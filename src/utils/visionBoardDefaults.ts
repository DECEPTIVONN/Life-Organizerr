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
