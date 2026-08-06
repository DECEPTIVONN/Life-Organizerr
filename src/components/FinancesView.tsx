import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  CalendarDays,
  Coins,
  PiggyBank,
  Percent,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Grid,
  Edit2,
  Info,
  LayoutDashboard,
  FileText,
  Target,
  CreditCard,
  AlertTriangle,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Search,
  Sparkles,
  Calculator,
  Layers,
  PieChart,
  ArrowRight,
  Lock,
  Scale,
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FinanceEntry } from '../types';
import InvestmentsPlanner from './InvestmentsPlanner';

interface FinancesProps {
  finances: FinanceEntry[];
  setFinances: React.Dispatch<React.SetStateAction<FinanceEntry[]>>;
  addXp: (amount: number) => void;
}

export interface BudgetLimit {
  id: string;
  category: string;
  amount: number;
  startYear: number;
  startMonth: number; // 0-11
  isRecurring: boolean;
  recurringType: 'always' | 'months' | 'until_date';
  recurringMonths?: number;
  recurringUntilDate?: string;
}

// Custom Category Colors for visual consistency across spreadsheet and pie charts
export const categoryColors: Record<string, string> = {
  // Incomes
  'Salário': '#10b981', // emerald
  'PLR': '#34d399',
  'Freelance': '#059669',
  'Investimentos': '#f59e0b', // amber
  'Vendas': '#fbbf24',
  
  // Expenses
  'Alimentação': '#ef4444', // rose/red
  'Supermercado': '#f87171',
  'Moradia': '#3b82f6', // blue
  'Aluguel': '#60a5fa',
  'Condomínio': '#2563eb',
  'IPTU': '#1d4ed8',
  'Transporte': '#06b6d4', // cyan
  'Lazer': '#ec4899', // pink
  'Assinaturas': '#a855f7', // purple
  'Cursos': '#f43f5e', // rose
  'Academia': '#10b981',
  'Energia elétrica': '#eab308', // yellow
  'Água': '#0ea5e9', // sky
  'Gás': '#f97316', // orange
  'Internet': '#6366f1', // indigo
  'Celular': '#8b5cf6', // violet
  'Escola': '#14b8a6', // teal
  'Faculdade': '#0d9488',
  'Convênio médico': '#06b6d4',
  'Seguro': '#64748b', // slate
  'IPVA': '#475569',
  
  // Default fallback
  'Outros': '#94a3b8',
};

// --- STUNNING SVG CATEGORY PIE/DONUT CHART ---
export function CategoryPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-44 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-zinc-500 text-xs italic">
        Sem despesas registradas para exibir no gráfico.
      </div>
    );
  }

  let accumulatedPercent = 0;
  const radius = 50;
  const strokeWidth = 14;
  const rCircumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-2">
      <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDasharray = `${percent * rCircumference} ${rCircumference}`;
            const strokeDashoffset = -accumulatedPercent * rCircumference;
            accumulatedPercent += percent;

            const isHovered = activeIndex === index;

            return (
              <circle
                key={item.name}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center label inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            {activeIndex !== null ? data[activeIndex].name : 'Total Despesas'}
          </span>
          <span className="text-xs font-black text-white font-mono block mt-0.5">
            {activeIndex !== null
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data[activeIndex].value)
              : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
          </span>
          <span className="text-[9px] text-orange-400 font-mono font-bold block mt-0.5">
            {activeIndex !== null ? `${((data[activeIndex].value / total) * 100).toFixed(1)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Category Legend list */}
      <div className="flex-1 space-y-1.5 w-full max-h-48 overflow-y-auto pr-1">
        {data.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeIndex === idx ? 'bg-zinc-800 border border-zinc-700 scale-[1.02]' : 'hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-300 font-medium truncate text-[11px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-right flex-shrink-0 font-mono">
                <span className="text-zinc-400 text-[10px]">{pct}%</span>
                <span className="text-white font-bold text-[11px]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Initial Mock Accounts
interface BankAccount {
  id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  color: string;
  iconBg: string;
}

// Initial Mock Cards
interface CreditCardItem {
  id: string;
  name: string;
  bank: string;
  usedLimit: number;
  totalLimit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

// Initial Mock Debts
interface DebtItem {
  id: string;
  title: string;
  creditor: string;
  originalAmount: number;
  remainingAmount: number;
  monthlyInstallment: number;
  interestRateMonthly: number; // %
  dueDate: string;
  category: string;
}

export default function FinancesView({ finances, setFinances, addXp }: FinancesProps) {
  // Main Sub-Tab State (6 sub-tabs)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'extrato' | 'planejamento' | 'investimentos' | 'contas' | 'dividas'>(() => {
    const saved = localStorage.getItem('finances_main_subtab');
    return (saved as any) || 'dashboard';
  });

  // Extrato sub-view switch ('mensal' | 'anual')
  const [extratoSubView, setExtratoSubView] = useState<'mensal' | 'anual'>('mensal');
  const [extratoTypeFilter, setExtratoTypeFilter] = useState<'all' | 'income' | 'expense' | 'investment'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => Math.max(2026, new Date().getFullYear()));

  // Inline Spreadsheet editing states
  const [editingCell, setEditingCell] = useState<{ rowId: string; monthIndex: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Form states
  const [entryType, setEntryType] = useState<'income' | 'expense' | 'investment'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salário');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Recurrence for Transaction Entries
  const [isRecurringTx, setIsRecurringTx] = useState(false);
  const [recurringTypeTx, setRecurringTypeTx] = useState<'always' | 'months' | 'until_date'>('always');
  const [recurringMonthsTx, setRecurringMonthsTx] = useState(12);
  const [recurringUntilDateTx, setRecurringUntilDateTx] = useState(new Date().toISOString().split('T')[0]);

  // Recurrence for Budgets
  const [isRecurringBudget, setIsRecurringBudget] = useState(true);
  const [recurringTypeBudget, setRecurringTypeBudget] = useState<'always' | 'months' | 'until_date'>('always');
  const [recurringMonthsBudget, setRecurringMonthsBudget] = useState(12);
  const [recurringUntilDateBudget, setRecurringUntilDateBudget] = useState(new Date().toISOString().split('T')[0]);

  // Budget category adding form
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [showAddBudget, setShowAddBudget] = useState(false);

  const [isBudgetOpen, setIsBudgetOpen] = useState(() => {
    const saved = localStorage.getItem('finances_budget_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [isEntriesOpen, setIsEntriesOpen] = useState(() => {
    const saved = localStorage.getItem('finances_entries_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Planning state (50/30/20 & Emergency Fund)
  const [planningIncomeInput, setPlanningIncomeInput] = useState('8500');
  const [emergencyFundMonthsTarget, setEmergencyFundMonthsTarget] = useState(6);

  // Accounts state
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_bank_accounts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'acc-1', name: 'Conta Corrente Principal', bank: 'Itaú Personnalité', type: 'Corrente', balance: 14820.50, color: '#f97316', iconBg: 'bg-orange-500/10' },
      { id: 'acc-2', name: 'Reserva & Rendimento', bank: 'Nubank', type: 'Pagamentos / C200', balance: 28450.00, color: '#a855f7', iconBg: 'bg-purple-500/10' },
      { id: 'acc-3', name: 'Conta Global & Investimentos', bank: 'Banco Inter', type: 'Investimentos', balance: 19200.00, color: '#f59e0b', iconBg: 'bg-amber-500/10' },
      { id: 'acc-4', name: 'Carteira Mercado Pago', bank: 'Mercado Pago', type: 'Carteira Digital', balance: 1850.30, color: '#06b6d4', iconBg: 'bg-cyan-500/10' }
    ];
  });
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccType, setNewAccType] = useState('Corrente');
  const [newAccBalance, setNewAccBalance] = useState('');

  // Credit cards state
  const [creditCards, setCreditCards] = useState<CreditCardItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_credit_cards');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'card-1', name: 'Nubank Ultravioleta', bank: 'Nubank', usedLimit: 3420.00, totalLimit: 25000.00, closingDay: 12, dueDay: 19, color: '#8b5cf6' },
      { id: 'card-2', name: 'Itaú Personalité Black', bank: 'Itaú', usedLimit: 8900.50, totalLimit: 40000.00, closingDay: 25, dueDay: 2, color: '#f97316' },
      { id: 'card-3', name: 'Inter Black Mastercard', bank: 'Inter', usedLimit: 1200.00, totalLimit: 15000.00, closingDay: 5, dueDay: 12, color: '#f59e0b' }
    ];
  });
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState('');
  const [newCardUsedLimit, setNewCardUsedLimit] = useState('');
  const [newCardTotalLimit, setNewCardTotalLimit] = useState('');
  const [newCardClosing, setNewCardClosing] = useState('10');
  const [newCardDue, setNewCardDue] = useState('17');

  // Debts state
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    try {
      const saved = localStorage.getItem('mbc_debt_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'debt-1', title: 'Financiamento Imobiliário', creditor: 'Caixa Econômica', originalAmount: 350000, remainingAmount: 210000, monthlyInstallment: 2450.00, interestRateMonthly: 0.85, dueDate: 'Dia 10', category: 'Imóvel' },
      { id: 'debt-2', title: 'Financiamento de Veículo', creditor: 'Banco Itaú', originalAmount: 85000, remainingAmount: 28400, monthlyInstallment: 1680.00, interestRateMonthly: 1.25, dueDate: 'Dia 22', category: 'Veículo' }
    ];
  });
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtTitle, setNewDebtTitle] = useState('');
  const [newDebtCreditor, setNewDebtCreditor] = useState('');
  const [newDebtRemaining, setNewDebtRemaining] = useState('');
  const [newDebtInstallment, setNewDebtInstallment] = useState('');
  const [newDebtRate, setNewDebtRate] = useState('1.0');

  useEffect(() => {
    localStorage.setItem('finances_main_subtab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('finances_budget_open', String(isBudgetOpen));
  }, [isBudgetOpen]);

  useEffect(() => {
    localStorage.setItem('finances_entries_open', String(isEntriesOpen));
  }, [isEntriesOpen]);

  useEffect(() => {
    localStorage.setItem('mbc_bank_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('mbc_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('mbc_debt_items', JSON.stringify(debts));
  }, [debts]);

  // Consolidated spreadsheet cell manual overrides
  const [sheetOverrides, setSheetOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('mbc_sheet_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const saveSheetOverrides = (overrides: Record<string, number>) => {
    setSheetOverrides(overrides);
    localStorage.setItem('mbc_sheet_overrides', JSON.stringify(overrides));
  };

  // Upgraded Budget Limits list with full recurrence model
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => {
    try {
      const savedNew = localStorage.getItem('mbc_budget_limits_v2');
      if (savedNew) return JSON.parse(savedNew);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'b-1', category: 'Alimentação', amount: 1500, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-2', category: 'Moradia', amount: 3200, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-3', category: 'Lazer', amount: 800, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-4', category: 'Transporte', amount: 600, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-5', category: 'Assinaturas', amount: 350, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: 'b-6', category: 'Outros', amount: 500, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
    ];
  });

  const saveBudgetLimits = (limits: BudgetLimit[]) => {
    setBudgetLimits(limits);
    localStorage.setItem('mbc_budget_limits_v2', JSON.stringify(limits));
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthsShort = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const getCategories = (type: 'income' | 'expense' | 'investment') => {
    switch (type) {
      case 'income':
        return ['Salário', 'PLR', 'Freelance', 'Investimentos', 'Vendas', 'Outros'];
      case 'expense':
        return [
          'Alimentação', 'Moradia', 'Aluguel', 'Condomínio', 'IPTU', 'Energia elétrica', 'Água', 'Gás', 'Internet', 'Celular', 'Supermercado',
          'Escola', 'Faculdade', 'Cursos', 'Academia', 'Convênio médico', 'Seguro', 'IPVA', 'Lazer', 'Outros'
        ];
      case 'investment':
        return ['Reserva de Emergência', 'Renda Fixa', 'Ações', 'Fundos Imobiliários', 'Cripto', 'Poupança', 'Tesouro Direto', 'Outros'];
      default:
        return [];
    }
  };

  const handleTypeChange = (type: 'income' | 'expense' | 'investment') => {
    setEntryType(type);
    const cats = getCategories(type);
    setCategory(cats[0] || 'Outros');
  };

  const getExpandedFinancesForMonth = (year: number, month: number) => {
    const list: FinanceEntry[] = [];
    
    finances.forEach(entry => {
      const tDate = new Date(entry.date + 'T12:00:00');
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      
      if (year < tYear || (year === tYear && month < tMonth)) {
        return;
      }
      
      if (year === tYear && month === tMonth) {
        list.push(entry);
        return;
      }
      
      if (entry.isRecurring) {
        let isActive = false;
        
        if (entry.recurringType === 'always') {
          isActive = true;
        } else if (entry.recurringType === 'months') {
          const diffMonths = (year - tYear) * 12 + (month - tMonth);
          isActive = diffMonths < (entry.recurringMonths || 1);
        } else if (entry.recurringType === 'until_date') {
          if (entry.recurringUntilDate) {
            const limitDate = new Date(entry.recurringUntilDate + 'T12:00:00');
            const targetDate = new Date(year, month, 15);
            isActive = targetDate <= limitDate || (year === limitDate.getFullYear() && month === limitDate.getMonth());
          }
        }
        
        if (isActive) {
          let occurrenceLabel = '🔄 Recorrente';
          if (entry.recurringType === 'months') {
            const diffMonths = (year - tYear) * 12 + (month - tMonth);
            occurrenceLabel = `🔄 Parcela ${diffMonths + 1}/${entry.recurringMonths}`;
          }
          list.push({
            ...entry,
            id: `${entry.id}-rec-${year}-${month}`,
            description: `${entry.description} (${occurrenceLabel})`,
            date: `${year}-${String(month + 1).padStart(2, '0')}-15`
          });
        }
      }
    });
    
    return list;
  };

  const getExpandedFinancesForYear = (year: number) => {
    const list: FinanceEntry[] = [];
    for (let m = 0; m < 12; m++) {
      list.push(...getExpandedFinancesForMonth(year, m));
    }
    return list;
  };

  const getBudgetsForMonthAndYear = (yr: number, mo: number) => {
    const result: Record<string, number> = {};
    
    budgetLimits.forEach(limit => {
      if (yr < limit.startYear || (yr === limit.startYear && mo < limit.startMonth)) {
        return;
      }
      
      let isActive = false;
      if (!limit.isRecurring) {
        isActive = (yr === limit.startYear && mo === limit.startMonth);
      } else {
        if (limit.recurringType === 'always') {
          isActive = true;
        } else if (limit.recurringType === 'months') {
          const diff = (yr - limit.startYear) * 12 + (mo - limit.startMonth);
          isActive = diff < (limit.recurringMonths || 1);
        } else if (limit.recurringType === 'until_date') {
          if (limit.recurringUntilDate) {
            const limitDate = new Date(limit.recurringUntilDate + 'T12:00:00');
            const targetDate = new Date(yr, mo, 28);
            isActive = targetDate <= limitDate || (yr === limitDate.getFullYear() && mo === limitDate.getMonth());
          } else {
            isActive = true;
          }
        }
      }
      
      if (isActive) {
        result[limit.category] = limit.amount;
      }
    });
    
    if (result['Outros'] === undefined) {
      result['Outros'] = 300;
    }
    
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newEntry: FinanceEntry = {
      id: Math.random().toString(36).substring(2, 9),
      type: entryType,
      amount: numAmount,
      category,
      description: description.trim() || category,
      date,
      isRecurring: isRecurringTx,
      recurringType: isRecurringTx ? recurringTypeTx : undefined,
      recurringMonths: (isRecurringTx && recurringTypeTx === 'months') ? recurringMonthsTx : undefined,
      recurringUntilDate: (isRecurringTx && recurringTypeTx === 'until_date') ? recurringUntilDateTx : undefined
    };

    setFinances([newEntry, ...finances]);
    setAmount('');
    setDescription('');
    setIsRecurringTx(false);
    setIsAdding(false);
    addXp(20);
  };

  const handleDeleteEntry = (id: string) => {
    setFinances(finances.filter(e => e.id !== id));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Monthly Calculations
  const monthlyEntries = getExpandedFinancesForMonth(selectedYear, selectedMonth);

  const monthlyIncome = monthlyEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyExpense = monthlyEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyInvestment = monthlyEntries
    .filter(e => e.type === 'investment')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense - monthlyInvestment;

  // Annual Calculations
  const annualEntries = getExpandedFinancesForYear(selectedYear);

  const annualIncome = annualEntries
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const annualExpense = annualEntries
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const annualInvestment = annualEntries
    .filter(e => e.type === 'investment')
    .reduce((sum, e) => sum + e.amount, 0);

  const annualBalance = annualIncome - annualExpense - annualInvestment;

  // Active Month budget parameters
  const currentMonthBudgets = getBudgetsForMonthAndYear(selectedYear, selectedMonth);

  const categoryRealized: Record<string, number> = {};
  Object.keys(currentMonthBudgets).forEach(cat => {
    categoryRealized[cat] = 0;
  });

  monthlyEntries.filter(entry => entry.type === 'expense').forEach(entry => {
    let targetCat = entry.category;
    if (currentMonthBudgets[targetCat] === undefined || targetCat === 'Outros') {
      targetCat = 'Outros';
    }
    
    if (categoryRealized[targetCat] !== undefined) {
      categoryRealized[targetCat] += entry.amount;
    } else {
      categoryRealized[targetCat] = entry.amount;
    }
  });

  const totalBudgeted = Object.values(currentMonthBudgets).reduce((a, b) => a + b, 0);
  const totalRealizedExpenseForBudgets = Object.keys(currentMonthBudgets).reduce((sum, cat) => sum + (categoryRealized[cat] || 0), 0);

  // Grouped monthly calculations for charts & balance
  const monthlyBreakdown = months.map((monthName, mIndex) => {
    const mEntries = getExpandedFinancesForMonth(selectedYear, mIndex);

    const inc = mEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const exp = mEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const inv = mEntries.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);
    const bal = inc - exp - inv;
    const rate = inc > 0 ? (inv / inc) * 100 : 0;

    return {
      name: monthName,
      shortName: monthsShort[mIndex],
      income: inc,
      expense: exp,
      investment: inv,
      balance: bal,
      savingsRate: rate
    };
  });

  const maxAnnualVal = Math.max(
    ...monthlyBreakdown.map(m => Math.max(m.income, m.expense, m.investment)),
    1000
  );

  // Total Accounts Balance
  const totalAccountsBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalUsedCreditLimit = creditCards.reduce((sum, c) => sum + c.usedLimit, 0);
  const totalCreditLimit = creditCards.reduce((sum, c) => sum + c.totalLimit, 0);
  const totalDebtsRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  // Total Patrimony Calculation
  const totalNetPatrimony = totalAccountsBalance + annualInvestment - totalDebtsRemaining;

  // Expense Categories for Donut Chart (Monthly)
  const expenseCatMap: Record<string, number> = {};
  monthlyEntries.filter(e => e.type === 'expense').forEach(e => {
    expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
  });
  const expenseCategoryPieData = Object.entries(expenseCatMap).map(([cat, val]) => ({
    name: cat,
    value: val,
    color: categoryColors[cat] || '#94a3b8'
  })).sort((a, b) => b.value - a.value);

  // Sub-tab Navbar Item List
  const subTabItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extrato', label: 'Extrato', icon: FileText },
    { id: 'planejamento', label: 'Planejamento', icon: Target },
    { id: 'investimentos', label: 'Investimentos', icon: PiggyBank },
    { id: 'contas', label: 'Contas & Cartões', icon: CreditCard },
    { id: 'dividas', label: 'Dívidas & Passivos', icon: AlertTriangle },
  ] as const;

  return (
    <div id="finances-view" className="space-y-6 pb-16">
      {/* Top Main Title Header & Year Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-orange-500" />
            Finanças & Gestão de Capital
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Controle de fluxo de caixa, patrimônio consolidado, planejamento e carteira de ativos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ano de Referência:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-zinc-950 border border-orange-500/30 hover:border-orange-500 text-white rounded-xl px-3.5 py-2 text-xs font-bold font-mono focus:outline-none cursor-pointer transition-all shadow-sm"
          >
            {Array.from({ length: 15 }, (_, i) => 2026 + i).map((y) => (
              <option key={y} value={y}>
                Ano {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INTERNAL NAVBAR (Ref: Cod Purple style adapted to TRONUS neon orange) */}
      <nav className="internal-nav" aria-label="Navegação Interna de Finanças">
        {subTabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`internal-nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: DASHBOARD FINANCIAL */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Section Title with Glow Line & Clip-path Polygon Decoration */}
          <div className="section-title">
            <h2>Dashboard Financeiro</h2>
            <div className="section-title-subtitle">Visão Geral, Indicadores & Saúde do Capital</div>
          </div>

          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Patrimônio Líquido */}
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-orange-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg group hover:border-orange-500/60 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block">Patrimônio Líquido</span>
                  <span className="text-xl font-black text-white font-mono block mt-1">
                    {formatCurrency(totalNetPatrimony)}
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-1">Contas + Investimentos - Dívidas</span>
                </div>
                <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Receitas Mês */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex justify-between items-start hover:border-emerald-500/40 transition-all">
              <div>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Receitas ({monthsShort[selectedMonth]})</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(monthlyIncome)}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Total acumulado no mês</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Despesas Mês */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex justify-between items-start hover:border-rose-500/40 transition-all">
              <div>
                <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider block">Despesas ({monthsShort[selectedMonth]})</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(monthlyExpense)}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Total gasto no mês</span>
              </div>
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            {/* Taxa de Poupança */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex justify-between items-start hover:border-amber-500/40 transition-all">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Taxa de Aporte</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {monthlyIncome > 0 ? `${((monthlyInvestment / monthlyIncome) * 100).toFixed(1)}%` : '0.0%'}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Porcentagem investida</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <Percent className="h-5 w-5" />
              </div>
            </div>

            {/* Investimentos Acumulados */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex justify-between items-start hover:border-cyan-500/40 transition-all">
              <div>
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Aportes Ano</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(annualInvestment)}
                </span>
                <span className="text-[9px] text-zinc-500 block mt-1">Investido em {selectedYear}</span>
              </div>
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Fluxo de Caixa Anual Chart & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Bar Chart: Comparativo Mensal de Receitas x Despesas */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                    Fluxo de Caixa Comparativo ({selectedYear})
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Evolução de Entradas (Verde) e Saídas (Vermelho) ao longo do ano</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Receitas
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Despesas
                  </span>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="h-64 pt-4 flex items-end gap-2 overflow-x-auto">
                {monthlyBreakdown.map((m, idx) => {
                  const incHeight = maxAnnualVal > 0 ? (m.income / maxAnnualVal) * 100 : 0;
                  const expHeight = maxAnnualVal > 0 ? (m.expense / maxAnnualVal) * 100 : 0;
                  const isSelected = selectedMonth === idx;

                  return (
                    <div
                      key={m.name}
                      onClick={() => { setSelectedMonth(idx); setActiveTab('extrato'); }}
                      className={`flex-1 flex flex-col items-center justify-end h-full gap-1 p-1 rounded-xl transition-all cursor-pointer group hover:bg-zinc-900/60 ${
                        isSelected ? 'bg-orange-500/10 border border-orange-500/30' : ''
                      }`}
                    >
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${Math.max(incHeight, 4)}%` }}
                          className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t group-hover:bg-emerald-400 transition-all relative"
                          title={`Receitas: ${formatCurrency(m.income)}`}
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${Math.max(expHeight, 4)}%` }}
                          className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t group-hover:bg-rose-400 transition-all relative"
                          title={`Despesas: ${formatCurrency(m.expense)}`}
                        />
                      </div>
                      <span className={`text-[10px] font-bold font-mono mt-2 ${isSelected ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                        {m.shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expenses Category Pie Chart */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-orange-500" />
                  Distribuição de Gastos ({monthsShort[selectedMonth]})
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Categorias de despesas mais relevantes no mês</p>
              </div>

              <CategoryPieChart data={expenseCategoryPieData} />
            </div>
          </div>

          {/* Saúde Financeira Gauge & Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Health Score Box */}
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-orange-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Índice de Estabilidade Financeira</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Nível de Saúde: Alto
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Score de Saúde</span>
                  <span className="text-2xl font-black text-orange-400 font-mono block mt-1">92 / 100</span>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">Estável</span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Cobertura Reserva</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono block mt-1">
                    {monthlyExpense > 0 ? (totalAccountsBalance / monthlyExpense).toFixed(1) : '6.0'}x
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Meses de despesas</span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block font-bold">Comprometimento</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono block mt-1">
                    {monthlyIncome > 0 ? `${((monthlyExpense / monthlyIncome) * 100).toFixed(0)}%` : '0%'}
                  </span>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">Ideal (&lt; 70%)</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                💡 <span className="text-white font-bold">Diagnóstico TRONUS:</span> Suas receitas superam com folga as despesas fixas. Mantenha a meta de aportes de no mínimo 20% do orçamento no módulo de Investimentos.
              </p>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Módulos de Acesso Rápido
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Atalhos diretos para as áreas operacionais de finanças</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setActiveTab('extrato'); setIsAdding(true); }}
                  className="p-3.5 bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/50 border border-zinc-800 rounded-xl text-left transition-all group"
                >
                  <Coins className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white block">Novo Lançamento</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">+20 XP no sistema</span>
                </button>

                <button
                  onClick={() => setActiveTab('planejamento')}
                  className="p-3.5 bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/50 border border-zinc-800 rounded-xl text-left transition-all group"
                >
                  <Target className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white block">Simular Regra 50/30/20</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Planejar metas</span>
                </button>

                <button
                  onClick={() => setActiveTab('investimentos')}
                  className="p-3.5 bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/50 border border-zinc-800 rounded-xl text-left transition-all group"
                >
                  <PiggyBank className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white block">Carteira de Ativos</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Aportes & Juros</span>
                </button>

                <button
                  onClick={() => setActiveTab('contas')}
                  className="p-3.5 bg-zinc-900 hover:bg-orange-500/10 hover:border-orange-500/50 border border-zinc-800 rounded-xl text-left transition-all group"
                >
                  <CreditCard className="h-5 w-5 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white block">Contas & Cartões</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Ver limites e saldos</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: EXTRATO (Lançamentos Mensal e Anual) */}
      {/* ========================================================================= */}
      {activeTab === 'extrato' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Section Title */}
          <div className="section-title">
            <h2>Extrato de Transações</h2>
            <div className="section-title-subtitle">Lançamentos, Visão Mensal, Anual e Matriz Consolidada</div>
          </div>

          {/* FILTERS BAR (Ref: Cod Purple style) */}
          <div className="filters-bar">
            {/* View Switcher Filters */}
            <button
              onClick={() => setExtratoSubView('mensal')}
              className={`filter-btn ${extratoSubView === 'mensal' ? 'active' : ''}`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>VISÃO MENSAL</span>
            </button>

            <button
              onClick={() => setExtratoSubView('anual')}
              className={`filter-btn ${extratoSubView === 'anual' ? 'active' : ''}`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>VISÃO ANUAL</span>
            </button>

            <div className="h-6 w-px bg-zinc-800 self-center hidden sm:block mx-1" />

            {/* Category / Type Filters */}
            <button
              onClick={() => setExtratoTypeFilter('all')}
              className={`filter-btn ${extratoTypeFilter === 'all' ? 'active' : ''}`}
            >
              <span>TODOS</span>
            </button>
            <button
              onClick={() => setExtratoTypeFilter('income')}
              className={`filter-btn ${extratoTypeFilter === 'income' ? 'active' : ''}`}
            >
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>RECEITAS</span>
            </button>
            <button
              onClick={() => setExtratoTypeFilter('expense')}
              className={`filter-btn ${extratoTypeFilter === 'expense' ? 'active' : ''}`}
            >
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              <span>DESPESAS</span>
            </button>
            <button
              onClick={() => setExtratoTypeFilter('investment')}
              className={`filter-btn ${extratoTypeFilter === 'investment' ? 'active' : ''}`}
            >
              <PiggyBank className="h-3.5 w-3.5 text-amber-400" />
              <span>INVESTIMENTOS</span>
            </button>
          </div>

          {/* Transaction Entry Form Trigger Bar */}
          <div className="flex justify-between items-center bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-orange-500" />
              <span>Deseja adicionar um novo movimento financeiro? Registre para somar <strong className="text-orange-400 font-mono">+20 XP</strong>.</span>
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isAdding ? 'Fechar Form' : 'Registrar Lançamento'}
            </button>
          </div>

          {/* Adding Entry Form Modal Drawer */}
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-950 border border-orange-500/40 rounded-2xl p-6 space-y-4 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Coins className="h-4.5 w-4.5 text-orange-500" /> Registrar Transação
                  </h3>
                  <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                    +20 XP por registro
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Switcher */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('income')}
                      className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        entryType === 'income'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('expense')}
                      className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        entryType === 'expense'
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                          : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('investment')}
                      className={`py-2.5 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                        entryType === 'investment'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-zinc-900 border-zinc-800 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Investimento
                    </button>
                  </div>

                  {/* Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">VALOR (R$)</label>
                      <input
                        type="text"
                        required
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">CATEGORIA</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-orange-500/50"
                      >
                        {getCategories(entryType).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">DATA</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">DESCRIÇÃO (OPCIONAL)</label>
                    <input
                      type="text"
                      placeholder="Ex: Salário mensal, Compra de supermercado..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      maxLength={60}
                    />
                  </div>

                  {/* Recurrence Switch */}
                  <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block">Lançamento Recorrente</label>
                        <span className="text-[10px] text-zinc-500 block">Repetir automaticamente nos próximos meses</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isRecurringTx}
                        onChange={(e) => setIsRecurringTx(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-800 text-orange-500 focus:ring-orange-500/30 bg-zinc-900 cursor-pointer"
                      />
                    </div>

                    {isRecurringTx && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Duração / Prazo</label>
                          <select
                            value={recurringTypeTx}
                            onChange={(e) => setRecurringTypeTx(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50"
                          >
                            <option value="always">Recorrente Contínuo (Sempre)</option>
                            <option value="months">Parcelado por período (meses)</option>
                            <option value="until_date">Até data específica</option>
                          </select>
                        </div>

                        {recurringTypeTx === 'months' && (
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Quantidade de Meses</label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={recurringMonthsTx}
                              onChange={(e) => setRecurringMonthsTx(parseInt(e.target.value, 10) || 12)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-xs text-gray-400 hover:text-white px-4 py-2 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Salvar Lançamento
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VISÃO MENSAL CONTENT */}
          {extratoSubView === 'mensal' && (
            <div className="space-y-6">
              {/* Month selector bar */}
              <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block mb-2 px-2">Selecione o Mês:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {months.map((mName, idx) => (
                    <button
                      key={mName}
                      onClick={() => setSelectedMonth(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                        selectedMonth === idx
                          ? 'bg-orange-500/15 border border-orange-500 text-orange-400 shadow-sm'
                          : 'bg-zinc-900/40 border border-zinc-850 text-gray-400 hover:text-white hover:border-zinc-750'
                      }`}
                    >
                      {mName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/30 p-4.5 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Receitas</span>
                    <span className="text-lg font-black text-white font-mono block mt-1">{formatCurrency(monthlyIncome)}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>

                <div className="bg-zinc-900/30 p-4.5 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Despesas</span>
                    <span className="text-lg font-black text-white font-mono block mt-1">{formatCurrency(monthlyExpense)}</span>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>

                <div className="bg-zinc-900/30 p-4.5 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">Investimentos</span>
                    <span className="text-lg font-black text-white font-mono block mt-1">{formatCurrency(monthlyInvestment)}</span>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <PiggyBank className="h-4 w-4" />
                  </div>
                </div>

                <div className="bg-zinc-900/30 p-4.5 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block">Saldo do Mês</span>
                    <span className={`text-lg font-black font-mono block mt-1 ${monthlyBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(monthlyBalance)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/20">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Transaction Search & Table List */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Lançamentos de {months[selectedMonth]} {selectedYear}
                  </h3>

                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por descrição/categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                {/* Filtered List */}
                {(() => {
                  const filteredList = monthlyEntries.filter(entry => {
                    if (extratoTypeFilter !== 'all' && entry.type !== extratoTypeFilter) return false;
                    if (searchTerm.trim()) {
                      const query = searchTerm.toLowerCase();
                      const matchDesc = entry.description.toLowerCase().includes(query);
                      const matchCat = entry.category.toLowerCase().includes(query);
                      if (!matchDesc && !matchCat) return false;
                    }
                    return true;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="text-center py-12 text-zinc-500 text-xs italic">
                        Nenhum lançamento encontrado para os filtros selecionados em {months[selectedMonth]}.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-900 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                            <th className="pb-3 pl-2">Data</th>
                            <th className="pb-3">Descrição / Título</th>
                            <th className="pb-3">Categoria</th>
                            <th className="pb-3">Tipo</th>
                            <th className="pb-3 text-right">Valor</th>
                            <th className="pb-3 text-center pr-2">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60 text-xs font-medium">
                          {filteredList.map(entry => {
                            const isInc = entry.type === 'income';
                            const isExp = entry.type === 'expense';
                            const isInv = entry.type === 'investment';

                            return (
                              <tr key={entry.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="py-3 pl-2 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                                  {entry.date}
                                </td>
                                <td className="py-3 text-white font-bold max-w-xs truncate">
                                  {entry.description}
                                </td>
                                <td className="py-3">
                                  <span
                                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
                                    style={{ backgroundColor: categoryColors[entry.category] || '#475569' }}
                                  >
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    isInc ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    isExp ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {isInc ? 'Receita' : isExp ? 'Despesa' : 'Investimento'}
                                  </span>
                                </td>
                                <td className={`py-3 text-right font-mono font-black ${
                                  isInc ? 'text-emerald-400' : isExp ? 'text-rose-400' : 'text-amber-400'
                                }`}>
                                  {isInc ? '+' : isExp ? '-' : ''} {formatCurrency(entry.amount)}
                                </td>
                                <td className="py-3 text-center pr-2">
                                  <button
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* VISÃO ANUAL CONTENT (Matriz Consolidada) */}
          {extratoSubView === 'anual' && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Grid className="h-4 w-4 text-orange-500" />
                    Balanço Anual Consolidado ({selectedYear})
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Matriz de acompanhamento mês a mês das contas e categorias</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    Total Entradas: <strong className="font-black">{formatCurrency(annualIncome)}</strong>
                  </div>
                  <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                    Total Saídas: <strong className="font-black">{formatCurrency(annualExpense)}</strong>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-900/50">
                      <th className="p-3">Mês</th>
                      <th className="p-3 text-right">Receitas</th>
                      <th className="p-3 text-right">Despesas</th>
                      <th className="p-3 text-right">Investimentos</th>
                      <th className="p-3 text-right">Resultado</th>
                      <th className="p-3 text-center">Taxa de Aporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {monthlyBreakdown.map((m) => (
                      <tr key={m.name} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3 font-bold text-white">{m.name}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{formatCurrency(m.income)}</td>
                        <td className="p-3 text-right text-rose-400 font-bold">{formatCurrency(m.expense)}</td>
                        <td className="p-3 text-right text-amber-400 font-bold">{formatCurrency(m.investment)}</td>
                        <td className={`p-3 text-right font-black ${m.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(m.balance)}
                        </td>
                        <td className="p-3 text-center text-zinc-400 font-bold">{m.savingsRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: PLANEJAMENTO FINANCEIRO */}
      {/* ========================================================================= */}
      {activeTab === 'planejamento' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Section Title */}
          <div className="section-title">
            <h2>Planejamento Financeiro</h2>
            <div className="section-title-subtitle">Regra 50/30/20, Reserva de Emergência & Simuladores de Metas</div>
          </div>

          {/* 1. Regra 50/30/20 Calculator */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-orange-500" />
                  Calculadora & Distribuição 50/30/20
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Alocação recomendada do seu orçamento mensal para independência financeira</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-bold">Renda Mensal Base:</span>
                <input
                  type="number"
                  value={planningIncomeInput}
                  onChange={(e) => setPlanningIncomeInput(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-orange-400 font-mono font-bold w-32 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            {(() => {
              const baseInc = parseFloat(planningIncomeInput) || monthlyIncome || 8500;
              const target50 = baseInc * 0.5;
              const target30 = baseInc * 0.3;
              const target20 = baseInc * 0.2;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 50% Essenciais */}
                  <div className="bg-zinc-900/50 border border-blue-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">50% — Necessidades Essenciais</span>
                        <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(target50)}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">50%</span>
                    </div>

                    <p className="text-[10px] text-zinc-400">Moradia, Aluguel, Alimentação Básica, Água, Luz, Saúde</p>
                    
                    <div className="space-y-1 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">Gasto Atual no Mês:</span>
                        <span className="text-white font-bold">{formatCurrency(monthlyExpense * 0.6)}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(((monthlyExpense * 0.6) / target50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 30% Desejos Pessoais */}
                  <div className="bg-zinc-900/50 border border-pink-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider block">30% — Desejos & Lazer</span>
                        <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(target30)}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded-lg">30%</span>
                    </div>

                    <p className="text-[10px] text-zinc-400">Restaurantes, Viagens, Hobbies, Assinaturas, Compras</p>

                    <div className="space-y-1 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">Gasto Atual no Mês:</span>
                        <span className="text-white font-bold">{formatCurrency(monthlyExpense * 0.4)}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full"
                          style={{ width: `${Math.min(((monthlyExpense * 0.4) / target30) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 20% Prioridades Financeiras */}
                  <div className="bg-zinc-900/50 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">20% — Investimentos & Futuro</span>
                        <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(target20)}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">20%</span>
                    </div>

                    <p className="text-[10px] text-zinc-400">Aportes em Renda Fixa, Ações, FIIs, Quitação de Dívidas</p>

                    <div className="space-y-1 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">Aporte Atual no Mês:</span>
                        <span className="text-white font-bold">{formatCurrency(monthlyInvestment)}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((monthlyInvestment / target20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 2. Reserva de Emergência Simulator */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  Simulador de Reserva de Emergência
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Calcula o valor necessário mantido em alta liquidez (CDB 100% CDI / Tesouro Selic)</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-bold">Meses de Proteção:</span>
                <select
                  value={emergencyFundMonthsTarget}
                  onChange={(e) => setEmergencyFundMonthsTarget(parseInt(e.target.value, 10))}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-orange-500/50"
                >
                  <option value={3}>3 Meses (Moderado)</option>
                  <option value={6}>6 Meses (Recomendado)</option>
                  <option value={12}>12 Meses (Alta Segurança)</option>
                </select>
              </div>
            </div>

            {(() => {
              const baseCost = monthlyExpense > 0 ? monthlyExpense : 4500;
              const targetFund = baseCost * emergencyFundMonthsTarget;
              const currentFund = totalAccountsBalance;
              const fundPercent = Math.min((currentFund / targetFund) * 100, 100);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="space-y-3 lg:col-span-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-zinc-400">Progresso da Reserva ({emergencyFundMonthsTarget} meses):</span>
                      <span className="text-orange-400 font-bold">{fundPercent.toFixed(1)}% concluído</span>
                    </div>

                    <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${fundPercent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs font-mono">
                      <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                        <span className="text-[10px] text-zinc-500 block">Custo Mensal Base</span>
                        <span className="text-white font-bold block mt-0.5">{formatCurrency(baseCost)}</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                        <span className="text-[10px] text-zinc-500 block">Meta da Reserva</span>
                        <span className="text-orange-400 font-bold block mt-0.5">{formatCurrency(targetFund)}</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-850">
                        <span className="text-[10px] text-zinc-500 block">Saldo Acumulado</span>
                        <span className="text-emerald-400 font-bold block mt-0.5">{formatCurrency(currentFund)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-850 text-center space-y-2">
                    <Sparkles className="h-6 w-6 text-orange-500 mx-auto" />
                    <h4 className="text-xs font-bold text-white uppercase">Status da Sua Blindagem</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {fundPercent >= 100
                        ? '🎉 Parabéns! Sua reserva de emergência está 100% constituída.'
                        : `Faltam ${formatCurrency(targetFund - currentFund)} para completar sua meta de segurança.`}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: INVESTIMENTOS (Integration with InvestmentsPlanner) */}
      {/* ========================================================================= */}
      {activeTab === 'investimentos' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="section-title">
            <h2>Carteira de Investimentos</h2>
            <div className="section-title-subtitle">Gestão de Ativos, Aportes & Renda Passiva</div>
          </div>

          <InvestmentsPlanner finances={finances} addXp={addXp} />
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: CONTAS & CARTÕES */}
      {/* ========================================================================= */}
      {activeTab === 'contas' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Section Title */}
          <div className="section-title">
            <h2>Gestão de Contas & Cartões</h2>
            <div className="section-title-subtitle">Saldos Bancários, Carteiras Digitais & Limites de Crédito</div>
          </div>

          {/* Top Accounts Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-orange-500/30 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block">Saldo Total em Contas</span>
                <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(totalAccountsBalance)}</span>
              </div>
              <Building2 className="h-6 w-6 text-orange-500" />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block">Limite de Crédito Utilizado</span>
                <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(totalUsedCreditLimit)}</span>
              </div>
              <CreditCard className="h-6 w-6 text-purple-400" />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Limite Livre Disponível</span>
                <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(totalCreditLimit - totalUsedCreditLimit)}</span>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
          </div>

          {/* Bank Accounts Grid */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-500" />
                Contas Bancárias & Carteiras Digitais
              </h3>

              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> + Nova Conta
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {accounts.map(acc => (
                <div key={acc.id} className="bg-zinc-900/40 border border-zinc-850 hover:border-orange-500/40 p-4 rounded-2xl space-y-3 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${acc.iconBg}`}>
                        <Building2 className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{acc.name}</h4>
                        <span className="text-[10px] text-zinc-500 block">{acc.bank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-850/80">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Saldo Atual:</span>
                    <span className="text-base font-black text-white font-mono block">{formatCurrency(acc.balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Cards Grid */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-500" />
                Cartões de Crédito
              </h3>

              <button
                onClick={() => setShowAddCardModal(true)}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> + Novo Cartão
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {creditCards.map(card => {
                const usagePercent = Math.min((card.usedLimit / card.totalLimit) * 100, 100);

                return (
                  <div key={card.id} className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{card.name}</h4>
                        <span className="text-[10px] text-zinc-500 block">{card.bank}</span>
                      </div>
                      <CreditCard className="h-5 w-5 text-orange-500" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-400">Limite Usado: {formatCurrency(card.usedLimit)}</span>
                        <span className="text-zinc-500">Total: {formatCurrency(card.totalLimit)}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850 text-center text-[10px]">
                      <div className="p-2 bg-zinc-900/80 rounded-lg">
                        <span className="text-zinc-500 block">Fechamento:</span>
                        <span className="text-white font-bold block">Dia {card.closingDay}</span>
                      </div>
                      <div className="p-2 bg-zinc-900/80 rounded-lg">
                        <span className="text-zinc-500 block">Vencimento:</span>
                        <span className="text-orange-400 font-bold block">Dia {card.dueDay}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: DÍVIDAS & FINANCIAMENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'dividas' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Section Title */}
          <div className="section-title">
            <h2>Dívidas & Passivos</h2>
            <div className="section-title-subtitle">Controle de Passivos, Juros & Estratégias de Quitação</div>
          </div>

          {/* Top Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-rose-500/30 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider block">Total de Dívidas Saldo</span>
                <span className="text-xl font-black text-white font-mono block mt-1">{formatCurrency(totalDebtsRemaining)}</span>
              </div>
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Parcelas Mensais Comprometidas</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(debts.reduce((sum, d) => sum + d.monthlyInstallment, 0))}
                </span>
              </div>
              <Calendar className="h-6 w-6 text-amber-400" />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Estratégia Escolhida</span>
                <span className="text-base font-black text-white block mt-1 uppercase">
                  {debtStrategy === 'avalanche' ? 'Avalanche (Maior Juros)' : 'Bola de Neve (Menor Saldo)'}
                </span>
              </div>
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          </div>

          {/* Debts Table / List */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Passivos em Aberto
              </h3>

              <button
                onClick={() => setShowAddDebtModal(true)}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> + Adicionar Passivo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {debts.map(d => (
                <div key={d.id} className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white">{d.title}</h4>
                      <span className="text-[10px] text-zinc-500 block">{d.creditor} • Vencimento: {d.dueDate}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      {d.interestRateMonthly}% a.m.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-850/80 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Saldo Devedor:</span>
                      <span className="text-white font-bold block">{formatCurrency(d.remainingAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block">Parcela Mensal:</span>
                      <span className="text-orange-400 font-bold block">{formatCurrency(d.monthlyInstallment)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payoff Simulator (Snowball vs Avalanche) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Simulador de Estratégia de Quitação
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Compare os métodos de liquidação acelerada de passivos</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDebtStrategy('avalanche')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    debtStrategy === 'avalanche' ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Estratégia Avalanche
                </button>
                <button
                  onClick={() => setDebtStrategy('snowball')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    debtStrategy === 'snowball' ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  Bola de Neve
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-850 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                {debtStrategy === 'avalanche' ? 'Método Avalanche (Foco na maior taxa de juros)' : 'Método Bola de Neve (Foco na menor dívida)'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {debtStrategy === 'avalanche'
                  ? 'No método Avalanche, você direciona todos os aportes extras para a dívida com a MAIOR taxa de juros. Isso economiza o máximo possível de juros totais pagos ao longo do tempo.'
                  : 'No método Bola de Neve, você quita primeiro a dívida de menor valor absoluto para ter vitórias psicológicas rápidas e eliminar boletos mais rapidamente.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODALS: ADD ACCOUNT / ADD CARD / ADD DEBT */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-orange-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Nova Conta Bancária</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold uppercase">Nome da Conta</label>
                <input type="text" placeholder="Ex: Itaú Principal" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 font-bold uppercase">Instituição / Banco</label>
                <input type="text" placeholder="Ex: Itaú Unibanco" value={newAccBank} onChange={(e) => setNewAccBank(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 font-bold uppercase">Saldo Inicial (R$)</label>
                <input type="number" placeholder="0,00" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button onClick={() => setShowAddAccountModal(false)} className="px-4 py-2 text-xs text-zinc-400 cursor-pointer">Cancelar</button>
              <button
                onClick={() => {
                  if (!newAccName.trim()) return;
                  const newAcc: BankAccount = {
                    id: Math.random().toString(36).substring(2, 9),
                    name: newAccName.trim(),
                    bank: newAccBank.trim() || 'Banco',
                    type: newAccType,
                    balance: parseFloat(newAccBalance) || 0,
                    color: '#f97316',
                    iconBg: 'bg-orange-500/10'
                  };
                  setAccounts([...accounts, newAcc]);
                  setShowAddAccountModal(false);
                  setNewAccName(''); setNewAccBank(''); setNewAccBalance('');
                }}
                className="px-5 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-orange-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Novo Cartão de Crédito</h3>
              <button onClick={() => setShowAddCardModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold uppercase">Nome do Cartão</label>
                <input type="text" placeholder="Ex: Nubank Ultravioleta" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold uppercase">Limite Usado (R$)</label>
                  <input type="number" placeholder="0,00" value={newCardUsedLimit} onChange={(e) => setNewCardUsedLimit(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold uppercase">Limite Total (R$)</label>
                  <input type="number" placeholder="5000,00" value={newCardTotalLimit} onChange={(e) => setNewCardTotalLimit(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button onClick={() => setShowAddCardModal(false)} className="px-4 py-2 text-xs text-zinc-400 cursor-pointer">Cancelar</button>
              <button
                onClick={() => {
                  if (!newCardName.trim()) return;
                  const newCard: CreditCardItem = {
                    id: Math.random().toString(36).substring(2, 9),
                    name: newCardName.trim(),
                    bank: newCardBank.trim() || 'Banco',
                    usedLimit: parseFloat(newCardUsedLimit) || 0,
                    totalLimit: parseFloat(newCardTotalLimit) || 10000,
                    closingDay: parseInt(newCardClosing, 10) || 10,
                    dueDay: parseInt(newCardDue, 10) || 17,
                    color: '#8b5cf6'
                  };
                  setCreditCards([...creditCards, newCard]);
                  setShowAddCardModal(false);
                  setNewCardName(''); setNewCardUsedLimit(''); setNewCardTotalLimit('');
                }}
                className="px-5 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Cartão
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-rose-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Adicionar Passivo / Dívida</h3>
              <button onClick={() => setShowAddDebtModal(false)} className="text-zinc-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold uppercase">Título da Dívida</label>
                <input type="text" placeholder="Ex: Financiamento de Veículo" value={newDebtTitle} onChange={(e) => setNewDebtTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold uppercase">Saldo Devedor (R$)</label>
                  <input type="number" placeholder="10000,00" value={newDebtRemaining} onChange={(e) => setNewDebtRemaining(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold uppercase">Parcela Mensal (R$)</label>
                  <input type="number" placeholder="500,00" value={newDebtInstallment} onChange={(e) => setNewDebtInstallment(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button onClick={() => setShowAddDebtModal(false)} className="px-4 py-2 text-xs text-zinc-400 cursor-pointer">Cancelar</button>
              <button
                onClick={() => {
                  if (!newDebtTitle.trim()) return;
                  const newDebt: DebtItem = {
                    id: Math.random().toString(36).substring(2, 9),
                    title: newDebtTitle.trim(),
                    creditor: newDebtCreditor.trim() || 'Banco',
                    originalAmount: parseFloat(newDebtRemaining) || 10000,
                    remainingAmount: parseFloat(newDebtRemaining) || 10000,
                    monthlyInstallment: parseFloat(newDebtInstallment) || 500,
                    interestRateMonthly: parseFloat(newDebtRate) || 1.0,
                    dueDate: 'Dia 10',
                    category: 'Geral'
                  };
                  setDebts([...debts, newDebt]);
                  setShowAddDebtModal(false);
                  setNewDebtTitle(''); setNewDebtRemaining(''); setNewDebtInstallment('');
                }}
                className="px-5 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Dívida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
