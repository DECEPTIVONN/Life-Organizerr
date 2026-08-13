import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  AtSign, 
  Flame, 
  Zap, 
  Target, 
  Trophy, 
  Sparkles, 
  Shield, 
  Award, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Camera, 
  Check, 
  Save, 
  Activity, 
  BookOpen, 
  ChevronRight, 
  Info,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, DailyTask, FinanceEntry, Habit, RoutineItem } from '../types';

interface ProfileViewProps {
  userName: string;
  setUserName: (name: string) => void;
  userPhoto: string;
  setUserPhoto: (photo: string) => void;
  userHandle: string;
  setUserHandle: (handle: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userBio?: string;
  setUserBio?: (bio: string) => void;
  userArchetype?: string;
  setUserArchetype?: (archetype: string) => void;
  focusTrainingDate?: string;
  setFocusTrainingDate?: (date: string) => void;
  xpTotal: number;
  streak: number;
  level: number;
  addXp: (amount: number) => void;
  goals: Goal[];
  dailyTasks: DailyTask[];
  finances: FinanceEntry[];
  habits: Habit[];
  routine: RoutineItem[];
  onOpenStreakHub?: () => void;
  onOpenRankingModal?: () => void;
}

export default function ProfileView({
  userName,
  setUserName,
  userPhoto,
  setUserPhoto,
  userHandle,
  setUserHandle,
  userEmail,
  setUserEmail,
  userBio: propUserBio,
  setUserBio: propSetUserBio,
  userArchetype: propUserArchetype,
  setUserArchetype: propSetUserArchetype,
  focusTrainingDate: propFocusTrainingDate,
  setFocusTrainingDate: propSetFocusTrainingDate,
  xpTotal,
  streak,
  level,
  addXp,
  goals = [],
  dailyTasks = [],
  finances = [],
  habits = [],
  routine = [],
  onOpenStreakHub,
  onOpenRankingModal
}: ProfileViewProps) {
  // Bio state
  const [localBio, setLocalBio] = useState(() => {
    return localStorage.getItem('mbc_userBio') || 'Consistência diária gera evolução constante.';
  });
  const bio = propUserBio !== undefined ? propUserBio : localBio;
  const setBio = (newBio: string) => {
    if (propSetUserBio) propSetUserBio(newBio);
    setLocalBio(newBio);
  };
  
  // Custom archetype state
  const [localArchetype, setLocalArchetype] = useState(() => {
    return localStorage.getItem('mbc_userArchetype') || 'estrategista';
  });
  const activeArchetype = propUserArchetype !== undefined ? propUserArchetype : localArchetype;
  const setActiveArchetype = (newArch: string) => {
    if (propSetUserArchetype) propSetUserArchetype(newArch);
    setLocalArchetype(newArch);
  };

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editHandle, setEditHandle] = useState(userHandle);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editBio, setEditBio] = useState(bio);
  const [editPhoto, setEditPhoto] = useState(userPhoto);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync edit states when prop changes
  useEffect(() => {
    setEditBio(bio);
  }, [bio]);

  // Predefined avatars
  const avatarPresets = [
    { name: 'Foco Absoluto', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150' },
    { name: 'Guerreiro Focado', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150' },
    { name: 'Estrategista Calmo', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150' },
    { name: 'Estudioso Criativo', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=150' },
    { name: 'Mente Focada', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150' }
  ];

  // Archetype definitions
  const archetypes = [
    {
      id: 'estrategista',
      title: 'O Estrategista',
      desc: 'Focado em planejamento de longo prazo, metas claras e evolução estruturada.',
      quote: 'Planejar hoje garante a vitória de amanhã.',
      focus: 'Metas e Linhas do Tempo',
      icon: Target,
      color: 'from-orange-500 to-rose-500',
      activeBuff: 'Multiplicador de XP nas metas de evolução pessoal.'
    },
    {
      id: 'atleta',
      title: 'O Atleta',
      desc: 'Prioriza hábitos físicos e rotinas saudáveis. Foco total em consistência diária.',
      quote: 'O corpo e a mente trabalhando em harmonia e repetição.',
      focus: 'Hábitos e Rituais Físicos',
      icon: Activity,
      color: 'from-amber-500 to-orange-500',
      activeBuff: 'Consistência de hábitos gera bônus passivo de +5 XP.'
    },
    {
      id: 'construtor',
      title: 'O Construtor',
      desc: 'Altamente focado em tarefas de checklist diário e execução rápida das obrigações.',
      quote: 'Progresso é somatório diário de rituais cumpridos.',
      focus: 'Checklists e Rituais',
      icon: Shield,
      color: 'from-orange-600 to-red-500',
      activeBuff: 'Bônus de XP ao finalizar todo o checklist diário.'
    },
    {
      id: 'investidor',
      title: 'O Investidor',
      desc: 'Interesse supremo no controle de caixa, metas financeiras e aportes para o futuro.',
      quote: 'Gerenciar recursos hoje para desfrutar de liberdade amanhã.',
      focus: 'Controle de Caixa e Metas',
      icon: DollarSign,
      color: 'from-amber-500 to-yellow-500',
      activeBuff: 'Taxas de economia acima de 30% dão medalhas raras.'
    },
    {
      id: 'aprendiz',
      title: 'O Aprendiz',
      desc: 'Comprometido com a leitura de livros, leitura bíblica e registro de notas intelectuais.',
      quote: 'O conhecimento é o único ativo que ninguém pode roubar.',
      focus: 'Leitura e Banco de Notas',
      icon: BookOpen,
      color: 'from-red-500 to-rose-600',
      activeBuff: 'Gera XP ao atualizar progresso de livros ou bíblia.'
    }
  ];

  // XP progression calculation
  const xpInCurrentLevel = xpTotal % 1000;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  // Real App Calculations for Badge Validation
  const activeGoalsCount = goals.filter(g => !g.completed).length;
  const completedGoalsCount = goals.filter(g => g.completed).length;
  const hasLoadedDemo = dailyTasks.length > 0 && routine.length > 0 && finances.length > 0;
  const hasChecklistComplete = dailyTasks.length > 0 && dailyTasks.every(t => t.completed);
  const balance = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0) -
                  finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);

  // Define Badge requirements based on real states
  const badges = [
    {
      id: 'chama_inicial',
      title: 'Chama Inicial',
      desc: 'Mantenha pelo menos 1 dia de frequência ativa.',
      requirement: 'Ter frequência de 1 dia ou mais',
      unlocked: streak >= 1,
      icon: Flame,
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: 'consistencia_ferro',
      title: 'Guerreiro de Ferro',
      desc: 'Consolide uma frequência espetacular de 5 dias seguidos.',
      requirement: 'Ter frequência de 5 dias ou mais',
      unlocked: streak >= 5,
      icon: Shield,
      color: 'from-amber-500 to-yellow-500'
    },
    {
      id: 'mestre_orcamento',
      title: 'Mestre das Finanças',
      desc: 'Mantenha um saldo líquido positivo em seu controle de caixa.',
      requirement: 'Ter saldo de caixa positivo',
      unlocked: finances.length > 0 && balance >= 0,
      icon: DollarSign,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'foco_blindado',
      title: 'Foco Blindado',
      desc: 'Complete e conclua pelo menos uma meta pessoal planejada.',
      requirement: 'Ter pelo menos 1 meta concluída',
      unlocked: completedGoalsCount > 0,
      icon: Target,
      color: 'from-rose-500 to-orange-500'
    },
    {
      id: 'consistencia_suprema',
      title: 'Perfeição Diária',
      desc: 'Complete 100% dos rituais do checklist de hoje.',
      requirement: 'Concluir todas as tarefas diárias hoje',
      unlocked: hasChecklistComplete,
      icon: Sparkles,
      color: 'from-cyan-400 to-blue-500'
    },
    {
      id: 'explorador_dados',
      title: 'Explorador',
      desc: 'Carregou os dados simulados completos do planner.',
      requirement: 'Importar dados de exemplo na tela principal',
      unlocked: hasLoadedDemo,
      icon: Trophy,
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Interactive Focus Training ground state
  const [focusClicks, setFocusClicks] = useState(0);
  const [localTrainingCompletedDate, setLocalTrainingCompletedDate] = useState(() => {
    return localStorage.getItem('mbc_focus_training_date') || '';
  });
  const currentTrainingDate = propFocusTrainingDate !== undefined ? propFocusTrainingDate : localTrainingCompletedDate;
  const todayDateStr = new Date().toDateString();
  const trainingCompletedToday = currentTrainingDate === todayDateStr;
  const [pulseActive, setPulseActive] = useState(false);

  // Handle focus exercise click
  const handleFocusClick = () => {
    if (trainingCompletedToday) return;
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 300);
    
    const nextClicks = focusClicks + 1;
    setFocusClicks(nextClicks);
    
    if (nextClicks >= 10) {
      addXp(20);
      if (propSetFocusTrainingDate) {
        propSetFocusTrainingDate(todayDateStr);
      }
      setLocalTrainingCompletedDate(todayDateStr);
      localStorage.setItem('mbc_focus_training_date', todayDateStr);
      setFocusClicks(0);
    }
  };

  // Handle saving personal info
  const handleSaveInfo = () => {
    let formattedHandle = editHandle.trim();
    if (formattedHandle && !formattedHandle.startsWith('@')) {
      formattedHandle = `@${formattedHandle}`;
    }

    setUserName(editName.trim() || 'Nando');
    setUserPhoto(editPhoto.trim());
    setUserHandle(formattedHandle || '@nando_mbc');
    setUserEmail(editEmail.trim());
    setBio(editBio.trim());

    localStorage.setItem('mbc_userName', editName.trim() || 'Nando');
    localStorage.setItem('mbc_userPhoto', editPhoto.trim());
    localStorage.setItem('mbc_userHandle', formattedHandle || '@nando_mbc');
    localStorage.setItem('mbc_userEmail', editEmail.trim());
    localStorage.setItem('mbc_userBio', editBio.trim());

    addXp(15);
    setIsEditing(false);
    setSaveFeedback('Perfil atualizado com sucesso! +15 XP.');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Select predefined avatar
  const handleSelectPresetAvatar = (url: string) => {
    setEditPhoto(url);
  };

  // Save archetype to localStorage
  const handleSelectArchetype = (archetypeId: string) => {
    setActiveArchetype(archetypeId);
    localStorage.setItem('mbc_userArchetype', archetypeId);
    addXp(10);
    setSaveFeedback(`Alinhamento alterado para ${archetypes.find(a => a.id === archetypeId)?.title}! +10 XP.`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div id="profile-view" className="space-y-8 pb-12 max-w-7xl mx-auto px-4 text-left">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Seu <span className="text-orange-500 font-display">Perfil de Foco</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Seu centro de reputação, conquistas gamificadas e alinhamento de produtividade.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenStreakHub}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 hover:border-orange-500/50 px-3.5 py-2 rounded-2xl text-xs font-bold text-orange-400 hover:text-orange-300 transition-all cursor-pointer shadow-sm"
            title="Abrir Central de Ofensivas & Escudos"
          >
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20 animate-pulse" />
            <div className="text-left leading-tight">
              <span className="text-[9px] text-zinc-400 block font-mono">Ofensiva Master</span>
              <span className="font-mono text-white font-black">{streak} Dias</span>
            </div>
          </button>
          <button
            onClick={onOpenRankingModal}
            className="flex items-center gap-3 bg-zinc-950 border border-zinc-850 hover:border-orange-500/50 px-4 py-2 rounded-2xl transition-all cursor-pointer group"
            title="Abrir Central de Ligas & Classificação"
          >
            <Trophy className="h-5 w-5 text-orange-500 fill-orange-500/10 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="text-[10px] text-zinc-500 group-hover:text-orange-400 font-bold uppercase tracking-widest block transition-colors">Classificação & Ligas</span>
              <span className="text-xs font-black text-white uppercase font-mono">Nível {level}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Save feedback notifications */}
      <AnimatePresence>
        {saveFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-400 font-bold"
          >
            <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
            <span>{saveFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Avatar Card & Personal Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main User Card */}
          <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />
            
            {isEditing ? (
              // Editing Mode Form
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Editar Detalhes do Perfil</h3>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Predefined Avatar presets selection */}
                <div>
                  <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-2">Selecione uma Imagem Preset</label>
                  <div className="flex gap-2 mb-3">
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPresetAvatar(preset.url)}
                        className={`w-10 h-10 rounded-full border overflow-hidden relative transition-all ${
                          editPhoto === preset.url ? 'border-orange-500 scale-110 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Photo URL Input */}
                  <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">Ou Link Personalizado</label>
                  <input
                    type="text"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="Cole a URL da sua foto"
                    className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Inputs for Name, Handle, Email and Bio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">Apelido</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={15}
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">Handle (@)</label>
                    <input
                      type="text"
                      value={editHandle}
                      onChange={(e) => setEditHandle(e.target.value)}
                      maxLength={15}
                      className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider block mb-1">Mantra / Biografia Curta</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={100}
                    rows={2}
                    className="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveInfo}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10"
                >
                  <Save className="h-4 w-4" />
                  Salvar Mudanças
                </button>
              </div>
            ) : (
              // Display Mode Card
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <img 
                        src={userPhoto} 
                        alt={userName} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]" 
                      />
                      <button 
                        onClick={() => {
                          setEditName(userName);
                          setEditHandle(userHandle);
                          setEditEmail(userEmail);
                          setEditBio(bio);
                          setEditPhoto(userPhoto);
                          setIsEditing(true);
                        }}
                        className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        title="Alterar Detalhes"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight leading-none">{userName}</h2>
                      <span className="text-xs text-orange-500 font-mono font-bold mt-1 inline-block">{userHandle}</span>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{userEmail}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditName(userName);
                      setEditHandle(userHandle);
                      setEditEmail(userEmail);
                      setEditBio(bio);
                      setEditPhoto(userPhoto);
                      setIsEditing(true);
                    }}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-850 rounded-xl text-[10px] font-bold transition-all"
                  >
                    Editar Perfil
                  </button>
                </div>

                {/* Mantra / Bio */}
                <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl relative">
                  <span className="absolute -top-2 left-3 px-1.5 bg-[#0a0a0c] text-[8px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Mantra de Produtividade</span>
                  <p className="text-xs text-gray-300 italic leading-relaxed pt-1">
                    "{bio}"
                  </p>
                </div>

                {/* Micro Level Stats */}
                <div className="pt-4 border-t border-zinc-900/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500 font-extrabold tracking-widest uppercase">Evolução do Nível</span>
                    <span className="text-xs text-orange-400 font-black font-mono">Nível {level} • {xpInCurrentLevel}/1000 XP</span>
                  </div>
                  
                  <div className="w-full bg-[#141417] h-2 rounded-full overflow-hidden border border-zinc-900">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                    <span>Nível {level}</span>
                    <span>Nível {level + 1}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Training Ground: Practice Focus Clicker */}
          <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Arena de Exercício</span>
                  <h3 className="text-base font-black text-white tracking-tight mt-0.5">Treino de Concentração</h3>
                </div>
                {trainingCompletedToday ? (
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black font-mono uppercase px-2 py-0.5 rounded-lg">
                    Concluído Hoje
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black font-mono uppercase px-2 py-0.5 rounded-lg">
                    Disponível (+20 XP)
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Pratique sua atenção focando no ponto abaixo. Clique nele 10 vezes mantendo a respiração controlada para pontuar XP diário.
              </p>

              <div className="flex flex-col items-center justify-center py-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
                {trainingCompletedToday ? (
                  <div className="text-center py-4">
                    <Trophy className="h-10 w-10 text-orange-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-white">Mente Focada com Sucesso!</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Sua mente está equilibrada para as tarefas de hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-center w-full flex flex-col items-center">
                    {/* Breathing circle trigger */}
                    <button
                      onClick={handleFocusClick}
                      className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all cursor-pointer ${
                        pulseActive ? 'bg-orange-600 scale-95 shadow-[0_0_30px_rgba(249,115,22,0.8)]' : 'bg-orange-500/15 border border-orange-500/30 hover:border-orange-500/60'
                      }`}
                    >
                      {/* Ripple ring anim */}
                      <span className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping" />
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-black font-mono text-sm shadow-md">
                        {10 - focusClicks}
                      </div>
                    </button>

                    <div className="w-48 bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${focusClicks * 10}%` }} />
                    </div>

                    <p className="text-[10px] text-zinc-500">
                      Clique {10 - focusClicks} vezes para consolidar o treino de foco.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Gamified Classes/Archetypes & Badge Showcase */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Gamified Classes */}
          <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden">
            <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Estilo de Atuação</span>
            <h3 className="text-base font-black text-white tracking-tight mt-0.5 mb-2">Selecione seu Alinhamento Ativo</h3>
            
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Sua classe de foco determina sua mentalidade produtiva no planner. Escolha o pilar de maior ressonância com seus objetivos atuais para ativar buffs exclusivos de XP.
            </p>

            <div className="space-y-3">
              {archetypes.map((arch) => {
                const isActive = activeArchetype === arch.id;
                const IconComponent = arch.icon;
                
                return (
                  <div
                    key={arch.id}
                    onClick={() => handleSelectArchetype(arch.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group text-left ${
                      isActive 
                        ? 'bg-zinc-950/80 border-orange-500 shadow-[0_4px_20px_rgba(249,115,22,0.1)]' 
                        : 'bg-zinc-900/20 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {/* Active highlight bar */}
                    {isActive && (
                      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${arch.color}`} />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isActive 
                            ? 'bg-orange-500/15 border-orange-500/30 text-orange-500' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-500 group-hover:text-white'
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <h4 className={`text-xs font-black flex items-center gap-2 ${isActive ? 'text-orange-500' : 'text-white'}`}>
                            {arch.title}
                            {isActive && (
                              <span className="text-[8px] bg-orange-500 text-black font-black font-mono uppercase px-2 py-0.5 rounded-md">
                                Ativo
                              </span>
                            )}
                          </h4>
                          
                          <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed max-w-xl">
                            {arch.desc}
                          </p>
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">
                            "{arch.quote}"
                          </p>

                          {/* Buff indicator */}
                          <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono">
                            <Sparkles className="h-3 w-3 text-orange-500" />
                            <span>Vantagem Passiva: <strong className="text-zinc-200">{arch.activeBuff}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isActive ? 'border-orange-500 bg-orange-500 text-black' : 'border-zinc-700 bg-zinc-950'
                        }`}>
                          {isActive && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Badges Achievements Showcase */}
          <div className="bg-[#0a0a0c]/60 border border-zinc-850 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-[10px] text-orange-500 font-extrabold tracking-widest uppercase">Salão de Conquistas</span>
                <h3 className="text-base font-black text-white tracking-tight mt-0.5">Medalhas e Insígnias Desbloqueadas</h3>
              </div>
              
              <span className="text-xs font-mono font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
                {unlockedCount} / {badges.length} Completas
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Consolide sua rotina real no aplicativo para destravar recompensas exclusivas e provar sua consistência.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((badge) => {
                const BadgeIcon = badge.icon;
                
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                      badge.unlocked 
                        ? 'bg-zinc-950/80 border-orange-500/25 shadow-md shadow-orange-500/[0.02]' 
                        : 'bg-zinc-900/10 border-zinc-900/60 opacity-65'
                    }`}
                  >
                    {/* Glow effect on unlocked */}
                    {badge.unlocked && (
                      <div className="absolute -right-6 -bottom-6 w-12 h-12 bg-orange-500/5 blur-xl rounded-full" />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                          badge.unlocked 
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' 
                            : 'bg-zinc-900 border-zinc-850 text-zinc-600'
                        }`}>
                          <BadgeIcon className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <h4 className={`text-xs font-black ${badge.unlocked ? 'text-white' : 'text-zinc-500 line-through'}`}>
                            {badge.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed font-medium">
                            {badge.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {badge.unlocked ? (
                          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-zinc-600" />
                        )}
                      </div>
                    </div>

                    <div className="border-t border-zinc-900 pt-2 flex justify-between items-center text-[8.5px] font-mono">
                      <span className="text-zinc-500 uppercase font-bold">REQUISITO:</span>
                      <span className={badge.unlocked ? 'text-emerald-400 font-bold' : 'text-zinc-500 font-medium'}>
                        {badge.requirement}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
