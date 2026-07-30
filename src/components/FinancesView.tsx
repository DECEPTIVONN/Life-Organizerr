import React, { useState } from 'react';
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
  Info
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
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-5 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
      {/* SVG Donut */}
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeLength = percent * rCircumference;
            const strokeOffset = -accumulatedPercent * rCircumference;
            accumulatedPercent += percent;

            const isHovered = activeIndex === index;

            return (
              <circle
                key={item.name}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${strokeLength} ${rCircumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer origin-center"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                style={{
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Total Gastos</span>
          <span className="text-xs font-black text-white font-mono mt-0.5">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {activeIndex !== null && (
            <span className="text-[9px] text-orange-400 font-bold mt-1 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 animate-fade-in">
              {data[activeIndex].name}: {((data[activeIndex].value / total) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {data.map((item, index) => {
          const pct = (item.value / total) * 100;
          const isHovered = activeIndex === index;
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center gap-2 p-1 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-zinc-900/80 text-white' : 'hover:bg-zinc-900/20 text-zinc-400'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold truncate text-zinc-300">{item.name}</p>
                <p className="text-[9px] font-mono text-zinc-500">
                  R$ {item.value.toLocaleString('pt-BR')} ({pct.toFixed(0)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FinancesView({ finances, setFinances, addXp }: FinancesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'mensal' | 'anual' | 'investimentos'>('mensal');
  const [annualSubTab, setAnnualSubTab] = useState<'planilha' | 'analise'>('planilha');
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

  React.useEffect(() => {
    localStorage.setItem('finances_budget_open', String(isBudgetOpen));
  }, [isBudgetOpen]);

  React.useEffect(() => {
    localStorage.setItem('finances_entries_open', String(isEntriesOpen));
  }, [isEntriesOpen]);

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
      
      const savedOld = localStorage.getItem('mbc_monthly_budgets');
      if (savedOld) {
        const oldBudgets = JSON.parse(savedOld);
        const migrated: BudgetLimit[] = [];
        Object.entries(oldBudgets).forEach(([key, catMap]) => {
          const [yrStr, moStr] = key.split('-');
          const yr = parseInt(yrStr, 10);
          const mo = parseInt(moStr, 10);
          if (!isNaN(yr) && !isNaN(mo)) {
            Object.entries(catMap as Record<string, number>).forEach(([cat, amt]) => {
              migrated.push({
                id: Math.random().toString(36).substring(2, 9),
                category: cat,
                amount: amt,
                startYear: yr,
                startMonth: mo,
                isRecurring: false, // old ones applied to a single month only
                recurringType: 'always'
              });
            });
          }
        });
        if (migrated.length > 0) {
          localStorage.setItem('mbc_budget_limits_v2', JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch (e) {
      console.error("Failed to parse budget limits", e);
    }
    
    // Default fallback limits
    return [
      { id: '1', category: 'Alimentação', amount: 600, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: '2', category: 'Moradia', amount: 1200, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: '3', category: 'Transporte', amount: 200, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: '4', category: 'Lazer', amount: 250, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: '5', category: 'Assinaturas', amount: 100, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' },
      { id: '6', category: 'Outros', amount: 300, startYear: 2026, startMonth: 0, isRecurring: true, recurringType: 'always' }
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

  // Expanded selectable categories covering the image checklist
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

  // Dynamic recurrence expansion for transaction entries
  const getExpandedFinancesForMonth = (year: number, month: number) => {
    const list: FinanceEntry[] = [];
    
    finances.forEach(entry => {
      const tDate = new Date(entry.date + 'T12:00:00');
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      
      // Cannot happen before start date
      if (year < tYear || (year === tYear && month < tMonth)) {
        return;
      }
      
      // Original occurrence
      if (year === tYear && month === tMonth) {
        list.push(entry);
        return;
      }
      
      // Dynamic recurrent clones
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

  // Dynamic derivation of active budget limits for a given month/year
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

  // Submits a new transaction with recurrence fields
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

  // Deriving Monthly items
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

  // Deriving Annual items
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

  // REQUIREMENT 5: expenses logged under category 'Outros' or any unconfigured budget category count automatically towards 'Outros' budget limit
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
  const totalAvailable = totalBudgeted - totalRealizedExpenseForBudgets;

  const handleUpdateBudget = (catName: string, value: number) => {
    const existingIndex = budgetLimits.findIndex(l => l.category === catName && l.startYear === selectedYear && l.startMonth === selectedMonth);
    if (existingIndex >= 0) {
      const updated = [...budgetLimits];
      updated[existingIndex] = { ...updated[existingIndex], amount: value };
      saveBudgetLimits(updated);
    } else {
      const newLimit: BudgetLimit = {
        id: Math.random().toString(36).substring(2, 9),
        category: catName,
        amount: value,
        startYear: selectedYear,
        startMonth: selectedMonth,
        isRecurring: true,
        recurringType: 'always'
      };
      saveBudgetLimits([...budgetLimits, newLimit]);
    }
  };

  const handleAddBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetCategory.trim()) return;
    const amt = parseFloat(newBudgetAmount) || 0;
    
    const newLimit: BudgetLimit = {
      id: Math.random().toString(36).substring(2, 9),
      category: newBudgetCategory.trim(),
      amount: amt,
      startYear: selectedYear,
      startMonth: selectedMonth,
      isRecurring: isRecurringBudget,
      recurringType: isRecurringBudget ? recurringTypeBudget : 'always',
      recurringMonths: (isRecurringBudget && recurringTypeBudget === 'months') ? recurringMonthsBudget : undefined,
      recurringUntilDate: (isRecurringBudget && recurringTypeBudget === 'until_date') ? recurringUntilDateBudget : undefined
    };
    
    saveBudgetLimits([...budgetLimits, newLimit]);
    setNewBudgetCategory('');
    setNewBudgetAmount('');
    setIsRecurringBudget(true);
    setRecurringTypeBudget('always');
    setShowAddBudget(false);
  };

  const handleRemoveBudgetCategory = (catName: string) => {
    const filtered = budgetLimits.filter(l => l.category !== catName);
    saveBudgetLimits(filtered);
  };

  // Grouped monthly calculations for charts & balanço
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

  // Find max value in monthly breakdown to scale the comparative chart correctly
  const maxAnnualVal = Math.max(
    ...monthlyBreakdown.map(m => Math.max(m.income, m.expense, m.investment)),
    1000 // default minimum scale to avoid division by zero
  );

  // Calculate historical summaries for each year starting from 2026 up to 2050
  const historyYears = Array.from({ length: 25 }, (_, i) => 2026 + i); // 2026 to 2050

  const yearlyHistoryData = historyYears.map(yr => {
    const yrEntries = finances.filter(entry => {
      // safe year parsing from YYYY-MM-DD
      const entryYear = parseInt(entry.date.split('-')[0], 10);
      return entryYear === yr;
    });

    const inc = yrEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const exp = yrEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const inv = yrEntries.filter(e => e.type === 'investment').reduce((sum, e) => sum + e.amount, 0);
    const bal = inc - exp - inv;
    const rate = inc > 0 ? (inv / inc) * 100 : 0;

    return {
      year: yr,
      income: inc,
      expense: exp,
      investment: inv,
      balance: bal,
      savingsRate: rate,
      hasData: yrEntries.length > 0
    };
  });

  return (
    <div id="finances-view" className="space-y-6 pb-12">
      {/* Header with main section tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-orange-500" />
            Finanças
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Planejamento mensal individual e balanço consolidado anual
          </p>
        </div>

        {/* Year Selector & View Switcher (Mensal vs Anual) */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Year selector starting from 2026 */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-zinc-950 border border-zinc-900 hover:border-zinc-850 text-white rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none cursor-pointer transition-all"
          >
            {Array.from({ length: 15 }, (_, i) => 2026 + i).map((y) => (
              <option key={y} value={y}>
                Ano: {y}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-900">
            <button
              onClick={() => setActiveTab('mensal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'mensal'
                  ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Mensal
            </button>
            <button
              onClick={() => setActiveTab('anual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'anual'
                  ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Anual
            </button>
            <button
              onClick={() => setActiveTab('investimentos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'investimentos'
                  ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <PiggyBank className="h-3.5 w-3.5" />
              Investimentos
            </button>
          </div>
        </div>
      </div>

      {/* Adding Input Panel */}
      {activeTab !== 'investimentos' && (
        <>
          <div className="flex justify-between items-center bg-zinc-900/20 border border-zinc-850 p-4 rounded-xl">
            <div className="text-xs text-gray-400">
              Tem uma nova transação? Registre para ganhar <span className="text-orange-400 font-bold font-mono">+20 XP</span>.
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
            >
              {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-orange-500" />}
              {isAdding ? 'Fechar' : 'Registrar Lançamento'}
            </button>
          </div>

          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-5 space-y-4 overflow-hidden shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Coins className="h-4.5 w-4.5 text-orange-500" /> Registrar Transação
                  </h3>
                  <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                    Ganha +20 XP por registro
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Switcher (Receita vs Despesa vs Investimento) */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('income')}
                      className={`py-2 rounded-lg font-bold text-xs border text-center transition-all ${
                        entryType === 'income'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-zinc-950 border-zinc-850 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('expense')}
                      className={`py-2 rounded-lg font-bold text-xs border text-center transition-all ${
                        entryType === 'expense'
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                          : 'bg-zinc-950 border-zinc-850 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('investment')}
                      className={`py-2 rounded-lg font-bold text-xs border text-center transition-all ${
                        entryType === 'investment'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-zinc-950 border-zinc-850 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      Investimento
                    </button>
                  </div>

                  {/* Amount, Category, Date Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">VALOR (R$)</label>
                      <input
                        type="text"
                        required
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">CATEGORIA</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-350 focus:outline-none focus:border-orange-500/50"
                      >
                        {getCategories(entryType).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">DATA DE INÍCIO</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">DESCRIÇÃO (OPCIONAL)</label>
                    <input
                      type="text"
                      placeholder="Ex: Pagamento de freelance, Aporte em Ações, Compra de mercado..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      maxLength={60}
                    />
                  </div>

                  {/* Recurrence Setup (Requirement 4) */}
                  <div className="bg-zinc-950/60 p-4 border border-zinc-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block">Lançamento Recorrente</label>
                        <span className="text-[10px] text-zinc-500 block">Defina se este lançamento se repetirá nos próximos meses</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isRecurringTx}
                        onChange={(e) => setIsRecurringTx(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-800 text-orange-500 focus:ring-orange-500/30 bg-zinc-900 cursor-pointer"
                      />
                    </div>

                    {isRecurringTx && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900/60"
                      >
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Duração / Prazo</label>
                          <select
                            value={recurringTypeTx}
                            onChange={(e) => setRecurringTypeTx(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50"
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
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                            />
                          </div>
                        )}

                        {recurringTypeTx === 'until_date' && (
                          <div>
                            <label className="text-[9px] text-gray-400 font-bold block mb-1 uppercase">Repetir até a Data</label>
                            <input
                              type="date"
                              value={recurringUntilDateTx}
                              onChange={(e) => setRecurringUntilDateTx(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-1.5 rounded-lg transition-colors"
                    >
                      Adicionar Lançamento
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* CONDITIONAL RENDER: MONTHLY VIEW */}
      {activeTab === 'mensal' && (
        <div className="space-y-6">
          
          {/* Individual Month Selector row (Aba mensal individual para cada mês do ano) */}
          <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-900">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-2 px-2">Selecione o mês do ano:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
              {months.map((mName, idx) => (
                <button
                  key={mName}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0 snap-start ${
                    selectedMonth === idx
                      ? 'bg-orange-500/10 border border-orange-500 text-orange-400'
                      : 'bg-zinc-900/40 border border-zinc-850 text-gray-400 hover:text-white hover:border-zinc-750'
                  }`}
                >
                  {mName}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Income Card */}
            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Receitas</span>
                <span className="text-lg font-black text-white font-mono block mt-1">
                  {formatCurrency(monthlyIncome)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Entradas do mês</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Despesas</span>
                <span className="text-lg font-black text-white font-mono block mt-1">
                  {formatCurrency(monthlyExpense)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Gastos efetuados</span>
              </div>
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <TrendingDown className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Investment Card */}
            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">Investimentos</span>
                <span className="text-lg font-black text-white font-mono block mt-1">
                  {formatCurrency(monthlyInvestment)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Poupado e aportado</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <PiggyBank className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Balance Card */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
              monthlyBalance >= 0 
                ? 'bg-zinc-900/20 border-zinc-850' 
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <div>
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block">Saldo do Mês</span>
                <span className={`text-lg font-black font-mono block mt-1 ${
                  monthlyBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}>
                  {formatCurrency(monthlyBalance)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Sobrou em conta</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                monthlyBalance >= 0 
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <Briefcase className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* ORÇAMENTO MENSAL (Second Image - Notion style) */}
          <div className="bg-zinc-900/20 border border-zinc-850 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3 select-none">
              <div 
                onClick={() => setIsBudgetOpen(!isBudgetOpen)}
                className="cursor-pointer group flex-1"
              >
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Coins className="h-4 w-4 text-orange-500" /> 
                  <span>Orçamento Mensal ({months[selectedMonth]})</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isBudgetOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Acompanhe limites orçados vs. gastos reais. Altere o valor diretamente no campo para atualizar.</p>
              </div>
              {isBudgetOpen && (
                <button
                  onClick={() => setShowAddBudget(true)}
                  className="text-[10px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto h-fit"
                >
                  <Plus className="h-3 w-3" /> Nova Categoria de Orçamento
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isBudgetOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Quick stats on budgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-gray-500 uppercase font-black block">Total Limite Orçado</span>
                      <span className="text-sm font-bold font-mono text-zinc-300 block mt-1">{formatCurrency(totalBudgeted)}</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-gray-500 uppercase font-black block">Total Gasto Realizado</span>
                      <span className={`text-sm font-bold font-mono block mt-1 ${totalRealizedExpenseForBudgets > totalBudgeted ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatCurrency(totalRealizedExpenseForBudgets)}
                      </span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-gray-500 uppercase font-black block">Saldo Disponível Geral</span>
                      <span className={`text-sm font-bold font-mono block mt-1 ${totalAvailable < 0 ? 'text-red-400' : 'text-teal-400'}`}>
                        {formatCurrency(totalAvailable)}
                      </span>
                    </div>
                  </div>

                  {/* Overall Spent Progress Bar */}
                  {totalBudgeted > 0 && (
                    <div className="space-y-1.5 bg-zinc-950/20 p-3 rounded-xl border border-zinc-900">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-400 font-bold">Consumo Geral do Orçamento</span>
                        <span className="text-gray-300 font-mono font-bold">
                          {((totalRealizedExpenseForBudgets / totalBudgeted) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            totalRealizedExpenseForBudgets > totalBudgeted ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, (totalRealizedExpenseForBudgets / totalBudgeted) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Budget Table (Notion Style) */}
                  <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/40">
                    <div className="overflow-x-auto scrollbar-none">
                      <table className="w-full border-collapse text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-zinc-900/50 border-b border-zinc-900 text-[9px] font-black text-gray-500 uppercase tracking-wider font-sans">
                            <th className="p-3 w-1/3">Categoria</th>
                            <th className="p-3">Orçado</th>
                            <th className="p-3">Realizado</th>
                            <th className="p-3">Diferença / Status</th>
                            <th className="p-3 text-center w-12">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/30 text-xs font-medium">
                          {Object.entries(currentMonthBudgets).map(([catName, budgetedVal]) => {
                            const realizedVal = categoryRealized[catName] || 0;
                            const diffVal = budgetedVal - realizedVal;
                            const pctUsed = budgetedVal > 0 ? (realizedVal / budgetedVal) * 100 : 0;

                            let statusBadge = 'bg-zinc-900 text-zinc-400';
                            let statusText = 'Sem Orçamento';
                            if (budgetedVal > 0) {
                              if (realizedVal > budgetedVal) {
                                statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                                statusText = 'Estourou 🔴';
                              } else if (realizedVal === budgetedVal) {
                                statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                                statusText = 'No Limite 🟡';
                              } else if (pctUsed > 80) {
                                statusBadge = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
                                statusText = 'Crítico 🟡';
                              } else {
                                statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                statusText = 'Seguro 🟢';
                              }
                            }

                            return (
                              <tr key={catName} className="hover:bg-zinc-900/10 transition-colors">
                                <td className="p-3 font-semibold text-zinc-300">
                                  {catName}
                                </td>
                                <td className="p-2">
                                  <div className="flex items-center gap-1 group/input">
                                    <span className="text-gray-500 text-[10px] font-mono">R$</span>
                                    <input
                                      type="number"
                                      defaultValue={budgetedVal}
                                      onBlur={(e) => {
                                        const newVal = parseFloat(e.target.value);
                                        if (!isNaN(newVal) && newVal >= 0) {
                                          handleUpdateBudget(catName, newVal);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                      }}
                                      className="w-24 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-orange-500/50 py-1 px-1 font-mono text-zinc-200 focus:outline-none focus:bg-zinc-900/60 rounded transition-all"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-zinc-400">
                                  {formatCurrency(realizedVal)}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusBadge}`}>
                                      {statusText}
                                    </span>
                                    <span className={`font-mono text-[10px] ${diffVal < 0 ? 'text-rose-455' : 'text-emerald-400'}`}>
                                      {diffVal < 0 ? `-${formatCurrency(Math.abs(diffVal))}` : `+${formatCurrency(diffVal)}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Deseja remover a categoria "${catName}" do orçamento?`)) {
                                        handleRemoveBudgetCategory(catName);
                                      }
                                    }}
                                    className="text-zinc-650 hover:text-red-400 p-1.5 rounded transition-colors"
                                    title="Remover Categoria"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Footer Totals exactly like Second Image */}
                        <tfoot>
                          <tr className="bg-zinc-900/30 border-t border-zinc-900 font-bold text-[10px] font-mono text-zinc-400">
                            <td className="p-3 uppercase tracking-wider font-sans text-[9px] text-gray-500">Soma Total</td>
                            <td className="p-3 text-white">{formatCurrency(totalBudgeted)}</td>
                            <td className="p-3 text-orange-400">{formatCurrency(totalRealizedExpenseForBudgets)}</td>
                            <td className="p-3 text-emerald-400" colSpan={2}>
                              {totalAvailable < 0 ? 'Déficit: ' : 'Disponível: '} {formatCurrency(totalAvailable)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gráfico de Pizza por Categorias (Mensal) - Requirement 4 */}
          <div className="bg-zinc-900/20 border border-zinc-850 p-5 rounded-2xl space-y-3.5">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-orange-500" /> Distribuição de Despesas Mensais
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Visão percentual das categorias reais de gastos neste mês</p>
            </div>
            {(() => {
              const despesasEntries = monthlyEntries.filter(e => e.type === 'expense');
              const expenseCategoriesMap: Record<string, number> = {};
              despesasEntries.forEach(e => {
                let cat = e.category;
                if (currentMonthBudgets[cat] === undefined || cat === 'Outros') {
                  cat = 'Outros';
                }
                expenseCategoriesMap[cat] = (expenseCategoriesMap[cat] || 0) + e.amount;
              });
              const monthlyPieData = Object.entries(expenseCategoriesMap).map(([cat, val]) => ({
                name: cat,
                value: val,
                color: categoryColors[cat] || '#8b5cf6'
              })).filter(item => item.value > 0);

              return <CategoryPieChart data={monthlyPieData} />;
            })()}
          </div>

          {/* New Budget Category Dialog Popover */}
          {showAddBudget && (
            <div 
              onClick={() => setShowAddBudget(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 cursor-pointer"
            >
              <form 
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleAddBudgetCategory}
                className="cursor-default bg-zinc-950 border border-zinc-850 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Nova Meta Orçamentária</h4>
                  <button type="button" onClick={() => setShowAddBudget(false)} className="text-gray-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Nome da Categoria</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Combustível, Faculdade, Pet..."
                      value={newBudgetCategory}
                      onChange={(e) => setNewBudgetCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Valor Limite (R$)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="Ex: 300"
                      value={newBudgetAmount}
                      onChange={(e) => setNewBudgetAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>

                  {/* Recorrente/Prazo do Orçamento (Requirement 4) */}
                  <div className="bg-zinc-900 p-3 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-300 font-bold block">Orçamento Recorrente</span>
                      <input
                        type="checkbox"
                        checked={isRecurringBudget}
                        onChange={(e) => setIsRecurringBudget(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-zinc-800 text-orange-500 focus:ring-orange-500/30 bg-zinc-950 cursor-pointer"
                      />
                    </div>
                    {isRecurringBudget && (
                      <div className="space-y-2 pt-1 border-t border-zinc-850">
                        <div>
                          <label className="text-[9px] text-gray-500 block uppercase font-bold mb-1">Duração / Prazo</label>
                          <select
                            value={recurringTypeBudget}
                            onChange={(e) => setRecurringTypeBudget(e.target.value as any)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[10.5px] text-zinc-300 focus:outline-none"
                          >
                            <option value="always">Recorrente Contínuo (Sempre)</option>
                            <option value="months">Limitar por meses</option>
                            <option value="until_date">Limitar até data</option>
                          </select>
                        </div>
                        {recurringTypeBudget === 'months' && (
                          <div>
                            <label className="text-[9px] text-gray-500 block uppercase font-bold mb-1">Meses Ativo</label>
                            <input
                              type="number"
                              min="1"
                              value={recurringMonthsBudget}
                              onChange={(e) => setRecurringMonthsBudget(parseInt(e.target.value, 10) || 12)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </div>
                        )}
                        {recurringTypeBudget === 'until_date' && (
                          <div>
                            <label className="text-[9px] text-gray-500 block uppercase font-bold mb-1">Ativo até</label>
                            <input
                              type="date"
                              value={recurringUntilDateBudget}
                              onChange={(e) => setRecurringUntilDateBudget(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowAddBudget(false)}
                    className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Adicionar Categoria
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Entries for the selected month */}
          <div className="space-y-3.5">
            <div 
              onClick={() => setIsEntriesOpen(!isEntriesOpen)}
              className="cursor-pointer group flex items-center justify-between border-b border-zinc-900 pb-2 select-none"
            >
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-orange-500" />
                <span>Lançamentos de {months[selectedMonth]} ({monthlyEntries.length})</span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 group-hover:text-white transition-transform duration-200 ${isEntriesOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} />
              </h2>
            </div>

            <AnimatePresence initial={false}>
              {isEntriesOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2 overflow-hidden"
                >
                  {monthlyEntries.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-950/40 rounded-2xl border border-zinc-900">
                      <DollarSign className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Nenhum lançamento registrado em {months[selectedMonth]}.</p>
                      <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-bold text-orange-500 hover:underline mt-2 inline-block"
                      >
                        Registrar transação agora
                      </button>
                    </div>
                  ) : (
                    monthlyEntries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-750 group transition-all"
                        layout
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl border ${
                            entry.type === 'income' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                              : entry.type === 'expense'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                          }`}>
                            {entry.type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : entry.type === 'expense' ? (
                              <ArrowDownRight className="h-4 w-4" />
                            ) : (
                              <PiggyBank className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{entry.description}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                              <span className="uppercase text-[9px] font-bold text-zinc-400 bg-zinc-850 px-1.5 py-0.5 rounded mr-1.5">
                                {entry.category}
                              </span>
                              • {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <span className={`text-xs font-extrabold font-mono ${
                            entry.type === 'income' 
                              ? 'text-emerald-400' 
                              : entry.type === 'expense'
                              ? 'text-rose-400' 
                              : 'text-amber-400'
                          }`}>
                            {entry.type === 'income' ? '+' : entry.type === 'expense' ? '-' : '📥'} {formatCurrency(entry.amount)}
                          </span>

                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-zinc-650 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remover Entrada"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CONDITIONAL RENDER: ANNUAL VIEW */}
      {activeTab === 'anual' && (
        <div className="space-y-6">
          {/* Annual Dashboard overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Receita Anual</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(annualIncome)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Ganhos em {selectedYear}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block">Despesa Anual</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(annualExpense)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Gastos em {selectedYear}</span>
              </div>
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                <TrendingDown className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="bg-zinc-900/20 p-5 rounded-2xl border border-zinc-850 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">Investido Anual</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {formatCurrency(annualInvestment)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Total poupado no ano</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <PiggyBank className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
              annualBalance >= 0 
                ? 'bg-zinc-900/20 border-orange-500/20' 
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <div>
                <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block">Saldo Final do Ano</span>
                <span className={`text-xl font-black font-mono block mt-1 ${
                  annualBalance >= 0 ? 'text-white' : 'text-rose-400'
                }`}>
                  {formatCurrency(annualBalance)}
                </span>
                <span className="text-[9px] text-gray-500 block mt-0.5">Excedente acumulado</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                annualBalance >= 0 
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <Briefcase className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Sub-tab selection bar for Annual View (Requirement 4) */}
          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900 w-fit">
            <button
              onClick={() => setAnnualSubTab('planilha')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                annualSubTab === 'planilha'
                  ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Planilha Consolidada
            </button>
            <button
              onClick={() => setAnnualSubTab('analise')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                annualSubTab === 'analise'
                  ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Percent className="h-3.5 w-3.5" />
              Gráfico de Pizza Anual
            </button>
            <button
              onClick={() => setAnnualSubTab('mensal_detalhado' as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                (annualSubTab as any) === 'mensal_detalhado'
                  ? 'bg-zinc-800 text-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Balanço & Histórico
            </button>
          </div>

          {/* 1. PLANILHA CONSOLIDADA SUBTAB (Requirement 4) */}
          {annualSubTab === 'planilha' && (() => {
            const cols = [
              { label: 'T1 (Jan-Mar)', months: [0, 1, 2] },
              { label: 'T2 (Abr-Jun)', months: [3, 4, 5] },
              { label: 'T3 (Jul-Set)', months: [6, 7, 8] },
              { label: 'T4 (Out-Dez)', months: [9, 10, 11] },
              { label: 'S1 (Jan-Jun)', months: [0, 1, 2, 3, 4, 5] },
              { label: 'S2 (Jul-Dez)', months: [6, 7, 8, 9, 10, 11] },
              { label: 'Ano Consolidado', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
            ];

            const planillaSections = [
              {
                title: 'RECEITAS',
                type: 'income' as const,
                textColor: 'text-emerald-400',
                categories: ['Salário', 'PLR', 'Freelance', 'Investimentos', 'Vendas', 'Outros']
              },
              {
                title: 'DESPESAS',
                type: 'expense' as const,
                textColor: 'text-rose-400',
                categories: [
                  'Alimentação', 'Moradia', 'Aluguel', 'Condomínio', 'IPTU', 'Energia elétrica', 'Água', 'Gás', 'Internet', 'Celular', 'Supermercado',
                  'Escola', 'Faculdade', 'Cursos', 'Academia', 'Convênio médico', 'Seguro', 'IPVA', 'Lazer', 'Outros'
                ]
              },
              {
                title: 'INVESTIMENTOS',
                type: 'investment' as const,
                textColor: 'text-amber-400',
                categories: ['Reserva de Emergência', 'Renda Fixa', 'Ações', 'Fundos Imobiliários', 'Cripto', 'Poupança', 'Tesouro Direto', 'Outros']
              }
            ];

            // Helper to dynamic aggregate
            const getCatValueForRange = (cat: string, type: 'income' | 'expense' | 'investment', mIdxs: number[]) => {
              let sum = 0;
              mIdxs.forEach(m => {
                const mEntries = getExpandedFinancesForMonth(selectedYear, m);
                mEntries.forEach(entry => {
                  let targetCat = entry.category;
                  if (type === 'expense') {
                    const mBudgets = getBudgetsForMonthAndYear(selectedYear, m);
                    if (mBudgets[targetCat] === undefined || targetCat === 'Outros') {
                      targetCat = 'Outros';
                    }
                  }
                  if (entry.type === type && targetCat === cat) {
                    sum += entry.amount;
                  }
                });
              });
              return sum;
            };

            return (
              <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Grid className="h-4 w-4 text-orange-500" /> Planilha de Balanço Trimestral, Semestral e Anual
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">Clique nos valores para conferir e auditar despesas acumuladas em cada período</p>
                  </div>
                  <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold font-mono">
                    ANO {selectedYear}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-950/70 text-[9px] text-zinc-400 uppercase tracking-wider font-mono">
                        <th className="p-3 font-bold font-sans">Categoria</th>
                        {cols.map(c => (
                          <th key={c.label} className="p-3 font-bold text-right">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {planillaSections.map(section => {
                        const sectionSums = cols.map(c => {
                          let sSum = 0;
                          section.categories.forEach(cat => {
                            sSum += getCatValueForRange(cat, section.type, c.months);
                          });
                          return sSum;
                        });

                        return (
                          <React.Fragment key={section.title}>
                            {/* Section Header */}
                            <tr className="bg-zinc-950/40">
                              <td colSpan={cols.length + 1} className="p-3 font-black text-[10px] tracking-wider text-zinc-300 font-sans uppercase">
                                {section.title}
                              </td>
                            </tr>

                            {/* Section categories rows */}
                            {section.categories.map(cat => {
                              const values = cols.map(c => getCatValueForRange(cat, section.type, c.months));
                              const hasAnyValue = values.some(v => v > 0);

                              return (
                                <tr 
                                  key={cat} 
                                  className={`hover:bg-zinc-900/10 transition-colors border-b border-zinc-850/30 ${
                                    !hasAnyValue ? 'opacity-40' : ''
                                  }`}
                                >
                                  <td className="p-3 font-sans font-medium text-zinc-400 pl-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categoryColors[cat] || '#71717a' }} />
                                    {cat}
                                  </td>
                                  {values.map((v, idx) => (
                                    <td key={idx} className="p-3 text-right font-mono text-[11px] text-zinc-300">
                                      {v > 0 ? formatCurrency(v) : '-'}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}

                            {/* Section Totals */}
                            <tr className="bg-zinc-900/10 font-bold border-b border-zinc-800">
                              <td className="p-3 font-sans text-zinc-300 pl-4 uppercase text-[9px] tracking-wider">
                                Subtotal {section.title}
                              </td>
                              {sectionSums.map((v, idx) => (
                                <td key={idx} className={`p-3 text-right font-mono text-[11px] ${section.textColor}`}>
                                  {v > 0 ? formatCurrency(v) : '-'}
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        );
                      })}

                      {/* GRAND SUMMARY OUTCOME */}
                      {(() => {
                        const grandSummaryValues = cols.map(c => {
                          let inc = 0;
                          let exp = 0;
                          let inv = 0;
                          
                          planillaSections[0].categories.forEach(cat => { inc += getCatValueForRange(cat, 'income', c.months); });
                          planillaSections[1].categories.forEach(cat => { exp += getCatValueForRange(cat, 'expense', c.months); });
                          planillaSections[2].categories.forEach(cat => { inv += getCatValueForRange(cat, 'investment', c.months); });

                          return inc - exp - inv;
                        });

                        return (
                          <tr className="bg-orange-500/10 border-t-2 border-orange-500/40 font-black text-white">
                            <td className="p-4 font-sans text-orange-400 uppercase text-[10px] tracking-widest pl-4">
                              BALANÇO LÍQUIDO FINAL
                            </td>
                            {grandSummaryValues.map((v, idx) => (
                              <td key={idx} className={`p-4 text-right font-mono text-xs ${v >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(v)}
                              </td>
                            ))}
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* 2. GRÁFICO DE PIZZA ANUAL SUBTAB (Requirement 4) */}
          {annualSubTab === 'analise' && (() => {
            const annualExpenses = annualEntries.filter(e => e.type === 'expense');
            const annualExpenseCategoriesMap: Record<string, number> = {};
            annualExpenses.forEach(e => {
              let cat = e.category;
              const standardCategories = getCategories('expense');
              if (!standardCategories.includes(cat) || cat === 'Outros') {
                cat = 'Outros';
              }
              annualExpenseCategoriesMap[cat] = (annualExpenseCategoriesMap[cat] || 0) + e.amount;
            });
            
            const annualPieData = Object.entries(annualExpenseCategoriesMap).map(([cat, val]) => ({
              name: cat,
              value: val,
              color: categoryColors[cat] || '#8b5cf6'
            })).filter(item => item.value > 0);

            return (
              <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="h-5 w-5 text-orange-500" /> Distribuição de Despesas Anuais ({selectedYear})
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Análise proporcional de todos os gastos consolidados de {selectedYear}</p>
                </div>
                
                {annualPieData.length === 0 ? (
                  <div className="text-center py-20 bg-zinc-950/40 rounded-xl border border-zinc-900">
                    <p className="text-xs text-zinc-500">Nenhuma despesa lançada no ano de {selectedYear}.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <CategoryPieChart data={annualPieData} />
                    
                    {/* Category breakdowns list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-zinc-850">
                      {annualPieData.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold text-zinc-300">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold font-mono text-zinc-400">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. BALANÇO & HISTÓRICO SUBTAB */}
          {((annualSubTab as any) === 'mensal_detalhado' || !['planilha', 'analise'].includes(annualSubTab)) && (
            <>
              {/* Premium Comparative Custom Bar Chart */}
              <div className="bg-[#0b0b0e] border border-zinc-850 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Comparativo Mensal ({selectedYear})
                  </h3>
                  <p className="text-[10px] text-gray-500">Representação visual de Receitas (Verde), Despesas (Vermelho) e Investimentos (Dourado)</p>
                </div>

                <div className="h-56 flex items-end justify-between gap-2.5 pt-6 border-b border-zinc-850/60 pb-1">
                  {monthlyBreakdown.map((m) => {
                    const incHeight = (m.income / maxAnnualVal) * 100;
                    const expHeight = (m.expense / maxAnnualVal) * 100;
                    const invHeight = (m.investment / maxAnnualVal) * 100;

                    return (
                      <div key={m.name} className="flex-1 flex flex-col items-center h-full group relative cursor-pointer">
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-2 bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-[9px] font-mono leading-relaxed hidden group-hover:block z-10 shadow-2xl pointer-events-none w-32">
                          <p className="text-zinc-400 font-bold border-b border-zinc-850 pb-1 mb-1 font-sans">{m.name}</p>
                          <p className="text-emerald-400">Rec: {formatCurrency(m.income)}</p>
                          <p className="text-rose-400">Des: {formatCurrency(m.expense)}</p>
                          <p className="text-amber-400">Inv: {formatCurrency(m.investment)}</p>
                          <p className="text-white border-t border-zinc-850 pt-1 mt-1">Bal: {formatCurrency(m.balance)}</p>
                        </div>

                        {/* Bars Container */}
                        <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                          {/* Income Bar */}
                          <div className="w-1.5 bg-emerald-500 rounded-t transition-all group-hover:brightness-110" style={{ height: `${Math.max(incHeight, 2)}%` }} />
                          {/* Expense Bar */}
                          <div className="w-1.5 bg-rose-500 rounded-t transition-all group-hover:brightness-110" style={{ height: `${Math.max(expHeight, 2)}%` }} />
                          {/* Investment Bar */}
                          <div className="w-1.5 bg-amber-500 rounded-t transition-all group-hover:brightness-110" style={{ height: `${Math.max(invHeight, 2)}%` }} />
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] text-zinc-500 font-bold font-mono mt-2 uppercase">
                          {m.shortName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legend */}
                <div className="flex items-center justify-center gap-6 text-[10px] text-zinc-400 font-bold uppercase tracking-wider pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                    Receitas
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                    Despesas
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
                    Investimentos
                  </div>
                </div>
              </div>

              {/* Upgraded Annual Balance Sheet (Detailed table as in standard finance sheets) */}
              <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl overflow-hidden">
                <div className="p-4 bg-zinc-900/40 border-b border-zinc-850">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Balanço Mensal Consolidado
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-950/40 text-[10px] text-zinc-500 uppercase tracking-wider">
                        <th className="p-3.5 font-bold">Mês</th>
                        <th className="p-3.5 font-bold text-right">Receitas</th>
                        <th className="p-3.5 font-bold text-right">Despesas</th>
                        <th className="p-3.5 font-bold text-right">Investimentos</th>
                        <th className="p-3.5 font-bold text-right">Saldo Líquido</th>
                        <th className="p-3.5 font-bold text-right">Taxa Poupança</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-mono">
                      {monthlyBreakdown.map((m, mIndex) => (
                        <tr 
                          key={m.name} 
                          onClick={() => {
                            setSelectedMonth(mIndex);
                            setActiveTab('mensal');
                          }}
                          className="hover:bg-zinc-900/20 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 font-sans font-bold text-gray-300 group-hover:text-orange-400">
                            {m.name}
                          </td>
                          <td className="p-3.5 text-right text-emerald-400">
                            {m.income > 0 ? formatCurrency(m.income) : '-'}
                          </td>
                          <td className="p-3.5 text-right text-rose-400 font-semibold">
                            {m.expense > 0 ? formatCurrency(m.expense) : '-'}
                          </td>
                          <td className="p-3.5 text-right text-amber-400 font-semibold">
                            {m.investment > 0 ? formatCurrency(m.investment) : '-'}
                          </td>
                          <td className={`p-3.5 text-right font-black ${m.balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                            {formatCurrency(m.balance)}
                          </td>
                          <td className="p-3.5 text-right text-zinc-400 font-bold">
                            {m.savingsRate > 0 ? `${m.savingsRate.toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Final highlighted row for the entire year (Saldo do ano / aprimorada) */}
                      <tr className="bg-orange-500/5 font-bold border-t-2 border-orange-500/30">
                        <td className="p-4 font-sans text-orange-400 font-black uppercase text-[10px] tracking-wider">
                          Saldo Consolidado do Ano
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-extrabold text-sm">
                          {formatCurrency(annualIncome)}
                        </td>
                        <td className="p-4 text-right text-rose-400 font-extrabold text-sm">
                          {formatCurrency(annualExpense)}
                        </td>
                        <td className="p-4 text-right text-amber-400 font-extrabold text-sm">
                          {formatCurrency(annualInvestment)}
                        </td>
                        <td className={`p-4 text-right font-black text-sm ${annualBalance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                          {formatCurrency(annualBalance)}
                        </td>
                        <td className="p-4 text-right text-orange-400 font-black text-sm">
                          {annualIncome > 0 ? `${((annualInvestment) / annualIncome * 100).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consolidated Yearly History table (à partir de 2026) */}
              <div className="bg-zinc-900/10 border border-zinc-850 rounded-2xl overflow-hidden mt-6">
                <div className="p-4 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Histórico de Cada Ano (a partir de 2026)
                    </h3>
                    <p className="text-[10px] text-gray-500 font-sans leading-normal">
                      Consolidado anual para acompanhamento histórico de longo prazo. Clique no ano para selecioná-lo.
                    </p>
                  </div>
                  <span className="text-[9px] font-black text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/15 uppercase tracking-widest font-mono">
                    Consolidado de Longo Prazo
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-950/40 text-[10px] text-zinc-500 uppercase tracking-wider">
                        <th className="p-3.5 font-bold">Ano</th>
                        <th className="p-3.5 font-bold text-right">Receitas</th>
                        <th className="p-3.5 font-bold text-right">Despesas</th>
                        <th className="p-3.5 font-bold text-right">Investimentos</th>
                        <th className="p-3.5 font-bold text-right">Saldo Líquido</th>
                        <th className="p-3.5 font-bold text-right">Taxa Poupança</th>
                        <th className="p-3.5 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 font-mono">
                      {yearlyHistoryData.map((yrData) => (
                        <tr 
                          key={yrData.year} 
                          onClick={() => {
                            setSelectedYear(yrData.year);
                            addXp(5);
                          }}
                          className={`hover:bg-zinc-900/20 transition-colors cursor-pointer group ${
                            selectedYear === yrData.year ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <td className="p-3.5 font-sans font-bold text-gray-300 group-hover:text-orange-400 flex items-center gap-2">
                            <span>{yrData.year}</span>
                            {selectedYear === yrData.year && (
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block animate-pulse" />
                            )}
                          </td>
                          <td className="p-3.5 text-right text-emerald-400">
                            {yrData.income > 0 ? formatCurrency(yrData.income) : '-'}
                          </td>
                          <td className="p-3.5 text-right text-rose-400 font-semibold">
                            {yrData.expense > 0 ? formatCurrency(yrData.expense) : '-'}
                          </td>
                          <td className="p-3.5 text-right text-amber-400 font-semibold">
                            {yrData.investment > 0 ? formatCurrency(yrData.investment) : '-'}
                          </td>
                          <td className={`p-3.5 text-right font-black ${yrData.balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                            {formatCurrency(yrData.balance)}
                          </td>
                          <td className="p-3.5 text-right text-zinc-400 font-bold">
                            {yrData.savingsRate > 0 ? `${yrData.savingsRate.toFixed(1)}%` : '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              yrData.hasData 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-zinc-900/50 text-zinc-650 border border-zinc-850'
                            }`}>
                              {yrData.hasData ? 'Com Lançamentos' : 'Sem Registros'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'investimentos' && (
        <InvestmentsPlanner finances={finances} addXp={addXp} />
      )}

    </div>
  );
}
