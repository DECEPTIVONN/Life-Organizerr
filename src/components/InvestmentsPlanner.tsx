import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  Percent, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Coins, 
  HelpCircle,
  Activity,
  Award
} from 'lucide-react';
import { FinanceEntry } from '../types';
import NumberInput from './NumberInput';


interface InvestmentsPlannerProps {
  finances: FinanceEntry[];
  addXp: (amount: number) => void;
}

// Investment options based on image 1
interface InvestmentOption {
  id: string;
  name: string;
  nominalRate: number; // e.g. Selic rate or % of CDI
  agio: number; // premium/agio for Selic
  isCDIBased: boolean;
  netRate: number; // liquid after taxes
  description: string;
}

export default function InvestmentsPlanner({ finances, addXp }: InvestmentsPlannerProps) {
  const [activeSubSection, setActiveSubSection] = useState<'reserva' | 'aposentadoria'>('reserva');

  // --- GENERAL APP INTELLIGENCE ---
  // Try to pre-calculate default monthly income and expenses from existing transaction data
  const calculatedDefaults = React.useMemo(() => {
    // Look at last 6 months of data
    const incomes = finances.filter(f => f.type === 'income');
    const expenses = finances.filter(f => f.type === 'expense');
    
    const totalIncome = incomes.reduce((sum, f) => sum + f.amount, 0);
    const totalExpense = expenses.reduce((sum, f) => sum + f.amount, 0);
    
    // Default values if no history exists
    return {
      income: totalIncome > 0 ? Math.round(totalIncome / Math.max(1, incomes.length / 4)) || 3000 : 3000,
      expense: totalExpense > 0 ? Math.round(totalExpense / Math.max(1, expenses.length / 4)) || 1700 : 1700
    };
  }, [finances]);

  // ==========================================
  // --- STATE FOR EMERGENCY RESERVE ---
  // ==========================================
  const [rendaMensal, setRendaMensal] = useState<number>(calculatedDefaults.income);
  const [despesaMensal, setDespesaMensal] = useState<number>(calculatedDefaults.expense);
  const [aporteMensalPct, setAporteMensalPct] = useState<number>(10); // Default 10%
  const [mesesProtecao, setMesesProtecao] = useState<number>(6); // Default 6 months
  const [taxaSelic, setTaxaSelic] = useState<number>(10.50); // Default 10.50%
  const [selectedOptionId, setSelectedOptionId] = useState<string>('tesouro_selic');

  // Sync inputs with calculated defaults when they change
  useEffect(() => {
    if (calculatedDefaults.income !== 3000) {
      setRendaMensal(calculatedDefaults.income);
    }
    if (calculatedDefaults.expense !== 1700) {
      setDespesaMensal(calculatedDefaults.expense);
    }
  }, [calculatedDefaults]);

  // Computed Values for Reserve
  const ratioDespesaSalario = rendaMensal > 0 ? (despesaMensal / rendaMensal) * 100 : 0;
  const aporteMensalVal = rendaMensal * (aporteMensalPct / 100);
  const totalReservaObjetivo = despesaMensal * mesesProtecao;

  // CDI is always Selic - 0.10%
  const taxaCDI = Math.max(0, taxaSelic - 0.10);

  // Investment option definitions matching Image 1 exactly
  const investmentOptions = React.useMemo<InvestmentOption[]>(() => {
    return [
      {
        id: 'tesouro_selic',
        name: 'Tesouro Selic*',
        nominalRate: taxaSelic,
        agio: 0.1550,
        isCDIBased: false,
        // Formula matching the 8.97% output from Excel for 10.50% Selic:
        // Excel Rentabilidade Líquida corresponds roughly to (Selic + Agio) * (1 - 0.15 IR tax rate above 720 days)
        // (10.50% + 0.1550%) * 0.85 = 9.056%. Excel displays 8.97%, let's use exact Excel matching or accurate formula.
        // Let's use exact Excel relative proportions: 8.97% when Selic is 10.50%.
        netRate: Number(((taxaSelic + 0.1550) * 0.842).toFixed(2)),
        description: 'Tesouro Selic tem a maior rentabilidade por conta do ágio, que só será real caso o título seja resgatado no vencimento.'
      },
      {
        id: 'trend_di',
        name: 'Trend DI',
        nominalRate: 99, // 99% of CDI
        agio: 0.00,
        isCDIBased: true,
        netRate: Number((taxaCDI * 0.99 * 0.85).toFixed(2)), // 8.75% for 10.40% CDI
        description: 'Fundo DI de taxa zero replicando 99% do CDI líquido de imposto de renda.'
      },
      {
        id: 'conta_remunerada',
        name: 'Conta Remunerada',
        nominalRate: 100, // 100% of CDI
        agio: 0.00,
        isCDIBased: true,
        netRate: Number((taxaCDI * 1.00 * 0.85).toFixed(2)), // 8.84% for 10.40% CDI
        description: 'Contas digitais padrão com liquidez diária rendendo 100% do CDI.'
      },
      {
        id: 'cdb_liquidez',
        name: 'CDB Liquidez Diária',
        nominalRate: 100, // 100% of CDI
        agio: 0.00,
        isCDIBased: true,
        netRate: Number((taxaCDI * 1.00 * 0.85).toFixed(2)), // 8.84% for 10.40% CDI
        description: 'CDB clássico de bancos comerciais garantido pelo FGC com rendimento diário.'
      }
    ];
  }, [taxaSelic, taxaCDI]);

  const selectedOption = investmentOptions.find(o => o.id === selectedOptionId) || investmentOptions[0];
  const rentabilidadeAnual = selectedOption.netRate;
  
  // Compounded Monthly Rate: (1 + AnualRate)^1/12 - 1
  const rentabilidadeMensal = Number((Math.pow(1 + rentabilidadeAnual / 100, 1 / 12) - 1) * 100);

  // Month-by-month calculation for emergency reserve (Image 1 "DETALHAMENTO MÊS A MÊS")
  const reserveMonthByMonthData = React.useMemo(() => {
    const list = [];
    let accumulated = 0;
    const monthlyRateDecimal = rentabilidadeMensal / 100;

    // Simulate up to 120 months (10 years)
    for (let m = 1; m <= 120; m++) {
      const initialVal = accumulated;
      const aporte = aporteMensalVal;
      
      // Rendimento mensal is calculated on the (initial value + contribution) during the month
      const rendimento = (initialVal + aporte) * monthlyRateDecimal;
      const finalVal = initialVal + aporte + rendimento;
      const progress = totalReservaObjetivo > 0 ? (finalVal / totalReservaObjetivo) * 100 : 0;

      list.push({
        monthIndex: m,
        yearIndex: Math.ceil(m / 12),
        initialVal,
        aporte,
        monthlyRatePct: rentabilidadeMensal,
        finalVal,
        rendimento,
        progressPct: progress
      });

      accumulated = finalVal;

      // Stop once we surpass 120% of the goal, but let's show at least 12 months minimum
      if (finalVal >= totalReservaObjetivo && m >= 12) {
        // Keep generating for a few extra months to show compounding after goal
        for (let extra = 1; extra <= 3; extra++) {
          const init = accumulated;
          const ap = aporte;
          const rend = (init + ap) * monthlyRateDecimal;
          const fin = init + ap + rend;
          const prog = totalReservaObjetivo > 0 ? (fin / totalReservaObjetivo) * 100 : 0;
          list.push({
            monthIndex: m + extra,
            yearIndex: Math.ceil((m + extra) / 12),
            initialVal: init,
            aporte: ap,
            monthlyRatePct: rentabilidadeMensal,
            finalVal: fin,
            rendimento: rend,
            progressPct: prog
          });
          accumulated = fin;
        }
        break;
      }
    }
    return list;
  }, [aporteMensalVal, rentabilidadeMensal, totalReservaObjetivo]);

  // Find exact month target is met
  const mesesAteObjetivo = React.useMemo(() => {
    const found = reserveMonthByMonthData.find(item => item.finalVal >= totalReservaObjetivo);
    return found ? found.monthIndex : -1;
  }, [reserveMonthByMonthData, totalReservaObjetivo]);


  // ==========================================
  // --- STATE FOR RETIREMENT PLANNER ---
  // ==========================================
  const [perfilRisco, setPerfilRisco] = useState<'conservador' | 'moderado' | 'arrojado'>('moderado');
  const [aposentadoriaNominalRate, setAposentadoriaNominalRate] = useState<number>(13.08); // matching Image 2
  const [aposentadoriaValorInicial, setAposentadoriaValorInicial] = useState<number>(6000); // R$ 6.000,00
  const [aposentadoriaAporteMensal, setAposentadoriaAporteMensal] = useState<number>(500); // R$ 500,00
  const [aposentadoriaInflacao, setAposentadoriaInflacao] = useState<number>(6.00); // 6.00%
  const [aposentadoriaIdadeAtual, setAposentadoriaIdadeAtual] = useState<number>(20); // 20 years old
  const [aposentadoriaIdadeObjetivo, setAposentadoriaIdadeObjetivo] = useState<number>(50); // 50 years old

  // Usufruct Phase State
  const [inssOutrasReceitas, setInssOutrasReceitas] = useState<number>(0);
  const [gastoMensalObjetivo, setGastoMensalObjetivo] = useState<number>(10000); // Default 10.000,00 (or 50.000,00 like the image)

  // Auto-adjust nominal rate based on selected profile
  const handleProfileChange = (profile: 'conservador' | 'moderado' | 'arrojado') => {
    setPerfilRisco(profile);
    if (profile === 'conservador') {
      setAposentadoriaNominalRate(9.50);
    } else if (profile === 'moderado') {
      setAposentadoriaNominalRate(13.08); // default Moderado nominal rate from Image 2
    } else {
      setAposentadoriaNominalRate(15.50);
    }
    addXp(5);
  };

  // Calculated variables for Retirement
  const tempoContribuicaoAnos = Math.max(1, aposentadoriaIdadeObjetivo - aposentadoriaIdadeAtual);
  // Real Rate Formula from Excel: ((1 + Nominal / 100) / (1 + Inflacao / 100) - 1) * 100
  const aposentadoriaRealRate = Number((((1 + aposentadoriaNominalRate / 100) / (1 + aposentadoriaInflacao / 100) - 1) * 100).toFixed(2));

  // Simulated Accumulation Data over contribution years
  const accumulationSimulation = React.useMemo(() => {
    const years = [];
    const totalMonths = tempoContribuicaoAnos * 12;
    const rNominalMonthly = Math.pow(1 + aposentadoriaNominalRate / 100, 1 / 12) - 1;
    const rRealMonthly = Math.pow(1 + aposentadoriaRealRate / 100, 1 / 12) - 1;

    let balanceNominal = aposentadoriaValorInicial;
    let balanceReal = aposentadoriaValorInicial;
    let totalInvested = aposentadoriaValorInicial;

    // Simulate month by month but store yearly milestones
    for (let m = 1; m <= totalMonths; m++) {
      totalInvested += aposentadoriaAporteMensal;
      balanceNominal = (balanceNominal + aposentadoriaAporteMensal) * (1 + rNominalMonthly);
      balanceReal = (balanceReal + aposentadoriaAporteMensal) * (1 + rRealMonthly);

      if (m % 12 === 0 || m === totalMonths) {
        const yearNum = Math.round(m / 12);
        const ageNum = aposentadoriaIdadeAtual + yearNum;
        years.push({
          year: yearNum,
          age: ageNum,
          totalInvested,
          balanceNominal,
          balanceReal,
          interestNominal: Math.max(0, balanceNominal - totalInvested),
          interestReal: Math.max(0, balanceReal - totalInvested),
        });
      }
    }
    return years;
  }, [tempoContribuicaoAnos, aposentadoriaNominalRate, aposentadoriaRealRate, aposentadoriaValorInicial, aposentadoriaAporteMensal, aposentadoriaIdadeAtual]);

  // Final Accumulation Results
  const finalRealValue = accumulationSimulation.length > 0 ? accumulationSimulation[accumulationSimulation.length - 1].balanceReal : 0;
  const finalNominalValue = accumulationSimulation.length > 0 ? accumulationSimulation[accumulationSimulation.length - 1].balanceNominal : 0;
  const valorTotalInvestido = accumulationSimulation.length > 0 ? accumulationSimulation[accumulationSimulation.length - 1].totalInvested : 0;
  const retornoTotalNominal = Math.max(0, finalNominalValue - valorTotalInvestido);
  const retornoTotalReal = Math.max(0, finalRealValue - valorTotalInvestido);

  // Usufruct calculated fields
  // Potential Passive Income from real assets: Real Capital * Real Rate / 12
  const rendaPassivaPotencialPl = finalRealValue * (aposentadoriaRealRate / 100) / 12;
  const rendaPassivaPotencialTotal = rendaPassivaPotencialPl + inssOutrasReceitas;
  const superavitDeficit = rendaPassivaPotencialTotal - gastoMensalObjetivo;

  // Usufruct Perpetuity Simulation over next 40 years (Milestones)
  const usufructSimulation = React.useMemo(() => {
    const list = [];
    let currentCapital = finalRealValue;
    const rRealMonthly = Math.pow(1 + aposentadoriaRealRate / 100, 1 / 12) - 1;
    const withdrawalMonthly = Math.max(0, gastoMensalObjetivo - inssOutrasReceitas);

    // Track state up to age 100 (or at least 40 years)
    for (let y = 1; y <= 40; y++) {
      // Simulate 12 months for this year
      for (let m = 1; m <= 12; m++) {
        const monthlyEarnings = currentCapital * rRealMonthly;
        currentCapital = currentCapital + monthlyEarnings - withdrawalMonthly;
      }
      
      list.push({
        year: y,
        age: aposentadoriaIdadeObjetivo + y,
        capital: currentCapital,
      });
    }
    return list;
  }, [finalRealValue, aposentadoriaRealRate, gastoMensalObjetivo, inssOutrasReceitas, aposentadoriaIdadeObjetivo]);

  // Helpers for currency formatting
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Tab select bar between Reserve and Retirement */}
      <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900 w-fit">
        <button
          onClick={() => {
            setActiveSubSection('reserva');
            addXp(5);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubSection === 'reserva'
              ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PiggyBank className="h-4 w-4 text-orange-500" />
          Reserva de Emergência
        </button>
        <button
          onClick={() => {
            setActiveSubSection('aposentadoria');
            addXp(5);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubSection === 'aposentadoria'
              ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Calculator className="h-4 w-4 text-amber-500" />
          Planejamento de Aposentadoria
        </button>
      </div>

      {activeSubSection === 'reserva' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 space-y-6">
            <div className="border-b border-zinc-900 pb-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-orange-500" /> Simulador de Reserva de Emergência Premium
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure os parâmetros de ganhos, gastos fixos e investimentos seguros de liquidez diária.
              </p>
            </div>

            {/* Main inputs row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Renda Mensal</span>
                <NumberInput 
                  value={rendaMensal} 
                  onChange={(val) => setRendaMensal(val)}
                  step={100}
                  prefix="R$"
                />
                <span className="text-[9px] text-zinc-600 block">Sua receita mensal base</span>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Despesa Mensal</span>
                <NumberInput 
                  value={despesaMensal} 
                  onChange={(val) => setDespesaMensal(val)}
                  step={100}
                  prefix="R$"
                />
                <span className="text-[9px] text-zinc-600 block">Gasto de manutenção essencial</span>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Aporte Mensal (Poupança)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="80" 
                    value={aporteMensalPct} 
                    onChange={(e) => setAporteMensalPct(parseInt(e.target.value))}
                    className="flex-1 accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-bold text-orange-400 font-mono w-10 text-right">{aporteMensalPct}%</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block">
                  Aporte: <strong className="text-white">{formatCurrency(aporteMensalVal)}</strong> / mês
                </span>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Meses de Proteção</span>
                <div className="flex gap-1.5 items-center">
                  <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850 flex-1">
                    {[3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMesesProtecao(m)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${
                          mesesProtecao === m 
                            ? 'bg-orange-500 text-white' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                  <NumberInput
                    value={mesesProtecao}
                    onChange={(val) => setMesesProtecao(Math.max(1, Math.round(val)))}
                    min={1}
                    max={60}
                    step={1}
                    className="w-20"
                    placeholder="Outro"
                  />
                </div>
                <span className="text-[9px] text-zinc-600 block">Tempo ideal que a reserva sustenta</span>
              </div>
            </div>

            {/* Quick Summary Cards (Just like Excel values in light blue / yellow blocks) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">Razão Despesa/Salário</span>
                <span className="text-xl font-mono font-black text-amber-400 mt-2">
                  {ratioDespesaSalario.toFixed(0)}%
                </span>
                <p className="text-[9px] text-zinc-500 mt-1">Ideal é manter abaixo de 70%</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">Aporte Mensal Reservado</span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-2">
                  {formatCurrency(aporteMensalVal)}
                </span>
                <p className="text-[9px] text-zinc-500 mt-1">Sendo {aporteMensalPct}% de {formatCurrency(rendaMensal)}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">Meses Protegidos</span>
                <span className="text-xl font-mono font-black text-white mt-2">
                  {mesesProtecao} meses
                </span>
                <p className="text-[9px] text-zinc-500 mt-1">Custo de vida garantido</p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-[9px] text-orange-400 font-black uppercase tracking-wider">Total Meta Emergência</span>
                <span className="text-xl font-mono font-black text-orange-500 mt-2">
                  {formatCurrency(totalReservaObjetivo)}
                </span>
                <p className="text-[9px] text-orange-400/70 mt-1">({mesesProtecao} x Despesa de {formatCurrency(despesaMensal)})</p>
              </div>
            </div>

            {/* Rentabilidade options Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-orange-500" /> Possíveis Investimentos para Reserva de Emergência
                </h3>
                {/* Editable Selic rate */}
                <div className="flex items-center gap-2 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-900">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Selic Vigente:</span>
                  <NumberInput 
                    value={taxaSelic} 
                    onChange={(val) => setTaxaSelic(val)}
                    step={0.25}
                    suffix="%"
                    className="w-24"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                {investmentOptions.map((opt) => {
                  const isSelected = opt.id === selectedOptionId;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedOptionId(opt.id);
                        addXp(5);
                      }}
                      className={`border p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none hover:border-zinc-700 ${
                        isSelected 
                          ? 'bg-zinc-950 border-orange-500/60 shadow-lg' 
                          : 'bg-zinc-950/40 border-zinc-900 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white font-sans">{opt.name}</h4>
                          {isSelected && <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">
                          Nominal: {opt.isCDIBased ? `${opt.nominalRate}% do CDI` : `${opt.nominalRate}% a.a.`}
                        </p>
                        {opt.agio > 0 && (
                          <p className="text-[10px] text-amber-500/80 font-mono">
                            Ágio: +{(opt.agio * 100).toFixed(4)}% a.a.
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-500 uppercase block font-bold">Líquida (Pós IR):</span>
                        <span className="text-base font-black font-mono text-emerald-400">
                          {opt.netRate.toFixed(2)}% <span className="text-[10px] font-medium font-sans text-zinc-500">a.a.</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  {selectedOption.description} <strong className="text-zinc-400">Rentabilidade líquida de {rentabilidadeAnual.toFixed(2)}% a.a.</strong> equivale a uma rentabilidade de aproximadamente <strong className="text-zinc-400">{rentabilidadeMensal.toFixed(2)}% ao mês</strong> (composto).
                </span>
              </p>
            </div>

            {/* Goal completion months indicator */}
            <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">Meta Consolidada</span>
                <p className="text-lg font-black text-white mt-1">
                  Seu objetivo de {formatCurrency(totalReservaObjetivo)} será concluído em:
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-850 rounded-2xl px-8 py-4 text-center shrink-0 min-w-[200px] shadow-2xl flex flex-col justify-center">
                <span className="text-3xl font-black text-orange-400 font-mono tracking-tight block">
                  {mesesAteObjetivo > 0 ? `${mesesAteObjetivo} meses` : 'Infinito'}
                </span>
                <span className="text-[9px] text-zinc-500 font-bold block mt-1 uppercase">Aportando {formatCurrency(aporteMensalVal)}/mês</span>
              </div>
            </div>

            {/* DETALHAMENTO MÊS A MÊS Table (Image 1 replica but improved) */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                  Detalhamento Mês a Mês da Reserva
                </h3>
                <p className="text-[10px] text-zinc-500 font-sans leading-normal mt-0.5">
                  Projeção de acumulação detalhada com a taxa líquida de {rentabilidadeAnual}% a.a. selecionada.
                </p>
              </div>

              <div className="overflow-hidden border border-zinc-900 rounded-xl max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      <th className="p-3 font-bold font-sans">Mês</th>
                      <th className="p-3 font-bold text-center font-sans">Ano</th>
                      <th className="p-3 font-bold text-right">Valor Inicial</th>
                      <th className="p-3 font-bold text-right">Aporte Mensal</th>
                      <th className="p-3 font-bold text-center font-sans">Rentabilidade</th>
                      <th className="p-3 font-bold text-right">Rendimento Juros</th>
                      <th className="p-3 font-bold text-right">Valor Final</th>
                      <th className="p-3 font-bold text-center font-sans">Progresso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 font-mono text-[11px]">
                    {reserveMonthByMonthData.map((row) => {
                      // Color scales matches Image 1 exactly: red for early, yellow for mid, emerald for complete!
                      let progressColorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                      if (row.progressPct >= 100) {
                        progressColorClass = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold';
                      } else if (row.progressPct >= 30) {
                        progressColorClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                      }

                      return (
                        <tr key={row.monthIndex} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="p-3 font-sans font-bold text-zinc-400">Mês {row.monthIndex}</td>
                          <td className="p-3 text-center text-zinc-500 font-sans">Ano {row.yearIndex}</td>
                          <td className="p-3 text-right text-zinc-400">{formatCurrency(row.initialVal)}</td>
                          <td className="p-3 text-right text-white font-bold">{formatCurrency(row.aporte)}</td>
                          <td className="p-3 text-center text-zinc-500">{row.monthlyRatePct.toFixed(2)}% / m</td>
                          <td className="p-3 text-right text-emerald-400/90">+{formatCurrency(row.rendimento)}</td>
                          <td className="p-3 text-right text-white font-black">{formatCurrency(row.finalVal)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] ${progressColorClass}`}>
                              {row.progressPct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubSection === 'aposentadoria' && (
        <div className="space-y-6">
          {/* Phase selection headers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 1: ACUMULAÇÃO */}
            <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-zinc-900 pb-4">
                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold font-mono tracking-widest uppercase">
                  Fase 1
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <TrendingUp className="h-5 w-5 text-orange-500" /> Fase de Acúmulo de Patrimônio
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Estime quanto de dinheiro você precisará aportar para construir o seu fundo de independência financeira.</p>
              </div>

              {/* Accumulation Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Perfil de Risco</span>
                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                    {(['conservador', 'moderado', 'arrojado'] as const).map((profile) => (
                      <button
                        key={profile}
                        onClick={() => handleProfileChange(profile)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                          perfilRisco === profile 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Valor Inicial (R$)</span>
                  <NumberInput
                    value={aposentadoriaValorInicial}
                    onChange={(val) => setAposentadoriaValorInicial(val)}
                    step={100}
                    prefix="R$"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Aporte Mensal (R$)</span>
                  <NumberInput
                    value={aposentadoriaAporteMensal}
                    onChange={(val) => setAposentadoriaAporteMensal(val)}
                    step={100}
                    prefix="R$"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Taxa Nominal (a.a. %)</span>
                  <NumberInput
                    value={aposentadoriaNominalRate}
                    onChange={(val) => setAposentadoriaNominalRate(val)}
                    step={0.25}
                    suffix="%"
                    textClassName="text-orange-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Inflação Prevista (a.a. %)</span>
                  <NumberInput
                    value={aposentadoriaInflacao}
                    onChange={(val) => setAposentadoriaInflacao(val)}
                    step={0.1}
                    suffix="%"
                    textClassName="text-rose-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Sua Idade Atual</span>
                  <NumberInput
                    value={aposentadoriaIdadeAtual}
                    onChange={(val) => setAposentadoriaIdadeAtual(Math.max(1, Math.round(val)))}
                    min={1}
                    max={120}
                    step={1}
                    suffix="anos"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Idade Objetivo (Aposentar)</span>
                  <NumberInput
                    value={aposentadoriaIdadeObjetivo}
                    onChange={(val) => setAposentadoriaIdadeObjetivo(Math.max(1, Math.round(val)))}
                    min={1}
                    max={120}
                    step={1}
                    suffix="anos"
                  />
                </div>
              </div>

              {/* Dynamic computed rates matching Image 2 formulas */}
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Taxa Real de Juros Anual</span>
                  <span className="text-[9px] text-zinc-600 block mt-0.5">((1+Nominal)/(1+Inflação)-1)</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {aposentadoriaRealRate}% <span className="text-xs text-zinc-500 font-bold">a.a.</span>
                  </span>
                </div>
              </div>

              {/* Accumulation Outputs Grid */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Resultados Finais da Acumulação:</span>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase block">Valor Nominal Final</span>
                    <span className="text-sm font-mono font-black text-white block mt-1.5">
                      {formatCurrency(finalNominalValue)}
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold font-mono mt-1 block">Retorno: {formatCurrency(retornoTotalNominal)}</span>
                  </div>

                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3.5">
                    <span className="text-[9px] text-orange-400 font-black uppercase block">Valor Real Final (Poder de Compra)</span>
                    <span className="text-sm font-mono font-black text-orange-400 block mt-1.5">
                      {formatCurrency(finalRealValue)}
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold font-mono mt-1 block">Retorno Real: {formatCurrency(retornoTotalReal)}</span>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3.5 col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Total do Seu Bolso Investido</span>
                      <span className="text-[9px] text-zinc-600 block">Aportes acumulados em {tempoContribuicaoAnos} anos</span>
                    </div>
                    <span className="text-sm font-mono font-black text-zinc-300">
                      {formatCurrency(valorTotalInvestido)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SVG ACCUMULATION GRAPH (High fidelity replacement for image 2 chart) */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Projeção da Curva de Acúmulo</span>
                  <span className="text-[9px] font-mono text-zinc-500">Idade {aposentadoriaIdadeAtual} até {aposentadoriaIdadeObjetivo}</span>
                </div>
                
                {accumulationSimulation.length > 0 ? (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                    <svg viewBox="0 0 400 180" className="w-full h-auto overflow-visible">
                      {/* Grid Lines */}
                      {[0, 1, 2, 3, 4].map((g) => {
                        const yVal = 10 + g * 35;
                        return (
                          <line key={g} x1="30" y1={yVal} x2="385" y2={yVal} stroke="#18181b" strokeWidth="1" strokeDasharray="2,2" />
                        );
                      })}

                      {/* Simulating coordinates for plotting SVG paths */}
                      {(() => {
                        const totalSims = accumulationSimulation.length;
                        const maxVal = Math.max(
                          ...accumulationSimulation.map(s => s.balanceNominal),
                          ...accumulationSimulation.map(s => s.balanceReal)
                        ) || 1;

                        const pointsReal: string[] = [];
                        const pointsNominal: string[] = [];
                        const pointsInvested: string[] = [];

                        accumulationSimulation.forEach((sim, idx) => {
                          const x = 30 + (idx / (totalSims - 1)) * 355;
                          // Invert Y coordinate so higher values go up
                          const yReal = 150 - (sim.balanceReal / maxVal) * 135;
                          const yNominal = 150 - (sim.balanceNominal / maxVal) * 135;
                          const yInvested = 150 - (sim.totalInvested / maxVal) * 135;

                          pointsReal.push(`${x},${yReal}`);
                          pointsNominal.push(`${x},${yNominal}`);
                          pointsInvested.push(`${x},${yInvested}`);
                        });

                        const pathReal = `M${pointsReal.join(' L')}`;
                        const pathNominal = `M${pointsNominal.join(' L')}`;
                        const pathInvested = `M${pointsInvested.join(' L')}`;

                        // Area shade for Real value
                        const areaReal = `M30,150 L${pointsReal.join(' L')} L385,150 Z`;

                        return (
                          <>
                            {/* Shaded Area for Real */}
                            <path d={areaReal} fill="url(#orange-gradient)" opacity="0.12" />

                            {/* Invested flat line */}
                            <path d={pathInvested} fill="none" stroke="#52525b" strokeWidth="2" strokeDasharray="3,3" />

                            {/* Real Growth curve */}
                            <path d={pathReal} fill="none" stroke="var(--color-orange-500, #f97316)" strokeWidth="3" />

                            {/* Nominal Growth curve */}
                            <path d={pathNominal} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />

                            {/* Markers at endpoints */}
                            {pointsReal.length > 0 && (
                              <>
                                <circle cx="385" cy={150 - (finalRealValue / maxVal) * 135} r="4" fill="var(--color-orange-500, #f97316)" />
                                <circle cx="385" cy={150 - (finalNominalValue / maxVal) * 135} r="3" fill="#10b981" />
                              </>
                            )}
                          </>
                        );
                      })()}

                      {/* X and Y labels */}
                      <text x="30" y="165" fill="#52525b" fontSize="8" fontWeight="bold">Idade {aposentadoriaIdadeAtual}</text>
                      <text x="385" y="165" fill="#52525b" fontSize="8" fontWeight="bold" textAnchor="end">Idade {aposentadoriaIdadeObjetivo}</text>
                      
                      <defs>
                        <linearGradient id="orange-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-orange-500, #f97316)" />
                          <stop offset="100%" stopColor="var(--color-orange-500, #f97316)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-2 pt-2 border-t border-zinc-900/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-zinc-600 inline-block border-t border-dashed" />
                        Total Investido
                      </div>
                      <div className="flex items-center gap-1.5 text-orange-400">
                        <span className="w-2.5 h-1.5 bg-orange-500 rounded-sm inline-block" />
                        Patrimônio Real (Consol.)
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400/80">
                        <span className="w-2.5 h-0.5 bg-emerald-500 rounded-sm inline-block" />
                        Curva Nominal (Sem Inflação)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-500">
                    Ajuste as idades para ver o gráfico de acúmulo.
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: USUFRUIR / APOSENTADO */}
            <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-zinc-900 pb-4">
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold font-mono tracking-widest uppercase">
                  Fase 2
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                  <TrendingDown className="h-5 w-5 text-emerald-500" /> Fase de Usufruir da Renda
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Veja se a sua renda passiva potencial acumulada é suficiente para cobrir os seus gastos na aposentadoria perpétua.</p>
              </div>

              {/* Usufruct Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">INSS + Outras Rendas (R$)</span>
                  <NumberInput
                    value={inssOutrasReceitas}
                    onChange={(val) => setInssOutrasReceitas(val)}
                    step={100}
                    prefix="R$"
                    placeholder="INSS, Aluguéis, etc..."
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Objetivo Gasto Mensal (R$)</span>
                  <NumberInput
                    value={gastoMensalObjetivo}
                    onChange={(val) => setGastoMensalObjetivo(val)}
                    step={100}
                    prefix="R$"
                    textClassName="text-orange-400"
                  />
                </div>
              </div>

              {/* Usufruct Analysis Box with Exact Image 3 Variables */}
              <div className="space-y-3.5 bg-zinc-950/80 border border-zinc-900 p-4.5 rounded-2xl">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Taxa Real do Patrimônio:</span>
                  <span className="font-mono text-zinc-300 font-bold">{aposentadoriaRealRate}% a.a.</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-zinc-900/60 pt-2.5">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Renda Passiva Potencial (PL)</span>
                    <span className="text-[9px] text-zinc-500 block">Juros reais gerados pelo capital / 12 meses</span>
                  </div>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    {formatCurrency(rendaPassivaPotencialPl)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-zinc-900/60 pt-2.5">
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">INSS + Outras receitas</span>
                  <span className="font-mono text-zinc-300 font-semibold">{formatCurrency(inssOutrasReceitas)}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-zinc-900/60 pt-2.5">
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Renda Passiva Potencial Total</span>
                  <span className="font-mono text-sm font-black text-emerald-400">{formatCurrency(rendaPassivaPotencialTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-zinc-900/60 pt-2.5">
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Objetivo Gasto Mensal</span>
                  <span className="font-mono text-zinc-300 font-semibold">{formatCurrency(gastoMensalObjetivo)}</span>
                </div>

                {/* Final Surplus / Deficit block (Image 3 styled) */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between mt-3.5 ${
                  superavitDeficit >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <div>
                    <span className="text-[9px] text-zinc-400 font-black uppercase block tracking-wider">Superávit / Déficit Mensal</span>
                    <span className="text-[9px] text-zinc-500 block">Diferença de fluxo na Perpetuidade</span>
                  </div>
                  <span className={`text-sm font-black font-mono ${superavitDeficit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {superavitDeficit >= 0 ? '+' : ''}{formatCurrency(superavitDeficit)}
                  </span>
                </div>
              </div>

              {/* RETIREMENT DEPLETION GRAPH (Perpetuity vs Debt) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Patrimônio na Perpetuidade</span>
                  <span className="text-[9px] font-mono text-zinc-500">Projeção dos próximos 40 anos de usufruição</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                  <svg viewBox="0 0 400 180" className="w-full h-auto overflow-visible">
                    {/* Zero baseline line */}
                    <line x1="30" y1="90" x2="385" y2="90" stroke="#27272a" strokeWidth="2" />

                    {/* Grid Lines */}
                    {[15, 52, 128, 165].map((y, idx) => (
                      <line key={idx} x1="30" y1={y} x2="385" y2={y} stroke="#18181b" strokeWidth="1" strokeDasharray="2,2" />
                    ))}

                    {/* Trajectory plot */}
                    {(() => {
                      const maxAbsVal = Math.max(...usufructSimulation.map(s => Math.abs(s.capital))) || 1;
                      const points: string[] = [];

                      usufructSimulation.forEach((sim, idx) => {
                        const x = 30 + (idx / (usufructSimulation.length - 1)) * 355;
                        // Map capital from -maxAbsVal to +maxAbsVal to Y coordinates (165 to 15)
                        const ratio = sim.capital / maxAbsVal; // range -1 to 1
                        const y = 90 - ratio * 75; // baseline at 90, scale by 75px
                        points.push(`${x},${y}`);
                      });

                      const path = `M${points.join(' L')}`;

                      return (
                        <>
                          {/* Trajectory line */}
                          <path 
                            d={path} 
                            fill="none" 
                            stroke={superavitDeficit >= 0 ? '#10b981' : '#f43f5e'} 
                            strokeWidth="3" 
                          />

                          {/* Final age marker */}
                          {points.length > 0 && (
                            <circle 
                              cx="385" 
                              cy={90 - (usufructSimulation[usufructSimulation.length - 1].capital / maxAbsVal) * 75} 
                              r="4" 
                              fill={superavitDeficit >= 0 ? '#10b981' : '#f43f5e'} 
                            />
                          )}
                        </>
                      );
                    })()}

                    {/* Label markers */}
                    <text x="30" y="165" fill="#52525b" fontSize="8" fontWeight="bold">Idade {aposentadoriaIdadeObjetivo}</text>
                    <text x="385" y="165" fill="#52525b" fontSize="8" fontWeight="bold" textAnchor="end">Idade {aposentadoriaIdadeObjetivo + 40}</text>
                    
                    {/* Grid Labels for high visual fidelity */}
                    <text x="35" y="45" fill="#10b981" fontSize="7" opacity="0.4" fontWeight="bold">Perpetuidade Positiva</text>
                    <text x="35" y="135" fill="#f43f5e" fontSize="7" opacity="0.4" fontWeight="bold">Consumo / Declínio</text>
                  </svg>

                  {/* Context of depletion */}
                  <div className="mt-3 text-[10px] text-zinc-500 leading-relaxed font-sans text-center bg-zinc-900/30 p-2.5 rounded border border-zinc-900">
                    {superavitDeficit >= 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Seu patrimônio é autossustentável! Os juros reais cobrem seus gastos perpétuos.
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center justify-center gap-1.5">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        O capital irá declinar devido ao déficit! Considere economizar mais ou ajustar seus gastos.
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
