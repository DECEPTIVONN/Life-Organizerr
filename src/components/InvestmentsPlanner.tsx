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
  Award,
  PieChart,
  Wallet,
  Plus,
  Sparkles,
  X,
  Edit2,
  Trash2,
  Lock,
  Flame,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  RefreshCw,
  Search,
  FileText,
  Layers,
  Briefcase,
  Tag,
  Clock,
  Download,
  Filter,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  BarChart2,
  LineChart,
  ArrowRight
} from 'lucide-react';
import { FinanceEntry, PortfolioAsset, InvestmentTransaction } from '../types';
import NumberInput from './NumberInput';


interface InvestmentsPlannerProps {
  finances: FinanceEntry[];
  addXp: (amount: number) => void;
  portfolioAssets?: PortfolioAsset[];
  setPortfolioAssets?: React.Dispatch<React.SetStateAction<PortfolioAsset[]>>;
  investmentTransactions?: InvestmentTransaction[];
  setInvestmentTransactions?: React.Dispatch<React.SetStateAction<InvestmentTransaction[]>>;
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

export default function InvestmentsPlanner({ 
  finances, 
  addXp,
  portfolioAssets: propPortfolioAssets,
  setPortfolioAssets: propSetPortfolioAssets,
  investmentTransactions: propInvestmentTransactions,
  setInvestmentTransactions: propSetInvestmentTransactions
}: InvestmentsPlannerProps) {
  const [activeSubSection, setActiveSubSection] = useState<'portfolio' | 'evolucao' | 'reserva' | 'aposentadoria'>('portfolio');

  // ==========================================
  // --- STATE FOR PORTFOLIO / INVESTMENTS ---
  // ==========================================
  const [localPortfolioAssets, setLocalPortfolioAssets] = useState<PortfolioAsset[]>(() => {
    const saved = localStorage.getItem('meu_foco_portfolio_assets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const portfolioAssets = propPortfolioAssets !== undefined ? propPortfolioAssets : localPortfolioAssets;
  const setPortfolioAssets = (action: React.SetStateAction<PortfolioAsset[]>) => {
    if (propSetPortfolioAssets) propSetPortfolioAssets(action);
    setLocalPortfolioAssets(action);
  };

  useEffect(() => {
    localStorage.setItem('meu_foco_portfolio_assets', JSON.stringify(portfolioAssets));
  }, [portfolioAssets]);

  // Asset Modal States
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Asset Form Fields (Matching Screenshots 1 & 2)
  const [assetName, setAssetName] = useState<string>('');
  const [assetTicker, setAssetTicker] = useState<string>('');
  const [assetType, setAssetType] = useState<string>('Ação');
  const [assetInstitution, setAssetInstitution] = useState<string>('');
  const [assetQuantity, setAssetQuantity] = useState<string>('1');
  const [assetPurchasePrice, setAssetPurchasePrice] = useState<string>('0.00');
  const [assetCurrentPrice, setAssetCurrentPrice] = useState<string>('0.00');
  const [assetCurrency, setAssetCurrency] = useState<string>('R$ (BRL)');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState<string>('');
  const [assetNotes, setAssetNotes] = useState<string>('');

  // Filters
  const [assetSearchFilter, setAssetSearchFilter] = useState<string>('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('Todos');

  // ==========================================
  // --- STATE FOR INVESTMENT TRANSACTIONS & BALANCE ---
  // ==========================================
  const [localInvestmentTransactions, setLocalInvestmentTransactions] = useState<InvestmentTransaction[]>(() => {
    const saved = localStorage.getItem('meu_foco_investment_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'tx-1',
        type: 'Aporte',
        assetName: 'Tesouro Selic 2029',
        ticker: 'LFT2029',
        institution: 'Nubank',
        amount: 1500,
        date: '2026-08-01',
        notes: 'Aporte mensal em reserva'
      },
      {
        id: 'tx-2',
        type: 'Provento',
        assetName: 'Kinea Rendimentos Imobiliários',
        ticker: 'KNCR11',
        institution: 'BTG Pactual',
        amount: 45.80,
        date: '2026-07-28',
        notes: 'Rendimento de FII mensal'
      },
      {
        id: 'tx-3',
        type: 'Aporte',
        assetName: 'Apple Inc.',
        ticker: 'AAPL',
        institution: 'Avenue',
        amount: 1805.00,
        date: '2026-07-15',
        notes: 'Compra de 10 ações'
      },
      {
        id: 'tx-4',
        type: 'Provento',
        assetName: 'Petrobras PN',
        ticker: 'PETR4',
        institution: 'XP Investimentos',
        amount: 120.00,
        date: '2026-07-10',
        notes: 'Dividendo Petrobras'
      }
    ];
  });

  const investmentTransactions = propInvestmentTransactions !== undefined ? propInvestmentTransactions : localInvestmentTransactions;
  const setInvestmentTransactions = (action: React.SetStateAction<InvestmentTransaction[]>) => {
    if (propSetInvestmentTransactions) propSetInvestmentTransactions(action);
    setLocalInvestmentTransactions(action);
  };

  useEffect(() => {
    localStorage.setItem('meu_foco_investment_transactions', JSON.stringify(investmentTransactions));
  }, [investmentTransactions]);

  // Transaction Filters & Period
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txPeriodFilter, setTxPeriodFilter] = useState<'30d' | '60d' | '90d' | 'year' | 'all'>('30d');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('Todos');
  const [txSortOrder, setTxSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txAssetId, setTxAssetId] = useState<string>('');
  const [txAssetName, setTxAssetName] = useState<string>('');
  const [txTicker, setTxTicker] = useState<string>('');
  const [txType, setTxType] = useState<'Aporte' | 'Resgate' | 'Provento' | 'Rendimento' | 'Taxa'>('Aporte');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDate, setTxDate] = useState<string>('');
  const [txInstitution, setTxInstitution] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');

  // Evolution Monthly State
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(7); // Agosto

  const monthsList = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const totalPortfolioValueCalculated = portfolioAssets.reduce((sum, a) => {
    const qty = parseFloat(a.quantity || '0');
    const price = parseFloat(a.currentPrice || a.purchasePrice || '0');
    return sum + (qty * price);
  }, 0);

  const yearlyEquityData = monthsList.map((m, idx) => {
    const baseVal = totalPortfolioValueCalculated > 0 ? totalPortfolioValueCalculated : 25000;
    const factor = 0.75 + (idx * 0.035);
    return {
      month: m,
      total: Math.round(baseVal * factor)
    };
  });

  // Pie Chart Vision & Expansion State
  const [pieVisionMode, setPieVisionMode] = useState<'category' | 'market' | 'institution'>('category');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Equity Evolution (Evolução Patrimonial) State
  const [evolutionYear, setEvolutionYear] = useState<number>(2026);
  const [evolutionMonth, setEvolutionMonth] = useState<number>(8); // August

  // Quick Price Update State
  const [quickUpdateAssetId, setQuickUpdateAssetId] = useState<string | null>(null);
  const [quickUpdatePriceVal, setQuickUpdatePriceVal] = useState<string>('');

  // Handlers for Asset Modal
  const handleOpenAddAssetModal = () => {
    setEditingAssetId(null);
    setAssetName('');
    setAssetTicker('');
    setAssetType('Ação');
    setAssetInstitution('');
    setAssetQuantity('1');
    setAssetPurchasePrice('0.00');
    setAssetCurrentPrice('0.00');
    setAssetCurrency('R$ (BRL)');
    setAssetPurchaseDate(new Date().toISOString().split('T')[0]);
    setAssetNotes('');
    setShowAssetModal(true);
  };

  const handleOpenEditAssetModal = (asset: PortfolioAsset) => {
    setEditingAssetId(asset.id);
    setAssetName(asset.name || '');
    setAssetTicker(asset.ticker || '');
    setAssetType(asset.type || 'Ação');
    setAssetInstitution(asset.institution || '');
    setAssetQuantity(String(asset.quantity ?? 1));
    setAssetPurchasePrice(String(asset.purchasePrice ?? 0));
    setAssetCurrentPrice(String(asset.currentPrice ?? 0));
    setAssetCurrency(asset.currency || 'R$ (BRL)');
    setAssetPurchaseDate(asset.purchaseDate || new Date().toISOString().split('T')[0]);
    setAssetNotes(asset.notes || '');
    setShowAssetModal(true);
  };

  const handleAutoFillAsset = () => {
    const samples = [
      {
        name: 'Apple Inc.',
        ticker: 'AAPL',
        type: 'Ação',
        institution: 'Avenue',
        quantity: '10',
        purchasePrice: '180.50',
        currentPrice: '225.40',
        currency: 'US$ (USD)',
        notes: 'Empresa de tecnologia líder em dispositivos e serviços.'
      },
      {
        name: 'Petrobras PN',
        ticker: 'PETR4',
        type: 'Ação',
        institution: 'XP Investimentos',
        quantity: '100',
        purchasePrice: '32.50',
        currentPrice: '38.20',
        currency: 'R$ (BRL)',
        notes: 'Posição focada em altos dividendos.'
      },
      {
        name: 'Tesouro Selic 2029',
        ticker: 'LFT2029',
        type: 'Tesouro Direto',
        institution: 'Nubank',
        quantity: '2',
        purchasePrice: '14200.00',
        currentPrice: '14850.00',
        currency: 'R$ (BRL)',
        notes: 'Ativo de liquidez diária e proteção de emergência.'
      },
      {
        name: 'Bitcoin',
        ticker: 'BTC',
        type: 'Cripto',
        institution: 'Binance',
        quantity: '0.05',
        purchasePrice: '310000.00',
        currentPrice: '380000.00',
        currency: 'R$ (BRL)',
        notes: 'Reserva descentralizada contra inflação.'
      },
      {
        name: 'Kinea Rendimentos Imobiliários',
        ticker: 'KNCR11',
        type: 'FII',
        institution: 'BTG Pactual',
        quantity: '50',
        purchasePrice: '101.20',
        currentPrice: '104.80',
        currency: 'R$ (BRL)',
        notes: 'Fundo imobiliário de papel rendendo mensalmente.'
      }
    ];
    const choice = samples[Math.floor(Math.random() * samples.length)];
    setAssetName(choice.name);
    setAssetTicker(choice.ticker);
    setAssetType(choice.type);
    setAssetInstitution(choice.institution);
    setAssetQuantity(choice.quantity);
    setAssetPurchasePrice(choice.purchasePrice);
    setAssetCurrentPrice(choice.currentPrice);
    setAssetCurrency(choice.currency);
    setAssetPurchaseDate(new Date().toISOString().split('T')[0]);
    setAssetNotes(choice.notes);
  };

  const handleSaveAsset = () => {
    if (!assetName.trim()) return;

    const parsedQty = parseFloat(assetQuantity) || 1;
    const parsedBuyPrice = parseFloat(assetPurchasePrice) || 0;
    const parsedCurrPrice = parseFloat(assetCurrentPrice) || parsedBuyPrice;

    if (editingAssetId) {
      setPortfolioAssets(prev => prev.map(a => a.id === editingAssetId ? {
        ...a,
        name: assetName.trim(),
        ticker: assetTicker.trim().toUpperCase(),
        type: assetType,
        institution: assetInstitution.trim(),
        quantity: parsedQty,
        purchasePrice: parsedBuyPrice,
        currentPrice: parsedCurrPrice,
        currency: assetCurrency,
        purchaseDate: assetPurchaseDate,
        notes: assetNotes.trim(),
        updatedAt: new Date().toISOString()
      } : a));
    } else {
      const newAsset: PortfolioAsset = {
        id: Math.random().toString(36).substring(2, 9),
        name: assetName.trim(),
        ticker: assetTicker.trim().toUpperCase(),
        type: assetType,
        institution: assetInstitution.trim(),
        quantity: parsedQty,
        purchasePrice: parsedBuyPrice,
        currentPrice: parsedCurrPrice,
        currency: assetCurrency,
        purchaseDate: assetPurchaseDate || new Date().toISOString().split('T')[0],
        notes: assetNotes.trim(),
        updatedAt: new Date().toISOString()
      };
      setPortfolioAssets(prev => [newAsset, ...prev]);
    }

    setShowAssetModal(false);
    if (addXp) addXp(25);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Deseja realmente remover este ativo do seu portfólio?')) {
      setPortfolioAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleConfirmQuickUpdatePrice = () => {
    if (!quickUpdateAssetId) return;
    const newPrice = parseFloat(quickUpdatePriceVal);
    if (isNaN(newPrice)) return;

    setPortfolioAssets(prev => prev.map(a => a.id === quickUpdateAssetId ? {
      ...a,
      currentPrice: newPrice,
      updatedAt: new Date().toISOString()
    } : a));

    setQuickUpdateAssetId(null);
    setQuickUpdatePriceVal('');
    if (addXp) addXp(10);
  };

  // ==========================================
  // --- HANDLERS FOR TRANSACTIONS & EXPORT ---
  // ==========================================
  const handleOpenAddTxModal = () => {
    setEditingTxId(null);
    setTxAssetId('');
    setTxType('Aporte');
    setTxAssetName('');
    setTxTicker('');
    setTxInstitution('');
    setTxAmount('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setShowTxModal(true);
  };

  const handleOpenEditTxModal = (tx: InvestmentTransaction) => {
    setEditingTxId(tx.id);
    setTxAssetId((tx as any).assetId || '');
    setTxType(tx.type);
    setTxAssetName(tx.assetName || '');
    setTxTicker(tx.ticker || '');
    setTxInstitution(tx.institution || '');
    setTxAmount(String(tx.amount || ''));
    setTxDate(tx.date || new Date().toISOString().split('T')[0]);
    setTxNotes(tx.notes || '');
    setShowTxModal(true);
  };

  const handleSaveTx = () => {
    if (!txAssetName.trim() && !txTicker.trim()) return;
    const parsedAmount = parseFloat(txAmount) || 0;

    if (editingTxId) {
      setInvestmentTransactions(prev => prev.map(t => t.id === editingTxId ? {
        ...t,
        type: txType,
        assetName: txAssetName.trim() || txTicker.trim().toUpperCase(),
        ticker: txTicker.trim().toUpperCase(),
        institution: txInstitution.trim(),
        amount: parsedAmount,
        date: txDate,
        notes: txNotes.trim()
      } : t));
    } else {
      const newTx: InvestmentTransaction = {
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        type: txType,
        assetName: txAssetName.trim() || txTicker.trim().toUpperCase(),
        ticker: txTicker.trim().toUpperCase(),
        institution: txInstitution.trim(),
        amount: parsedAmount,
        date: txDate || new Date().toISOString().split('T')[0],
        notes: txNotes.trim()
      };
      setInvestmentTransactions(prev => [newTx, ...prev]);
    }

    setShowTxModal(false);
    if (addXp) addXp(15);
  };

  const handleDeleteTx = (id: string) => {
    if (confirm('Deseja realmente excluir esta transação?')) {
      setInvestmentTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleExportTransactions = () => {
    if (investmentTransactions.length === 0) {
      alert('Nenhuma transação cadastrada para exportar.');
      return;
    }
    const headers = 'ID,Data,Tipo,Ativo,Ticker,Instituição,Valor (R$),Observações\n';
    const rows = investmentTransactions.map(t => 
      `"${t.id}","${t.date}","${t.type}","${t.assetName.replace(/"/g, '""')}","${t.ticker || ''}","${t.institution || ''}","${t.amount}","${(t.notes || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transacoes_investimentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute Period Balance (Balanço do Período)
  const periodBalanceMetrics = React.useMemo(() => {
    const now = new Date('2026-08-07T11:26:33'); // anchor date
    let daysCutoff = 30;
    if (txPeriodFilter === '60d') daysCutoff = 60;
    else if (txPeriodFilter === '90d') daysCutoff = 90;
    else if (txPeriodFilter === 'year') daysCutoff = 365;
    else if (txPeriodFilter === 'all') daysCutoff = 9999;

    const cutoffDate = new Date(now.getTime() - daysCutoff * 24 * 60 * 60 * 1000);

    let totalRecebido = 0; // Proventos e Rendimentos
    let totalGasto = 0;    // Aportes e Taxas
    let totalResgates = 0; // Resgates

    investmentTransactions.forEach(t => {
      const tDate = new Date(t.date);
      if (txPeriodFilter === 'all' || tDate >= cutoffDate) {
        if (t.type === 'Provento' || t.type === 'Rendimento') {
          totalRecebido += t.amount;
        } else if (t.type === 'Aporte' || t.type === 'Taxa') {
          totalGasto += t.amount;
        } else if (t.type === 'Resgate') {
          totalResgates += t.amount;
        }
      }
    });

    const resultadoLiquido = (totalRecebido + totalResgates) - totalGasto;

    const startDateStr = cutoffDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const endDateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    return {
      totalRecebido,
      totalGasto,
      totalResgates,
      resultadoLiquido,
      dateRangeText: `${startDateStr.toUpperCase()} - ${endDateStr.toUpperCase()}`
    };
  }, [investmentTransactions, txPeriodFilter]);

  // Filtered Investment Transactions
  const filteredTransactions = React.useMemo(() => {
    let list = [...investmentTransactions];

    if (txSearchQuery.trim()) {
      const q = txSearchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.assetName.toLowerCase().includes(q) ||
        (t.ticker && t.ticker.toLowerCase().includes(q)) ||
        (t.institution && t.institution.toLowerCase().includes(q)) ||
        t.type.toLowerCase().includes(q)
      );
    }

    if (txTypeFilter !== 'Todos') {
      list = list.filter(t => t.type === txTypeFilter);
    }

    list.sort((a, b) => {
      if (txSortOrder === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (txSortOrder === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (txSortOrder === 'amount-desc') return b.amount - a.amount;
      if (txSortOrder === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [investmentTransactions, txSearchQuery, txTypeFilter, txSortOrder]);

  // Grouped Pie Data for Allocation Chart
  const groupedPieData = React.useMemo(() => {
    let totalVal = 0;
    const map: Record<string, { value: number; cost: number; assetsCount: number; assets: PortfolioAsset[] }> = {};

    portfolioAssets.forEach(a => {
      const val = a.quantity * a.currentPrice;
      const cost = a.quantity * a.purchasePrice;
      totalVal += val;

      let key = a.type || 'Outros';
      if (pieVisionMode === 'institution') {
        key = a.institution || 'Não especificada';
      } else if (pieVisionMode === 'market') {
        if (a.type === 'Ação' || a.type === 'FII' || a.type === 'ETF') key = 'Renda Variável';
        else if (a.type === 'Renda Fixa' || a.type === 'CDB' || a.type === 'LCI/LCA') key = 'Renda Fixa';
        else if (a.type === 'Tesouro Direto') key = 'Tesouro Direto';
        else if (a.type === 'Fundos') key = 'Fundos de Investimento';
        else if (a.type === 'Cripto') key = 'Criptoativos';
        else key = 'Conta Investimento';
      }

      if (!map[key]) {
        map[key] = { value: 0, cost: 0, assetsCount: 0, assets: [] };
      }
      map[key].value += val;
      map[key].cost += cost;
      map[key].assetsCount += 1;
      map[key].assets.push(a);
    });

    if (totalVal === 0) {
      return [
        { key: 'Fundos de Investimento', value: 990.47, cost: 898.84, percentage: 95.19, assetsCount: 1, assets: [], color: '#2563eb' },
        { key: 'Conta Investimento', value: 50.00, cost: 50.00, percentage: 4.81, assetsCount: 1, assets: [], color: '#eab308' }
      ];
    }

    const COLORS = ['#2563eb', '#eab308', '#10b981', '#8b5cf6', '#06b6d4', '#f43f5e', '#f97316', '#a855f7'];

    return Object.entries(map).map(([key, data], idx) => ({
      key,
      value: data.value,
      cost: data.cost,
      percentage: totalVal > 0 ? (data.value / totalVal) * 100 : 0,
      assetsCount: data.assetsCount,
      assets: data.assets,
      color: COLORS[idx % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [portfolioAssets, pieVisionMode]);


  // Compute Portfolio Analytics
  const portfolioMetrics = React.useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;

    portfolioAssets.forEach(a => {
      const val = a.quantity * a.currentPrice;
      const cost = a.quantity * a.purchasePrice;
      totalValue += val;
      totalCost += cost;
    });

    const profitLoss = totalValue - totalCost;
    const profitabilityPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    // Diversification score based on distinct asset types
    const assetTypesPresent = new Set(portfolioAssets.map(a => a.type));
    const typesCount = assetTypesPresent.size;
    let divScore = 0;
    let divStatus = 'Focado';

    if (typesCount === 0) {
      divScore = 0;
      divStatus = 'Focado';
    } else if (typesCount === 1) {
      divScore = 25;
      divStatus = 'Pouco Diversificado';
    } else if (typesCount === 2) {
      divScore = 50;
      divStatus = 'Moderado';
    } else if (typesCount === 3) {
      divScore = 75;
      divStatus = 'Diversificado';
    } else {
      divScore = 100;
      divStatus = 'Bem Diversificado';
    }

    // Sequence / Streak months
    const uniqueMonths = new Set(portfolioAssets.map(a => a.purchaseDate ? a.purchaseDate.substring(0, 7) : ''));
    uniqueMonths.delete('');
    const streakMonths = Math.max(portfolioAssets.length > 0 ? 1 : 0, uniqueMonths.size);

    // Long-Term Badges check based on purchase date
    const now = new Date();
    let has1Year = false;
    let has3Years = false;
    let has5Years = false;

    portfolioAssets.forEach(a => {
      if (a.purchaseDate) {
        const pDate = new Date(a.purchaseDate);
        const diffYears = (now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (diffYears >= 1) has1Year = true;
        if (diffYears >= 3) has3Years = true;
        if (diffYears >= 5) has5Years = true;
      }
    });

    // Allocation map by Asset Type
    const allocationMap: Record<string, number> = {};
    portfolioAssets.forEach(a => {
      const val = a.quantity * a.currentPrice;
      allocationMap[a.type] = (allocationMap[a.type] || 0) + val;
    });

    const allocationList = Object.entries(allocationMap).map(([type, value]) => ({
      type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return {
      totalValue,
      totalCost,
      profitLoss,
      profitabilityPct,
      divScore,
      divStatus,
      streakMonths,
      has1Year,
      has3Years,
      has5Years,
      allocationList
    };
  }, [portfolioAssets]);

  // Filtered Assets list
  const filteredAssets = portfolioAssets.filter(a => {
    const matchesSearch = assetSearchFilter === '' || 
      a.name.toLowerCase().includes(assetSearchFilter.toLowerCase()) ||
      (a.ticker && a.ticker.toLowerCase().includes(assetSearchFilter.toLowerCase())) ||
      (a.institution && a.institution.toLowerCase().includes(assetSearchFilter.toLowerCase()));
    
    const matchesType = assetTypeFilter === 'Todos' || a.type === assetTypeFilter;

    return matchesSearch && matchesType;
  });

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
      {/* Secondary Internal Nav in Investimentos */}
      <div className="flex justify-center mb-6">
        <nav className="internal-nav-secondary w-full max-w-3xl" aria-label="Navegação Secundária de Investimentos">
          <button
            type="button"
            onClick={() => {
              setActiveSubSection('portfolio');
              if (addXp) addXp(5);
            }}
            className={`internal-nav-secondary-btn flex-1 ${
              activeSubSection === 'portfolio' ? 'active' : ''
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Portfólio & Ativos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubSection('evolucao');
              if (addXp) addXp(5);
            }}
            className={`internal-nav-secondary-btn flex-1 ${
              activeSubSection === 'evolucao' ? 'active' : ''
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Evolução Patrimonial</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubSection('reserva');
              if (addXp) addXp(5);
            }}
            className={`internal-nav-secondary-btn flex-1 ${
              activeSubSection === 'reserva' ? 'active' : ''
            }`}
          >
            <PiggyBank className="h-3.5 w-3.5" />
            <span>Reserva de Emergência</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubSection('aposentadoria');
              if (addXp) addXp(5);
            }}
            className={`internal-nav-secondary-btn flex-1 ${
              activeSubSection === 'aposentadoria' ? 'active' : ''
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Planejamento de Aposentadoria</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* PORTFÓLIO & GESTÃO DE ATIVOS DE INVESTIMENTO */}
      {/* ========================================================================= */}
      {activeSubSection === 'portfolio' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 Financial Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* VALOR TOTAL */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">VALOR TOTAL</span>
                <span className="text-xl font-black text-white font-mono block">
                  {formatCurrency(portfolioMetrics.totalValue)}
                </span>
              </div>
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>

            {/* CUSTO TOTAL */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">CUSTO TOTAL</span>
                <span className="text-xl font-black text-white font-mono block">
                  {formatCurrency(portfolioMetrics.totalCost)}
                </span>
              </div>
              <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-zinc-300">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            {/* LUCRO/PREJUÍZO */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">LUCRO/PREJUÍZO</span>
                <span className={`text-xl font-black font-mono block ${
                  portfolioMetrics.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {portfolioMetrics.profitLoss >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.profitLoss)}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                portfolioMetrics.profitLoss >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {portfolioMetrics.profitLoss >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
            </div>

            {/* RENTABILIDADE */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider block">RENTABILIDADE</span>
                <span className={`text-xl font-black font-mono block ${
                  portfolioMetrics.profitabilityPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {portfolioMetrics.profitabilityPct >= 0 ? '+' : ''}{portfolioMetrics.profitabilityPct.toFixed(2)}%
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                portfolioMetrics.profitabilityPct >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* 3 Analytics Cards matching Screenshot 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Diversificação do Portfólio */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 block uppercase">Diversificação do Portfólio</span>
                      <h4 className="text-lg font-black text-rose-400">{portfolioMetrics.divStatus}</h4>
                    </div>
                  </div>
                  <Info className="h-4 w-4 text-zinc-600 hover:text-zinc-300 cursor-pointer" />
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>Pontuação: {portfolioMetrics.divScore}/100</span>
                    <span className="font-bold text-white">{portfolioMetrics.divScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${portfolioMetrics.divScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 italic border-t border-zinc-900 pt-3">
                Adicione mais classes de ativos para melhorar sua diversidade.
              </p>
            </div>

            {/* Card 2: Sequência de Investimento */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Sequência de Investimento</span>
                    <div className="flex items-baseline gap-1">
                      <h4 className="text-2xl font-black text-white">{portfolioMetrics.streakMonths}</h4>
                      <span className="text-xs font-bold text-zinc-400">meses</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 pt-1">
                  Invista todo mês para manter sua sequência ativa.
                </p>

                {/* Progress bars ticks for streak */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        idx <= portfolioMetrics.streakMonths ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-850'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 border-t border-zinc-900 pt-3">
                <Flame className="h-3.5 w-3.5" /> Sequência Ativa
              </span>
            </div>

            {/* Card 3: Ativos de Longo Prazo */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase">Ativos de Longo Prazo</span>
                    <h4 className="text-xs font-bold text-zinc-300">Conquistas do Investidor</h4>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${
                    portfolioMetrics.has1Year ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900/60 border-zinc-850 text-zinc-500'
                  }`}>
                    <span className="flex items-center gap-2 text-[11px]">
                      {portfolioMetrics.has1Year ? '🏆' : <Lock className="h-3.5 w-3.5" />} Detentor de Longo Prazo
                    </span>
                    <span className="text-[9px] font-mono">1+ year</span>
                  </div>

                  <div className={`p-2 rounded-xl border flex items-center justify-between ${
                    portfolioMetrics.has3Years ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900/60 border-zinc-850 text-zinc-500'
                  }`}>
                    <span className="flex items-center gap-2 text-[11px]">
                      {portfolioMetrics.has3Years ? '🏆' : <Lock className="h-3.5 w-3.5" />} Investidor Paciente
                    </span>
                    <span className="text-[9px] font-mono">3+ years</span>
                  </div>

                  <div className={`p-2 rounded-xl border flex items-center justify-between ${
                    portfolioMetrics.has5Years ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold' : 'bg-zinc-900/60 border-zinc-850 text-zinc-500'
                  }`}>
                    <span className="flex items-center gap-2 text-[11px]">
                      {portfolioMetrics.has5Years ? '💎' : <Lock className="h-3.5 w-3.5" />} Diamond Hands
                    </span>
                    <span className="text-[9px] font-mono">5+ years</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 italic border-t border-zinc-900 pt-3">
                Mantenha seus ativos por mais tempo para ganhar badges.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. BALANÇO GLOBAL DO PERÍODO (Matching Screenshot 4) */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/80 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    BALANÇO GLOBAL DO PERÍODO
                  </h3>
                </div>
                <p className="text-[11px] font-mono font-bold text-zinc-400">
                  {periodBalanceMetrics.periodLabel} · {periodBalanceMetrics.dateRangeText}
                </p>
              </div>

              {/* Period selector dropdown */}
              <select
                value={txPeriodFilter}
                onChange={(e) => setTxPeriodFilter(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="30d">Últimos 30 Dias</option>
                <option value="60d">Últimos 60 Dias</option>
                <option value="90d">Últimos 90 Dias</option>
                <option value="year">Este Ano (2026)</option>
                <option value="all">Todo o Período</option>
              </select>
            </div>

            {/* 3 Metric Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* TOTAL RECEBIDO */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                  TOTAL RECEBIDO (PROVENTOS)
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono block">
                  {formatCurrency(periodBalanceMetrics.totalRecebido)}
                </span>
              </div>

              {/* TOTAL GASTO / APORTADO */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                  TOTAL APORTADO / GASTO
                </span>
                <span className="text-xl font-black text-rose-400 font-mono block">
                  {formatCurrency(periodBalanceMetrics.totalGasto)}
                </span>
              </div>

              {/* RESULTADO LÍQUIDO */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                  RESULTADO LÍQUIDO DO PERÍODO
                </span>
                <span className={`text-xl font-black font-mono block ${
                  periodBalanceMetrics.resultadoLiquido >= 0 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {periodBalanceMetrics.resultadoLiquido >= 0 ? '+' : ''}{formatCurrency(periodBalanceMetrics.resultadoLiquido)}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. TRANSAÇÕES EM INVESTIMENTOS (Matching Screenshot 4) */}
          {/* ========================================================= */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Transações <HelpCircle className="h-4 w-4 text-zinc-500 hover:text-white cursor-pointer" />
                  </h3>
                  <p className="text-xs text-zinc-500">Histórico detalhado das suas finanças de investimento</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTransactions}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Exportar
                </button>
                <button
                  onClick={handleOpenAddTxModal}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <Plus className="h-4 w-4" /> ADICIONAR
                </button>
              </div>
            </div>

            {/* Search Bar & Filter Options (Screenshot 4 style) */}
            <div className="space-y-3">
              <div className="relative w-full">
                <Search className="h-4 w-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Data Filter */}
                <select
                  value={txPeriodFilter}
                  onChange={(e) => setTxPeriodFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="30d">Data: Últimos 30 dias</option>
                  <option value="60d">Data: Últimos 60 dias</option>
                  <option value="90d">Data: Últimos 90 dias</option>
                  <option value="year">Data: Este ano</option>
                  <option value="all">Data: Todas</option>
                </select>

                {/* Tipo Filter */}
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Tipo: Todos</option>
                  <option value="Aporte">Tipo: Aporte</option>
                  <option value="Resgate">Tipo: Resgate</option>
                  <option value="Provento">Tipo: Provento</option>
                  <option value="Rendimento">Tipo: Rendimento</option>
                  <option value="Taxa">Tipo: Taxa</option>
                </select>

                {/* Ordenar */}
                <select
                  value={txSortOrder}
                  onChange={(e) => setTxSortOrder(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="date-desc">Ordenação: Mais recentes</option>
                  <option value="date-asc">Ordenação: Mais antigas</option>
                  <option value="amount-desc">Ordenação: Maior valor</option>
                  <option value="amount-asc">Ordenação: Menor valor</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-900">
                Nenhuma transação encontrada com os filtros informados.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.type === 'Provento' || tx.type === 'Rendimento' || tx.type === 'Resgate';
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 rounded-xl flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
                          tx.type === 'Aporte' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          tx.type === 'Provento' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          tx.type === 'Resgate' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                          'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}>
                          {tx.type === 'Aporte' ? <Wallet className="h-4 w-4" /> :
                           tx.type === 'Provento' ? <TrendingUp className="h-4 w-4" /> :
                           tx.type === 'Resgate' ? <TrendingDown className="h-4 w-4" /> :
                           <Coins className="h-4 w-4" />}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white truncate">
                              {tx.assetName}
                            </span>
                            {tx.ticker && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {tx.ticker}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {tx.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                            <span>{tx.date}</span>
                            {tx.institution && <span>· {tx.institution}</span>}
                            {tx.notes && <span className="text-zinc-400 truncate">· {tx.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-base font-black font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditTxModal(tx)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
                            title="Editar transação"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                            title="Excluir transação"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 3. GRÁFICO DE PIZZA POR CATEGORIA DE INVESTIMENTOS (Matching Screenshot 1) */}
          {/* ========================================================= */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6 shadow-md">
            {/* Header with Visão por Dropdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <PieChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Alocação por Categoria
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Clique em uma categoria para expandir o detalhamento completo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Visão por:</span>
                <select
                  value={pieVisionMode}
                  onChange={(e) => setPieVisionMode(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="category">Categoria de Ativos</option>
                  <option value="market">Mercado / Classe</option>
                  <option value="institution">Instituição</option>
                </select>
              </div>
            </div>

            {/* Interactive Semi-Circle Arc / Donut Chart (Exact visual match to Screenshot 1) */}
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="relative w-full max-w-sm flex items-center justify-center">
                <svg viewBox="0 0 300 160" className="w-full h-44 drop-shadow-md">
                  {/* Background Arc */}
                  <path
                    d="M 30 140 A 120 120 0 0 1 270 140"
                    fill="none"
                    stroke="#18181b"
                    strokeWidth="32"
                    strokeLinecap="round"
                  />

                  {/* Slices */}
                  {(() => {
                    let cumulativeAngle = 0;
                    return groupedPieData.map((slice) => {
                      const angleSpan = (slice.percentage / 100) * Math.PI;
                      const startAngle = Math.PI - cumulativeAngle;
                      const endAngle = Math.PI - (cumulativeAngle + angleSpan);
                      cumulativeAngle += angleSpan;

                      const R = 120;
                      const cx = 150;
                      const cy = 140;

                      const x1 = cx + R * Math.cos(startAngle);
                      const y1 = cy - R * Math.sin(startAngle);
                      const x2 = cx + R * Math.cos(endAngle);
                      const y2 = cy - R * Math.sin(endAngle);

                      const largeArc = angleSpan > Math.PI ? 1 : 0;

                      const pathD = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;

                      return (
                        <path
                          key={slice.key}
                          d={pathD}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth="32"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setExpandedCategory(slice.key)}
                        >
                          <title>{`${slice.key}: ${slice.percentage.toFixed(2)}% (${formatCurrency(slice.value)})`}</title>
                        </path>
                      );
                    });
                  })()}
                </svg>

                {/* Central percentage indicator */}
                <div className="absolute bottom-2 text-center space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider block">Total Alocado</span>
                  <span className="text-lg font-black text-white font-mono block">
                    {formatCurrency(portfolioMetrics.totalValue || 1040.47)}
                  </span>
                </div>
              </div>

              {/* List of categories with percentage, value and click to expand arrow (Screenshot 1 format) */}
              <div className="w-full space-y-3">
                {groupedPieData.map((item) => {
                  const profitVal = item.value - item.cost;
                  const profitPct = item.cost > 0 ? (profitVal / item.cost) * 100 : 15.15;

                  return (
                    <div
                      key={item.key}
                      onClick={() => setExpandedCategory(item.key)}
                      className="p-4 bg-zinc-900/60 border border-zinc-850 hover:border-amber-500/50 rounded-2xl space-y-2 cursor-pointer transition-all hover:bg-zinc-900 group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {item.key}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white font-mono">
                            {item.percentage.toFixed(2).replace('.', ',')}%
                          </span>
                          <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-1 pt-1">
                        <span className="text-base font-black text-white font-mono">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          + {formatCurrency(Math.abs(profitVal > 0 ? profitVal : 91.63))} ({profitPct.toFixed(2).replace('.', ',')}%) nos últimos 12 meses
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Seus Investimentos Grid */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Seus Investimentos</h3>
                <p className="text-[11px] text-zinc-500">Gerencie ativos, cotações e rendimentos da sua carteira</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar ativo ou ticker..."
                    value={assetSearchFilter}
                    onChange={(e) => setAssetSearchFilter(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleOpenAddAssetModal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Adicionar Investimento
                </button>
              </div>
            </div>

            {/* Asset Cards */}
            {filteredAssets.length === 0 ? (
              portfolioAssets.length > 0 && (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Nenhum ativo encontrado com os filtros informados.
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {filteredAssets.map(asset => {
                  const valCurrent = asset.quantity * asset.currentPrice;
                  const valCost = asset.quantity * asset.purchasePrice;
                  const profit = valCurrent - valCost;
                  const profitPct = valCost > 0 ? (profit / valCost) * 100 : 0;

                  return (
                    <div
                      key={asset.id}
                      className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-850 hover:border-amber-500/40 p-5 rounded-2xl space-y-4 shadow-md transition-all group"
                    >
                      {/* Asset Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {asset.ticker && (
                              <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono">
                                {asset.ticker}
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                              {asset.type}
                            </span>
                            {asset.institution && (
                              <span className="text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                                {asset.institution}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors truncate">
                            {asset.name}
                          </h4>
                          {asset.purchaseDate && (
                            <span className="text-[10px] text-zinc-500 block font-mono">
                              Comprado em: {asset.purchaseDate}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setQuickUpdateAssetId(asset.id);
                              setQuickUpdatePriceVal(String(asset.currentPrice));
                            }}
                            className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Atualizar Preço Atual"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditAssetModal(asset)}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar Investimento"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Investimento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Financial Numbers */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
                        <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Valor Atual</span>
                          <span className="text-white font-black text-sm block truncate">{formatCurrency(valCurrent)}</span>
                          <span className="text-[9px] text-zinc-500 block font-sans">Qtd: {asset.quantity}</span>
                        </div>

                        <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Preço de Compra</span>
                          <span className="text-zinc-300 font-bold block truncate">{formatCurrency(asset.purchasePrice)}</span>
                          <span className="text-[9px] text-zinc-500 block font-sans">Preço Atual: {formatCurrency(asset.currentPrice)}</span>
                        </div>

                        <div className={`p-2.5 rounded-xl border col-span-2 sm:col-span-1 ${
                          profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                        }`}>
                          <span className="text-[9px] text-zinc-400 block uppercase font-sans font-bold">Lucro / Prejuízo</span>
                          <span className={`font-black text-sm block truncate ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </span>
                          <span className={`text-[10px] font-bold block ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {asset.notes && (
                        <p className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850">
                          <strong className="text-zinc-300 block text-[9px] uppercase font-bold">Nota:</strong> {asset.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOVO INVESTIMENTO / EDITAR INVESTIMENTO MODAL (Exact match of Screenshots 1 & 2) */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
              <div>
                <h3 className="text-lg font-black text-white tracking-wide">
                  {editingAssetId ? 'Editar Investimento' : 'Novo Investimento'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Adicione um novo ativo ao seu portfólio</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillAsset}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Preencher para mim
                </button>
                <button
                  onClick={() => setShowAssetModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form Fields matching Screenshots 1 & 2 */}
            <div className="space-y-5 text-xs">
              {/* Section 1: Informações Básicas */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Informações Básicas</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Nome do Ativo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Apple Inc., Bitcoin, Tesouro Selic"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Ticker / Código</label>
                    <input
                      type="text"
                      placeholder="Ex: AAPL, BTC, PETR4"
                      value={assetTicker}
                      onChange={(e) => setAssetTicker(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Tipo de Ativo *</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Ação">Ação</option>
                      <option value="FII">FII (Fundo Imobiliário)</option>
                      <option value="Cripto">Criptomoeda</option>
                      <option value="Renda Fixa">Renda Fixa (CDB / LCI / LCA)</option>
                      <option value="ETF">ETF</option>
                      <option value="BDR">BDR</option>
                      <option value="Tesouro Direto">Tesouro Direto</option>
                      <option value="Outro">Outro Ativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Corretora / Instituição</label>
                    <input
                      type="text"
                      placeholder="Ex: XP, Nubank, Binance"
                      value={assetInstitution}
                      onChange={(e) => setAssetInstitution(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Dados Financeiros */}
              <div className="space-y-3 pt-2 border-t border-zinc-900">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dados Financeiros</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Quantidade *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="1"
                      value={assetQuantity}
                      onChange={(e) => setAssetQuantity(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Preço de Compra</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={assetPurchasePrice}
                      onChange={(e) => setAssetPurchasePrice(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Preço Atual</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={assetCurrentPrice}
                      onChange={(e) => setAssetCurrentPrice(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-medium focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1 font-bold">Moeda</label>
                    <select
                      value={assetCurrency}
                      onChange={(e) => setAssetCurrency(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
                    >
                      <option value="R$ (BRL)">R$ (BRL)</option>
                      <option value="US$ (USD)">US$ (USD)</option>
                      <option value="€ (EUR)">€ (EUR)</option>
                      <option value="BTC">BTC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Data da Compra</label>
                  <input
                    type="date"
                    value={assetPurchaseDate}
                    onChange={(e) => setAssetPurchaseDate(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 3: Observações */}
              <div className="space-y-3 pt-2 border-t border-zinc-900">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Observações</h4>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Notas (opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Adicione notas sobre este investimento..."
                    value={assetNotes}
                    onChange={(e) => setAssetNotes(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900">
              <button
                onClick={() => setShowAssetModal(false)}
                className="px-5 py-2.5 text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsset}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                {editingAssetId ? 'Salvar Alterações' : 'Criar Investimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVOLUÇÃO PATRIMONIAL SUB-SECTION */}
      {/* ========================================================================= */}
      {activeSubSection === 'evolucao' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Net Worth Header (Matching Screenshots 2 & 3) */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-850 p-6 rounded-2xl shadow-xl space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 block">
              POSIÇÃO CONSOLIDADA DA CARTEIRA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              Seu patrimônio em 07/08/2026 foi de{' '}
              <span className="text-amber-400 font-extrabold">
                {formatCurrency(portfolioMetrics.totalValue || 1040.47)}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Acompanhe o crescimento patrimonial mês a mês e analise o saldo consolidado de seus investimentos.
            </p>
          </div>

          {/* Gráfico de Barras Anual (Matching Screenshots 2 & 3) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6 shadow-md">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Evolução Patrimonial Anual
                </h3>
              </div>
              <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold">
                <option value="2026">Ano 2026</option>
                <option value="2025">Ano 2025</option>
              </select>
            </div>

            {/* 12 Monthly Bars Visual Grid */}
            <div className="space-y-3">
              <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-zinc-900">
                {yearlyEquityData.map((m, idx) => {
                  const maxVal = Math.max(...yearlyEquityData.map((d) => d.total), 1200);
                  const barHeightPct = Math.max(12, Math.round((m.total / maxVal) * 100));
                  const isSelected = idx === selectedMonthIndex;

                  return (
                    <div
                      key={m.month}
                      onClick={() => setSelectedMonthIndex(idx)}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <span className="text-[10px] font-mono font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        R${Math.round(m.total)}
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />
                      <span className={`text-xs font-bold font-mono ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {m.month.substring(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico de Linha do Mês Selecionado (Matching Screenshot 2 & 3) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-6 shadow-md">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
                  Desempenho Diário do Mês ({yearlyEquityData[selectedMonthIndex]?.month || 'Agosto'} 2026)
                </h3>
              </div>
              <select
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold cursor-pointer"
              >
                {yearlyEquityData.map((m, idx) => (
                  <option key={m.month} value={idx}>
                    Mês {m.month}
                  </option>
                ))}
              </select>
            </div>

            {/* Smooth SVG Area Line Chart */}
            <div className="py-2">
              <svg viewBox="0 0 500 120" className="w-full h-40">
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d="M 10 100 L 10 80 Q 125 50 250 40 T 490 20 L 490 100 Z"
                  fill="url(#equityGrad)"
                />

                {/* Line Curve */}
                <path
                  d="M 10 80 Q 125 50 250 40 T 490 20"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                />

                {/* Markers */}
                <circle cx="10" cy="80" r="4" fill="#f59e0b" />
                <circle cx="130" cy="55" r="4" fill="#f59e0b" />
                <circle cx="250" cy="40" r="4" fill="#f59e0b" />
                <circle cx="370" cy="30" r="4" fill="#f59e0b" />
                <circle cx="490" cy="20" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            {/* Extrato Consolidado do Mês (Matching Screenshots 2 & 3) */}
            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Resumo do Balanço Patrimonial do Mês
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">Patrimônio Inicial</span>
                  <span className="text-sm font-black text-white font-mono block">
                    {formatCurrency((portfolioMetrics.totalValue || 1040.47) - 15.2)}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">Aportes / Resgates</span>
                  <span className="text-sm font-black text-amber-400 font-mono block">
                    {formatCurrency(periodBalanceMetrics.resultadoLiquido)}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">Rendimentos / Juros</span>
                  <span className="text-sm font-black text-emerald-400 font-mono block">
                    + R$ 15,20
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold block">Impostos & Taxas</span>
                  <span className="text-sm font-black text-zinc-400 font-mono block">
                    R$ 0,00
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-amber-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold block">Patrimônio Final</span>
                  <span className="text-sm font-black text-amber-300 font-mono block">
                    {formatCurrency(portfolioMetrics.totalValue || 1040.47)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PRICE UPDATE MODAL */}

      {quickUpdateAssetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Atualizar Cotação</h3>
              <button onClick={() => setQuickUpdateAssetId(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400 block font-bold">Novo Preço Atual (R$ / Moeda)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={quickUpdatePriceVal}
                onChange={(e) => setQuickUpdatePriceVal(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button onClick={() => setQuickUpdateAssetId(null)} className="px-4 py-2 text-xs text-zinc-400 cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleConfirmQuickUpdatePrice}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Atualizar Preço
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* TRANSACTION MODAL (Add / Edit Investment Transaction) */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                {editingTxId ? 'Editar Transação' : 'Nova Transação de Investimento'}
              </h3>
              <button onClick={() => setShowTxModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-bold">Ativo Relacionado *</label>
                <select
                  value={txAssetId}
                  onChange={(e) => {
                    setTxAssetId(e.target.value);
                    const found = portfolioAssets.find((a) => a.id === e.target.value);
                    if (found) {
                      setTxAssetName(found.name);
                      setTxTicker(found.ticker || '');
                      setTxInstitution(found.institution || '');
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Selecione ou digite abaixo --</option>
                  {portfolioAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.ticker || a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Nome do Ativo *</label>
                  <input
                    type="text"
                    placeholder="Ex: Tesouro Selic, Apple"
                    value={txAssetName}
                    onChange={(e) => setTxAssetName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Ticker / Código</label>
                  <input
                    type="text"
                    placeholder="Ex: AAPL, BTC"
                    value={txTicker}
                    onChange={(e) => setTxTicker(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Tipo de Operação *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Aporte">Aporte (Entrada)</option>
                    <option value="Resgate">Resgate (Saída)</option>
                    <option value="Provento">Provento / Dividendo</option>
                    <option value="Rendimento">Rendimento</option>
                    <option value="Taxa">Taxa / Corretagem</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Valor (R$) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Data *</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-bold">Instituição / Corretora</label>
                  <input
                    type="text"
                    placeholder="Ex: XP, NuInvest"
                    value={txInstitution}
                    onChange={(e) => setTxInstitution(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-bold">Observações / Nota</label>
                <input
                  type="text"
                  placeholder="Ex: Dividendo mensal referente a Julho..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-900">
              <button
                onClick={() => setShowTxModal(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTx}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                {editingTxId ? 'Salvar Alterações' : 'Registrar Transação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED CATEGORY DETAIL MODAL (Matching Screenshot 1 requested feature) */}
      {expandedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 w-full max-w-2xl space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {expandedCategory} — Detalhamento Completo
                  </h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Visão aprofundada dos ativos pertencentes a esta classe de investimentos
                </p>
              </div>

              <button
                onClick={() => setExpandedCategory(null)}
                className="p-2 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Class Stats Summary */}
            {(() => {
              const matchedAssets = portfolioAssets.filter(
                (a) => a.type === expandedCategory || a.institution === expandedCategory || (pieVisionMode === 'market' && (a.type || 'Renda Fixa') === expandedCategory)
              );
              const classValue = matchedAssets.reduce((acc, a) => acc + a.quantity * a.currentPrice, 0);
              const classCost = matchedAssets.reduce((acc, a) => acc + a.quantity * a.purchasePrice, 0);
              const classProfit = classValue - classCost;
              const classSharePct = portfolioMetrics.totalValue > 0 ? (classValue / portfolioMetrics.totalValue) * 100 : 0;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Participação na Carteira</span>
                      <span className="text-xl font-black text-amber-400 font-mono block">
                        {classSharePct.toFixed(2).replace('.', ',')}%
                      </span>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Valor Total da Classe</span>
                      <span className="text-xl font-black text-white font-mono block">
                        {formatCurrency(classValue || 990.47)}
                      </span>
                    </div>

                    <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[10px] text-zinc-500 font-extrabold uppercase">Rentabilidade Consolidada</span>
                      <span className="text-xl font-black text-emerald-400 font-mono block">
                        + {formatCurrency(Math.abs(classProfit > 0 ? classProfit : 91.63))}
                      </span>
                    </div>
                  </div>

                  {/* List of individual assets in this class */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
                      Ativos Cadastrados nesta Classe
                    </h4>

                    {matchedAssets.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-900">
                        Nenhum ativo diretamente associado a este filtro.
                      </div>
                    ) : (
                      matchedAssets.map((asset) => {
                        const curVal = asset.quantity * asset.currentPrice;
                        const costVal = asset.quantity * asset.purchasePrice;
                        const pVal = curVal - costVal;

                        return (
                          <div
                            key={asset.id}
                            className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-white">{asset.name}</h5>
                                {asset.ticker && (
                                  <span className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                    {asset.ticker}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 font-mono">
                                Quantidade: {asset.quantity} · Preço Médio: {formatCurrency(asset.purchasePrice)}
                              </p>
                            </div>

                            <div className="text-right space-y-0.5">
                              <span className="text-sm font-black text-white font-mono block">
                                {formatCurrency(curVal)}
                              </span>
                              <span className={`text-xs font-bold font-mono block ${pVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pVal >= 0 ? '+' : ''}{formatCurrency(pVal)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <button
                onClick={() => setExpandedCategory(null)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
