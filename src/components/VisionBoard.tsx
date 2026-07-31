import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Upload, 
  Link as LinkIcon, 
  Maximize2, 
  Star, 
  RotateCcw, 
  X,
  Layers,
  Heart,
  Coins,
  Users,
  Palette,
  Dumbbell,
  Briefcase,
  Target,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VisionBoardCard } from '../types';

export const DEFAULT_VISION_BOARD_CARDS: VisionBoardCard[] = [
  // Saúde
  {
    id: 'vb-sau-1',
    area: 'Saúde',
    title: 'Longevidade & Vitalidade',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800',
    caption: 'Checkups em dia e hábitos para viver com máxima energia',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-sau-2',
    area: 'Saúde',
    title: 'Nutrição Limpa',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800',
    caption: 'Comida de verdade, hidratação constante e suplementação ideal',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-sau-3',
    area: 'Saúde',
    title: 'Sono Reparador',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800',
    caption: '8 horas de sono de qualidade para regeneração muscular e mental',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-sau-4',
    area: 'Saúde',
    title: 'Paz Mental & Clareza',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800',
    caption: 'Mente serena, meditação e controle eficiente do estresse',
    targetYear: '2026',
    completed: false
  },

  // Financeiro
  {
    id: 'vb-fin-1',
    area: 'Financeiro',
    title: 'Liberdade & Reserva de Emergência',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800',
    caption: 'Reserva sólida de 6 a 12 meses para total tranquilidade',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-fin-2',
    area: 'Financeiro',
    title: 'Carteira de Investimentos',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800',
    caption: 'Ativos diversificados gerando renda passiva mensal crescente',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-fin-3',
    area: 'Financeiro',
    title: 'Independência Financeira',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800',
    caption: 'Aportes regulares e alocação estratégica de capital',
    targetYear: '2027',
    completed: false
  },
  {
    id: 'vb-fin-4',
    area: 'Financeiro',
    title: 'Conquistas & Patrimônio',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800',
    caption: 'Aquisições conscientes, segurança e conforto para o futuro',
    targetYear: '2026',
    completed: false
  },

  // Social
  {
    id: 'vb-soc-1',
    area: 'Social',
    title: 'Relacionamentos Profundos',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800',
    caption: 'Amigos leais, conversas sinceras e momentos inesquecíveis',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-soc-2',
    area: 'Social',
    title: 'Presença em Família',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800',
    caption: 'Reuniões familiares, atenção plena e celebrações',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-soc-3',
    area: 'Social',
    title: 'Círculo de Alto Valor',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800',
    caption: 'Convívio com pessoas que inspiram constante evolução',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-soc-4',
    area: 'Social',
    title: 'Amor & Parceria',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800',
    caption: 'Cumplicidade, apoio mútuo e construção de uma história juntos',
    targetYear: '2026',
    completed: false
  },

  // Hobbies
  {
    id: 'vb-hob-1',
    area: 'Hobbies',
    title: 'Leitura & Expandir Horizontes',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800',
    caption: 'Livros de filosofia, literatura e desenvolvimento pessoal',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-hob-2',
    area: 'Hobbies',
    title: 'Música & Expressão',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
    caption: 'Aprender um instrumento e apreciar arte e boa música',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-hob-3',
    area: 'Hobbies',
    title: 'Viagens & Natureza',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800',
    caption: 'Trilhas, praias, montanhas e desconexão das telas',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-hob-4',
    area: 'Hobbies',
    title: 'Fotografia & Memórias',
    imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=800',
    caption: 'Registrar ângulos únicos e guardar recordações da vida',
    targetYear: '2026',
    completed: false
  },

  // Espiritualidade
  {
    id: 'vb-esp-1',
    area: 'Espiritualidade',
    title: 'Prática Diária de Oração',
    imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800',
    caption: 'Momento diário reservado para silêncio, leitura e fé',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-esp-2',
    area: 'Espiritualidade',
    title: 'Gratidão Incondicional',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    caption: 'Cultivar um coração grato em cada detalhe da rotina',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-esp-3',
    area: 'Espiritualidade',
    title: 'Propósito & Princípios',
    imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800',
    caption: 'Viver alinhado com meus valores morais e espirituais',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-esp-4',
    area: 'Espiritualidade',
    title: 'Paz Interior & Retiros',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?q=80&w=800',
    caption: 'Desacelerar e renovar o espírito longe do barulho',
    targetYear: '2026',
    completed: false
  },

  // Físico
  {
    id: 'vb-fis-1',
    area: 'Físico',
    title: 'Alta Performance & Treino',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800',
    caption: 'Treinos intensos e constantes com foco em força e hipertrofia',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-fis-2',
    area: 'Físico',
    title: 'Corrida & Superação',
    imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=800',
    caption: 'Bater recordes pessoais de distância e ritmo na corrida',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-fis-3',
    area: 'Físico',
    title: 'Flexibilidade & Mobilidade',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800',
    caption: 'Alongamentos diários para articulações saudáveis',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-fis-4',
    area: 'Físico',
    title: 'Físico Estético & Disciplina',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800',
    caption: 'Percentual de gordura baixo e composição corporal atlética',
    targetYear: '2026',
    completed: false
  },

  // Carreira
  {
    id: 'vb-car-1',
    area: 'Carreira',
    title: 'Liderança & Projetos de Impacto',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
    caption: 'Liderar grandes iniciativas e gerar valor real',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-car-2',
    area: 'Carreira',
    title: 'Mestria Técnica & Estudos',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800',
    caption: 'Evolução constante em habilidades do futuro',
    targetYear: '2026',
    completed: false
  },
  {
    id: 'vb-car-3',
    area: 'Carreira',
    title: 'Produtos & Empreendedorismo',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
    caption: 'Criar soluções inovadoras e escalar negócios próprios',
    targetYear: '2027',
    completed: false
  },
  {
    id: 'vb-car-4',
    area: 'Carreira',
    title: 'Reconhecimento & Mentoria',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800',
    caption: 'Ser referência na área e ajudar outros profissionais a crescer',
    targetYear: '2026',
    completed: false
  }
];

const areaBadges: Record<string, { label: string; color: string; border: string }> = {
  'Saúde': { label: 'Saúde', color: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/30' },
  'Financeiro': { label: 'Financeiro', color: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/30' },
  'Social': { label: 'Social', color: 'bg-sky-500/10 text-sky-400', border: 'border-sky-500/30' },
  'Hobbies': { label: 'Hobbies', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/30' },
  'Espiritualidade': { label: 'Espiritualidade', color: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/30' },
  'Físico': { label: 'Físico', color: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/30' },
  'Carreira': { label: 'Carreira', color: 'bg-blue-500/10 text-blue-400', border: 'border-blue-500/30' },
};

interface VisionBoardProps {
  cards: VisionBoardCard[];
  setCards: React.Dispatch<React.SetStateAction<VisionBoardCard[]>>;
  currentArea?: string | null;
  lifeAreas: string[];
  addXp?: (amount: number) => void;
}

export function VisionBoard({ cards, setCards, currentArea, lifeAreas, addXp }: VisionBoardProps) {
  const [filterArea, setFilterArea] = useState<string>('Todas');
  const [editingCard, setEditingCard] = useState<VisionBoardCard | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<VisionBoardCard | null>(null);

  // Form State
  const [formArea, setFormArea] = useState<string>(currentArea || lifeAreas[0] || 'Saúde');
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formYear, setFormYear] = useState('2026');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const displayCards = cards.filter(c => {
    if (currentArea) {
      return c.area === currentArea;
    }
    if (filterArea !== 'Todas') {
      return c.area === filterArea;
    }
    return true;
  });

  const handleOpenAddModal = (targetArea?: string) => {
    setFormArea(targetArea || currentArea || lifeAreas[0] || 'Saúde');
    setFormTitle('');
    setFormImageUrl('');
    setFormCaption('');
    setFormYear('2026');
    setEditingCard(null);
    setIsAddingNew(true);
  };

  const handleOpenEditModal = (card: VisionBoardCard) => {
    setEditingCard(card);
    setFormArea(card.area);
    setFormTitle(card.title);
    setFormImageUrl(card.imageUrl);
    setFormCaption(card.caption || '');
    setFormYear(card.targetYear || '2026');
    setIsAddingNew(false);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImageUrl.trim()) return;

    if (editingCard) {
      // Update existing
      setCards(prev => prev.map(c => c.id === editingCard.id ? {
        ...c,
        area: formArea,
        title: formTitle.trim(),
        imageUrl: formImageUrl.trim(),
        caption: formCaption.trim(),
        targetYear: formYear.trim()
      } : c));
    } else {
      // Create new
      const newCard: VisionBoardCard = {
        id: 'vb-' + Math.random().toString(36).substring(2, 9),
        area: formArea,
        title: formTitle.trim(),
        imageUrl: formImageUrl.trim(),
        caption: formCaption.trim(),
        targetYear: formYear.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setCards(prev => [newCard, ...prev]);
      if (addXp) addXp(25);
    }

    setIsAddingNew(false);
    setEditingCard(null);
  };

  const handleToggleCompleted = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.completed;
        if (nextState && addXp) addXp(50);
        return { ...c, completed: nextState };
      }
      return c;
    }));
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Remover este card do Vision Board?")) {
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Restaurar os cards padrão do Vision Board para todas as áreas?")) {
      setCards(DEFAULT_VISION_BOARD_CARDS);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-3xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/30 text-orange-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-serif">
              {currentArea ? `Vision Board — ${currentArea}` : 'Vision Board Geral (Áreas da Vida)'}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            {currentArea 
              ? `Mural visual de inspirações e metas de ${currentArea.toLowerCase()}. Personalize fotos e objetivos.`
              : 'Quadros de visão combinados de todos os seus pilares fundamentais. Visualize e realize seus sonhos.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => handleOpenAddModal(currentArea || undefined)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Novo Card</span>
          </button>

          {cards.length === 0 && (
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          )}
        </div>
      </div>

      {/* Area filter tabs (Only on overall vision board) */}
      {!currentArea && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setFilterArea('Todas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterArea === 'Todas'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800/60'
            }`}
          >
            Todas ({cards.length})
          </button>
          {lifeAreas.map(area => {
            const areaCount = cards.filter(c => c.area === area).length;
            return (
              <button
                key={area}
                onClick={() => setFilterArea(area)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterArea === area
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800/60'
                }`}
              >
                {area} ({areaCount})
              </button>
            );
          })}
        </div>
      )}

      {/* Cards Grid */}
      {displayCards.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-10 text-center space-y-3">
          <ImageIcon className="h-10 w-10 text-zinc-600 mx-auto stroke-1 animate-pulse" />
          <h4 className="text-sm font-bold text-zinc-300">Nenhum card cadastrado neste Vision Board</h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Crie novos cards com fotos motivacionais, frases de meta e metas para personalizar seu mural de visão.
          </p>
          <button
            onClick={() => handleOpenAddModal(currentArea || undefined)}
            className="mt-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Primeiro Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayCards.map(card => {
            const badge = areaBadges[card.area] || { label: card.area, color: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/30' };

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 flex flex-col shadow-xl ${
                  card.completed ? 'ring-2 ring-emerald-500/50' : ''
                }`}
              >
                {/* Image Box */}
                <div 
                  onClick={() => setZoomedImage(card)}
                  className="relative h-48 w-full bg-zinc-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Area Badge at top left */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${badge.color} ${badge.border}`}>
                      {card.area}
                    </span>
                  </div>

                  {/* Completed star indicator */}
                  {card.completed && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-zinc-950 font-mono font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                      <Star className="h-3 w-3 fill-zinc-950" />
                      Conquistado
                    </div>
                  )}

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedImage(card);
                      }}
                      className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700 transition-all cursor-pointer"
                      title="Ver em tamanho cheio"
                    >
                      <Maximize2 className="h-4 w-4 text-orange-400" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(card);
                      }}
                      className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700 transition-all cursor-pointer"
                      title="Editar Card"
                    >
                      <Edit3 className="h-4 w-4 text-amber-400" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-xl border border-zinc-700 transition-all cursor-pointer"
                      title="Excluir Card"
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* Card Content Footer */}
                <div className="p-4 flex flex-col justify-between flex-1 space-y-3 bg-zinc-900/90">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                        {card.title}
                      </h4>
                      {card.targetYear && (
                        <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {card.targetYear}
                        </span>
                      )}
                    </div>
                    {card.caption && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                        {card.caption}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={(e) => handleToggleCompleted(card.id, e)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        card.completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className={`h-3.5 w-3.5 ${card.completed ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span>{card.completed ? 'Conquistado' : 'Marcar Conquistado'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(card)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-bold transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {(isAddingNew || editingCard) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingNew(false);
                setEditingCard(null);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-orange-500/30 rounded-3xl p-6 max-w-lg w-full relative z-10 shadow-2xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                    {editingCard ? 'Editar Card do Vision Board' : 'Novo Card no Vision Board'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingCard(null);
                  }}
                  className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Área da Vida</label>
                    <select
                      value={formArea}
                      onChange={(e) => setFormArea(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      {lifeAreas.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Ano / Prazo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 2026, 2027"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Título do Card / Visão *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reserva Financeira Sólida, Viagem dos Sonhos"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Frase / Descrição / Meta</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Conquistar o corpo desejado com treino diário e alimentação saudável..."
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 custom-scrollbar"
                  />
                </div>

                {/* Image Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">Imagem do Card *</label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="URL da Imagem (Ex: https://images.unsplash.com/...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 border border-zinc-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      title="Upload foto local"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Image Preview */}
                  {formImageUrl && (
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-zinc-800 mt-2 bg-zinc-900">
                      <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-orange-400">
                        Preview
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingCard(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN LIGHTBOX / ZOOM MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImage(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="md:w-3/5 bg-black h-72 md:h-[480px] flex items-center justify-center relative">
                <img
                  src={zoomedImage.imageUrl}
                  alt={zoomedImage.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-4 bg-zinc-950">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 inline-block uppercase">
                    {zoomedImage.area}
                  </span>
                  <h3 className="text-xl font-bold text-white font-serif">{zoomedImage.title}</h3>
                  {zoomedImage.caption && (
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{zoomedImage.caption}</p>
                  )}
                  {zoomedImage.targetYear && (
                    <div className="text-xs font-mono text-zinc-400">
                      Ano Alvo: <span className="text-white font-bold">{zoomedImage.targetYear}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-850 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleToggleCompleted(zoomedImage.id, e);
                      setZoomedImage(prev => prev ? { ...prev, completed: !prev.completed } : null);
                    }}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      zoomedImage.completed
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{zoomedImage.completed ? 'Conquistado ✓' : 'Marcar como Conquistado'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetCard = zoomedImage;
                      setZoomedImage(null);
                      handleOpenEditModal(targetCard);
                    }}
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
