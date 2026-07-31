import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Upload, 
  Maximize2, 
  Star, 
  RotateCcw, 
  X,
  RectangleHorizontal,
  RectangleVertical,
  Eye,
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
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-sau-2',
    area: 'Saúde',
    title: 'Nutrição Limpa',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800',
    caption: 'Comida de verdade, hidratação constante e suplementação ideal',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-sau-3',
    area: 'Saúde',
    title: 'Sono Reparador',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800',
    caption: '8 horas de sono de qualidade para regeneração muscular e mental',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-sau-4',
    area: 'Saúde',
    title: 'Paz Mental & Clareza',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800',
    caption: 'Mente serena, meditação e controle eficiente do estresse',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Financeiro
  {
    id: 'vb-fin-1',
    area: 'Financeiro',
    title: 'Liberdade & Reserva de Emergência',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800',
    caption: 'Reserva sólida de 6 a 12 meses para total tranquilidade',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fin-2',
    area: 'Financeiro',
    title: 'Carteira de Investimentos',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800',
    caption: 'Ativos diversificados gerando renda passiva mensal crescente',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fin-3',
    area: 'Financeiro',
    title: 'Independência Financeira',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800',
    caption: 'Aportes regulares e alocação estratégica de capital',
    targetYear: '2027',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fin-4',
    area: 'Financeiro',
    title: 'Conquistas & Patrimônio',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800',
    caption: 'Aquisições conscientes, segurança e conforto para o futuro',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Social
  {
    id: 'vb-soc-1',
    area: 'Social',
    title: 'Relacionamentos Profundos',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800',
    caption: 'Amigos leais, conversas sinceras e momentos inesquecíveis',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-soc-2',
    area: 'Social',
    title: 'Presença em Família',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800',
    caption: 'Reuniões familiares, atenção plena e celebrações',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-soc-3',
    area: 'Social',
    title: 'Círculo de Alto Valor',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800',
    caption: 'Convívio com pessoas que inspiram constante evolução',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-soc-4',
    area: 'Social',
    title: 'Amor & Parceria',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800',
    caption: 'Cumplicidade, apoio mútuo e construção de uma história juntos',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Hobbies
  {
    id: 'vb-hob-1',
    area: 'Hobbies',
    title: 'Leitura & Expandir Horizontes',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800',
    caption: 'Livros de filosofia, literatura e desenvolvimento pessoal',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-hob-2',
    area: 'Hobbies',
    title: 'Música & Expressão',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
    caption: 'Aprender um instrumento e apreciar arte e boa música',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-hob-3',
    area: 'Hobbies',
    title: 'Viagens & Natureza',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800',
    caption: 'Trilhas, praias, montanhas e desconexão das telas',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-hob-4',
    area: 'Hobbies',
    title: 'Fotografia & Memórias',
    imageUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=800',
    caption: 'Registrar ângulos únicos e guardar recordações da vida',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Espiritualidade
  {
    id: 'vb-esp-1',
    area: 'Espiritualidade',
    title: 'Prática Diária de Oração',
    imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800',
    caption: 'Momento diário reservado para silêncio, leitura e fé',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-esp-2',
    area: 'Espiritualidade',
    title: 'Gratidão Incondicional',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    caption: 'Cultivar um coração grato em cada detalhe da rotina',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-esp-3',
    area: 'Espiritualidade',
    title: 'Propósito & Princípios',
    imageUrl: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=800',
    caption: 'Viver alinhado com meus valores morais e espirituais',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-esp-4',
    area: 'Espiritualidade',
    title: 'Paz Interior & Retiros',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?q=80&w=800',
    caption: 'Desacelerar e renovar o espírito longe do barulho',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Físico
  {
    id: 'vb-fis-1',
    area: 'Físico',
    title: 'Alta Performance & Treino',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800',
    caption: 'Treinos intensos e constantes com foco em força e hipertrofia',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fis-2',
    area: 'Físico',
    title: 'Corrida & Superação',
    imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=800',
    caption: 'Bater recordes pessoais de distância e ritmo na corrida',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fis-3',
    area: 'Físico',
    title: 'Flexibilidade & Mobilidade',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800',
    caption: 'Alongamentos diários para articulações saudáveis',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-fis-4',
    area: 'Físico',
    title: 'Físico Estético & Disciplina',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800',
    caption: 'Percentual de gordura baixo e composição corporal atlética',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },

  // Carreira
  {
    id: 'vb-car-1',
    area: 'Carreira',
    title: 'Liderança & Projetos de Impacto',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
    caption: 'Liderar grandes iniciativas e gerar valor real',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-car-2',
    area: 'Carreira',
    title: 'Mestria Técnica & Estudos',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800',
    caption: 'Evolução constante em habilidades do futuro',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-car-3',
    area: 'Carreira',
    title: 'Produtos & Empreendedorismo',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800',
    caption: 'Criar soluções inovadoras e escalar negócios próprios',
    targetYear: '2027',
    completed: false,
    orientation: 'horizontal'
  },
  {
    id: 'vb-car-4',
    area: 'Carreira',
    title: 'Reconhecimento & Mentoria',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800',
    caption: 'Ser referência na área e ajudar outros profissionais a crescer',
    targetYear: '2026',
    completed: false,
    orientation: 'horizontal'
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
  const [activeTouchCardId, setActiveTouchCardId] = useState<string | null>(null);

  // Form State
  const [formArea, setFormArea] = useState<string>(currentArea || lifeAreas[0] || 'Saúde');
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formYear, setFormYear] = useState('2026');
  const [formOrientation, setFormOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

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
    setFormOrientation('horizontal');
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
    setFormOrientation(card.orientation || 'horizontal');
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
        targetYear: formYear.trim(),
        orientation: formOrientation
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
        createdAt: new Date().toISOString(),
        orientation: formOrientation
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
              ? `Mural visual de inspirações e metas de ${currentArea.toLowerCase()}. Passe o mouse ou toque nos cards para visualizar o título e meta.`
              : 'Quadros de visão combinados de todos os seus pilares fundamentais. Passe o mouse ou toque nos cards para ver as informações.'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {displayCards.map(card => {
            const badge = areaBadges[card.area] || { label: card.area, color: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/30' };
            const isHorizontal = (card.orientation || 'horizontal') === 'horizontal';
            const isTouched = activeTouchCardId === card.id;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  // Toggle active touch state on mobile / desktop tap
                  setActiveTouchCardId(prev => prev === card.id ? null : card.id);
                }}
                className={`group relative bg-zinc-950 border border-purple-500/30 hover:border-purple-500/80 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-300 select-none cursor-pointer ${
                  isHorizontal ? 'col-span-1 md:col-span-2 aspect-[16/9]' : 'col-span-1 aspect-[3/4]'
                } ${card.completed ? 'ring-2 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : ''}`}
              >
                {/* Image background */}
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Always-Visible Badges (Top Left: Completed / Area) */}
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
                  {card.completed && (
                    <div className="bg-emerald-500 text-zinc-950 font-mono font-black text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg tracking-wider uppercase border border-emerald-400">
                      <Check className="h-3 w-3 stroke-[3]" />
                      Conquistado
                    </div>
                  )}
                  {!card.completed && (
                    <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${badge.color} ${badge.border}`}>
                      {card.area}
                    </span>
                  )}
                </div>

                {/* HOVER / TOUCH OVERLAY WITH TITLE AND CAPTION */}
                <div 
                  className={`absolute inset-0 bg-black/85 backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-between p-5 text-center z-20 ${
                    isTouched ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-auto'
                  }`}
                >
                  {/* Top Area Tag */}
                  <div className="w-full flex justify-between items-center">
                    <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${badge.color} ${badge.border}`}>
                      {card.area}
                    </span>
                    {card.targetYear && (
                      <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/40">
                        [{card.targetYear}]
                      </span>
                    )}
                  </div>

                  {/* Center Title and Description */}
                  <div className="space-y-2.5 my-auto px-2 max-w-md">
                    {card.targetYear && !card.targetYear.includes('[') && (
                      <span className="text-[10px] font-mono font-bold text-purple-400 tracking-widest uppercase block">
                        [{card.targetYear}]
                      </span>
                    )}
                    <div className="inline-block bg-purple-950/80 border border-purple-500/50 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono">
                        {card.title}
                      </h4>
                    </div>
                    {card.caption && (
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed line-clamp-3 max-w-sm mx-auto">
                        {card.caption}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="w-full flex items-center justify-between pt-3 border-t border-purple-500/20 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleCompleted(card.id, e)}
                      className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        card.completed
                          ? 'bg-emerald-500 text-zinc-950 border border-emerald-400'
                          : 'bg-zinc-900 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{card.completed ? 'Conquistado' : 'Marcar Conquistado'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedImage(card);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                        title="Ver Imagem Inteira"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(card);
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                        title="Editar Card"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCard(card.id, e)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-rose-400 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                        title="Excluir Card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL - EXPANDED LATERALLY FOR DESKTOP */}
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
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-4xl w-full relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.2)] space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-purple-500/10 rounded-2xl border border-purple-500/30 text-purple-400">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                      {editingCard ? 'Editar Card do Vision Board' : 'Novo Card no Vision Board'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">
                      Personalize a imagem, informações de meta e a orientação de exibição (horizontal/vertical).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingCard(null);
                  }}
                  className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Grid: Left = Inputs, Right = Live Preview */}
              <form onSubmit={handleSaveCard} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  {/* Area and Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block mb-1">
                        Área da Vida *
                      </label>
                      <select
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {lifeAreas.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block mb-1">
                        Ano / Prazo (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2026, 2027"
                        value={formYear}
                        onChange={(e) => setFormYear(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Orientation Selector */}
                  <div>
                    <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block mb-1.5">
                      Orientação do Card *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormOrientation('horizontal')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-mono text-xs font-bold ${
                          formOrientation === 'horizontal'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <RectangleHorizontal className="h-4 w-4" />
                        <span>Horizontal (16:9)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormOrientation('vertical')}
                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-mono text-xs font-bold ${
                          formOrientation === 'vertical'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <RectangleVertical className="h-4 w-4" />
                        <span>Vertical (3:4)</span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block mb-1">
                      Título do Card / Visão *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CALL OF DUTY, RESERVA DE EMERGÊNCIA"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono transition-colors"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block mb-1">
                      Frase / Descrição / Meta
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: Conquistar o corpo desejado com treino diário e alimentação saudável..."
                      value={formCaption}
                      onChange={(e) => setFormCaption(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 custom-scrollbar transition-colors"
                    />
                  </div>

                  {/* Image Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-300 font-mono font-bold uppercase block">
                      Imagem do Card *
                    </label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="URL da Imagem (Ex: https://images.unsplash.com/...)"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-zinc-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
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
                  </div>
                </div>

                {/* Right Column: Live Interactive Card Preview */}
                <div className="space-y-3 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Pré-visualização do Card
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">Passe o mouse no preview</span>
                  </div>

                  {/* Mock Card */}
                  <div 
                    className={`group relative bg-zinc-950 border border-purple-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 mx-auto ${
                      formOrientation === 'horizontal' ? 'w-full aspect-[16/9]' : 'w-64 max-w-full aspect-[3/4]'
                    }`}
                  >
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 space-y-2">
                        <ImageIcon className="h-8 w-8 stroke-1" />
                        <span className="text-[10px] font-mono">Sem Imagem</span>
                      </div>
                    )}

                    {/* Area Badge top left */}
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-md border backdrop-blur-md bg-purple-500/10 text-purple-400 border-purple-500/30">
                        {formArea}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-between p-4 text-center z-20">
                      <div className="w-full flex justify-between items-center">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {formArea}
                        </span>
                        {formYear && (
                          <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40">
                            [{formYear}]
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 my-auto px-2">
                        {formYear && (
                          <span className="text-[10px] font-mono font-bold text-purple-400 tracking-widest uppercase block">
                            [{formYear}]
                          </span>
                        )}
                        <div className="inline-block bg-purple-950/80 border border-purple-500/50 rounded-xl px-3.5 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
                            {formTitle || 'TÍTULO DO CARD'}
                          </h4>
                        </div>
                        {formCaption && (
                          <p className="text-[11px] text-zinc-300 font-sans line-clamp-2 max-w-xs mx-auto">
                            {formCaption}
                          </p>
                        )}
                      </div>

                      <div className="w-full text-center text-[9px] font-mono text-purple-400 pt-2 border-t border-purple-500/20">
                        Visualização em Hover
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingCard(null);
                      }}
                      className="px-4 py-2.5 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-mono font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
                    >
                      {editingCard ? 'Salvar Alterações' : 'Criar Card'}
                    </button>
                  </div>
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
              className="relative z-10 max-w-4xl w-full bg-zinc-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
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
                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 inline-block uppercase">
                    {zoomedImage.area}
                  </span>
                  <h3 className="text-xl font-black text-white font-mono uppercase">{zoomedImage.title}</h3>
                  {zoomedImage.caption && (
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{zoomedImage.caption}</p>
                  )}
                  {zoomedImage.targetYear && (
                    <div className="text-xs font-mono text-zinc-400">
                      Ano Alvo: <span className="text-white font-bold">[{zoomedImage.targetYear}]</span>
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
                    className={`text-xs font-mono font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
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
