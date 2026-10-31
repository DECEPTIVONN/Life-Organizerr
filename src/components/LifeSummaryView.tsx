import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Dumbbell, 
  Brain, 
  Users, 
  Coins, 
  Compass, 
  ChevronLeft, 
  Star, 
  Check, 
  Plus, 
  Trash2, 
  Smile, 
  BookOpen, 
  HelpCircle, 
  Heart,
  Briefcase,
  ExternalLink,
  Gamepad2,
  Tv,
  Palmtree,
  Quote,
  Target,
  ArrowRight,
  ThumbsUp,
  Award,
  Search,
  Mail,
  Info,
  X,
  BicepsFlexed,
  Footprints,
  HeartPulse,
  Scale,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, BookTracker, BibleTracker, TimelineGoal } from '../types';
import GoalsView from './GoalsView';
import { 
  type LifeSummaryState, 
  defaultState, 
  ensureAreaFields, 
  ensureVertentesAndPontos, 
  mergeWithDefaults,
  type Belief,
  type Relation,
  type Mentor,
  type InfluencerRow,
  type BudgetGoal,
  type WishItem,
  type GridReason,
  type StarConquest
} from '../utils/lifeSummaryDefaults';

export { type LifeSummaryState, defaultState, mergeWithDefaults };

export interface LifeSummaryViewProps {
  state: LifeSummaryState;
  onChange: (newState: LifeSummaryState) => void;
  addXp: (amount: number) => void;
  goals?: Goal[];
  setGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
  timelines?: TimelineGoal[];
  setTimelines?: React.Dispatch<React.SetStateAction<TimelineGoal[]>>;
  bookTracker?: BookTracker;
  setBookTracker?: React.Dispatch<React.SetStateAction<BookTracker>>;
  bibleTracker?: BibleTracker;
  setBibleTracker?: React.Dispatch<React.SetStateAction<BibleTracker>>;
  areaImages?: Record<string, string>;
  setAreaImages?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeArea?: any;
  setActiveArea?: (area: any) => void;
}

const AREA_DETAILS = {
  spirituality: {
    title: 'Espiritualidade',
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-500/20',
    glowColor: 'rgba(245,158,11,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=1200',
    quote: '"O espírito é a âncora da alma, o farol na tempestade."'
  },
  body: {
    title: 'Corpo & Físico',
    icon: Dumbbell,
    color: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-500/20',
    glowColor: 'rgba(16,185,129,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200',
    quote: '"Seu corpo é o único lugar que você tem para viver. Cuide bem dele."'
  },
  mind: {
    title: 'Mente & Intelecto',
    icon: Brain,
    color: 'from-blue-400 to-cyan-500',
    borderColor: 'border-blue-500/20',
    glowColor: 'rgba(59,130,246,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200',
    quote: '"A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original."'
  },
  social: {
    title: 'Vida Social',
    icon: Users,
    color: 'from-pink-400 to-rose-500',
    borderColor: 'border-pink-500/20',
    glowColor: 'rgba(236,72,153,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200',
    quote: '"Nós somos a média das cinco pessoas com quem mais convivemos."'
  },
  finances: {
    title: 'Finanças & Carreira',
    icon: Coins,
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/20',
    glowColor: 'rgba(234,179,8,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=1200',
    quote: '"O dinheiro compra liberdade, não felicidade. Mas com liberdade, você escolhe seu caminho."'
  },
  entertainment: {
    title: 'Entretenimento & Lazer',
    icon: Compass,
    color: 'from-purple-400 to-violet-500',
    borderColor: 'border-purple-500/20',
    glowColor: 'rgba(168,85,247,0.2)',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200',
    quote: '"Tempo que você gosta de perder não é tempo perdido."'
  }
};

type CoreAreaKey = 'spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment';
type ActiveAreaKey = CoreAreaKey | null;

interface LifeAreaStandardTopicsProps {
  areaKey: CoreAreaKey;
  state: LifeSummaryState;
  onChange: (newState: LifeSummaryState) => void;
  triggerReward: (xp: number, message: string) => void;
}

const getImpactGridTitle = (key: string) => {
  switch (key) {
    case 'spirituality':
      return "Quais são as razões mais importantes para eu cultivar minha espiritualidade?";
    case 'body':
      return "Quais são as razões mais importantes para eu estar em ótima forma?";
    case 'mind':
      return "Quais são as razões mais importantes para eu ter uma mente sã e focada?";
    case 'social':
      return "Quais são as razões mais importantes para eu cultivar uma vida social saudável?";
    case 'finances':
      return "Quais são as razões mais importantes para eu conquistar a liberdade financeira e crescer na carreira?";
    case 'entertainment':
      return "Quais são as razões mais importantes para eu desfrutar de entretenimento e lazer equilibrados?";
    default:
      return "Quais são as razões mais importantes?";
  }
};

const getImpactGridDescription = (key: string) => {
  switch (key) {
    case 'spirituality':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu me conectar espiritualmente?' Pense em como fortalecer sua espiritualidade vai afetar positivamente as outras áreas da sua vida.";
    case 'body':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu melhorar meu corpo?' Pense em como melhorar seu corpo vai afetar positivamente as outras áreas da sua vida.";
    case 'mind':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu desenvolver minha mente?' Pense em como desenvolver sua mente vai afetar positivamente as outras áreas da sua vida.";
    case 'social':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu cultivar meus relacionamentos?' Pense em como ter conexões profundas vai afetar positivamente as outras áreas da sua vida.";
    case 'finances':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu atingir a liberdade financeira e sucesso na carreira?' Pense em como a estabilidade financeira vai afetar positivamente as outras áreas da sua vida.";
    case 'entertainment':
      return "Olhe para sua vida como um todo e pense: 'Quais são as principais razões para eu ter momentos de lazer?' Pense em como o entretenimento equilibrado vai afetar positivamente as outras áreas da sua vida.";
    default:
      return "Explore as conexões entre as diferentes áreas da sua vida.";
  }
};

const getActivityTitle = (key: string) => {
  switch (key) {
    case 'spirituality':
      return "Que tipo de atividades espirituais você se vê praticando?";
    case 'body':
      return "Que tipo de atividades físicas você se vê praticando?";
    case 'mind':
      return "Que tipo de atividades intelectuais você se vê praticando?";
    case 'social':
      return "Que tipo de atividades sociais você se vê praticando?";
    case 'finances':
      return "Que tipo de atividades financeiras ou profissionais você se vê praticando?";
    case 'entertainment':
      return "Que tipo de atividades de lazer você se vê praticando?";
    default:
      return "Que tipo de atividades você se vê praticando?";
  }
};

const getActivityIcon = (key: string) => {
  switch (key) {
    case 'spirituality':
      return Sparkles;
    case 'body':
      return Dumbbell;
    case 'mind':
      return Brain;
    case 'social':
      return Users;
    case 'finances':
      return Coins;
    case 'entertainment':
      return Compass;
    default:
      return Sparkles;
  }
};

const getAreaCheckColor = (key: string) => {
  switch (key) {
    case 'mind':
      return 'bg-blue-500 border-blue-500 text-zinc-950';
    case 'body':
      return 'bg-emerald-500 border-emerald-500 text-zinc-950';
    case 'spirituality':
      return 'bg-amber-500 border-amber-500 text-zinc-950';
    case 'social':
      return 'bg-pink-500 border-pink-500 text-zinc-950';
    case 'finances':
      return 'bg-yellow-500 border-yellow-500 text-zinc-950';
    case 'entertainment':
      return 'bg-purple-500 border-purple-500 text-zinc-950';
    default:
      return 'bg-orange-500 border-orange-500 text-zinc-950';
  }
};

function LifeAreaStandardTopics({ areaKey, state, onChange, triggerReward }: LifeAreaStandardTopicsProps) {
  const areaData = state[areaKey];
  const reasonsGrid = areaData?.reasonsGrid || [];
  const conquests = areaData?.conquests || [];
  const activities = areaData?.activities || [];

  const vertenteKey = areaKey;
  const pontosKey = areaKey;

  const v = state.vertentes || defaultState.vertentes!;
  const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;

  const [newPontoText, setNewPontoText] = useState('');
  const [editingPontoId, setEditingPontoId] = useState<string | null>(null);
  const [editingPontoText, setEditingPontoText] = useState('');

  const handleUpdateScoreLocal = (field: string, score: number) => {
    const updatedVertentes = {
      ...v,
      [vertenteKey]: {
        ...v[vertenteKey],
        [field]: score
      }
    };
    onChange({
      ...state,
      vertentes: updatedVertentes
    });
    triggerReward(5, 'Nota da vertente atualizada!');
  };

  const handleTogglePontoLocal = (id: string) => {
    const updated = pAtencao.map(p => {
      if (p.id === id) {
        const nextChecked = !p.checked;
        if (nextChecked) triggerReward(10, 'Ponto de atenção resolvido!');
        return { ...p, checked: nextChecked };
      }
      return p;
    });
    onChange({
      ...state,
      pontosAtencao: updated
    });
  };

  const handleAddPontoLocal = (texto: string) => {
    if (!texto.trim()) return;
    const newPonto = {
      id: `pa-${Date.now()}`,
      categoria: pontosKey,
      texto: texto.trim(),
      checked: false
    };
    onChange({
      ...state,
      pontosAtencao: [...pAtencao, newPonto]
    });
    triggerReward(5, 'Novo ponto de atenção adicionado!');
  };

  const handleRemovePontoLocal = (id: string) => {
    const updated = pAtencao.filter(p => p.id !== id);
    onChange({
      ...state,
      pontosAtencao: updated
    });
  };

  const handleUpdatePontoTextLocal = (id: string, newText: string) => {
    if (!newText.trim()) {
      handleRemovePontoLocal(id);
      return;
    }
    const updated = pAtencao.map(p => {
      if (p.id === id) {
        return { ...p, texto: newText.trim() };
      }
      return p;
    });
    onChange({
      ...state,
      pontosAtencao: updated
    });
  };

  const handleAreaChange = (field: 'reasonsGrid' | 'conquests' | 'activities', value: any) => {
    onChange({
      ...state,
      [areaKey]: {
        ...state[areaKey],
        [field]: value
      }
    });
  };

  const ActivityIcon = getActivityIcon(areaKey);

  return (
    <div className="space-y-8 pt-8 border-t border-zinc-900 mt-8">
      {/* 1. Impact Grid */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {getImpactGridTitle(areaKey)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed max-w-4xl">
            {getImpactGridDescription(areaKey)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {reasonsGrid.map((item, idx) => (
            <div key={item.id} className="space-y-1.5">
              <div className="inline-block px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                {item.label}
              </div>
              <div className={`flex items-center gap-3 p-3 bg-zinc-900/60 border rounded-xl hover:border-zinc-700/60 transition-all ${item.checked ? 'border-zinc-700/80 shadow-sm' : 'border-zinc-800'}`}>
                <button
                  type="button"
                  onClick={() => {
                    const updatedGrid = [...reasonsGrid];
                    const nextCheck = !item.checked;
                    updatedGrid[idx] = { ...item, checked: nextCheck };
                    if (nextCheck) triggerReward(10, `Impacto ${item.label} ativado!`);
                    handleAreaChange('reasonsGrid', updatedGrid);
                  }}
                  className={`w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    item.checked ? getAreaCheckColor(areaKey) : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/50'
                  }`}
                >
                  {item.checked && <Check className="h-3 w-3 stroke-[3px]" />}
                </button>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updatedGrid = [...reasonsGrid];
                    updatedGrid[idx] = { ...item, text: e.target.value };
                    handleAreaChange('reasonsGrid', updatedGrid);
                  }}
                  placeholder="Como afeta esta área..."
                  className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-700 focus:outline-none text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2 & 3 Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conquests (Left 7 Columns) */}
        <div className="lg:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              O que você gostaria de conquistar nessa área da vida?
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Defina 6 metas ou conquistas essenciais para esta área.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conquests.map((conquest, idx) => (
              <div 
                key={conquest.id} 
                className={`flex items-center gap-3 p-3 bg-zinc-900/40 border rounded-xl hover:border-zinc-700/60 transition-all ${conquest.checked ? 'border-yellow-500/20' : 'border-zinc-800'}`}
              >
                <button
                  onClick={() => {
                    const updated = [...conquests];
                    const nextCheck = !conquest.checked;
                    updated[idx] = { ...conquest, checked: nextCheck };
                    if (nextCheck) triggerReward(15, "Nova meta de conquista ativada!");
                    handleAreaChange('conquests', updated);
                  }}
                  className="flex-shrink-0 hover:scale-110 transition-transform"
                >
                  <Star className={`h-4.5 w-4.5 ${conquest.checked ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`} />
                </button>
                <input
                  type="text"
                  value={conquest.text}
                  onChange={(e) => {
                    const updated = [...conquests];
                    updated[idx] = { ...conquest, text: e.target.value };
                    handleAreaChange('conquests', updated);
                  }}
                  placeholder="Defina uma conquista..."
                  className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-700 focus:outline-none text-xs font-sans"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Activities (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {getActivityTitle(areaKey)}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Registre 3 práticas constantes ou rituais de excelência.</p>
          </div>

          <div className="space-y-3">
            {activities.map((act, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-700/60 transition-all"
              >
                <div className="text-zinc-500">
                  <ActivityIcon className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={act}
                  onChange={(e) => {
                    const updated = [...activities];
                    updated[idx] = e.target.value;
                    handleAreaChange('activities', updated);
                  }}
                  placeholder="Type something..."
                  className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-700 focus:outline-none text-xs font-sans italic"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Sincronização de Vertentes e Pontos de Atenção */}
      <div className="border-t border-zinc-900/60 pt-8 mt-8 space-y-6">
        <div>
          <span className="text-[10px] text-emerald-400 font-mono font-black tracking-widest uppercase block mb-1">
            CONEXÃO COM SUAS VERTENTES DA VIDA
          </span>
          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 text-emerald-400" />
            Análise Associada & Pontos de Atenção
          </h4>
          <p className="text-[11px] text-zinc-500 font-medium mt-1 leading-relaxed">
            As notas e pontos de atenção abaixo estão sincronizados em tempo real com o seu painel central.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vertente Card */}
          {(() => {
            const meta = VERTENTES_METADATA[vertenteKey];
            const catData = v[vertenteKey];
            const Icon = meta.icon;

            return (
              <div 
                className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-5 space-y-5 relative overflow-hidden"
                style={{
                  backgroundImage: `radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 60%)`
                }}
              >
                {/* Grid Accent overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                {/* Card Title */}
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{meta.title}</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    {(() => {
                      const avg = Object.values(catData).reduce((a, b) => a + b, 0) / 3;
                      return avg.toFixed(1);
                    })()} AVG
                  </span>
                </div>

                {/* Fields */}
                <div className="space-y-4 relative z-10">
                  {meta.fields.map((field) => {
                    const val = catData[field.key as keyof typeof catData];
                    const FieldIcon = field.icon;

                    return (
                      <div key={field.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <FieldIcon className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="text-xs font-bold font-sans">{field.label}</span>
                          </div>
                        </div>
                        <RatingCellBar 
                          value={val} 
                          onChange={(newVal) => handleUpdateScoreLocal(field.key, newVal)} 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Pontos de Atenção Column */}
          {(() => {
            const catMeta = CATEGORY_LABELS[pontosKey];
            const catPoints = pAtencao.filter(p => p.categoria === pontosKey);
            const CatIcon = catMeta.icon;

            return (
              <div 
                className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between min-h-[300px] relative overflow-hidden"
              >
                {/* Grid Accent overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                <div className="space-y-4 relative z-10 flex-1">
                  {/* Column Title */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                    <div className="flex items-center gap-2 text-white">
                      <CatIcon className="h-4 w-4 text-orange-400/80" />
                      <h3 className="text-xs font-black uppercase tracking-wider">Pontos de Atenção - {catMeta.label}</h3>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {catPoints.length} ITENS
                    </span>
                  </div>

                  {/* List of Points */}
                  <div className="space-y-2.5">
                    {catPoints.map((point) => (
                      <div 
                        key={point.id}
                        className={`flex items-start justify-between gap-2 p-2 rounded-xl border transition-all group ${
                          point.checked 
                            ? 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500 line-through' 
                            : 'bg-zinc-950/40 border-zinc-900/80 hover:border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleTogglePontoLocal(point.id)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                              point.checked 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-zinc-800 bg-zinc-900 text-transparent hover:border-zinc-700'
                            }`}
                          >
                            <Check className="h-2.5 w-2.5" />
                          </button>

                          {/* Point Text or Editor */}
                          {editingPontoId === point.id ? (
                            <input
                              type="text"
                              value={editingPontoText}
                              onChange={(e) => setEditingPontoText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdatePontoTextLocal(point.id, editingPontoText);
                                  setEditingPontoId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingPontoId(null);
                                }
                              }}
                              onBlur={() => {
                                handleUpdatePontoTextLocal(point.id, editingPontoText);
                                setEditingPontoId(null);
                              }}
                              autoFocus
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 p-0 font-sans"
                            />
                          ) : (
                            <span 
                              className="text-xs font-medium leading-relaxed font-sans cursor-pointer break-words flex-1 min-w-0"
                              onDoubleClick={() => {
                                setEditingPontoId(point.id);
                                setEditingPontoText(point.texto);
                              }}
                            >
                              {point.texto}
                            </span>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => {
                              setEditingPontoId(point.id);
                              setEditingPontoText(point.texto);
                            }}
                            className="text-zinc-600 hover:text-zinc-300 p-0.5 rounded transition-colors"
                            title="Editar"
                          >
                            <Plus className="h-3 w-3 rotate-45" />
                          </button>
                          <button
                            onClick={() => handleRemovePontoLocal(point.id)}
                            className="text-zinc-600 hover:text-red-500 p-0.5 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {catPoints.length === 0 && (
                      <div className="text-center py-6 border border-dashed border-zinc-900 rounded-xl">
                        <span className="text-[10px] text-zinc-600 font-mono">NENHUM DESAFIO ATIVO</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input addition field */}
                <div className="mt-4 relative z-10 pt-3 border-t border-zinc-900/40">
                  <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-900 rounded-xl px-3 py-2 transition-all focus-within:border-zinc-800">
                    <Plus className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      value={newPontoText}
                      onChange={(e) => setNewPontoText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPontoLocal(newPontoText);
                          setNewPontoText('');
                        }
                      }}
                      placeholder="Adicionar ponto de atenção..."
                      className="flex-1 bg-transparent border-none text-[11px] text-zinc-400 focus:text-zinc-200 focus:outline-none focus:ring-0 p-0 font-sans placeholder-zinc-600"
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

interface SemicolonListEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  gridColsClass?: string;
}

const SemicolonListEditor: React.FC<SemicolonListEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite algo...",
  gridColsClass = "grid-cols-1 sm:grid-cols-2"
}) => {
  const [newValueText, setNewValueText] = useState('');
  
  const items = value ? value.split(';').map(s => s.trim()).filter(Boolean) : [];

  const handleUpdateItem = (index: number, text: string) => {
    const updated = [...items];
    if (text.trim() === '') {
      updated.splice(index, 1);
    } else {
      updated[index] = text.trim();
    }
    onChange(updated.map(i => i + ';').join(' '));
  };

  const handleAddItem = () => {
    if (!newValueText.trim()) return;
    const updated = [...items, newValueText.trim()];
    onChange(updated.map(i => i + ';').join(' '));
    setNewValueText('');
  };

  return (
    <div className={`grid ${gridColsClass} gap-3`}>
      {items.map((item, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-900 rounded-xl px-3.5 py-2.5 transition-all focus-within:border-zinc-800 group"
        >
          <Search className="h-3.5 w-3.5 text-blue-400/50 shrink-0" />
          <input
            type="text"
            value={item}
            onChange={(e) => handleUpdateItem(index, e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-zinc-200 focus:outline-none focus:ring-0 p-0 font-sans"
          />
          <button
            onClick={() => handleUpdateItem(index, '')}
            className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      
      {/* Addition Card */}
      <div className="flex items-center gap-3 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl px-3.5 py-2.5 transition-all focus-within:border-zinc-800">
        <Search className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
        <input
          type="text"
          value={newValueText}
          onChange={(e) => setNewValueText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
          onBlur={handleAddItem}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-xs text-zinc-500 focus:text-zinc-300 focus:outline-none focus:ring-0 p-0 font-sans"
        />
      </div>
    </div>
  );
};

const VERTENTES_METADATA = {
  spirituality: {
    title: 'Espiritualidade',
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-500/20',
    fields: [
      { key: 'conexao', label: 'Conexão e Fé', icon: Sparkles, desc: 'Sua prática espiritual diária e conexão íntima com Deus.' },
      { key: 'proposito', label: 'Alinhamento Espiritual', icon: Award, desc: 'Sentimento de agir em conformidade com seus valores cristãos.' },
      { key: 'paz', label: 'Paz Interior', icon: Heart, desc: 'Ausência de angústia e sentimento de profunda gratidão e amparo.' }
    ]
  },
  body: {
    title: 'Corpo & Físico',
    icon: Dumbbell,
    color: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-500/20',
    fields: [
      { key: 'saude', label: 'Saúde e Disposição', icon: Dumbbell, desc: 'Sua vitalidade, energia física e ausência de dores.' },
      { key: 'vitalidade', label: 'Energia e Resistência', icon: HeartPulse, desc: 'Disposição para o trabalho e treinos intensos diários.' },
      { key: 'estetica', label: 'Autoimagem e Shape', icon: Award, desc: 'Seu nível de satisfação com a força e estética do corpo.' }
    ]
  },
  mind: {
    title: 'Mente & Intelecto',
    icon: Brain,
    color: 'from-blue-400 to-cyan-500',
    borderColor: 'border-blue-500/20',
    fields: [
      { key: 'emocional', label: 'Equilíbrio Emocional', icon: Heart, desc: 'Controle de ansiedade, estresse e paz mental perante desafios.' },
      { key: 'intelectual', label: 'Desenvolvimento Intelectual', icon: Brain, desc: 'Leitura, estudo focado e aprendizado constante de novas tecnologias.' },
      { key: 'foco', label: 'Clareza Mental e Foco', icon: Target, desc: 'Capacidade de concentração profunda sem distrações.' }
    ]
  },
  social: {
    title: 'Vida Social',
    icon: Users,
    color: 'from-pink-400 to-rose-500',
    borderColor: 'border-pink-500/20',
    fields: [
      { key: 'familia', label: 'Família', icon: Users, desc: 'Presença, carinho, convivência e apoio mútuo com familiares.' },
      { key: 'amoroso', label: 'Relacionamento Amoroso', icon: Heart, desc: 'Conexão íntima, amor, carinho e parceria recíproca.' },
      { key: 'social', label: 'Vida Social', icon: Compass, desc: 'Interação de qualidade, novos amigos e redes de apoio saudáveis.' }
    ]
  },
  finances: {
    title: 'Finanças & Carreira',
    icon: Coins,
    color: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500/20',
    fields: [
      { key: 'realizacao', label: 'Realização Profissional', icon: Award, desc: 'Sentimento de valor, propósito e utilidade em sua carreira de engenheiro.' },
      { key: 'financeiro', label: 'Recurso Financeiro', icon: Coins, desc: 'Sua estabilidade financeira, investimentos e ganho mensal.' },
      { key: 'social', label: 'Contribuição Social', icon: Users, desc: 'Impacto positivo do seu trabalho e softwares no mundo real.' }
    ]
  },
  entertainment: {
    title: 'Entretenimento & Lazer',
    icon: Compass,
    color: 'from-purple-400 to-violet-500',
    borderColor: 'border-purple-500/20',
    fields: [
      { key: 'tempo', label: 'Lazer de Qualidade', icon: Smile, desc: 'Tempo dedicado a relaxar de verdade e curtir momentos sem pressão.' },
      { key: 'hobbies', label: 'Hobbies e Paixões', icon: Compass, desc: 'Games, receitas, livros não-técnicos e interesses pessoais.' },
      { key: 'desconexao', label: 'Desconexão do Trabalho', icon: Sparkles, desc: 'Sua habilidade em se desligar de pendências e códigos nos momentos livres.' }
    ]
  }
};

const CATEGORY_LABELS = {
  spirituality: { label: 'Espiritualidade', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', icon: Sparkles },
  body: { label: 'Corpo & Físico', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', icon: Dumbbell },
  mind: { label: 'Mente & Intelecto', color: 'text-blue-400 bg-blue-500/10 border-blue-500/25', icon: Brain },
  social: { label: 'Vida Social', color: 'text-pink-400 bg-pink-500/10 border-pink-500/25', icon: Users },
  finances: { label: 'Finanças & Carreira', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25', icon: Coins },
  entertainment: { label: 'Entretenimento & Lazer', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', icon: Compass }
};

const RatingCellBar: React.FC<{
  value: number;
  onChange: (val: number) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex-1 grid grid-cols-10 gap-1 bg-zinc-950/40 p-1 border border-zinc-900 rounded-lg">
        {Array.from({ length: 10 }).map((_, i) => {
          const scoreVal = i + 1;
          const isSelected = scoreVal <= value;
          return (
            <button
              key={i}
              onClick={() => onChange(scoreVal)}
              className={`h-7 rounded-md transition-all relative group flex items-center justify-center font-mono text-[9px] font-black ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  : 'bg-zinc-900/40 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 border border-zinc-900/60'
              }`}
              title={`Definir nota ${scoreVal}`}
            >
              {scoreVal}
            </button>
          );
        })}
      </div>
      <div className="w-8 flex items-center justify-center shrink-0">
        <span className="text-sm font-black font-mono bg-zinc-900/80 border border-zinc-800 text-emerald-400 px-2 py-0.5 rounded-lg">
          {value}
        </span>
      </div>
    </div>
  );
};

export default function LifeSummaryView({ 
  state, 
  onChange, 
  addXp,
  goals = [],
  setGoals = () => {},
  timelines = [],
  setTimelines = () => {},
  bookTracker,
  setBookTracker = () => {},
  bibleTracker,
  setBibleTracker = () => {},
  areaImages,
  setAreaImages = () => {},
  activeArea: propActiveArea,
  setActiveArea: propSetActiveArea
}: LifeSummaryViewProps) {
  const [localActiveArea, setLocalActiveArea] = useState<ActiveAreaKey>(null);

  const activeArea = propActiveArea !== undefined ? propActiveArea : localActiveArea;
  const setActiveArea = propSetActiveArea !== undefined ? propSetActiveArea : setLocalActiveArea;

  // States for interactive editing inputs inside detailed views
  const [newBeliefText, setNewBeliefText] = useState('');
  const [newRelationName, setNewRelationName] = useState('');
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorArea, setNewMentorArea] = useState('');
  const [newMentorImpact, setNewMentorImpact] = useState<'Alto' | 'Médio' | 'Baixo'>('Alto');
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(100);
  const [newWishDescription, setNewWishDescription] = useState('');
  const [newWishCost, setNewWishCost] = useState<number>(100);

  // States for other list additions
  const [newHabitText, setNewHabitText] = useState('');
  const [newHabitXp, setNewHabitXp] = useState<number>(15);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [newIntellectualGoalText, setNewIntellectualGoalText] = useState('');
  const [newValueText, setNewValueText] = useState('');
  const [newAvoidBehaviorText, setNewAvoidBehaviorText] = useState('');
  const [newInfluencerCategory, setNewInfluencerCategory] = useState('');
  const [newInfluencerUsernames, setNewInfluencerUsernames] = useState('');
  const [newInfluencerCountry, setNewInfluencerCountry] = useState('');
  const [newInfluencerTopics, setNewInfluencerTopics] = useState('');
  const [newInfluencerFollowers, setNewInfluencerFollowers] = useState('');
  const [newStressBusterText, setNewStressBusterText] = useState('');
  const [newNurtureTexts, setNewNurtureTexts] = useState<Record<string, string>>({});

  // Custom persistent tip lists
  const [tips, setTips] = useState([
    { id: 'tip-1', text: 'Tirar 15 minutos para respiração guiada ou meditação transcendental hoje.', checked: false },
    { id: 'tip-2', text: 'Registrar todas as despesas diárias e manter o orçamento nos eixos.', checked: false },
    { id: 'tip-3', text: 'Enviar uma mensagem curta de incentivo ou gratidão para Kelvyn ou Davi.', checked: false },
    { id: 'tip-4', text: 'Treinar com foco máximo por 45 minutos (Cardio ou Musculação).', checked: false },
  ]);

  const handleStateChange = (newState: LifeSummaryState) => {
    onChange(newState);
  };

  const [newPontoTexts, setNewPontoTexts] = useState<Record<string, string>>({
    spirituality: '',
    body: '',
    mind: '',
    social: '',
    finances: '',
    entertainment: ''
  });
  const [editingPontoId, setEditingPontoId] = useState<string | null>(null);
  const [editingPontoText, setEditingPontoText] = useState('');

  const handleUpdateScore = (
    category: 'spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment',
    field: string,
    score: number
  ) => {
    const v = state.vertentes || defaultState.vertentes!;
    const updatedVertentes = {
      ...v,
      [category]: {
        ...(v[category] || {}),
        [field]: score
      }
    };
    handleStateChange({
      ...state,
      vertentes: updatedVertentes
    });
    triggerReward(5, 'Nota da vertente atualizada!');
  };

  const handleTogglePonto = (id: string) => {
    const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;
    const updated = pAtencao.map(p => {
      if (p.id === id) {
        const nextChecked = !p.checked;
        if (nextChecked) triggerReward(10, 'Ponto de atenção resolvido!');
        return { ...p, checked: nextChecked };
      }
      return p;
    });
    handleStateChange({
      ...state,
      pontosAtencao: updated
    });
  };

  const handleAddPonto = (
    categoria: 'qualidade_vida' | 'profissional' | 'pessoal' | 'spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment',
    texto: string
  ) => {
    if (!texto.trim()) return;
    const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;
    const newPonto = {
      id: `pa-${Date.now()}`,
      categoria,
      texto: texto.trim(),
      checked: false
    };
    handleStateChange({
      ...state,
      pontosAtencao: [...pAtencao, newPonto]
    });
    triggerReward(5, 'Novo ponto de atenção adicionado!');
  };

  const handleRemovePonto = (id: string) => {
    const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;
    const updated = pAtencao.filter(p => p.id !== id);
    handleStateChange({
      ...state,
      pontosAtencao: updated
    });
  };

  const handleUpdatePontoText = (id: string, newText: string) => {
    if (!newText.trim()) {
      handleRemovePonto(id);
      return;
    }
    const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;
    const updated = pAtencao.map(p => {
      if (p.id === id) {
        return { ...p, texto: newText.trim() };
      }
      return p;
    });
    handleStateChange({
      ...state,
      pontosAtencao: updated
    });
  };

  // Safe reward notifier that uses props
  const triggerReward = (xp: number, message: string) => {
    addXp(xp);
    // Dynamic temporary toast in upper center if possible (or console status)
    const toast = document.createElement('div');
    toast.className = "fixed top-12 left-1/2 transform -translate-x-1/2 bg-zinc-950 border border-orange-500/50 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono shadow-[0_0_15px_rgba(249,115,22,0.3)] z-50 flex items-center gap-2 pointer-events-none animate-bounce";
    toast.innerHTML = `<span class="text-orange-500">✦ +${xp} XP</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2500);
  };

  // Helper calculating properties completion
  const getProgress = (key: keyof LifeSummaryState) => {
    switch (key) {
      case 'spirituality': {
        const checkedCount = state.spirituality.habits.filter(h => h.checked).length;
        const totalCount = state.spirituality.habits.length;
        return totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      }
      case 'body': {
        const checkedCount = state.body.milestones.filter(m => m.checked).length;
        const totalCount = state.body.milestones.length;
        return totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      }
      case 'mind': {
        const checkedCount = state.mind.intellectualGoals.filter(i => i.checked).length;
        const totalCount = state.mind.intellectualGoals.length;
        return totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      }
      case 'social': {
        const checkedCount = state.social.values.filter(v => v.checked).length;
        const totalCount = state.social.values.length;
        return totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      }
      case 'finances': {
        const answerCount = Object.values(state.finances.careerAnswers).filter(Boolean).length;
        return Math.round((answerCount / 6) * 100);
      }
      case 'entertainment': {
        const checkedCount = state.entertainment.stressBusters.filter(s => s.checked).length;
        const totalCount = state.entertainment.stressBusters.length;
        return totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
      }
      default:
        return 0;
    }
  };

  const getSubtext = (key: keyof LifeSummaryState) => {
    switch (key) {
      case 'spirituality':
        return `${state.spirituality.beliefs.length} crenças definidas`;
      case 'body':
        return `Resistência: Nível ${state.body.ratings.stamina}/5`;
      case 'mind':
        return `${state.mind.intellectualGoals.filter(g => g.checked).length}/${state.mind.intellectualGoals.length} objetivos`;
      case 'social':
        return `${state.social.relations.length} conexões nucleares`;
      case 'finances':
        return `Crenças configuradas: ${state.finances.beliefs.length}/3`;
      case 'entertainment':
        return `Balanço de Lazer: ${state.entertainment.balanceRating}/5`;
    }
  };

  const v = state.vertentes || defaultState.vertentes!;
  const pAtencao = state.pontosAtencao || defaultState.pontosAtencao!;

  return (
    <div className="text-zinc-200 select-none">
      <AnimatePresence mode="wait">
        {!activeArea ? (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header section with brand identity */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900/60 pb-6">
              <div>
                <span className="text-[10px] text-orange-500 font-mono font-black tracking-widest uppercase block mb-1">
                  MÓDULO DE AUTOCONHECIMENTO
                </span>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <Compass className="h-8 w-8 text-orange-500" />
                  Vida em resumo
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Gerencie holisticamente todas as áreas vitais da sua jornada. Defina princípios, avalie condições e crie planos.
                </p>
              </div>

              {/* Overview completion stats */}
              <div className="flex gap-3 bg-zinc-950/40 border border-zinc-900/80 p-3 rounded-2xl">
                <div className="text-center px-4 border-r border-zinc-900">
                  <span className="text-[10px] text-gray-500 font-mono font-bold block">ÁREAS ATIVAS</span>
                  <span className="text-xl font-mono font-black text-white mt-1 block">6 / 6</span>
                </div>
                <div className="text-center px-4">
                  <span className="text-[10px] text-gray-500 font-mono font-bold block">HABILIDADES HUD</span>
                  <span className="text-xl font-mono font-black text-orange-500 mt-1 block">PREMIUM</span>
                </div>
              </div>
            </div>

            {/* Quote and Tips Side Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: The 6 Life Areas cards */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.keys(AREA_DETAILS) as Array<keyof typeof AREA_DETAILS>).map((key) => {
                  const area = AREA_DETAILS[key];
                  const prog = getProgress(key);
                  const sub = getSubtext(key);
                  const Icon = area.icon;

                  return (
                    <motion.div
                      key={key}
                      onClick={() => setActiveArea(key)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      className={`relative overflow-hidden bg-zinc-950/50 border ${area.borderColor} rounded-2xl h-52 p-5 cursor-pointer group flex flex-col justify-between transition-all duration-300`}
                      style={{
                        boxShadow: `inset 0 0 20px rgba(0, 0, 0, 0.4)`
                      }}
                    >
                      {/* Artistic Background Overlay Image */}
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={area.bannerUrl} 
                          alt={area.title} 
                          className="w-full h-full object-cover opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-500 filter grayscale"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-zinc-950/40`} />
                      </div>

                      {/* Header */}
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-zinc-900 border ${area.borderColor} text-zinc-300 group-hover:text-white group-hover:scale-110 transition-all`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">{area.title}</h3>
                            <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{sub}</span>
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-4 w-4 text-orange-400" />
                        </div>
                      </div>

                      {/* Middle Quote Preview */}
                      <div className="relative z-10 text-[10px] italic text-zinc-400 line-clamp-2 pr-6 border-l border-zinc-800 pl-3">
                        {area.quote}
                      </div>

                      {/* Progress bar at the bottom */}
                      <div className="relative z-10 space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-gray-500 uppercase font-bold">PREENCHIMENTO</span>
                          <span className="text-white font-black">{prog}%</span>
                        </div>
                        <div className="w-full bg-zinc-900/60 h-1 rounded-full overflow-hidden border border-zinc-900/40">
                          <div 
                            className={`h-full bg-gradient-to-r ${area.color} transition-all duration-500`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right Column: Quotes of the day and customizable checklist */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Visual Quote card */}
                <div className="relative overflow-hidden bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between min-h-[160px]">
                  <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                  <Quote className="h-8 w-8 text-orange-500/20 fill-orange-500/5 mb-3" />
                  
                  <div>
                    <p className="text-xs font-black italic text-zinc-300 leading-relaxed">
                      "A excelência não é um ato único, mas sim um hábito constante. Nós nos tornamos aquilo que fazemos repetidamente."
                    </p>
                    <span className="text-[9px] font-mono text-orange-500 uppercase tracking-widest font-bold mt-2.5 block">
                      — ARISTÓTELES
                    </span>
                  </div>
                </div>

                {/* Interactive Life tips card */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-orange-500" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Dicas de Equilíbrio</h3>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">DICAS</span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Aqui estão sugestões de ações diárias recomendadas para equilibrar sua mente, corpo e espírito hoje:
                  </p>

                  <div className="space-y-2.5">
                    {tips.map((tip) => (
                      <div 
                        key={tip.id}
                        onClick={() => {
                          const updated = tips.map(t => {
                            if (t.id === tip.id) {
                              const next = !t.checked;
                              if (next) triggerReward(10, 'Ação de equilíbrio completada!');
                              return { ...t, checked: next };
                            }
                            return t;
                          });
                          setTips(updated);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                          tip.checked 
                            ? 'bg-orange-500/5 border-orange-500/20 text-zinc-500 line-through' 
                            : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          tip.checked 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'border-zinc-800 bg-zinc-950 text-transparent'
                        }`}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-[10px] leading-tight font-medium font-sans">
                          {tip.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-900/60 text-center">
                    <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest block">
                      SEU PROTOCOLO DIÁRIO
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* --- SEÇÃO: VERTENTES DA VIDA --- */}
            <div className="border-t border-zinc-900/60 pt-10 mt-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono font-black tracking-widest uppercase block mb-1">
                    ANÁLISE DE SATISFAÇÃO GERAL
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <Compass className="h-6 w-6 text-emerald-400" />
                    Vertentes da Vida
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Avalie suas vertentes principais de 1 a 10 para identificar equilíbrios e pontos críticos em sua rotina.
                  </p>
                </div>
                
                {/* General score representation */}
                <div className="bg-zinc-950/40 border border-zinc-900 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono font-bold block">BALANÇO GERAL</span>
                    <span className="text-sm font-mono font-black text-white block">
                      {(() => {
                        const keys: ('spirituality' | 'body' | 'mind' | 'social' | 'finances' | 'entertainment')[] = [
                          'spirituality', 'body', 'mind', 'social', 'finances', 'entertainment'
                        ];
                        let sum = 0;
                        let count = 0;
                        keys.forEach(k => {
                          const catData = v[k];
                          if (catData) {
                            Object.values(catData).forEach((val: any) => {
                              sum += val;
                              count++;
                            });
                          }
                        });
                        return count > 0 ? (sum / count).toFixed(1) : '0.0';
                      })()}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid of 6 Customized Vertentes Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(['spirituality', 'body', 'mind', 'social', 'finances', 'entertainment'] as const).map((catKey) => {
                  const meta = VERTENTES_METADATA[catKey];
                  const catData = v[catKey] || { field1: 5, field2: 5, field3: 5 }; // Safe fallback
                  const Icon = meta.icon;

                  return (
                    <div 
                      key={catKey}
                      className="bg-zinc-950/30 border border-zinc-900 rounded-2xl p-5 space-y-5 relative overflow-hidden"
                      style={{
                        backgroundImage: `radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 60%)`
                      }}
                    >
                      {/* Grid Accent overlay to look like journal page */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                      {/* Card Title */}
                      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">{meta.title}</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                          {(() => {
                            const values = Object.values(catData);
                            const avg = values.length > 0 ? (values.reduce((a: number, b: number) => a + b, 0) / values.length) : 0;
                            return avg.toFixed(1);
                          })()} AVG
                        </span>
                      </div>

                      {/* Fields */}
                      <div className="space-y-4 relative z-10">
                        {meta.fields.map((field) => {
                          const val = (catData as any)[field.key] ?? 5;
                          const FieldIcon = field.icon;

                          return (
                            <div key={field.key} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-300">
                                  <FieldIcon className="h-3.5 w-3.5 text-zinc-500" />
                                  <span className="text-xs font-bold font-sans">{field.label}</span>
                                </div>
                              </div>
                              <RatingCellBar 
                                value={val} 
                                onChange={(newVal) => handleUpdateScore(catKey, field.key, newVal)} 
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* --- SEÇÃO: PONTOS QUE MERECEM ATENÇÃO --- */}
              <div className="space-y-6 pt-4">
                <div>
                  <span className="text-[10px] text-orange-400 font-mono font-black tracking-widest uppercase block mb-1">
                    DIAGNÓSTICO DE DESAFIOS
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                    <Info className="h-5 w-5 text-orange-400" />
                    Pontos que Merecem Atenção
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Pontos fundamentais extraídos da sua autoavaliação. Adicione, edite ou conclua objetivos de ajuste em cada área.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(['spirituality', 'body', 'mind', 'social', 'finances', 'entertainment'] as const).map((catId) => {
                    const catMeta = CATEGORY_LABELS[catId];
                    const catPoints = pAtencao.filter(p => p.categoria === catId);
                    const CatIcon = catMeta.icon;

                    return (
                      <div 
                        key={catId}
                        className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between min-h-[300px] relative overflow-hidden"
                      >
                        {/* Grid Accent overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(63,63,70,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                        <div className="space-y-4 relative z-10 flex-1">
                          {/* Column Title */}
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                            <div className="flex items-center gap-2 text-white">
                              <CatIcon className="h-4 w-4 text-orange-400/80" />
                              <h3 className="text-xs font-black uppercase tracking-wider">{catMeta.label}</h3>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {catPoints.length} ITENS
                            </span>
                          </div>

                          {/* List of Points */}
                          <div className="space-y-2.5">
                            {catPoints.map((point) => (
                              <div 
                                key={point.id}
                                className={`flex items-start justify-between gap-2 p-2 rounded-xl border transition-all group ${
                                  point.checked 
                                    ? 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500 line-through' 
                                    : 'bg-zinc-950/40 border-zinc-900/80 hover:border-zinc-800 text-zinc-300'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => handleTogglePonto(point.id)}
                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                      point.checked 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-zinc-800 bg-zinc-900 text-transparent hover:border-zinc-700'
                                    }`}
                                  >
                                    <Check className="h-2.5 w-2.5" />
                                  </button>

                                  {/* Point Text or Editor */}
                                  {editingPontoId === point.id ? (
                                    <input
                                      type="text"
                                      value={editingPontoText}
                                      onChange={(e) => setEditingPontoText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleUpdatePontoText(point.id, editingPontoText);
                                          setEditingPontoId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingPontoId(null);
                                        }
                                      }}
                                      onBlur={() => {
                                        handleUpdatePontoText(point.id, editingPontoText);
                                        setEditingPontoId(null);
                                      }}
                                      autoFocus
                                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 p-0 font-sans"
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs font-medium leading-relaxed font-sans cursor-pointer break-words flex-1 min-w-0"
                                      onDoubleClick={() => {
                                        setEditingPontoId(point.id);
                                        setEditingPontoText(point.texto);
                                      }}
                                    >
                                      {point.texto}
                                    </span>
                                  )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingPontoId(point.id);
                                      setEditingPontoText(point.texto);
                                    }}
                                    className="text-zinc-600 hover:text-zinc-300 p-0.5 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Plus className="h-3 w-3 rotate-45" />
                                  </button>
                                  <button
                                    onClick={() => handleRemovePonto(point.id)}
                                    className="text-zinc-600 hover:text-red-500 p-0.5 rounded transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {catPoints.length === 0 && (
                              <div className="text-center py-6 border border-dashed border-zinc-900 rounded-xl">
                                <span className="text-[10px] text-zinc-600 font-mono">NENHUM DESAFIO ATIVO</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Input addition field */}
                        <div className="mt-4 relative z-10 pt-3 border-t border-zinc-900/40">
                          <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-900 rounded-xl px-3 py-2 transition-all focus-within:border-zinc-800">
                            <Plus className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                            <input
                              type="text"
                              value={newPontoTexts[catId] || ''}
                              onChange={(e) => setNewPontoTexts({
                                ...newPontoTexts,
                                [catId]: e.target.value
                              })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPonto(catId, newPontoTexts[catId]);
                                  setNewPontoTexts({
                                    ...newPontoTexts,
                                    [catId]: ''
                                  });
                                }
                              }}
                              placeholder="Adicionar ponto de atenção..."
                              className="flex-1 bg-transparent border-none text-[11px] text-zinc-400 focus:text-zinc-200 focus:outline-none focus:ring-0 p-0 font-sans placeholder-zinc-600"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* --- SEÇÃO: METAS DE VIDA --- */}
            <div className="border-t border-zinc-900/60 pt-10 mt-10">
              <GoalsView 
                goals={goals}
                setGoals={setGoals}
                timelines={timelines}
                setTimelines={setTimelines}
                addXp={addXp}
                bookTracker={bookTracker}
                setBookTracker={setBookTracker}
                bibleTracker={bibleTracker}
                setBibleTracker={setBibleTracker}
                areaImages={areaImages}
                setAreaImages={setAreaImages}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Back button and title */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <button
                onClick={() => {
                  setActiveArea(null);
                  // Reset temporary input values
                  setNewBeliefText('');
                  setNewRelationName('');
                  setNewMentorName('');
                  setNewMentorArea('');
                  setNewMentorImpact('Alto');
                  setNewBudgetCategory('');
                  setNewBudgetAmount(100);
                  setNewWishDescription('');
                  setNewWishCost(100);
                  setNewAvoidBehaviorText('');
                  setNewInfluencerCategory('');
                  setNewInfluencerUsernames('');
                  setNewInfluencerCountry('');
                  setNewInfluencerTopics('');
                  setNewInfluencerFollowers('');
                  setNewValueText('');
                }}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-zinc-900/60 px-3.5 py-2 rounded-xl border border-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar ao Resumo
              </button>
            </div>

            {/* Custom Worksheet Content Based on Active Area */}
            {activeArea === 'spirituality' && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden flex items-end p-6 border border-zinc-900">
                  <img 
                    src={AREA_DETAILS.spirituality.bannerUrl} 
                    alt="Espiritualidade" 
                    className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3.5 bg-zinc-900 border border-amber-500/20 rounded-xl text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-400 font-mono tracking-widest font-black uppercase">ÁREA DA ESPIRITUALIDADE</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">— Espiritualidade & Propósito</h2>
                    </div>
                  </div>
                </div>

                {/* Notion Page Properties */}
                <div className="bg-zinc-950/20 border border-zinc-900 p-5 rounded-2xl space-y-3 font-sans">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-4 h-4 rounded bg-[#b9735a] flex items-center justify-center text-[10px] text-white font-bold font-serif shadow-sm">
                      E
                    </div>
                    <span>— Spirit</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4 pt-2">
                    {/* Important Property */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Star className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Important</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.spirituality.important || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          spirituality: { ...state.spirituality, important: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* O que eu quero no futuro */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Compass className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">O que eu quero, n...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.spirituality.whatIWantInFuture || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          spirituality: { ...state.spirituality, whatIWantInFuture: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* Por que eu quero */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Por que eu quero...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.spirituality.whyIWant || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          spirituality: { ...state.spirituality, whyIWant: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-zinc-900/60 text-[11px] text-gray-500">
                    <button className="hover:text-zinc-300 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add a property
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button className="hover:text-zinc-300 transition-colors">
                      Ocultar 3 propriedades
                    </button>
                  </div>
                </div>

                {/* Centered Serif Header */}
                <div className="text-center py-6 border-y border-zinc-900/80 my-2">
                  <h1 className="text-3xl font-serif text-[#9f6e49] uppercase tracking-[0.25em]">
                    Espírito
                  </h1>
                </div>

                {/* 1. Crenças Section */}
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-[#9f6e49] font-mono">⪡</span>
                      Escreva suas crenças sobre espiritualidade da forma mais clara e simples que conseguir.
                      <span className="text-[#9f6e49] font-mono">⪢</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=400"
                        alt="Renaissance hand sketch"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Beliefs List */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="space-y-1">
                        {state.spirituality.beliefs.map((belief, idx) => (
                          <div key={belief.id || idx} className="flex items-center gap-2 border-b border-zinc-900/40 py-2 group">
                            <span className="text-[#c38d67] text-lg select-none leading-none">•</span>
                            <input
                              type="text"
                              value={belief.text || ''}
                              onChange={(e) => {
                                const updated = state.spirituality.beliefs.map(b => b.id === belief.id ? { ...b, text: e.target.value } : b);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, beliefs: updated }
                                });
                              }}
                              className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none w-full font-serif leading-relaxed py-0.5"
                              placeholder="Vazio"
                            />
                            <button
                              onClick={() => {
                                const updated = state.spirituality.beliefs.filter(b => b.id !== belief.id);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, beliefs: updated }
                                });
                              }}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newB = { id: `sb-${Date.now()}`, text: '' };
                            handleStateChange({
                              ...state,
                              spirituality: {
                                ...state.spirituality,
                                beliefs: [...state.spirituality.beliefs, newB]
                              }
                            });
                          }}
                          className="text-[10px] text-zinc-600 hover:text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1 pt-1.5"
                        >
                          <Plus className="h-3 w-3" /> Adicionar crença
                        </button>
                      </div>

                      {/* Son of God Extra Statement */}
                      <div className="pt-3 border-t border-zinc-900/50">
                        <input
                          type="text"
                          value={state.spirituality.sonOfGodText || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            spirituality: { ...state.spirituality, sonOfGodText: e.target.value }
                          })}
                          className="bg-transparent border-none text-xs text-zinc-300 font-serif font-semibold w-full focus:outline-none focus:bg-zinc-900/20 px-2 py-1 rounded placeholder-zinc-700"
                          placeholder="Escreva sua afirmação de identidade..."
                        />
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400"
                        alt="Classic art artwork"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Custom Divider */}
                  <div className="py-6 text-center select-none text-zinc-800 text-[10px] tracking-[0.8em] font-light">
                    ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡
                  </div>
                </div>

                {/* 2. Objetivos Section */}
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-[#9f6e49] font-mono">⪡</span>
                      Defina um objetivo espiritual.
                      <span className="text-[#9f6e49] font-mono">⪢</span>
                    </h3>
                    <p className="text-[11px] font-serif italic text-[#c38d67]/80 max-w-2xl mx-auto leading-relaxed">
                      ♢ harmonia com si mesmo e com o mundo, ficar mais próximo de Deus , não julgar os outros, achar felicidade nas coisas simples etc.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1617503752587-98923ced7000?q=80&w=400"
                        alt="Angel sketch drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Objectives List */}
                    <div className="lg:col-span-6 space-y-2">
                      <div className="space-y-1">
                        {(state.spirituality.objectives || []).map((objective, idx) => (
                          <div key={objective.id || idx} className="flex items-center gap-2 border-b border-zinc-900/40 py-2 group">
                            <span className="text-[#c38d67] text-lg select-none leading-none">•</span>
                            <input
                              type="text"
                              value={objective.text || ''}
                              onChange={(e) => {
                                const updated = (state.spirituality.objectives || []).map(o => o.id === objective.id ? { ...o, text: e.target.value } : o);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, objectives: updated }
                                });
                              }}
                              className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none w-full font-serif leading-relaxed py-0.5"
                              placeholder="Vazio"
                            />
                            <button
                              onClick={() => {
                                const updated = (state.spirituality.objectives || []).filter(o => o.id !== objective.id);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, objectives: updated }
                                });
                              }}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newObj = { id: `so-${Date.now()}`, text: '' };
                            handleStateChange({
                              ...state,
                              spirituality: {
                                ...state.spirituality,
                                objectives: [...(state.spirituality.objectives || []), newObj]
                              }
                            });
                          }}
                          className="text-[10px] text-zinc-600 hover:text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1 pt-1.5"
                        >
                          <Plus className="h-3 w-3" /> Adicionar objetivo
                        </button>
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=400"
                        alt="Crucifixion sketch drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Custom Divider */}
                  <div className="py-6 text-center select-none text-zinc-800 text-[10px] tracking-[0.8em] font-light">
                    ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡
                  </div>
                </div>

                {/* 3. Hábitos Section */}
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-[#9f6e49] font-mono">⪡</span>
                      Escolha um hábito diário que fomente seu lado espiritual.
                      <span className="text-[#9f6e49] font-mono">⪢</span>
                    </h3>
                    <p className="text-[11px] font-serif italic text-[#c38d67]/80 max-w-2xl mx-auto leading-relaxed">
                      ♢ meditação, oração, perdão, simplificar sua vida, abdicar de prazeres momentâneos, ficar mais em contato com a natureza, ...
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=400"
                        alt="Prayers drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Habits Checklist */}
                    <div className="lg:col-span-6 space-y-2">
                      <div className="space-y-1.5">
                        {state.spirituality.habits.map((habit, idx) => (
                          <div
                            key={habit.id}
                            onClick={() => {
                              const updated = state.spirituality.habits.map(h => {
                                if (h.id === habit.id) {
                                  const next = !h.checked;
                                  if (next) triggerReward(habit.xpReward || 15, `Hábito: ${habit.label} concluído!`);
                                  return { ...h, checked: next };
                                }
                                return h;
                              });
                              handleStateChange({
                                ...state,
                                spirituality: { ...state.spirituality, habits: updated }
                              });
                            }}
                            className={`flex items-center gap-3 border-b border-zinc-900/40 py-2 cursor-pointer group transition-all ${
                              habit.checked ? 'text-zinc-500 line-through' : 'text-zinc-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                              habit.checked 
                                ? 'bg-amber-500 border-amber-500 text-zinc-950' 
                                : 'border-zinc-800 bg-zinc-950 text-transparent'
                            }`}>
                              <Check className="h-3 w-3 stroke-[3px]" />
                            </div>
                            
                            <input
                              type="text"
                              value={habit.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const updated = state.spirituality.habits.map(h => h.id === habit.id ? { ...h, label: e.target.value } : h);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, habits: updated }
                                });
                              }}
                              className="bg-transparent border-none text-xs focus:outline-none w-full font-serif leading-relaxed py-0.5"
                              placeholder="Vazio"
                            />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = state.spirituality.habits.filter(h => h.id !== habit.id);
                                handleStateChange({
                                  ...state,
                                  spirituality: { ...state.spirituality, habits: updated }
                                });
                              }}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newHab = {
                              id: `sh-${Date.now()}`,
                              label: '',
                              checked: false,
                              xpReward: 15
                            };
                            handleStateChange({
                              ...state,
                              spirituality: {
                                ...state.spirituality,
                                habits: [...state.spirituality.habits, newHab]
                              }
                            });
                          }}
                          className="text-[10px] text-zinc-600 hover:text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-1 pt-1.5"
                        >
                          <Plus className="h-3 w-3" /> Adicionar hábito
                        </button>
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1581084324492-c8076f130f86?q=80&w=400"
                        alt="Heaven sketch drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* Keep existing bottom components for feature completeness */}
                <LifeAreaStandardTopics
                  areaKey="spirituality"
                  state={state}
                  onChange={handleStateChange}
                  triggerReward={triggerReward}
                />
              </div>
            )}

            {/* 2. Corpo (Análise Corporal) */}
            {activeArea === 'body' && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden flex items-end p-6 border border-zinc-900">
                  <img 
                    src={AREA_DETAILS.body.bannerUrl} 
                    alt="Corpo" 
                    className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3.5 bg-zinc-900 border border-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-400 font-mono tracking-widest font-black uppercase">ANÁLISE CORPORAL</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">— Templo & Capacidade Física</h2>
                    </div>
                  </div>
                </div>

                {/* Notion Page Properties */}
                <div className="bg-zinc-950/20 border border-zinc-900 p-5 rounded-2xl space-y-3 font-sans">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    <Dumbbell className="h-4 w-4 text-emerald-400" />
                    <span>— Body</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4 pt-2">
                    {/* Important Property */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Star className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Important</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.body.important || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          body: { ...state.body, important: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* O que eu quero no futuro */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Compass className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">O que eu quero, n...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.body.whatIWantInFuture || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          body: { ...state.body, whatIWantInFuture: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* Por que eu quero */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Por que eu quero...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.body.whyIWant || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          body: { ...state.body, whyIWant: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-zinc-900/60 text-[11px] text-gray-500">
                    <button className="hover:text-zinc-300 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add a property
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button className="hover:text-zinc-300 transition-colors">
                      Ocultar 3 propriedades
                    </button>
                  </div>
                </div>

                {/* Custom Header Title */}
                <div className="text-center py-6 border-y border-zinc-900/80 my-2">
                  <h1 className="text-xl font-black text-white uppercase tracking-[0.25em] font-sans">
                    ANÁLISE CORPORAL
                  </h1>
                </div>

                {/* Column Layout: Meu Corpo Table & Simone Quote */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Tabela Meu Corpo */}
                  <div className="lg:col-span-7">
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Meu corpo</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Defina o status e percepções de seus principais atributos físicos.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 text-gray-500 font-mono text-[10px] uppercase">
                              <th className="py-2.5 font-normal">Name</th>
                              <th className="py-2.5 font-normal">Nota</th>
                              <th className="py-2.5 font-normal">Percepção</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { key: 'arms', label: 'Braços', icon: BicepsFlexed },
                              { key: 'legs', label: 'Pernas', icon: Footprints },
                              { key: 'stamina', label: 'Resistência', icon: HeartPulse },
                              { key: 'fat', label: 'Gordura', icon: Scale },
                              { key: 'strength', label: 'Força', icon: Zap }
                            ].map((attr) => {
                              const ratingVal = state.body.ratings[attr.key as keyof typeof state.body.ratings] || 1;
                              const perceptionVal = state.body.perceptions?.[attr.key as keyof typeof state.body.ratings] || 'Ruim';
                              const AttrIcon = attr.icon;
                              
                              return (
                                <tr key={attr.key} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors">
                                  <td className="py-3 font-bold text-zinc-300">
                                    <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                        <AttrIcon className="h-3.5 w-3.5" />
                                      </div>
                                      <span className="font-medium text-xs text-zinc-200">{attr.label}</span>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="flex gap-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() => {
                                            const updatedRatings = { ...state.body.ratings, [attr.key]: star };
                                            handleStateChange({
                                              ...state,
                                              body: { ...state.body, ratings: updatedRatings }
                                            });
                                          }}
                                          className={`p-0.5 hover:scale-110 transition-transform ${
                                            star <= ratingVal ? 'text-amber-400' : 'text-zinc-700'
                                          }`}
                                        >
                                          <Star className={`h-3.5 w-3.5 ${star <= ratingVal ? 'fill-amber-400' : ''}`} />
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      value={perceptionVal}
                                      onChange={(e) => {
                                        const updatedPerceptions = {
                                          ...(state.body.perceptions || {
                                            arms: 'Ruim',
                                            legs: 'Ruim',
                                            stamina: 'Ruim',
                                            fat: 'Ruim',
                                            strength: 'Ruim'
                                          }),
                                          [attr.key]: e.target.value
                                        };
                                        handleStateChange({
                                          ...state,
                                          body: { ...state.body, perceptions: updatedPerceptions }
                                        });
                                      }}
                                      className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none focus:bg-zinc-900/60 rounded px-2 py-1 w-full"
                                      placeholder="Ruim"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="pt-3 text-[10px] font-mono text-gray-500 uppercase flex justify-between border-t border-zinc-900">
                          <span>Contagem 5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quote & Marble Torso */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    {/* Simone Quote */}
                    <div className="p-5 bg-zinc-900/20 border-l-2 border-zinc-700 rounded-r-xl font-sans h-fit">
                      <p className="text-zinc-300 italic text-sm leading-relaxed">
                        "To lose confidence in one's body is to lose confidence in oneself."
                      </p>
                      <p className="text-right text-xs text-gray-500 font-mono mt-2">— Simone de Beauvoir</p>
                    </div>
                    
                    {/* Marble Torso Image */}
                    <div className="relative h-44 lg:h-full min-h-[12rem] rounded-2xl overflow-hidden border border-zinc-900 bg-black flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1608155686393-8fdd966d784d?q=80&w=600"
                        alt="Sculpture Torso"
                        className="object-cover w-full h-full filter brightness-75 hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                  </div>

                </div>

                {/* Callout Prompt Banner */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl flex items-center gap-3.5 text-zinc-300 text-xs">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="font-sans">
                    Responda às perguntas e reflita sobre como seu corpo pode trazer a melhor versão de você à tona:
                  </p>
                </div>

                {/* Reflexions */}
                <div className="space-y-6">
                  
                  {/* Question 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Como você se sente atualmente sobre sua saúde e situação corporal?
                    </h4>
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex gap-3 items-start hover:border-zinc-800 transition-colors">
                      <div className="mt-0.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <HeartPulse className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={state.body.currentFeeling}
                          onChange={(e) => handleStateChange({
                            ...state,
                            body: { ...state.body, currentFeeling: e.target.value }
                          })}
                          rows={4}
                          className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none resize-y font-sans leading-relaxed"
                          placeholder="Escreva sua reflexão..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question 2 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Como você gostaria de se sentir sobre seu corpo no futuro?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4 h-48 rounded-2xl overflow-hidden border border-zinc-900 bg-black">
                        <img
                          src="https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?q=80&w=600"
                          alt="Ideal Back Sculpture"
                          className="object-cover w-full h-full filter brightness-75 hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="md:col-span-8 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex gap-3 items-start hover:border-zinc-800 transition-colors">
                        <div className="mt-0.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Target className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={state.body.futureFeeling}
                            onChange={(e) => handleStateChange({
                              ...state,
                              body: { ...state.body, futureFeeling: e.target.value }
                            })}
                            rows={8}
                            className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none resize-none font-sans leading-relaxed"
                            placeholder="Como gostaria de se sentir..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question 3 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Qual tipo de corpo você quer construir?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex gap-3 items-start hover:border-zinc-800 transition-colors">
                        <div className="mt-0.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={state.body.desiredBodyType}
                            onChange={(e) => handleStateChange({
                              ...state,
                              body: { ...state.body, desiredBodyType: e.target.value }
                            })}
                            rows={8}
                            className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none resize-y font-sans leading-relaxed"
                            placeholder="Qual tipo de corpo..."
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Adicione seu corpo ideal</span>
                          <div className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black mt-2">
                            {state.body.idealBodyImage ? (
                              <img
                                src={state.body.idealBodyImage}
                                alt="Corpo Ideal"
                                className="object-cover w-full h-full filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1 text-[10px]">
                                <Dumbbell className="h-5 w-5" />
                                <span>Sem Imagem</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={state.body.idealBodyImage || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              body: { ...state.body, idealBodyImage: e.target.value }
                            })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-emerald-500/40 text-white font-sans"
                            placeholder="Cole a URL da imagem ideal..."
                          />
                          <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span>Adicionar uma imagem</span>
                            <Plus className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Star Conquests Section */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">O que você gostaria de conquistar nessa área da vida?</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Defina 6 metas ou conquistas essenciais para esta área.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(state.body.conquests || []).map((conquest, idx) => (
                      <div
                        key={conquest.id || idx}
                        onClick={() => {
                          const updatedConquests = (state.body.conquests || []).map(c => {
                            if (c.id === conquest.id) {
                              const nextVal = !c.checked;
                              if (nextVal) triggerReward(30, `Meta Corporal Conquistada: ${c.text || 'Meta'}!`);
                              return { ...c, checked: nextVal };
                            }
                            return c;
                          });
                          handleStateChange({
                            ...state,
                            body: { ...state.body, conquests: updatedConquests }
                          });
                        }}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          conquest.checked
                            ? 'bg-amber-500/5 border-amber-500/20 text-zinc-300'
                            : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <button
                          className={`flex-shrink-0 transition-transform hover:scale-110 ${
                            conquest.checked ? 'text-amber-400' : 'text-zinc-700'
                          }`}
                        >
                          <Star className={`h-4.5 w-4.5 ${conquest.checked ? 'fill-amber-400' : ''}`} />
                        </button>
                        <input
                          type="text"
                          value={conquest.text || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const updatedConquests = (state.body.conquests || []).map(c => {
                              if (c.id === conquest.id) {
                                return { ...c, text: e.target.value };
                              }
                              return c;
                            });
                            handleStateChange({
                              ...state,
                              body: { ...state.body, conquests: updatedConquests }
                            });
                          }}
                          className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-full font-sans"
                          placeholder="Vazio"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities Section */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Que tipo de atividades físicas você se vê praticando?</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Atividades essenciais que você se vê realizando para manter o corpo em alta performance.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(state.body.activities || []).map((activity, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl flex items-center gap-3 transition-all"
                      >
                        <div className="p-2 bg-emerald-500/5 text-emerald-400 rounded-lg">
                          <Dumbbell className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          value={activity || ''}
                          onChange={(e) => {
                            const updatedActivities = [...(state.body.activities || [])];
                            updatedActivities[idx] = e.target.value;
                            handleStateChange({
                              ...state,
                              body: { ...state.body, activities: updatedActivities }
                            });
                          }}
                          className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-full font-sans"
                          placeholder="Ex: Musculação;"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact / Reasons Grid Section */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Quais são as razões mais importantes para eu estar em ótima forma?</h3>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Olhe para sua vida como um todo e pense: "Quais são as principais razões para eu melhorar meu corpo?" Agora pense em como melhorar seu corpo vai afetar positivamente as outras áreas da sua vida.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {(state.body.reasonsGrid || []).map((reason) => (
                      <div
                        key={reason.id}
                        onClick={() => {
                          const updatedGrid = (state.body.reasonsGrid || []).map(r => {
                            if (r.id === reason.id) {
                              return { ...r, checked: !r.checked };
                            }
                            return r;
                          });
                          handleStateChange({
                            ...state,
                            body: { ...state.body, reasonsGrid: updatedGrid }
                          });
                        }}
                        className={`p-4 rounded-xl border flex flex-col gap-3 justify-between cursor-pointer transition-all ${
                          reason.checked
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-200'
                            : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-mono tracking-wider uppercase font-black text-emerald-400">
                            {reason.label}
                          </span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            reason.checked
                              ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                              : 'border-zinc-800 bg-zinc-950 text-transparent'
                          }`}>
                            <Check className="h-2.5 w-2.5 stroke-[3.5px]" />
                          </div>
                        </div>

                        <textarea
                          value={reason.text || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const updatedGrid = (state.body.reasonsGrid || []).map(r => {
                              if (r.id === reason.id) {
                                return { ...r, text: e.target.value, checked: e.target.value.trim() !== '' };
                              }
                              return r;
                            });
                            handleStateChange({
                              ...state,
                              body: { ...state.body, reasonsGrid: updatedGrid }
                            });
                          }}
                          rows={3}
                          className="bg-transparent border-none text-xs text-zinc-300 focus:outline-none w-full font-sans resize-none leading-relaxed mt-1"
                          placeholder="Razão ou impacto..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 3. Mente (Minha Mente) */}
            {/* 3. Mente (Minha Mente) */}
            {activeArea === 'mind' && (
              <div className="space-y-8 font-sans pb-12">
                
                {/* Notion-style Page Header with icon and title */}
                <div className="space-y-4">
                  {/* Notion Page Icon and Title */}
                  <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all hover:scale-105">
                      <Brain className="h-7 w-7" />
                    </div>
                    <h1 className="text-4xl font-serif font-black text-white tracking-tight text-center">Minha mente</h1>
                  </div>

                  {/* Notion Page Properties card */}
                  <div className="max-w-2xl mx-auto bg-zinc-950/20 border border-zinc-900/60 p-5 rounded-2xl space-y-3 font-sans mt-4">
                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider pb-1.5 border-b border-zinc-900/40">
                      <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-[10px] text-zinc-950 font-bold font-serif shadow-sm">
                        M
                      </div>
                      <span>— Notion Page Properties</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4 pt-1">
                      {/* Important Property */}
                      <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                        <Star className="h-3.5 w-3.5 text-gray-600" />
                        <span className="w-32 shrink-0 font-medium">Important</span>
                      </div>
                      <div className="md:col-span-8">
                        <input
                          type="text"
                          value={state.mind.important || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            mind: { ...state.mind, important: e.target.value }
                          })}
                          className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                          placeholder="Vazio"
                        />
                      </div>

                      {/* O que eu quero no futuro */}
                      <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                        <Compass className="h-3.5 w-3.5 text-gray-600" />
                        <span className="w-32 shrink-0 font-medium">O que eu quero, n...</span>
                      </div>
                      <div className="md:col-span-8">
                        <input
                          type="text"
                          value={state.mind.whatIWantInFuture || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            mind: { ...state.mind, whatIWantInFuture: e.target.value }
                          })}
                          className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                          placeholder="Vazio"
                        />
                      </div>

                      {/* Por que eu quero */}
                      <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                        <HelpCircle className="h-3.5 w-3.5 text-gray-600" />
                        <span className="w-32 shrink-0 font-medium">Por que eu quero...</span>
                      </div>
                      <div className="md:col-span-8">
                        <input
                          type="text"
                          value={state.mind.whyIWant || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            mind: { ...state.mind, whyIWant: e.target.value }
                          })}
                          className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                          placeholder="Vazio"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table of Contents / Index Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl overflow-hidden p-4">
                  {/* Left: Geometric graphic */}
                  <div className="md:col-span-3 h-36 rounded-xl overflow-hidden relative border border-zinc-900">
                    <img 
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400" 
                      alt="Geometry" 
                      className="absolute inset-0 w-full h-full object-cover filter opacity-40 brightness-75 grayscale"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 to-transparent" />
                  </div>

                  {/* Middle: Index Links */}
                  <div className="md:col-span-6 flex flex-col justify-center px-4 space-y-1 text-xs">
                    <button onClick={() => document.getElementById('qualidades')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Quais são suas maiores qualidades?
                    </button>
                    <button onClick={() => document.getElementById('oportunidades')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Quais são minhas oportunidades de melhorar?
                    </button>
                    <button onClick={() => document.getElementById('fraquezas')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Quais são suas maiores fraquezas?
                    </button>
                    <button onClick={() => document.getElementById('objetivo-intelectual')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Pense num objetivo intelectual
                    </button>
                    <button onClick={() => document.getElementById('meditacao')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Exercício de meditação
                    </button>
                    <button onClick={() => document.getElementById('emocoes')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-zinc-400 hover:text-blue-400 transition-colors font-medium">
                      Entendendo suas emoções
                    </button>
                    <div className="pl-4 space-y-0.5 pt-0.5 text-[11px] text-zinc-500">
                      <div>— Uma emoção positiva que gostaria de cultivar</div>
                      <div>— Uma emoção negativa que gostaria de eliminar</div>
                    </div>
                  </div>

                  {/* Right: Cloud Quote */}
                  <div className="md:col-span-3 h-36 rounded-xl overflow-hidden relative border border-zinc-900 flex items-center justify-center p-4">
                    <img 
                      src="https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=400" 
                      alt="Clouds" 
                      className="absolute inset-0 w-full h-full object-cover filter opacity-30 brightness-75"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40" />
                    <div className="relative z-10 text-center space-y-1">
                      <p className="text-[10px] font-black text-white/90 tracking-widest leading-tight uppercase font-sans">SOMETIMES YOU WIN</p>
                      <p className="text-[10px] font-black text-blue-400/90 tracking-widest leading-tight uppercase font-sans">SOMETIMES YOU LEARN</p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Maiores Qualidades */}
                <div id="qualidades" className="space-y-4 pt-4 scroll-mt-6">
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight border-b border-zinc-900 pb-2">Quais são suas maiores qualidades?</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Tall Sunset Image on the Left */}
                    <div className="md:col-span-4 h-64 md:h-[240px] rounded-2xl overflow-hidden relative border border-zinc-900">
                      <img 
                        src="https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=400" 
                        alt="Sunset Sky" 
                        className="absolute inset-0 w-full h-full object-cover filter opacity-60 brightness-90 saturate-125"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    </div>

                    {/* Semicolon Qualities Editor */}
                    <div className="md:col-span-8">
                      <div className="text-[11px] text-zinc-500 font-medium italic mb-2 font-sans">
                        Seus traços cognitivos mais fortes e dons intelectuais:
                      </div>
                      <SemicolonListEditor 
                        value={state.mind.qualities}
                        onChange={(val) => handleStateChange({
                          ...state,
                          mind: { ...state.mind, qualities: val }
                        })}
                        placeholder="Adicionar qualidade..."
                        gridColsClass="grid-cols-1 sm:grid-cols-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Oportunidades de melhorar */}
                <div id="oportunidades" className="space-y-3 pt-4 scroll-mt-6">
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight border-b border-zinc-900 pb-2">Quais são minhas oportunidades de melhorar?</h2>
                  <div className="text-[11px] text-zinc-500 font-medium italic mb-2 font-sans">
                    Áreas de conhecimento ou hábitos de aprendizado a serem desenvolvidos:
                  </div>
                  <SemicolonListEditor 
                    value={state.mind.improvements}
                    onChange={(val) => handleStateChange({
                      ...state,
                      mind: { ...state.mind, improvements: val }
                    })}
                    placeholder="Adicionar oportunidade..."
                    gridColsClass="grid-cols-1 sm:grid-cols-2"
                  />
                </div>

                {/* Section 3: Maiores Fraquezas (3 Columns Layout as shown in the image) */}
                <div id="fraquezas" className="space-y-3 pt-4 scroll-mt-6">
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight border-b border-zinc-900 pb-2">Quais são suas maiores fraquezas?</h2>
                  <div className="text-[11px] text-zinc-500 font-medium italic mb-2 font-sans">
                    Vulnerabilidades intelectuais ou bloqueios cognitivos que precisam ser suprimidos:
                  </div>
                  <SemicolonListEditor 
                    value={state.mind.weaknesses}
                    onChange={(val) => handleStateChange({
                      ...state,
                      mind: { ...state.mind, weaknesses: val }
                    })}
                    placeholder="Adicionar fraqueza..."
                    gridColsClass="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  />
                </div>

                {/* Section 4: Objetivo Intelectual Board */}
                <div id="objetivo-intelectual" className="space-y-6 pt-6 scroll-mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-2">
                    <h2 className="text-xl font-serif font-bold text-white tracking-tight">Pense num objetivo intelectual</h2>
                    
                    <button
                      onClick={() => {
                        const newGoalId = `mg-${Date.now()}`;
                        const newG = {
                          id: newGoalId,
                          label: 'Novo objetivo intelectual',
                          checked: false,
                          actions: []
                        };
                        handleStateChange({
                          ...state,
                          mind: {
                            ...state.mind,
                            intellectualGoals: [...state.mind.intellectualGoals, newG]
                          }
                        });
                        triggerReward(15, 'Novo objetivo intelectual cadastrado!');
                      }}
                      className="text-xs bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 font-bold shadow-sm shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add a new Goal
                    </button>
                  </div>

                  {/* Mail Instruction Alert Block */}
                  <div className="bg-blue-950/10 border border-blue-900/30 rounded-2xl p-4 flex gap-3.5 items-start">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-300 italic tracking-wide font-sans">
                        Escreva tudo que você precisa fazer para atingir esse objetivo. Não procrastine. FAÇA O QUE TEM QUE FAZER
                      </p>
                    </div>
                  </div>

                  {/* Goals Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {state.mind.intellectualGoals.map((goal, idx) => (
                      <div 
                        key={goal.id} 
                        className={`bg-[#12131a]/70 border ${goal.checked ? 'border-blue-500/40 bg-blue-500/[0.03]' : 'border-zinc-900'} rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all`}
                      >
                        <div className="space-y-4">
                          {/* Goal Column Title Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {/* Goal Checkbox / Bullet button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextChecked = !goal.checked;
                                  const updated = state.mind.intellectualGoals.map(g => 
                                    g.id === goal.id ? { ...g, checked: nextChecked } : g
                                  );
                                  if (nextChecked) triggerReward(15, `Objetivo Intelectual Concluído: ${goal.label}!`);
                                  handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                }}
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center font-bold font-mono shrink-0 shadow-inner transition-all cursor-pointer ${
                                  goal.checked
                                    ? 'bg-blue-500 border-blue-500 text-zinc-950 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                                    : 'border-blue-500/30 hover:border-blue-400 bg-blue-500/10 text-blue-400'
                                }`}
                                title={goal.checked ? 'Objetivo concluído (clique para reabrir)' : 'Marcar objetivo como concluído'}
                              >
                                {goal.checked ? (
                                  <Check className="h-3 w-3 stroke-[3]" />
                                ) : (
                                  <span className="text-[10px]">{idx + 1}</span>
                                )}
                              </button>
                              <input
                                type="text"
                                value={goal.label}
                                onChange={(e) => {
                                  const updated = state.mind.intellectualGoals.map(g => g.id === goal.id ? { ...g, label: e.target.value } : g);
                                  handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                }}
                                className={`flex-1 bg-transparent border-none text-xs font-black text-white focus:outline-none focus:ring-0 p-0 font-sans tracking-wide truncate focus:bg-zinc-900/40 rounded px-1 py-0.5 ${goal.checked ? 'line-through text-zinc-400' : ''}`}
                                placeholder="Título do objetivo..."
                              />
                            </div>
                            
                            <button
                              onClick={() => {
                                const updated = state.mind.intellectualGoals.filter(g => g.id !== goal.id);
                                handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                triggerReward(5, 'Objetivo intelectual excluído.');
                              }}
                              className="text-zinc-600 hover:text-red-500 p-1 rounded hover:bg-zinc-900/50 transition-colors shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* "Adicione nova ação" dashed button */}
                          <button
                            onClick={() => {
                              const newActionId = `mga-${Date.now()}`;
                              const newAct = { id: newActionId, label: 'Nova ação;', checked: false };
                              const updated = state.mind.intellectualGoals.map(g => {
                                if (g.id === goal.id) {
                                  return {
                                    ...g,
                                    actions: [...(g.actions || []), newAct]
                                  };
                                }
                                return g;
                              });
                              handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                            }}
                            className="text-[10px] text-zinc-500 hover:text-blue-400 font-mono tracking-wider uppercase flex items-center gap-1.5 transition-colors border border-dashed border-zinc-900 hover:border-zinc-800 rounded-xl px-3 py-2 w-full justify-center bg-zinc-950/20"
                          >
                            <Plus className="h-3 w-3" /> Adicione nova ação
                          </button>

                          {/* Checklist items */}
                          <div className="space-y-2">
                            {(goal.actions || []).map((action) => (
                              <div 
                                key={action.id} 
                                className={`flex items-center gap-2.5 group p-1.5 rounded-xl border transition-all ${
                                  action.checked
                                    ? 'bg-zinc-950/60 border-zinc-900/60'
                                    : 'hover:bg-zinc-950/50 border-transparent hover:border-zinc-900/40'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = state.mind.intellectualGoals.map(g => {
                                      if (g.id === goal.id) {
                                        const updatedActions = (g.actions || []).map(act => {
                                          if (act.id === action.id) {
                                            const next = !act.checked;
                                            if (next) triggerReward(10, `Ação Concluída: ${action.label}`);
                                            return { ...act, checked: next };
                                          }
                                          return act;
                                        });
                                        return { ...g, actions: updatedActions };
                                      }
                                      return g;
                                    });
                                    handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                  }}
                                  className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    action.checked
                                      ? 'bg-blue-500 border-blue-500 text-zinc-950 shadow-[0_0_8px_rgba(59,130,246,0.35)]'
                                      : 'border-zinc-700 hover:border-blue-500/80 bg-zinc-950 text-transparent'
                                  }`}
                                  title={action.checked ? 'Marcar como pendente' : 'Marcar como concluída'}
                                >
                                  {action.checked && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>
                                <input
                                  type="text"
                                  value={action.label}
                                  onChange={(e) => {
                                    const updated = state.mind.intellectualGoals.map(g => {
                                      if (g.id === goal.id) {
                                        const updatedActions = (g.actions || []).map(act => act.id === action.id ? { ...act, label: e.target.value } : act);
                                        return { ...g, actions: updatedActions };
                                      }
                                      return g;
                                    });
                                    handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                  }}
                                  className={`flex-1 bg-transparent border-none text-[11px] focus:outline-none focus:ring-0 p-0 font-sans text-zinc-300 focus:bg-zinc-900/40 rounded px-1 py-0.5 ${action.checked ? 'line-through text-zinc-500' : ''}`}
                                  placeholder="Descrição da ação..."
                                />
                                <button
                                  onClick={() => {
                                    const updated = state.mind.intellectualGoals.map(g => {
                                      if (g.id === goal.id) {
                                        const updatedActions = (g.actions || []).filter(act => act.id !== action.id);
                                        return { ...g, actions: updatedActions };
                                      }
                                      return g;
                                    });
                                    handleStateChange({ ...state, mind: { ...state.mind, intellectualGoals: updated } });
                                  }}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-700 hover:text-red-500 p-0.5 rounded transition-all shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {(goal.actions || []).length === 0 && (
                              <p className="text-[10px] text-zinc-600 italic text-center py-2">Sem ações cadastradas</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {state.mind.intellectualGoals.length === 0 && (
                      <div className="col-span-full bg-zinc-950/20 border border-dashed border-zinc-900 p-8 rounded-2xl text-center text-zinc-500 text-xs">
                        Nenhum objetivo cadastrado. Clique no botão "Add a new Goal" acima para começar!
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Exercício de Meditação */}
                <div id="meditacao" className="space-y-6 pt-6 scroll-mt-6">
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight border-b border-zinc-900 pb-2">Exercício de meditação</h2>
                  
                  {/* Mail Instruction Alert Block */}
                  <div className="bg-blue-950/10 border border-blue-500/30 rounded-2xl p-4 flex gap-3.5 items-start">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-blue-300 leading-relaxed font-sans">
                        Complete esse exercício para ter melhor entendimento da sua vida emocional. Da próxima vez que uma emoção aparecer na sua mente (pode ser "positiva" ou "negativa"), siga os seguintes passos:
                      </p>
                    </div>
                  </div>

                  {/* 2-Column Section layout (Coliseum picture + Steps 1-4) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Square vintage Coliseum photo */}
                    <div className="lg:col-span-4 h-64 lg:h-[280px] rounded-2xl overflow-hidden relative border border-zinc-900">
                      <img 
                        src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=500" 
                        alt="Vintage Amphitheatre" 
                        className="absolute inset-0 w-full h-full object-cover filter opacity-50 sepia contrast-125 brightness-90"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    </div>

                    {/* Right: Step cards 1 to 4 */}
                    <div className="lg:col-span-8 space-y-2 text-xs font-sans">
                      <div className="flex items-start gap-3 bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl text-zinc-300 leading-relaxed">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono shadow-sm">
                          1
                        </div>
                        <p>Ache um lugar quieto (idealmente isolado) e respire fundo por 10 vezes</p>
                      </div>

                      <div className="flex items-start gap-3 bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl text-zinc-300 leading-relaxed">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono shadow-sm">
                          2
                        </div>
                        <p>Pergunte para si mesmo - "O que eu estou sentindo agora?" Tente dar um nome para a emoção. É raiva, descontentamento, ciúmes - talvez alegria ou esperança?</p>
                      </div>

                      <div className="flex items-start gap-3 bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl text-zinc-300 leading-relaxed">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono shadow-sm">
                          3
                        </div>
                        <p>Aceite o seu sentimento pelo o que ele é; não reaja ao sentimento. Saiba que é normal sentir emoções. Todas as emoções são necessárias. Você não pode controlar o que sente mas pode controlar sua reação.</p>
                      </div>

                      <div className="flex items-start gap-3 bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl text-zinc-300 leading-relaxed">
                        <div className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono shadow-sm">
                          4
                        </div>
                        <p>Respire fundo mais algumas vezes, e continue em silêncio e tente aceitar seus sentimentos até que eles se tornem algo novo ou desapareçam.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 - Registration thoughts (Wide textarea on left, water ripple picture on right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                    {/* Textarea reflection box */}
                    <div className="lg:col-span-8 bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono shadow-sm">
                          5
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">Registre aqui seus pensamentos para reflexões futuras</span>
                      </div>
                      
                      <textarea
                        value={state.mind.meditationThoughts || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          mind: { ...state.mind, meditationThoughts: e.target.value }
                        })}
                        placeholder="Escreva suas reflexões emocionais e insights do exercício de meditação..."
                        rows={5}
                        className="w-full bg-zinc-950/60 border border-zinc-900 rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/40 font-sans mt-2 resize-none"
                      />
                    </div>

                    {/* Right: Square Ocean ripples image */}
                    <div className="lg:col-span-4 h-full min-h-[160px] rounded-2xl overflow-hidden relative border border-zinc-900 hidden lg:block">
                      <img 
                        src="https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400" 
                        alt="Ocean Ripples" 
                        className="absolute inset-0 w-full h-full object-cover filter opacity-50 brightness-75 animate-pulse"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>

                {/* Section 6: Entendendo suas emoções */}
                <div id="emocoes" className="space-y-6 pt-6 scroll-mt-6">
                  <h2 className="text-xl font-serif font-bold text-white tracking-tight border-b border-zinc-900 pb-2">Entendendo suas emoções</h2>

                  {/* Mail Instruction Alert Block */}
                  <div className="bg-blue-950/10 border border-blue-500/30 rounded-2xl p-4 flex gap-3.5 items-start">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-blue-300 leading-relaxed font-sans">
                        Escolha uma emoção positiva para cultivar e uma emoção negativa para eliminar
                      </p>
                    </div>
                  </div>

                  {/* Bento Grid (Positive vs Negative Column) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left Column: Uma emoção positiva que gostaria de cultivar */}
                    <div className="bg-blue-950/10 border border-blue-500/10 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-serif font-black text-white/95">Uma emoção positiva que gostaria de cultivar:</h3>
                      
                      {/* Emotion Title Input Card */}
                      <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                        <Smile className="h-4 w-4 text-blue-400 shrink-0" />
                        <input
                          type="text"
                          value={state.mind.posEmotionName || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            mind: { ...state.mind, posEmotionName: e.target.value }
                          })}
                          placeholder="Nome da emoção positiva (Ex: Gratidão)..."
                          className="bg-transparent border-none text-xs font-black text-blue-300 p-0 focus:outline-none focus:ring-0 w-full"
                        />
                      </div>

                      {/* Emotion Subquestions */}
                      <div className="space-y-4 pt-1 font-sans">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ O que essa emoção significa para mim?
                          </label>
                          <textarea
                            value={state.mind.posEmotionMeaning || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, posEmotionMeaning: e.target.value }
                            })}
                            rows={3}
                            placeholder="Descreva o significado desta emoção..."
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Como posso mudar minha vida para cultivar essa emoção?
                          </label>
                          <textarea
                            value={state.mind.posEmotionHowToCultivate || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, posEmotionHowToCultivate: e.target.value }
                            })}
                            rows={2}
                            placeholder="Ações ou rotinas para cultivar..."
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Quais são os gatilhos para essa emoção?
                          </label>
                          <textarea
                            value={state.mind.posEmotionTriggers || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, posEmotionTriggers: e.target.value }
                            })}
                            rows={3}
                            placeholder="Ex:&#10;1. Ver como uma situação poderia ter sido pior;&#10;2. Raros momentos de empatia;"
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Quais estratégias posso implementar para ter mais dessa emoção na minha vida?
                          </label>
                          <textarea
                            value={state.mind.posEmotionStrategies || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, posEmotionStrategies: e.target.value }
                            })}
                            rows={3}
                            placeholder="Ex:&#10;1. Agradecer;&#10;2. Meditar;&#10;3. Anotar em um diário;"
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Uma emoção negativa que gostaria de eliminar */}
                    <div className="bg-red-950/5 border border-red-900/10 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-serif font-black text-white/95">Uma emoção negativa que gostaria de eliminar:</h3>
                      
                      {/* Emotion Title Input Card */}
                      <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/30 p-3 rounded-xl">
                        <HelpCircle className="h-4 w-4 text-red-400 shrink-0" />
                        <input
                          type="text"
                          value={state.mind.negEmotionName || ''}
                          onChange={(e) => handleStateChange({
                            ...state,
                            mind: { ...state.mind, negEmotionName: e.target.value }
                          })}
                          placeholder="Nome da emoção negativa (Ex: Vergonha)..."
                          className="bg-transparent border-none text-xs font-black text-red-300 p-0 focus:outline-none focus:ring-0 w-full"
                        />
                      </div>

                      {/* Emotion Subquestions */}
                      <div className="space-y-4 pt-1 font-sans">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Como essa emoção está me afetando?
                          </label>
                          <textarea
                            value={state.mind.negEmotionEffect || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, negEmotionEffect: e.target.value }
                            })}
                            rows={3}
                            placeholder="Descreva o impacto negativo que ela traz..."
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Como posso mudar minha vida para suprimir essa emoção?
                          </label>
                          <textarea
                            value={state.mind.negEmotionHowToSuppress || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, negEmotionHowToSuppress: e.target.value }
                            })}
                            rows={2}
                            placeholder="Ações para mitigar ou suprimir..."
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Quais são os gatilhos para essa emoção?
                          </label>
                          <textarea
                            value={state.mind.negEmotionTriggers || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, negEmotionTriggers: e.target.value }
                            })}
                            rows={3}
                            placeholder="Ex:&#10;1. Ouvir o julgamento das outras pessoas;&#10;2. O desprezo dos outros;"
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-red-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-bold">
                            ✦ Quais estratégias posso implementar para ter menos dessa emoção na minha vida?
                          </label>
                          <textarea
                            value={state.mind.negEmotionStrategies || ''}
                            onChange={(e) => handleStateChange({
                              ...state,
                              mind: { ...state.mind, negEmotionStrategies: e.target.value }
                            })}
                            rows={3}
                            placeholder="Ex:&#10;1. Ter mais moral;&#10;2. Não ser permissivo com essas situações;"
                            className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-red-500/40 resize-none font-sans leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <LifeAreaStandardTopics
                  areaKey="mind"
                  state={state}
                  onChange={handleStateChange}
                  triggerReward={triggerReward}
                />
              </div>
            )}

            {/* 4. Vida Social */}
            {activeArea === 'social' && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden flex items-end p-6 border border-zinc-900">
                  <img 
                    src={AREA_DETAILS.social.bannerUrl} 
                    alt="Vida Social" 
                    className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3.5 bg-zinc-900 border border-pink-500/20 rounded-xl text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] text-pink-400 font-mono tracking-widest font-black uppercase">REDE DE VALORES</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">— Vida Social & Relações</h2>
                    </div>
                  </div>
                </div>

                {/* Notion Page Properties */}
                <div className="bg-zinc-950/20 border border-zinc-900 p-5 rounded-2xl space-y-3 font-sans">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    <div className="w-4 h-4 rounded bg-[#ec4899] flex items-center justify-center text-[10px] text-white font-bold font-serif shadow-sm">
                      S
                    </div>
                    <span>— Social Life</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 gap-x-4 pt-2">
                    {/* Important Property */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Star className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Important</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.social.important || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          social: { ...state.social, important: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* O que eu quero no futuro */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <Compass className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">O que eu quero, n...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.social.whatIWantInFuture || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          social: { ...state.social, whatIWantInFuture: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>

                    {/* Por que eu quero */}
                    <div className="md:col-span-4 flex items-center gap-2 text-gray-500 text-xs">
                      <HelpCircle className="h-3.5 w-3.5 text-gray-600" />
                      <span className="w-24 shrink-0 font-medium">Por que eu quero...</span>
                    </div>
                    <div className="md:col-span-8">
                      <input
                        type="text"
                        value={state.social.whyIWant || ''}
                        onChange={(e) => handleStateChange({
                          ...state,
                          social: { ...state.social, whyIWant: e.target.value }
                        })}
                        className="w-full bg-transparent border-none hover:bg-zinc-900/40 focus:bg-zinc-900/80 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-colors"
                        placeholder="Vazio"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-zinc-900/60 text-[11px] text-gray-500">
                    <button className="hover:text-zinc-300 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add a property
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button className="hover:text-zinc-300 transition-colors">
                      Ocultar 3 propriedades
                    </button>
                  </div>
                </div>

                {/* Centered Serif Header */}
                <div className="text-center py-6 border-y border-zinc-900/80 my-2">
                  <h1 className="text-3xl font-serif text-pink-400 uppercase tracking-[0.25em]">
                    Vida Social
                  </h1>
                </div>

                {/* 1. Relações Sociais Nucleares */}
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-pink-400 font-mono">⪡</span>
                      Defina as conexões que realmente importam e como vai nutrir cada laço.
                      <span className="text-pink-400 font-mono">⪢</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-[360px] rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400"
                        alt="Collaboration drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Relations List */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.social.relations.map((relation, rIdx) => (
                          <div key={relation.id} className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3 relative group">
                            <button
                              onClick={() => {
                                const updated = state.social.relations.filter(r => r.id !== relation.id);
                                handleStateChange({
                                  ...state,
                                  social: { ...state.social, relations: updated }
                                });
                              }}
                              className="absolute top-3 right-3 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-900 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>

                            <input
                              type="text"
                              value={relation.name}
                              onChange={(e) => {
                                const updated = state.social.relations.map(r => r.id === relation.id ? { ...r, name: e.target.value } : r);
                                handleStateChange({
                                  ...state,
                                  social: { ...state.social, relations: updated }
                                });
                              }}
                              className="bg-transparent border-none text-xs font-black text-white uppercase tracking-wider w-full focus:outline-none focus:bg-zinc-900/30 rounded py-0.5"
                            />
                            
                            <div className="space-y-1.5">
                              {relation.howToNurture.map((nurture) => (
                                <div
                                  key={nurture.id}
                                  onClick={() => {
                                    const updatedHow = relation.howToNurture.map(h => {
                                      if (h.id === nurture.id) {
                                        const next = !h.checked;
                                        if (next) triggerReward(10, `Nutriu contato com ${relation.name}!`);
                                        return { ...h, checked: next };
                                      }
                                      return h;
                                    });
                                    const updatedRelations = state.social.relations.map(r => {
                                      if (r.id === relation.id) return { ...r, howToNurture: updatedHow };
                                      return r;
                                    });
                                    handleStateChange({
                                      ...state,
                                      social: { ...state.social, relations: updatedRelations }
                                    });
                                  }}
                                  className={`flex items-center justify-between gap-2 text-[11px] cursor-pointer group/nurture p-1 rounded hover:bg-zinc-900/40 ${
                                    nurture.checked ? 'text-pink-400 line-through' : 'text-zinc-400 hover:text-zinc-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                                      nurture.checked ? 'bg-pink-500 border-pink-500 text-zinc-950' : 'border-zinc-800'
                                    }`}>
                                      <Check className="h-2.5 w-2.5 stroke-[4px]" />
                                    </div>
                                    <input
                                      type="text"
                                      value={nurture.label}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const updatedHow = relation.howToNurture.map(h => h.id === nurture.id ? { ...h, label: e.target.value } : h);
                                        const updatedRelations = state.social.relations.map(r => r.id === relation.id ? { ...r, howToNurture: updatedHow } : r);
                                        handleStateChange({
                                          ...state,
                                          social: { ...state.social, relations: updatedRelations }
                                        });
                                      }}
                                      className="bg-transparent border-none text-[11px] font-serif focus:outline-none py-0 w-full"
                                    />
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updatedHow = relation.howToNurture.filter(h => h.id !== nurture.id);
                                      const updatedRelations = state.social.relations.map(r => {
                                        if (r.id === relation.id) return { ...r, howToNurture: updatedHow };
                                        return r;
                                      });
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, relations: updatedRelations }
                                      });
                                    }}
                                    className="text-zinc-600 hover:text-red-500 p-0.5 rounded hover:bg-zinc-900 opacity-0 group-hover/nurture:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add Nurture Action */}
                            <div className="flex gap-1 pt-2 border-t border-zinc-800/40 mt-2">
                              <input
                               type="text"
                               value={newNurtureTexts[relation.id] || ''}
                               onChange={(e) => setNewNurtureTexts({
                                 ...newNurtureTexts,
                                 [relation.id]: e.target.value
                               })}
                               placeholder="Nova ação..."
                               className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-pink-500/40 text-white font-sans"
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const labelText = newNurtureTexts[relation.id]?.trim();
                                   if (!labelText) return;
                                   const newNurtureItem = {
                                     id: `srn-${relation.id}-${Date.now()}`,
                                     label: labelText,
                                     checked: false
                                   };
                                   const updatedRelations = state.social.relations.map(r => {
                                     if (r.id === relation.id) {
                                       return { ...r, howToNurture: [...r.howToNurture, newNurtureItem] };
                                     }
                                     return r;
                                   });
                                   handleStateChange({
                                     ...state,
                                     social: { ...state.social, relations: updatedRelations }
                                   });
                                   setNewNurtureTexts({
                                     ...newNurtureTexts,
                                     [relation.id]: ''
                                   });
                                   triggerReward(10, 'Nova ação adicionada!');
                                 }
                               }}
                              />
                              <button
                               onClick={() => {
                                 const labelText = newNurtureTexts[relation.id]?.trim();
                                 if (!labelText) return;
                                 const newNurtureItem = {
                                   id: `srn-${relation.id}-${Date.now()}`,
                                   label: labelText,
                                   checked: false
                                 };
                                 const updatedRelations = state.social.relations.map(r => {
                                   if (r.id === relation.id) {
                                     return { ...r, howToNurture: [...r.howToNurture, newNurtureItem] };
                                   }
                                   return r;
                                 });
                                 handleStateChange({
                                   ...state,
                                   social: { ...state.social, relations: updatedRelations }
                                 });
                                 setNewNurtureTexts({
                                   ...newNurtureTexts,
                                   [relation.id]: ''
                                 });
                                 triggerReward(10, 'Nova ação de cuidado adicionada!');
                               }}
                               className="bg-zinc-900 text-pink-400 border border-zinc-800 p-1 rounded hover:bg-zinc-800 text-[10px]"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add connection */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-900/60">
                        <input
                          type="text"
                          value={newRelationName}
                          onChange={(e) => setNewRelationName(e.target.value)}
                          placeholder="Adicionar nome de nova conexão principal..."
                          className="flex-1 bg-zinc-950/40 border border-zinc-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <button
                          onClick={() => {
                            if (!newRelationName.trim()) return;
                            const newRel: Relation = {
                              id: `sr-${Date.now()}`,
                              name: newRelationName.trim(),
                              howToNurture: [
                                { id: `srn-${Date.now()}-1`, label: 'Conversar/Ligar;', checked: false },
                                { id: `srn-${Date.now()}-2`, label: 'Ajudar;', checked: false }
                              ]
                            };
                            handleStateChange({
                              ...state,
                              social: { ...state.social, relations: [...state.social.relations, newRel] }
                            });
                            setNewRelationName('');
                            triggerReward(15, 'Nova relação cadastrada!');
                          }}
                          className="bg-zinc-950/60 text-pink-400 hover:text-white hover:bg-zinc-900 border border-zinc-900 px-4 rounded-xl text-xs font-black flex items-center gap-1 flex-shrink-0 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-[360px] rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400"
                        alt="Meeting sketch drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Custom Divider */}
                  <div className="py-6 text-center select-none text-zinc-800 text-[10px] tracking-[0.8em] font-light">
                    ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡
                  </div>
                </div>

                {/* 2. Esclareça Seus Valores Sociais */}
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-pink-400 font-mono">⪡</span>
                      Esclareça Seus Valores Sociais & Comportamentos a Eliminar
                      <span className="text-pink-400 font-mono">⪢</span>
                    </h3>
                    <p className="text-[11px] font-serif italic text-pink-400/80 max-w-2xl mx-auto leading-relaxed">
                      Defina as virtudes fundamentais do seu círculo social e os comportamentos prejudiciais que devem ser eliminados imediatamente.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-[300px] rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?q=80&w=400"
                        alt="Honesty drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Grid containing Values and Behaviors */}
                    <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left list: Valores Sociais */}
                      <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                          Valores Sociais
                        </h4>
                        
                        <div className="space-y-1.5">
                          {state.social.values.map((v) => (
                            <div
                              key={v.id}
                              onClick={() => {
                                const updated = state.social.values.map(val => val.id === v.id ? { ...val, checked: !val.checked } : val);
                                handleStateChange({
                                  ...state,
                                  social: { ...state.social, values: updated }
                                });
                              }}
                              className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition-all relative group/val ${
                                v.checked ? 'bg-pink-500/5 border-pink-500/20 text-zinc-300 font-bold' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs w-full">
                                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                  v.checked ? 'bg-pink-500 border-pink-500 text-zinc-950' : 'border-zinc-800'
                                }`}>
                                  <Check className="h-2.5 w-2.5 stroke-[4px]" />
                                </div>
                                <input
                                  type="text"
                                  value={v.label}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const updated = state.social.values.map(val => val.id === v.id ? { ...val, label: e.target.value } : val);
                                    handleStateChange({
                                      ...state,
                                      social: { ...state.social, values: updated }
                                    });
                                  }}
                                  className="bg-transparent border-none text-xs font-serif focus:outline-none py-0 w-full"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = state.social.values.filter(val => val.id !== v.id);
                                  handleStateChange({
                                    ...state,
                                    social: { ...state.social, values: updated }
                                  });
                                }}
                                className="text-zinc-600 hover:text-red-500 p-0.5 rounded opacity-0 group-hover/val:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Value */}
                        <div className="flex gap-2 pt-2 border-t border-zinc-900/60 mt-2">
                          <input
                            type="text"
                            value={newValueText}
                            onChange={(e) => setNewValueText(e.target.value)}
                            placeholder="Ex: Lealdade;..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-pink-500/40 text-white font-sans"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (!newValueText.trim()) return;
                                const newVal = {
                                  id: `sv-${Date.now()}`,
                                  label: newValueText.trim(),
                                  checked: true
                                };
                                handleStateChange({
                                  ...state,
                                  social: {
                                    ...state.social,
                                    values: [...state.social.values, newVal]
                                  }
                                });
                                setNewValueText('');
                                triggerReward(10, 'Novo valor adicionado!');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!newValueText.trim()) return;
                              const newVal = {
                                id: `sv-${Date.now()}`,
                                label: newValueText.trim(),
                                checked: true
                              };
                              handleStateChange({
                                ...state,
                                social: {
                                  ...state.social,
                                  values: [...state.social.values, newVal]
                                }
                              });
                              setNewValueText('');
                              triggerReward(10, 'Novo valor social cadastrado!');
                            }}
                            className="bg-zinc-900 text-pink-400 border border-zinc-800 p-1 rounded hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right list: Comportamentos a eliminar */}
                      <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-zinc-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Comportamentos a Eliminar
                        </h4>
                        
                        <div className="space-y-1.5">
                          {(state.social.behaviorsToAvoid || []).map((b) => (
                            <div
                              key={b.id}
                              onClick={() => {
                                const updated = (state.social.behaviorsToAvoid || []).map(val => val.id === b.id ? { ...val, checked: !val.checked } : val);
                                handleStateChange({
                                  ...state,
                                  social: { ...state.social, behaviorsToAvoid: updated }
                                });
                              }}
                              className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition-all relative group/beh ${
                                b.checked ? 'bg-red-500/5 border-red-500/20 text-zinc-300 line-through' : 'bg-zinc-900/40 border-zinc-900 text-zinc-500'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs w-full">
                                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                  b.checked ? 'bg-red-500 border-red-500 text-zinc-950' : 'border-zinc-800'
                                }`}>
                                  <Check className="h-2.5 w-2.5 stroke-[4px]" />
                                </div>
                                <input
                                  type="text"
                                  value={b.label}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const updated = (state.social.behaviorsToAvoid || []).map(val => val.id === b.id ? { ...val, label: e.target.value } : val);
                                    handleStateChange({
                                      ...state,
                                      social: { ...state.social, behaviorsToAvoid: updated }
                                    });
                                  }}
                                  className="bg-transparent border-none text-xs font-serif focus:outline-none py-0 w-full"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = (state.social.behaviorsToAvoid || []).filter(val => val.id !== b.id);
                                  handleStateChange({
                                    ...state,
                                    social: { ...state.social, behaviorsToAvoid: updated }
                                  });
                                }}
                                className="text-zinc-600 hover:text-red-500 p-0.5 rounded opacity-0 group-hover/beh:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Behavior to avoid */}
                        <div className="flex gap-2 pt-2 border-t border-zinc-900/60 mt-2">
                          <input
                            type="text"
                            value={newAvoidBehaviorText}
                            onChange={(e) => setNewAvoidBehaviorText(e.target.value)}
                            placeholder="Ex: Falsidade;..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-red-500/40 text-white font-sans"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (!newAvoidBehaviorText.trim()) return;
                                const newBeh = {
                                  id: `ba-${Date.now()}`,
                                  label: newAvoidBehaviorText.trim(),
                                  checked: true
                                };
                                handleStateChange({
                                  ...state,
                                  social: {
                                    ...state.social,
                                    behaviorsToAvoid: [...(state.social.behaviorsToAvoid || []), newBeh]
                                  }
                                });
                                setNewAvoidBehaviorText('');
                                triggerReward(10, 'Novo comportamento indesejado cadastrado!');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (!newAvoidBehaviorText.trim()) return;
                              const newBeh = {
                                id: `ba-${Date.now()}`,
                                label: newAvoidBehaviorText.trim(),
                                checked: true
                              };
                              handleStateChange({
                                ...state,
                                social: {
                                  ...state.social,
                                  behaviorsToAvoid: [...(state.social.behaviorsToAvoid || []), newBeh]
                                }
                              });
                              setNewAvoidBehaviorText('');
                              triggerReward(10, 'Novo comportamento cadastrado!');
                            }}
                            className="bg-zinc-900 text-red-400 border border-zinc-800 p-1 rounded hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-[300px] rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400"
                        alt="Ethics drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Custom Divider */}
                  <div className="py-6 text-center select-none text-zinc-800 text-[10px] tracking-[0.8em] font-light">
                    ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡
                  </div>
                </div>

                {/* 3. Melhore a Qualidade da Sua Rede Social */}
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-pink-400 font-mono">⪡</span>
                      Melhore a qualidade da sua rede social
                      <span className="text-pink-400 font-mono">⪢</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400"
                        alt="Friendship drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Central Quality Control Panels */}
                    <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Panel 1: Dedicate Time */}
                      <div className="space-y-3 bg-zinc-950/20 border border-zinc-900 p-5 rounded-2xl">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider leading-snug">
                          Quem merece mais do seu tempo?
                        </h4>
                        <p className="text-[10px] text-gray-500 italic">
                          (Dedique tempo e energia a essas pessoas)
                        </p>
                        
                        <div className="space-y-2 pt-2">
                          {(state.social.dedicateTimeList || ['', '', '']).map((item, idx) => (
                            <div key={`dt-${idx}`} className="flex items-center gap-2 border-b border-zinc-900/60 pb-1">
                              <span className="text-pink-400 font-mono text-[10px] select-none">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const list = [...(state.social.dedicateTimeList || ['', '', ''])];
                                  list[idx] = e.target.value;
                                  handleStateChange({
                                    ...state,
                                    social: { ...state.social, dedicateTimeList: list }
                                  });
                                }}
                                placeholder="Digite um nome..."
                                className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-full font-serif"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Panel 2: Motivators */}
                      <div className="space-y-3 bg-zinc-950/20 border border-zinc-900 p-5 rounded-2xl">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider leading-snug">
                          Quem te motiva?
                        </h4>
                        <p className="text-[10px] text-gray-500 italic">
                          (Gaste tempo com pessoas que te motivam a crescer)
                        </p>
                        
                        <div className="space-y-2 pt-2">
                          {(state.social.motivatorsList || ['', '', '']).map((item, idx) => (
                            <div key={`mot-${idx}`} className="flex items-center gap-2 border-b border-zinc-900/60 pb-1">
                              <span className="text-pink-400 font-mono text-[10px] select-none">#{idx + 1}</span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const list = [...(state.social.motivatorsList || ['', '', ''])];
                                  list[idx] = e.target.value;
                                  handleStateChange({
                                    ...state,
                                    social: { ...state.social, motivatorsList: list }
                                  });
                                }}
                                placeholder="Digite um nome..."
                                className="bg-transparent border-none text-xs text-zinc-200 focus:outline-none w-full font-serif"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Sketch Image */}
                    <div className="lg:col-span-3 h-64 rounded-2xl overflow-hidden border border-zinc-900 bg-black/40">
                      <img
                        src="https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5c?q=80&w=400"
                        alt="Mentor sketch drawing"
                        className="object-cover w-full h-full filter hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'sepia(0.4) brightness(0.85) contrast(1.1)' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Custom Divider */}
                  <div className="py-6 text-center select-none text-zinc-800 text-[10px] tracking-[0.8em] font-light">
                    ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡
                  </div>
                </div>

                {/* 4. Mentores Mundiais & Influenciadores de Apoio */}
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="text-pink-400 font-mono">⪡</span>
                      Crie uma Lista de Mentores de Nível Mundial & Canais de Apoio
                      <span className="text-pink-400 font-mono">⪢</span>
                    </h3>
                    <p className="text-[11px] font-serif italic text-pink-400/80 max-w-2xl mx-auto leading-relaxed">
                      Siga o exemplo de mentes consolidadas globalmente e filtre o conteúdo consumido de influenciadores para apoiar sua mentalidade de sucesso.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Side: Mentores de Nível Mundial */}
                    <div className="xl:col-span-5 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Mentores de Nível Mundial</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">Grandes mentes históricas ou contemporâneas cujos hábitos e conselhos você deve estudar.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-zinc-900 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                              <th className="py-2 pr-2">Nome / Mentor</th>
                              <th className="py-2 pr-2">Área de Atuação</th>
                              <th className="py-2 pr-2">Impacto</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.social.mentors.map((mentor) => (
                              <tr key={mentor.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition-colors">
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={mentor.name}
                                    onChange={(e) => {
                                      const updated = state.social.mentors.map(m => m.id === mentor.id ? { ...m, name: e.target.value } : m);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, mentors: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none font-bold text-white uppercase tracking-wider focus:outline-none w-full py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={mentor.area}
                                    onChange={(e) => {
                                      const updated = state.social.mentors.map(m => m.id === mentor.id ? { ...m, area: e.target.value } : m);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, mentors: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none text-zinc-400 focus:outline-none w-full py-0.5 font-serif"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <select
                                    value={mentor.impact}
                                    onChange={(e) => {
                                      const updated = state.social.mentors.map(m => m.id === mentor.id ? { ...m, impact: e.target.value as any } : m);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, mentors: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none text-[10px] font-mono font-bold text-pink-400 focus:outline-none focus:bg-zinc-900/50 rounded py-0.5"
                                  >
                                    <option value="Alto">Alto</option>
                                    <option value="Médio">Médio</option>
                                    <option value="Baixo">Baixo</option>
                                  </select>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => {
                                      const updated = state.social.mentors.filter(m => m.id !== mentor.id);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, mentors: updated }
                                      });
                                    }}
                                    className="text-zinc-600 hover:text-red-500 p-1 rounded hover:bg-zinc-900 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Mentor row form */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-900/60">
                        <input
                          type="text"
                          value={newMentorName}
                          onChange={(e) => setNewMentorName(e.target.value)}
                          placeholder="Nome..."
                          className="sm:col-span-2 bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <input
                          type="text"
                          value={newMentorArea}
                          onChange={(e) => setNewMentorArea(e.target.value)}
                          placeholder="Área..."
                          className="bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <button
                          onClick={() => {
                            if (!newMentorName.trim()) return;
                            const newM: Mentor = {
                              id: `sm-${Date.now()}`,
                              name: newMentorName.trim(),
                              area: newMentorArea.trim() || 'Geral',
                              impact: 'Alto'
                            };
                            handleStateChange({
                              ...state,
                              social: { ...state.social, mentors: [...state.social.mentors, newM] }
                            });
                            setNewMentorName('');
                            setNewMentorArea('');
                            triggerReward(20, 'Mentor adicionado com sucesso!');
                          }}
                          className="bg-zinc-900 text-pink-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Right Side: Canais de Apoio / Influenciadores de Conteúdo */}
                    <div className="xl:col-span-7 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Canais de Apoio & Influenciadores de Conteúdo</h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">Defina criadores de conteúdo que alinham com seu projeto de vida e que fornecem valor real às suas mídias.</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="border-b border-zinc-900 text-gray-500 font-mono text-[8px] uppercase tracking-wider">
                              <th className="py-2 pr-2">Categoria</th>
                              <th className="py-2 pr-2">Canais / Usernames</th>
                              <th className="py-2 pr-2">País</th>
                              <th className="py-2 pr-2">Assunto</th>
                              <th className="py-2 pr-2">Seguidores</th>
                              <th className="py-2 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(state.social.influencers || []).map((inf) => (
                              <tr key={inf.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition-colors">
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={inf.category}
                                    onChange={(e) => {
                                      const updated = (state.social.influencers || []).map(i => i.id === inf.id ? { ...i, category: e.target.value.toUpperCase() } : i);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none font-bold text-pink-400 focus:outline-none w-full py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 pr-2 max-w-[200px]">
                                  <textarea
                                    value={inf.usernames}
                                    onChange={(e) => {
                                      const updated = (state.social.influencers || []).map(i => i.id === inf.id ? { ...i, usernames: e.target.value } : i);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    rows={2}
                                    className="bg-transparent border-none text-zinc-300 focus:outline-none w-full font-serif text-[10px] resize-none leading-normal"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={inf.country || ''}
                                    onChange={(e) => {
                                      const updated = (state.social.influencers || []).map(i => i.id === inf.id ? { ...i, country: e.target.value } : i);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none text-zinc-400 focus:outline-none w-full py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={inf.topics || ''}
                                    onChange={(e) => {
                                      const updated = (state.social.influencers || []).map(i => i.id === inf.id ? { ...i, topics: e.target.value } : i);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none text-zinc-400 focus:outline-none w-full py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 pr-2">
                                  <input
                                    type="text"
                                    value={inf.followers || ''}
                                    onChange={(e) => {
                                      const updated = (state.social.influencers || []).map(i => i.id === inf.id ? { ...i, followers: e.target.value } : i);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    className="bg-transparent border-none font-mono text-[10px] text-zinc-500 focus:outline-none w-full py-0.5"
                                  />
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => {
                                      const updated = (state.social.influencers || []).filter(i => i.id !== inf.id);
                                      handleStateChange({
                                        ...state,
                                        social: { ...state.social, influencers: updated }
                                      });
                                    }}
                                    className="text-zinc-600 hover:text-red-500 p-1 rounded hover:bg-zinc-900 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add Influencer Row Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-2 border-t border-zinc-900/60">
                        <input
                          type="text"
                          value={newInfluencerCategory}
                          onChange={(e) => setNewInfluencerCategory(e.target.value)}
                          placeholder="Cat (Ex: FINANÇAS)..."
                          className="bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <input
                          type="text"
                          value={newInfluencerUsernames}
                          onChange={(e) => setNewInfluencerUsernames(e.target.value)}
                          placeholder="Usernames (separados por ||)..."
                          className="sm:col-span-2 bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <input
                          type="text"
                          value={newInfluencerCountry}
                          onChange={(e) => setNewInfluencerCountry(e.target.value)}
                          placeholder="País..."
                          className="bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <input
                          type="text"
                          value={newInfluencerTopics}
                          onChange={(e) => setNewInfluencerTopics(e.target.value)}
                          placeholder="Assunto..."
                          className="bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-pink-500/40 text-white font-sans"
                        />
                        <button
                          onClick={() => {
                            if (!newInfluencerCategory.trim() || !newInfluencerUsernames.trim()) return;
                            const newInf: InfluencerRow = {
                              id: `inf-${Date.now()}`,
                              category: newInfluencerCategory.toUpperCase().trim(),
                              usernames: newInfluencerUsernames.trim(),
                              country: newInfluencerCountry.trim() || 'Brasil',
                              topics: newInfluencerTopics.trim() || 'Geral',
                              followers: '100k+'
                            };
                            handleStateChange({
                              ...state,
                              social: { ...state.social, influencers: [...(state.social.influencers || []), newInf] }
                            });
                            setNewInfluencerCategory('');
                            setNewInfluencerUsernames('');
                            setNewInfluencerCountry('');
                            setNewInfluencerTopics('');
                            triggerReward(20, 'Influenciador cadastrado!');
                          }}
                          className="bg-zinc-900 text-pink-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                <LifeAreaStandardTopics
                  areaKey="social"
                  state={state}
                  onChange={handleStateChange}
                  triggerReward={triggerReward}
                />
              </div>
            )}

            {/* 5. Finanças & Carreira */}
            {activeArea === 'finances' && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden flex items-end p-6 border border-zinc-900">
                  <img 
                    src={AREA_DETAILS.finances.bannerUrl} 
                    alt="Finanças" 
                    className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3.5 bg-zinc-900 border border-yellow-500/20 rounded-xl text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] text-yellow-400 font-mono tracking-widest font-black uppercase">ABUNDÂNCIA E INTENCIONALIDADE</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">— Finanças & Carreira</h2>
                    </div>
                  </div>
                </div>

                {/* Properties list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl text-xs font-sans">
                  <div>
                    <span className="text-gray-500 block">Status:</span>
                    <span className="text-yellow-400 font-bold uppercase tracking-wider mt-1 block">✦ Abundância Estável</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Importância:</span>
                    <div className="flex gap-0.5 text-yellow-400 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            handleStateChange({
                              ...state,
                              finances: { ...state.finances, importance: s }
                            });
                          }}
                        >
                          <Star className={`h-3 w-3 ${s <= (state.finances.importance || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block">O que eu quero:</span>
                    <input
                      type="text"
                      value={state.finances.whatIWant}
                      onChange={(e) => handleStateChange({
                        ...state,
                        finances: { ...state.finances, whatIWant: e.target.value }
                      })}
                      className="bg-transparent border-b border-zinc-800 text-zinc-300 font-medium text-xs focus:outline-none focus:border-yellow-500/40 w-full mt-1"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Money Beliefs and Budgeting */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Três Principais Crenças */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Principais Diretrizes Financeiras</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Mantenha esses três mantras financeiros sempre visíveis e alinhados.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {state.finances.beliefs.map((belief, index) => (
                          <div key={index} className="p-3.5 bg-zinc-900/60 border border-zinc-900 rounded-xl flex items-start gap-3">
                            <span className="h-5 w-5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center font-mono font-black text-[10px] flex-shrink-0">
                              Top {index + 1}
                            </span>
                            <input
                              type="text"
                              value={belief}
                              onChange={(e) => {
                                const updated = [...state.finances.beliefs];
                                updated[index] = e.target.value;
                                handleStateChange({
                                  ...state,
                                  finances: { ...state.finances, beliefs: updated }
                                });
                              }}
                              className="flex-1 bg-transparent border-none text-zinc-300 focus:outline-none focus:border-b focus:border-zinc-800 text-xs font-sans"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gratidão e Abundância */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Gratidão & Destinação</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Defina seu orçamento intencional para as coisas que realmente te agregam.</p>
                      </div>

                      <div className="space-y-3">
                        {state.finances.budgetGoals.map((budget) => (
                          <div key={budget.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs">
                            <span className="font-bold text-zinc-300">{budget.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-mono">LIMITE MENSAL:</span>
                              <span className="text-white font-black font-mono">R$ {budget.amount}</span>
                              <button
                                onClick={() => {
                                  const updated = state.finances.budgetGoals.filter(b => b.id !== budget.id);
                                  handleStateChange({
                                    ...state,
                                    finances: { ...state.finances, budgetGoals: updated }
                                  });
                                }}
                                className="text-zinc-600 hover:text-red-500 ml-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Budget */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-900/60">
                        <input
                          type="text"
                          value={newBudgetCategory}
                          onChange={(e) => setNewBudgetCategory(e.target.value)}
                          placeholder="Ex: Jogos, Estudo, Saúde..."
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/40 text-white font-sans"
                        />
                        <input
                          type="number"
                          value={newBudgetAmount}
                          onChange={(e) => setNewBudgetAmount(parseInt(e.target.value) || 0)}
                          placeholder="Valor R$..."
                          className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/40 text-white font-mono"
                        />
                        <button
                          onClick={() => {
                            if (!newBudgetCategory.trim()) return;
                            const newB: BudgetGoal = {
                              id: `fb-${Date.now()}`,
                              category: newBudgetCategory.trim(),
                              amount: newBudgetAmount
                            };
                            handleStateChange({
                              ...state,
                              finances: { ...state.finances, budgetGoals: [...state.finances.budgetGoals, newB] }
                            });
                            setNewBudgetCategory('');
                            setNewBudgetAmount(100);
                            triggerReward(15, 'Destinação orçamentária definida!');
                          }}
                          className="bg-zinc-900 text-yellow-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-4 rounded-xl text-xs font-black flex items-center gap-1 flex-shrink-0 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Career Reflexion */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Reflexão de Carreira */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Reflexões de Carreira</h3>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'q3', label: 'O que realmente me motiva a criar?' },
                          { key: 'q4', label: 'Quero crescer em cargo de gestão ou especialista?' },
                          { key: 'q6', label: 'Como posso contribuir com as pessoas através do meu trabalho?' }
                        ].map((q) => (
                          <div key={q.key}>
                            <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{q.label}</label>
                            <textarea
                              value={state.finances.careerAnswers[q.key as keyof typeof state.finances.careerAnswers]}
                              onChange={(e) => {
                                const updatedAns = { ...state.finances.careerAnswers, [q.key]: e.target.value };
                                handleStateChange({
                                  ...state,
                                  finances: { ...state.finances, careerAnswers: updatedAns }
                                });
                              }}
                              rows={2}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-yellow-500/40 text-white font-sans resize-none mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preço a pagar */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Preço a Pagar</h3>
                      
                      <div>
                        <label className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Qual o preço para alcançar o topo da minha carreira?</label>
                        <textarea
                          value={state.finances.careerIdeal.priceToPay}
                          onChange={(e) => {
                            const updatedIdeal = { ...state.finances.careerIdeal, priceToPay: e.target.value };
                            handleStateChange({
                              ...state,
                              finances: { ...state.finances, careerIdeal: updatedIdeal }
                            });
                          }}
                          rows={3}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-yellow-500/40 text-white font-sans resize-none mt-1"
                        />
                      </div>

                      <div
                        onClick={() => {
                          const nextWill = !state.finances.careerIdeal.willingToPay;
                          if (nextWill) triggerReward(40, 'Compromisso de alta performance assumido!');
                          handleStateChange({
                            ...state,
                            finances: {
                              ...state.finances,
                              careerIdeal: { ...state.finances.careerIdeal, willingToPay: nextWill }
                            }
                          });
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          state.finances.careerIdeal.willingToPay 
                            ? 'bg-yellow-500/5 border-yellow-500/20 text-zinc-300' 
                            : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                          state.finances.careerIdeal.willingToPay ? 'bg-yellow-500 border-yellow-500 text-zinc-950' : 'border-zinc-800'
                        }`}>
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider font-sans text-yellow-500">Estou disposto a pagar este preço</span>
                      </div>
                    </div>

                  </div>

                </div>

                <LifeAreaStandardTopics
                  areaKey="finances"
                  state={state}
                  onChange={handleStateChange}
                  triggerReward={triggerReward}
                />
              </div>
            )}

            {/* 6. Entretenimento & Lazer */}
            {activeArea === 'entertainment' && (
              <div className="space-y-6">
                
                {/* Banner */}
                <div className="relative h-44 rounded-2xl overflow-hidden flex items-end p-6 border border-zinc-900">
                  <img 
                    src={AREA_DETAILS.entertainment.bannerUrl} 
                    alt="Entretenimento" 
                    className="absolute inset-0 w-full h-full object-cover filter grayscale opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3.5 bg-zinc-900 border border-purple-500/20 rounded-xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <Compass className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[9px] text-purple-400 font-mono tracking-widest font-black uppercase">RECOMPENSA DE ESFORÇO</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider mt-0.5">— Entretenimento & Tempo Offline</h2>
                    </div>
                  </div>
                </div>

                {/* Properties list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl text-xs font-sans">
                  <div>
                    <span className="text-gray-500 block">Status:</span>
                    <span className="text-purple-400 font-bold uppercase tracking-wider mt-1 block">✦ Lazer Equilibrado</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Divertimento da jornada (Lazer):</span>
                    <div className="flex gap-0.5 text-purple-400 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => {
                            handleStateChange({
                              ...state,
                              entertainment: { ...state.entertainment, balanceRating: star }
                            });
                          }}
                          className="hover:scale-110 transition-all"
                        >
                          <Star className={`h-3 w-3 ${star <= state.entertainment.balanceRating ? 'fill-purple-400 text-purple-400' : 'text-zinc-700'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Dica de Lazer:</span>
                    <span className="text-zinc-300 font-medium mt-1 block">Evite telas nas primeiras 2h do seu lazer.</span>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Stress Busters & Hobbies */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Desligar estresse */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">O que me desliga do estresse?</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Atividades intencionais de lazer saudável para limpar os receptores de dopamina.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {state.entertainment.stressBusters.map((buster) => (
                          <div
                            key={buster.id}
                            onClick={() => {
                              const updated = state.entertainment.stressBusters.map(b => {
                                if (b.id === buster.id) {
                                  const next = !b.checked;
                                  if (next) triggerReward(15, 'Lazer offline realizado!');
                                  return { ...b, checked: next };
                                }
                                return b;
                              });
                              handleStateChange({
                                ...state,
                                entertainment: { ...state.entertainment, stressBusters: updated }
                              });
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all relative group/buster ${
                              buster.checked 
                                ? 'bg-purple-500/5 border-purple-500/20 text-zinc-300' 
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                buster.checked ? 'bg-purple-500 border-purple-500 text-zinc-950' : 'border-zinc-800'
                              }`}>
                                <Check className="h-2.5 w-2.5 stroke-[4px]" />
                              </div>
                              <span className="text-xs font-bold font-sans">{buster.label}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = state.entertainment.stressBusters.filter(b => b.id !== buster.id);
                                handleStateChange({
                                  ...state,
                                  entertainment: { ...state.entertainment, stressBusters: updated }
                                });
                              }}
                              className="text-zinc-600 hover:text-red-500 p-0.5 rounded hover:bg-zinc-900 opacity-0 group-hover/buster:opacity-100 transition-opacity ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Stress Buster */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-900/60 mt-3">
                        <input
                          type="text"
                          value={newStressBusterText}
                          onChange={(e) => setNewStressBusterText(e.target.value)}
                          placeholder="Ex: Tocar violão, cozinhar..."
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500/40 text-white font-sans"
                        />
                        <button
                          onClick={() => {
                            if (!newStressBusterText.trim()) return;
                            const newBuster = {
                              id: `sb-${Date.now()}`,
                              label: newStressBusterText.trim(),
                              checked: false
                            };
                            handleStateChange({
                              ...state,
                              entertainment: {
                                ...state.entertainment,
                                stressBusters: [...state.entertainment.stressBusters, newBuster]
                              }
                            });
                            setNewStressBusterText('');
                            triggerReward(15, 'Nova atividade cadastrada!');
                          }}
                          className="bg-zinc-900 text-purple-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-4 rounded-xl text-xs font-black flex items-center gap-1 flex-shrink-0 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      </div>
                    </div>

                    {/* Wishlist */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Wishlist de Experiências & Prêmios</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Itens de recompensa ou viagens planejadas de longo prazo.</p>
                      </div>

                      <div className="space-y-2">
                        {state.entertainment.wishlist.map((wish) => (
                          <div
                            key={wish.id}
                            onClick={() => {
                              const updated = state.entertainment.wishlist.map(w => {
                                if (w.id === wish.id) {
                                  const next = !w.completed;
                                  if (next) triggerReward(50, `Conquista de Wishlist: ${wish.description}!`);
                                  return { ...w, completed: next };
                                }
                                return w;
                              });
                              handleStateChange({
                                ...state,
                                entertainment: { ...state.entertainment, wishlist: updated }
                              });
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all relative group/wish ${
                              wish.completed 
                                ? 'bg-purple-500/5 border-purple-500/20 text-zinc-500 line-through' 
                                : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                wish.completed ? 'bg-purple-500 border-purple-500 text-zinc-950' : 'border-zinc-800'
                              }`}>
                                <Check className="h-3 w-3 stroke-[3px]" />
                              </div>
                              <span className="text-xs font-sans font-medium">{wish.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-purple-400 font-bold">R$ {wish.cost}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = state.entertainment.wishlist.filter(w => w.id !== wish.id);
                                  handleStateChange({
                                    ...state,
                                    entertainment: { ...state.entertainment, wishlist: updated }
                                  });
                                }}
                                className="text-zinc-600 hover:text-red-500 p-0.5 rounded hover:bg-zinc-900 opacity-0 group-hover/wish:opacity-100 transition-opacity ml-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Wish */}
                      <div className="flex gap-2 pt-2 border-t border-zinc-900/60">
                        <input
                          type="text"
                          value={newWishDescription}
                          onChange={(e) => setNewWishDescription(e.target.value)}
                          placeholder="Nova viagem ou item de desejo..."
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500/40 text-white font-sans"
                        />
                        <input
                          type="number"
                          value={newWishCost}
                          onChange={(e) => setNewWishCost(parseInt(e.target.value) || 0)}
                          placeholder="Custo R$..."
                          className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500/40 text-white font-mono"
                        />
                        <button
                          onClick={() => {
                            if (!newWishDescription.trim()) return;
                            const newWish: WishItem = {
                              id: `ew-${Date.now()}`,
                              description: newWishDescription.trim(),
                              cost: newWishCost,
                              completed: false
                            };
                            handleStateChange({
                              ...state,
                              entertainment: { ...state.entertainment, wishlist: [...state.entertainment.wishlist, newWish] }
                            });
                            setNewWishDescription('');
                            setNewWishCost(100);
                            triggerReward(20, 'Desejo cadastrado na wishlist!');
                          }}
                          className="bg-zinc-900 text-purple-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 px-4 rounded-xl text-xs font-black flex items-center gap-1 flex-shrink-0 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Dynamic happiness quotes */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Balanço de lazer e bem-estar */}
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Palmtree className="h-4.5 w-4.5" />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">A Importância do Ócio Criativo</h3>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed italic pr-4 border-l border-zinc-800 pl-3">
                        "O ócio não é o tempo livre para fazer nada, mas sim a liberdade de escolher o que fazer em harmonia com sua mente."
                      </p>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-900 rounded-xl space-y-2">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-bold">AVALIAÇÃO DE LEVANTAMENTO</span>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300">Satisfação de Lazer</span>
                          <span className="text-xs font-mono font-black text-purple-400">{state.entertainment.balanceRating} / 5</span>
                        </div>

                        <div className="text-[10px] text-gray-500 pt-1.5 border-t border-zinc-900">
                          {state.entertainment.balanceRating >= 4 
                            ? 'Excelente! Seu tempo de lazer está bem planejado e nutrindo sua dopamina de forma saudável.' 
                            : 'Atenção: Você pode estar sob estresse excessivo. Considere bloquear algumas horas no final de semana exclusivamente para atividades sem telas.'}
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <LifeAreaStandardTopics
                  areaKey="entertainment"
                  state={state}
                  onChange={handleStateChange}
                  triggerReward={triggerReward}
                />
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
