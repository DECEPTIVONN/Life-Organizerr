import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Tag, 
  MessageSquare, 
  CheckSquare, 
  User, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Share2, 
  Star, 
  Layers, 
  Sparkles, 
  LayoutGrid, 
  List, 
  AlertCircle, 
  Image as ImageIcon, 
  Copy, 
  ArrowRightLeft, 
  Send,
  SlidersHorizontal,
  Folder,
  Briefcase,
  Code,
  Palette,
  Megaphone,
  Compass,
  Upload,
  Clipboard,
  Link,
  Table,
  CalendarDays,
  BarChart3,
  PieChart,
  Paperclip,
  UserPlus,
  Sliders,
  CornerDownRight,
  Percent,
  TrendingUp,
  Check,
  ExternalLink,
  GripVertical,
  Flame,
  Globe,
  FileText,
  Github,
  Figma,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectList, ProjectCard, ProjectCardChecklist, ProjectCardComment } from '../types';

interface ProjetosViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addXp: (amount: number) => void;
  userName?: string;
  userPhoto?: string;
}

// Preset Covers for Quick Selection
const PRESET_COVERS = [
  { label: 'Futurista', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000' },
  { label: 'Tecnologia', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000' },
  { label: 'Design', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000' },
  { label: 'Trabalho', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000' },
  { label: 'Minimalista', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000' },
  { label: 'Galáxia', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000' },
  { label: 'Arquitetura', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000' },
];

// Color palettes for Kanban Card Covers & List Badges
const COVER_COLORS = [
  { name: 'Nenhum', hex: '' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Roxo', hex: '#8b5cf6' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Amarelo', hex: '#eab308' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Ciano', hex: '#06b6d4' }
];

export const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon?: string }> = {
  baixa: { label: 'Baixa', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
  media: { label: 'Média', bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', dot: 'bg-sky-500' },
  alta: { label: 'Alta', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  urgente: { label: 'Urgente', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40 animate-pulse', dot: 'bg-red-500', icon: '🔥' },
};

// Helper: Alerta de Prazos Próximos (< 24h ou Atrasado)
export const checkDueStatus = (dueDate?: string, dueTime?: string, completed?: boolean) => {
  if (!dueDate || completed) return { isDueSoon: false, isOverdue: false, text: '', diffHours: 0 };

  const now = new Date();
  let targetStr = dueDate;
  if (dueTime) {
    targetStr += `T${dueTime}`;
  } else {
    targetStr += 'T23:59:59';
  }

  const due = new Date(targetStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    return {
      isDueSoon: false,
      isOverdue: true,
      text: overdueHours > 24 ? `Atrasado (${Math.round(overdueHours / 24)}d)` : `Atrasado (${overdueHours}h)`,
      diffHours
    };
  } else if (diffHours <= 24) {
    const hrs = Math.max(1, Math.round(diffHours));
    return {
      isDueSoon: true,
      isOverdue: false,
      text: `Vence em ${hrs}h`,
      diffHours
    };
  }

  return { isDueSoon: false, isOverdue: false, text: '', diffHours };
};

// Helper: Automação de Mover Cartão ao atingir 100% dos Checklists
export const checkAndApplyChecklistAutomation = (
  card: ProjectCard,
  lists: ProjectList[]
): { card: ProjectCard; moved: boolean; targetListTitle?: string } => {
  let totalItems = 0;
  let doneItems = 0;

  (card.checklists || []).forEach(chk => {
    chk.items.forEach(it => {
      totalItems++;
      if (it.completed) doneItems++;
      (it.subItems || []).forEach(sub => {
        totalItems++;
        if (sub.completed) doneItems++;
      });
    });
  });

  if (totalItems > 0 && doneItems === totalItems) {
    // Procurar lista "Concluído", "Done", "Finalizado", "Entregue" ou pegar a última lista
    const doneList = lists.find(l => {
      const lower = l.title.toLowerCase();
      return (
        lower.includes('concluí') ||
        lower.includes('conclui') ||
        lower.includes('done') ||
        lower.includes('finaliz') ||
        lower.includes('entreg')
      );
    }) || lists[lists.length - 1];

    if (doneList && (card.listId !== doneList.id || !card.completed)) {
      const autoComment: ProjectCardComment = {
        id: `comm-auto-${Date.now()}`,
        authorName: '🤖 Automação de Tarefas',
        authorAvatar: '',
        text: `100% dos checklists (${doneItems}/${totalItems}) concluídos. O cartão foi marcado como concluído e movido automaticamente para a lista "${doneList.title}".`,
        createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      };

      return {
        card: {
          ...card,
          completed: true,
          listId: doneList.id,
          comments: [...(card.comments || []), autoComment]
        },
        moved: true,
        targetListTitle: doneList.title
      };
    }
  }

  return { card, moved: false };
};

const CATEGORIES = [
  'Todos',
  'Software',
  'Engenharia',
  'Design',
  'Marketing',
  'Pessoal',
  'Outros'
];

export default function ProjetosView({
  projects,
  setProjects,
  addXp,
  userName = 'Nando',
  userPhoto = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=100'
}: ProjetosViewProps) {
  // Navigation State: null = Hub view, string = active project ID
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Hub Filters & Search
  const [hubSearch, setHubSearch] = useState('');
  const [hubCategory, setHubCategory] = useState('Todos');
  const [hubStatus, setHubStatus] = useState<'todos' | 'ativo' | 'concluido' | 'arquivado'>('todos');

  // Project Modal States (Unified Creation & Editing)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<ProjectCard | null>(null);

  // Form State for Project Creation / Editing
  const [projectTitle, setProjectTitle] = useState('');
  const [projectQuote, setProjectQuote] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCategory, setProjectCategory] = useState('Software');
  const [projectTargetYear, setProjectTargetYear] = useState('2026');
  const [projectCover, setProjectCover] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000');
  const [projectTemplate, setProjectTemplate] = useState<'scrum' | 'kanban' | 'vazio'>('scrum');
  const [projectFavorite, setProjectFavorite] = useState(false);

  // File Input Ref for Cover Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active View Mode (Quadro, Tabela, Cronograma, Painel) & Board Search
  const [activeViewMode, setActiveViewMode] = useState<'quadro' | 'tabela' | 'cronograma' | 'painel'>('quadro');
  const [boardSearch, setBoardSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Sub-items & Card Features State
  const [addingSubItemForItemId, setAddingSubItemForItemId] = useState<string | null>(null);
  const [subItemInput, setSubItemInput] = useState('');
  const [newChecklistGroupTitle, setNewChecklistGroupTitle] = useState('');

  // Modals / Dropdowns inside Card Detail Modal ("Adicionar ao cartão")
  const [activeAddPopUp, setActiveAddPopUp] = useState<'etiquetas' | 'datas' | 'checklist' | 'membros' | 'anexo' | 'campos' | 'prioridade' | 'horas' | null>(null);
  const [cardStartDateInput, setCardStartDateInput] = useState('');
  const [cardDueDateInput, setCardDueDateInput] = useState('');
  const [cardAssigneeInput, setCardAssigneeInput] = useState('');
  const [cardAttachmentNameInput, setCardAttachmentNameInput] = useState('');
  const [cardAttachmentUrlInput, setCardAttachmentUrlInput] = useState('');
  const [attachmentPresetType, setAttachmentPresetType] = useState<'link' | 'file' | 'figma' | 'github' | 'notion' | 'drive'>('link');
  const [cardCustomFieldNameInput, setCardCustomFieldNameInput] = useState('');
  const [cardCustomFieldValueInput, setCardCustomFieldValueInput] = useState('');
  const [cardEstimatedHoursInput, setCardEstimatedHoursInput] = useState('');
  const [cardLoggedHoursInput, setCardLoggedHoursInput] = useState('');

  // Drag and Drop State for Kanban Cards and Lists
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // New List State & Modals
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [newListModalTitle, setNewListModalTitle] = useState('');

  // Edit List Modal State
  const [editingListModal, setEditingListModal] = useState<ProjectList | null>(null);
  const [editListTitleInput, setEditListTitleInput] = useState('');

  // New Card Inline State (per list ID)
  const [addingCardForListId, setAddingCardForListId] = useState<string | null>(null);
  const [newCardTitleInput, setNewCardTitleInput] = useState('');

  // Card Detail Editing States
  const [editingCardDesc, setEditingCardDesc] = useState(false);
  const [cardDescInput, setCardDescInput] = useState('');
  const [newChecklistItemInput, setNewChecklistItemInput] = useState('');
  const [newCommentInput, setNewCommentInput] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [selectedLabelColor, setSelectedLabelColor] = useState('#3b82f6');

  // Active Project object
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Initialize seed demo project if projects is empty
  useEffect(() => {
    if (projects.length === 0) {
      const demoProject: Project = {
        id: 'proj-eneses-demo',
        title: 'ÊNESES - Sistema Principal',
        description: 'Plataforma completa de gerenciamento, backend, autenticação e interface do usuário.',
        category: 'Software',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000',
        colorTheme: 'orange',
        status: 'ativo',
        favorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lists: [
          { id: 'l-ideias', title: 'Ideias 💡', order: 0 },
          { id: 'l-planning', title: 'Em planejamento 📐', order: 1 },
          { id: 'l-backlog', title: 'Backlog 📋', order: 2 },
          { id: 'l-refinement', title: 'REFINAMENTO ⚙️', order: 3 },
          { id: 'l-sprint', title: 'SPRINT BACKLOG 🚀', order: 4 },
          { id: 'l-dev', title: 'Em desenvolvimento ⚡', order: 5 },
          { id: 'l-review', title: 'Revisão de código 🔍', order: 6 },
          { id: 'l-tests', title: 'Em testes 🧪', order: 7 },
          { id: 'l-done', title: 'Concluído 🎆', order: 8 },
        ],
        cards: [
          {
            id: 'c-idea-1',
            listId: 'l-ideias',
            title: '💡 Registrar Ideia: Notificações em Tempo Real com WebSocket',
            description: 'Explorar o uso de WebSockets ou Firebase Cloud Messaging para enviar alertas instantâneos de alteração no Kanban aos membros do time.',
            coverColor: '#8b5cf6',
            priority: 'media',
            labels: [
              { id: 'lab-idea', name: 'Ideia', color: '#8b5cf6' },
              { id: 'lab-inov', name: 'Inovação', color: '#ec4899' }
            ],
            dueDate: '2026-08-30',
            createdAt: '2026-08-13T00:00:00.000Z'
          },
          {
            id: 'c-plan-1',
            listId: 'l-planning',
            title: '📐 Planejamento da Arquitetura do Banco de Dados Sync',
            description: 'Mapear coleções do Firestore para sincronizar estado de gratidão, decretos e workspace diário sem conflitos.',
            coverColor: '#06b6d4',
            priority: 'alta',
            labels: [
              { id: 'lab-plan', name: 'Planejamento', color: '#06b6d4' }
            ],
            dueDate: '2026-08-28',
            createdAt: '2026-08-13T00:00:00.000Z'
          },
          {
            id: 'c-1',
            listId: 'l-backlog',
            title: 'Cadastro de usuários',
            description: 'Como usuário, quero acessar minha conta com e-mail e senha para acessar minhas compras e pedidos.',
            coverColor: '#3b82f6',
            labels: [
              { id: 'lab-1', name: 'Autenticação', color: '#3b82f6' },
              { id: 'lab-2', name: 'Sprint 1', color: '#8b5cf6' }
            ],
            dueDate: '2026-08-25',
            checklists: [
              {
                id: 'chk-1',
                title: 'Lista de Requisitos',
                items: [
                  { id: 'i-1', text: 'Criar autenticação', completed: false },
                  { id: 'i-2', text: 'Validar senha criptografada', completed: false },
                  { id: 'i-3', text: 'Criar sessão de usuário', completed: false },
                  { id: 'i-4', text: 'Testar login', completed: false }
                ]
              }
            ],
            comments: [
              {
                id: 'comm-1',
                authorName: userName,
                authorAvatar: userPhoto,
                text: 'adicionou este cartão a Backlog',
                createdAt: '2026-03-05 19:25'
              }
            ],
            createdAt: '2026-03-05'
          },
          {
            id: 'c-2',
            listId: 'l-backlog',
            title: 'Sistema de login',
            description: 'Implementar fluxo JWT e recuperação de senha por e-mail.',
            coverColor: '',
            labels: [{ id: 'lab-1', name: 'Segurança', color: '#ef4444' }],
            checklists: [
              {
                id: 'chk-2',
                title: 'Checklist Login',
                items: [
                  { id: 'i-21', text: 'Formulário Responsivo', completed: true },
                  { id: 'i-22', text: 'Token JWT em cookies', completed: false },
                  { id: 'i-23', text: 'OAuth Google Integration', completed: false },
                  { id: 'i-24', text: 'Múltiplos Dispositivos', completed: false }
                ]
              }
            ],
            createdAt: '2026-03-06'
          },
          {
            id: 'c-3',
            listId: 'l-refinement',
            title: 'Definir arquitetura do sistema',
            description: 'Mapear diagramas de banco de dados, microsserviços e APIs.',
            coverColor: '#8b5cf6',
            labels: [{ id: 'lab-3', name: 'Arquitetura', color: '#a855f7' }],
            createdAt: '2026-03-02'
          },
          {
            id: 'c-4',
            listId: 'l-refinement',
            title: 'Modelagem do banco de dados',
            description: 'Estruturação de tabelas Firestore & PostgreSQL.',
            coverColor: '',
            checklists: [
              {
                id: 'chk-4',
                title: 'Tabelas Básicas',
                items: [
                  { id: 'i-41', text: 'Users & Roles', completed: true },
                  { id: 'i-42', text: 'Projects & Tasks', completed: true },
                  { id: 'i-43', text: 'Logs', completed: false },
                  { id: 'i-44', text: 'Backup policy', completed: false }
                ]
              }
            ],
            createdAt: '2026-03-03'
          },
          {
            id: 'c-5',
            listId: 'l-sprint',
            title: 'Configurar ambiente de desenvolvimento',
            description: 'Instalar Docker, Node.js e scripts de build automatizados.',
            coverColor: '#ef4444',
            labels: [{ id: 'lab-4', name: 'DevOps', color: '#f97316' }],
            createdAt: '2026-03-01'
          },
          {
            id: 'c-6',
            listId: 'l-tests',
            title: 'Teste de Carga e Integração',
            description: 'Testar endpoints com volume concorrente.',
            coverColor: '#ef4444',
            createdAt: '2026-03-07'
          },
          {
            id: 'c-7',
            listId: 'l-done',
            title: 'Conclusão de requisitos iniciais',
            description: 'Levantamento de requisitos aprovado com o time.',
            coverColor: '#10b981',
            completed: true,
            dueDate: '2026-01-23',
            createdAt: '2026-01-20'
          }
        ]
      };
      setProjects([demoProject]);
    }
  }, []);

  // --- Image Processing & Clipboard Handlers ---
  const handleProcessImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessImageFile(file);
            return;
          }
        }
      }
    }
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleProcessImageFile(file);
      }
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-image.png', { type: imageType });
            handleProcessImageFile(file);
            return;
          }
        }
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http') || text.startsWith('data:image/'))) {
          setProjectCover(text.trim());
        }
      }
    } catch (err) {
      console.error('Clipboard read failed or permission denied:', err);
    }
  };

  // --- Project Hub Handlers (Creation & Editing) ---
  const handleOpenNewProjectModal = () => {
    setEditingProject(null);
    setProjectTitle('');
    setProjectQuote('');
    setProjectDesc('');
    setProjectCategory('Software');
    setProjectTargetYear('2026');
    setProjectCover('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000');
    setProjectTemplate('scrum');
    setProjectFavorite(false);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectQuote(project.quote || '');
    setProjectDesc(project.description || '');
    setProjectCategory(project.category || 'Software');
    setProjectTargetYear(project.targetYear || '2026');
    setProjectCover(project.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000');
    setProjectFavorite(project.favorite || false);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectTitle.trim()) return;

    if (editingProject) {
      // Update existing project
      setProjects(prev => prev.map(p => {
        if (p.id === editingProject.id) {
          return {
            ...p,
            title: projectTitle.trim(),
            quote: projectQuote.trim(),
            description: projectDesc.trim(),
            category: projectCategory,
            targetYear: projectTargetYear.trim(),
            coverImage: projectCover.trim(),
            favorite: projectFavorite,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    } else {
      // Create new project
      let defaultLists: ProjectList[] = [];
      if (projectTemplate === 'scrum') {
        defaultLists = [
          { id: `l-${Date.now()}-1`, title: 'Ideias 💡', order: 0 },
          { id: `l-${Date.now()}-2`, title: 'Em planejamento 📐', order: 1 },
          { id: `l-${Date.now()}-3`, title: 'Backlog 📋', order: 2 },
          { id: `l-${Date.now()}-4`, title: 'REFINAMENTO ⚙️', order: 3 },
          { id: `l-${Date.now()}-5`, title: 'SPRINT BACKLOG 🚀', order: 4 },
          { id: `l-${Date.now()}-6`, title: 'Em desenvolvimento ⚡', order: 5 },
          { id: `l-${Date.now()}-7`, title: 'Revisão de código 🔍', order: 6 },
          { id: `l-${Date.now()}-8`, title: 'Concluído 🎆', order: 7 },
        ];
      } else if (projectTemplate === 'kanban') {
        defaultLists = [
          { id: `l-${Date.now()}-1`, title: 'Ideias 💡', order: 0 },
          { id: `l-${Date.now()}-2`, title: 'Em planejamento 📐', order: 1 },
          { id: `l-${Date.now()}-3`, title: 'A Fazer 📋', order: 2 },
          { id: `l-${Date.now()}-4`, title: 'Em Progresso ⏳', order: 3 },
          { id: `l-${Date.now()}-5`, title: 'Concluído ✅', order: 4 },
        ];
      } else {
        defaultLists = [
          { id: `l-${Date.now()}-1`, title: 'Ideias 💡', order: 0 },
          { id: `l-${Date.now()}-2`, title: 'Em planejamento 📐', order: 1 },
          { id: `l-${Date.now()}-3`, title: 'A Fazer 📋', order: 2 }
        ];
      }

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: projectTitle.trim(),
        quote: projectQuote.trim(),
        description: projectDesc.trim() || 'Projeto criado para acompanhamento no estilo Trello/Kanban.',
        category: projectCategory,
        targetYear: projectTargetYear.trim(),
        coverImage: projectCover || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000',
        colorTheme: 'orange',
        status: 'ativo',
        favorite: projectFavorite,
        lists: defaultLists,
        cards: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setProjects(prev => [newProject, ...prev]);
      addXp(40);
      setActiveProjectId(newProject.id);
    }

    setIsProjectModalOpen(false);
  };

  const toggleFavoriteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, favorite: !p.favorite };
      }
      return p;
    }));
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este projeto e todas as suas listas/cartões?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    }
  };

  // --- Kanban Board Handlers ---
  const handleSaveNewList = () => {
    if (!newListModalTitle.trim() || !activeProjectId) return;
    const title = newListModalTitle.trim();

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const newList: ProjectList = {
          id: `l-${Date.now()}`,
          title: title,
          order: p.lists.length
        };
        return {
          ...p,
          lists: [...p.lists, newList],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    setNewListModalTitle('');
    setIsAddListModalOpen(false);
    addXp(10);
  };

  const handleOpenEditListModal = (list: ProjectList) => {
    setEditingListModal(list);
    setEditListTitleInput(list.title);
  };

  const handleSaveEditedList = () => {
    if (!editingListModal || !editListTitleInput.trim() || !activeProjectId) return;
    const newName = editListTitleInput.trim();

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          lists: p.lists.map(l => l.id === editingListModal.id ? { ...l, title: newName } : l),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    setEditingListModal(null);
    setEditListTitleInput('');
  };

  const handleDeleteListFromModal = () => {
    if (!editingListModal || !activeProjectId) return;
    if (window.confirm(`Excluir a lista "${editingListModal.title}" e todos os seus cartões?`)) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            lists: p.lists.filter(l => l.id !== editingListModal.id),
            cards: p.cards.filter(c => c.listId !== editingListModal.id),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
      setEditingListModal(null);
    }
  };

  const handleAddCardInline = (listId: string) => {
    if (!newCardTitleInput.trim() || !activeProjectId) return;

    const newCard: ProjectCard = {
      id: `c-${Date.now()}`,
      listId: listId,
      title: newCardTitleInput.trim(),
      description: '',
      createdAt: new Date().toISOString().split('T')[0],
      comments: [
        {
          id: `comm-${Date.now()}`,
          authorName: userName,
          authorAvatar: userPhoto,
          text: `criou este cartão`,
          createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        }
      ]
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: [...p.cards, newCard],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    setNewCardTitleInput('');
    setAddingCardForListId(null);
    addXp(15);
  };

  const handleMoveCard = (cardId: string, targetListId: string) => {
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const targetList = p.lists.find(l => l.id === targetListId);
        const listName = targetList ? targetList.title : 'outra lista';

        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === cardId) {
              const newComments = [
                ...(c.comments || []),
                {
                  id: `comm-${Date.now()}`,
                  authorName: userName,
                  authorAvatar: userPhoto,
                  text: `moveu este cartão para ${listName}`,
                  createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                }
              ];
              return {
                ...c,
                listId: targetListId,
                comments: newComments
              };
            }
            return c;
          }),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    if (selectedCardForDetail && selectedCardForDetail.id === cardId) {
      setSelectedCardForDetail(prev => prev ? { ...prev, listId: targetListId } : null);
    }
  };

  const handleToggleCardCompleted = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === cardId) {
              const isComp = !c.completed;
              if (isComp) addXp(15);
              return { ...c, completed: isComp };
            }
            return c;
          }),
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    if (selectedCardForDetail && selectedCardForDetail.id === cardId) {
      setSelectedCardForDetail(prev => prev ? { ...prev, completed: !prev.completed } : null);
    }
  };

  // --- Detailed Card Modal Handlers ---
  const handleSaveCardDescription = () => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, description: cardDescInput.trim() };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, description: cardDescInput.trim() } : null);
    setEditingCardDesc(false);
  };

  const handleAddChecklistItem = () => {
    if (!selectedCardForDetail || !newChecklistItemInput.trim() || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              const existingChecklists = c.checklists || [];
              let updatedChecklists: ProjectCardChecklist[] = [];

              if (existingChecklists.length === 0) {
                updatedChecklists = [
                  {
                    id: `chk-${Date.now()}`,
                    title: 'Lista de Tarefas',
                    items: [
                      { id: `i-${Date.now()}`, text: newChecklistItemInput.trim(), completed: false }
                    ]
                  }
                ];
              } else {
                updatedChecklists = existingChecklists.map((chk, idx) => {
                  if (idx === 0) {
                    return {
                      ...chk,
                      items: [
                        ...chk.items,
                        { id: `i-${Date.now()}`, text: newChecklistItemInput.trim(), completed: false }
                      ]
                    };
                  }
                  return chk;
                });
              }

              return { ...c, checklists: updatedChecklists };
            }
            return c;
          })
        };
      }
      return p;
    }));

    // Sync selected card
    setSelectedCardForDetail(prev => {
      if (!prev) return null;
      const existing = prev.checklists || [];
      if (existing.length === 0) {
        return {
          ...prev,
          checklists: [
            {
              id: `chk-${Date.now()}`,
              title: 'Lista de Tarefas',
              items: [{ id: `i-${Date.now()}`, text: newChecklistItemInput.trim(), completed: false }]
            }
          ]
        };
      } else {
        return {
          ...prev,
          checklists: existing.map((chk, idx) => idx === 0 ? {
            ...chk,
            items: [...chk.items, { id: `i-${Date.now()}`, text: newChecklistItemInput.trim(), completed: false }]
          } : chk)
        };
      }
    });

    setNewChecklistItemInput('');
  };

  const handleToggleChecklistItem = (chkId: string, itemId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedCards = p.cards.map(c => {
          if (c.id === selectedCardForDetail.id) {
            const updatedChecklists = (c.checklists || []).map(chk => {
              if (chk.id === chkId) {
                return {
                  ...chk,
                  items: chk.items.map(item => {
                    if (item.id === itemId) {
                      if (!item.completed) addXp(5);
                      return { ...item, completed: !item.completed };
                    }
                    return item;
                  })
                };
              }
              return chk;
            });
            const updatedCard = { ...c, checklists: updatedChecklists };
            const autoResult = checkAndApplyChecklistAutomation(updatedCard, p.lists);
            if (autoResult.moved) addXp(20);
            return autoResult.card;
          }
          return c;
        });
        return { ...p, cards: updatedCards };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => {
      if (!prev) return null;
      const updatedChecklists = (prev.checklists || []).map(chk => {
        if (chk.id === chkId) {
          return {
            ...chk,
            items: chk.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
          };
        }
        return chk;
      });
      const updatedCard = { ...prev, checklists: updatedChecklists };
      const currentProj = projects.find(p => p.id === activeProjectId);
      if (currentProj) {
        return checkAndApplyChecklistAutomation(updatedCard, currentProj.lists).card;
      }
      return updatedCard;
    });
  };

  const handleDeleteChecklist = (chkId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return {
                ...c,
                checklists: (c.checklists || []).filter(chk => chk.id !== chkId)
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      checklists: (prev.checklists || []).filter(chk => chk.id !== chkId)
    } : null);
  };

  // --- Sub-items & Sub-lists Handlers ---
  const handleAddSubItemToChecklist = (chkId: string, parentItemId: string, text: string) => {
    if (!selectedCardForDetail || !text.trim() || !activeProjectId) return;
    const subText = text.trim();

    const updateChecklists = (checklists: ProjectCardChecklist[]) => {
      return (checklists || []).map(chk => {
        if (chk.id === chkId) {
          return {
            ...chk,
            items: chk.items.map(item => {
              if (item.id === parentItemId) {
                const subItems = item.subItems || [];
                return {
                  ...item,
                  subItems: [
                    ...subItems,
                    { id: `sub-${Date.now()}`, text: subText, completed: false }
                  ]
                };
              }
              return item;
            })
          };
        }
        return chk;
      });
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, checklists: updateChecklists(c.checklists || []) };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, checklists: updateChecklists(prev.checklists || []) } : null);
    setAddingSubItemForItemId(null);
    setSubItemInput('');
  };

  const handleToggleSubChecklistItem = (chkId: string, parentItemId: string, subItemId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    const updateChecklists = (checklists: ProjectCardChecklist[]) => {
      return (checklists || []).map(chk => {
        if (chk.id === chkId) {
          return {
            ...chk,
            items: chk.items.map(item => {
              if (item.id === parentItemId) {
                const subItems = (item.subItems || []).map(sub => {
                  if (sub.id === subItemId) {
                    if (!sub.completed) addXp(5);
                    return { ...sub, completed: !sub.completed };
                  }
                  return sub;
                });
                return { ...item, subItems };
              }
              return item;
            })
          };
        }
        return chk;
      });
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updatedCards = p.cards.map(c => {
          if (c.id === selectedCardForDetail.id) {
            const updatedCard = { ...c, checklists: updateChecklists(c.checklists || []) };
            const autoResult = checkAndApplyChecklistAutomation(updatedCard, p.lists);
            if (autoResult.moved) addXp(20);
            return autoResult.card;
          }
          return c;
        });
        return { ...p, cards: updatedCards };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => {
      if (!prev) return null;
      const updatedCard = { ...prev, checklists: updateChecklists(prev.checklists || []) };
      const currentProj = projects.find(p => p.id === activeProjectId);
      if (currentProj) {
        return checkAndApplyChecklistAutomation(updatedCard, currentProj.lists).card;
      }
      return updatedCard;
    });
  };

  const handleDeleteSubChecklistItem = (chkId: string, parentItemId: string, subItemId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    const updateChecklists = (checklists: ProjectCardChecklist[]) => {
      return (checklists || []).map(chk => {
        if (chk.id === chkId) {
          return {
            ...chk,
            items: chk.items.map(item => {
              if (item.id === parentItemId) {
                return {
                  ...item,
                  subItems: (item.subItems || []).filter(s => s.id !== subItemId)
                };
              }
              return item;
            })
          };
        }
        return chk;
      });
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, checklists: updateChecklists(c.checklists || []) };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, checklists: updateChecklists(prev.checklists || []) } : null);
  };

  const handleAddChecklistGroup = (title: string) => {
    if (!selectedCardForDetail || !title.trim() || !activeProjectId) return;
    const groupTitle = title.trim();

    const newGroup: ProjectCardChecklist = {
      id: `chk-${Date.now()}`,
      title: groupTitle,
      items: []
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, checklists: [...(c.checklists || []), newGroup] };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, checklists: [...(prev.checklists || []), newGroup] } : null);
    setNewChecklistGroupTitle('');
    setActiveAddPopUp(null);
  };

  const handleSaveCardDates = () => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return {
                ...c,
                startDate: cardStartDateInput || c.startDate,
                dueDate: cardDueDateInput || c.dueDate
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      startDate: cardStartDateInput || prev.startDate,
      dueDate: cardDueDateInput || prev.dueDate
    } : null);

    setActiveAddPopUp(null);
  };

  const handleAddAssignee = () => {
    if (!selectedCardForDetail || !cardAssigneeInput.trim() || !activeProjectId) return;
    const name = cardAssigneeInput.trim();

    const newAssignee = { id: `ass-${Date.now()}`, name };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, assignees: [...(c.assignees || []), newAssignee] };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      assignees: [...(prev.assignees || []), newAssignee]
    } : null);

    setCardAssigneeInput('');
    setActiveAddPopUp(null);
  };

  const handleRemoveAssignee = (id: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, assignees: (c.assignees || []).filter(a => a.id !== id) };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      assignees: (prev.assignees || []).filter(a => a.id !== id)
    } : null);
  };

  // Priority Handler
  const handleSetCardPriority = (priority: 'baixa' | 'media' | 'alta' | 'urgente' | undefined) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, priority };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, priority } : null);
    setActiveAddPopUp(null);
  };

  // Estimativa e Log de Horas Handler
  const handleSaveCardHours = () => {
    if (!selectedCardForDetail || !activeProjectId) return;
    const est = cardEstimatedHoursInput ? Math.max(0, parseFloat(cardEstimatedHoursInput) || 0) : undefined;
    const log = cardLoggedHoursInput ? Math.max(0, parseFloat(cardLoggedHoursInput) || 0) : undefined;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, estimatedHours: est, loggedHours: log };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, estimatedHours: est, loggedHours: log } : null);
    setActiveAddPopUp(null);
  };

  // Detect Attachment / Link Type
  const detectLinkType = (url: string, preset?: string): 'link' | 'file' | 'figma' | 'github' | 'notion' | 'drive' => {
    if (preset && preset !== 'link') return preset as any;
    const lower = (url || '').toLowerCase();
    if (lower.includes('figma.com')) return 'figma';
    if (lower.includes('github.com')) return 'github';
    if (lower.includes('notion.so') || lower.includes('notion.site')) return 'notion';
    if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) return 'drive';
    if (lower.startsWith('data:') || lower.match(/\.(pdf|doc|docx|png|jpg|jpeg|gif|zip|rar)$/i)) return 'file';
    return 'link';
  };

  const handleAddAttachment = () => {
    if (!selectedCardForDetail || !cardAttachmentNameInput.trim() || !activeProjectId) return;

    const url = cardAttachmentUrlInput.trim() || 'https://';
    const type = detectLinkType(url, attachmentPresetType);

    const newAtt = {
      id: `att-${Date.now()}`,
      name: cardAttachmentNameInput.trim(),
      url: url,
      type: type
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, attachments: [...(c.attachments || []), newAtt] };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      attachments: [...(prev.attachments || []), newAtt]
    } : null);

    setCardAttachmentNameInput('');
    setCardAttachmentUrlInput('');
    setAttachmentPresetType('link');
    setActiveAddPopUp(null);
  };

  // --- Drag and Drop Handlers for Cards and Lists ---
  const handleCardDragStart = (e: React.DragEvent, cardId: string, sourceListId: string) => {
    e.stopPropagation();
    setDraggedCardId(cardId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'card', cardId, sourceListId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedCardId && draggedCardId !== cardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleListDragOver = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    if (draggedCardId || draggedListId) {
      setDragOverListId(listId);
    }
  };

  const handleListDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Reorder Lists / Columns
    if (draggedListId && draggedListId !== targetListId && activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          const listIndex = p.lists.findIndex(l => l.id === draggedListId);
          const targetIndex = p.lists.findIndex(l => l.id === targetListId);
          if (listIndex === -1 || targetIndex === -1) return p;

          const newLists = [...p.lists];
          const [movedList] = newLists.splice(listIndex, 1);
          newLists.splice(targetIndex, 0, movedList);

          return {
            ...p,
            lists: newLists.map((l, idx) => ({ ...l, order: idx })),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }

    // 2. Move Card to List / Position
    else if (draggedCardId && activeProjectId) {
      handleMoveCardToPosition(draggedCardId, targetListId, dragOverCardId);
    }

    setDraggedCardId(null);
    setDraggedListId(null);
    setDragOverListId(null);
    setDragOverCardId(null);
  };

  const handleMoveCardToPosition = (cardId: string, targetListId: string, targetCardId?: string | null) => {
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const sourceCard = p.cards.find(c => c.id === cardId);
        if (!sourceCard) return p;

        const targetList = p.lists.find(l => l.id === targetListId);
        const listName = targetList ? targetList.title : 'outra lista';
        const changedList = sourceCard.listId !== targetListId;

        let newComments = sourceCard.comments || [];
        if (changedList) {
          newComments = [
            ...newComments,
            {
              id: `comm-${Date.now()}`,
              authorName: userName,
              authorAvatar: userPhoto,
              text: `moveu este cartão para ${listName}`,
              createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            }
          ];
        }

        const updatedCard = {
          ...sourceCard,
          listId: targetListId,
          comments: newComments
        };

        const otherCards = p.cards.filter(c => c.id !== cardId);

        let finalCards = [];
        if (targetCardId && targetCardId !== cardId) {
          const targetIndex = otherCards.findIndex(c => c.id === targetCardId);
          if (targetIndex !== -1) {
            finalCards = [...otherCards];
            finalCards.splice(targetIndex, 0, updatedCard);
          } else {
            finalCards = [...otherCards, updatedCard];
          }
        } else {
          finalCards = [...otherCards, updatedCard];
        }

        return {
          ...p,
          cards: finalCards,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    if (selectedCardForDetail && selectedCardForDetail.id === cardId) {
      setSelectedCardForDetail(prev => prev ? { ...prev, listId: targetListId } : null);
    }
  };

  const handleListHeaderDragStart = (e: React.DragEvent, listId: string) => {
    e.stopPropagation();
    setDraggedListId(listId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'list', listId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDeleteAttachment = (attId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, attachments: (c.attachments || []).filter(a => a.id !== attId) };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      attachments: (prev.attachments || []).filter(a => a.id !== attId)
    } : null);
  };

  const handleAddCustomField = () => {
    if (!selectedCardForDetail || !cardCustomFieldNameInput.trim() || !activeProjectId) return;

    const newField = {
      id: `cf-${Date.now()}`,
      name: cardCustomFieldNameInput.trim(),
      value: cardCustomFieldValueInput.trim() || '-'
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, customFields: [...(c.customFields || []), newField] };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    } : null);

    setCardCustomFieldNameInput('');
    setCardCustomFieldValueInput('');
    setActiveAddPopUp(null);
  };

  const handleDeleteCustomField = (fieldId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, customFields: (c.customFields || []).filter(f => f.id !== fieldId) };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      customFields: (prev.customFields || []).filter(f => f.id !== fieldId)
    } : null);
  };

  const handleAddComment = () => {
    if (!selectedCardForDetail || !newCommentInput.trim() || !activeProjectId) return;

    const newComment: ProjectCardComment = {
      id: `comm-${Date.now()}`,
      authorName: userName,
      authorAvatar: userPhoto,
      text: newCommentInput.trim(),
      createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return {
                ...c,
                comments: [...(c.comments || []), newComment]
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      comments: [...(prev.comments || []), newComment]
    } : null);

    setNewCommentInput('');
  };

  const handleAddLabelToCard = () => {
    if (!selectedCardForDetail || !newLabelInput.trim() || !activeProjectId) return;

    const newLab = {
      id: `lab-${Date.now()}`,
      name: newLabelInput.trim(),
      color: selectedLabelColor
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return {
                ...c,
                labels: [...(c.labels || []), newLab]
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      labels: [...(prev.labels || []), newLab]
    } : null);

    setNewLabelInput('');
    setShowLabelPicker(false);
  };

  const handleRemoveLabelFromCard = (labelId: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return {
                ...c,
                labels: (c.labels || []).filter(l => l.id !== labelId)
              };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? {
      ...prev,
      labels: (prev.labels || []).filter(l => l.id !== labelId)
    } : null);
  };

  const handleSetCoverColor = (colorHex: string) => {
    if (!selectedCardForDetail || !activeProjectId) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          cards: p.cards.map(c => {
            if (c.id === selectedCardForDetail.id) {
              return { ...c, coverColor: colorHex };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => prev ? { ...prev, coverColor: colorHex } : null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!activeProjectId) return;
    if (window.confirm('Tem certeza que deseja excluir este cartão?')) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            cards: p.cards.filter(c => c.id !== cardId)
          };
        }
        return p;
      }));

      if (selectedCardForDetail?.id === cardId) {
        setSelectedCardForDetail(null);
      }
    }
  };

  // Filtered Projects for Hub
  const filteredHubProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(hubSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(hubSearch.toLowerCase()));
    const matchesCategory = hubCategory === 'Todos' || p.category === hubCategory;
    const matchesStatus = hubStatus === 'todos' || p.status === hubStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. INITIAL PROJECTS HUB VIEW (When no active project selected)  */}
      {/* ------------------------------------------------------------- */}
      {!activeProject ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Hub Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider font-mono">
                <FolderKanban className="h-4 w-4" />
                <span>Hub de Projetos & Sprints</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Projetos</h1>
              <p className="text-xs text-zinc-400 max-w-xl">
                Crie quadros no estilo Trello para organizar suas ideias, roadmaps, tarefas e sprints de desenvolvimento.
              </p>
            </div>

            <button
              onClick={handleOpenNewProjectModal}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.3)] transition-all cursor-pointer shrink-0 active:scale-95 relative z-10"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Projeto</span>
            </button>
          </div>

          {/* Hub Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/80">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar projeto por título..."
                value={hubSearch}
                onChange={(e) => setHubSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
              />
              {hubSearch && (
                <button
                  onClick={() => setHubSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setHubCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    hubCategory === cat
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/60 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHubProjects.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3">
                <FolderKanban className="h-10 w-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-400">Nenhum projeto encontrado</p>
                <p className="text-xs text-zinc-600">Crie seu primeiro projeto para iniciar a organização estilo Trello.</p>
                <button
                  onClick={handleOpenNewProjectModal}
                  className="bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold text-xs px-4 py-2 rounded-xl hover:bg-orange-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Projeto</span>
                </button>
              </div>
            ) : (
              filteredHubProjects.map(project => {
                const totalCards = project.cards.length;
                const completedCards = project.cards.filter(c => c.completed).length;
                const progressPct = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    onClick={() => setActiveProjectId(project.id)}
                    className="bg-zinc-950/80 border border-zinc-900 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-orange-500/5 group cursor-pointer flex flex-col justify-between"
                  >
                    {/* Card Top Banner Image / Gradient */}
                    <div className="h-28 w-full relative overflow-hidden bg-zinc-900">
                      {project.coverImage ? (
                        <img
                          src={project.coverImage}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-orange-950 to-amber-950 opacity-80" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                      {/* Category Badge, Target Year & Action Buttons */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                            {project.category || 'Geral'}
                          </span>
                          {project.targetYear && (
                            <span className="bg-zinc-950/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {project.targetYear}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditProjectModal(project, e)}
                            className="p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 hover:text-orange-400 hover:border-orange-500/40 transition-colors"
                            title="Editar Projeto"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => toggleFavoriteProject(project.id, e)}
                            className={`p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 transition-colors ${
                              project.favorite ? 'text-amber-400 border-amber-500/40' : 'text-zinc-500 hover:text-white'
                            }`}
                            title="Favoritar"
                          >
                            <Star className={`h-3.5 w-3.5 ${project.favorite ? 'fill-amber-400' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
                            title="Excluir Projeto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-white group-hover:text-orange-400 transition-colors leading-tight">
                          {project.title}
                        </h3>
                        {project.quote && (
                          <p className="text-xs text-orange-300/90 italic font-serif border-l-2 border-orange-500/60 pl-2 my-1 line-clamp-1">
                            "{project.quote}"
                          </p>
                        )}
                        {project.description && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar & Stats */}
                      <div className="space-y-2 pt-2 border-t border-zinc-900">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 font-medium">Progresso Geral</span>
                          <span className="font-mono font-bold text-orange-400">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        {/* Stats Badges */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400 font-mono">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1" title="Listas">
                              <Layers className="h-3.5 w-3.5 text-zinc-500" />
                              {project.lists.length}
                            </span>
                            <span className="flex items-center gap-1" title="Total de Cartões">
                              <CheckSquare className="h-3.5 w-3.5 text-zinc-500" />
                              {totalCards}
                            </span>
                          </div>
                          <span className="text-zinc-500 text-[10px]">
                            {completedCards}/{totalCards} concluídas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-900/80 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Abrir Quadro Kanban
                      </span>
                      <div className="flex items-center gap-1 text-orange-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
                        <span>Acessar</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. DEDICATED PROJECT KANBAN BOARD VIEW (Matching Reference Images) */
        /* ------------------------------------------------------------- */
        <div className="space-y-4 animate-fadeIn">
          {/* Top Breadcrumb & Action Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveProjectId(null)}
                className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800/80 transition-all flex items-center justify-center cursor-pointer hover:border-orange-500/40 shadow-sm"
                title="Voltar"
              >
                <ArrowLeft className="h-4 w-4 text-orange-500" />
              </button>

              <div className="h-4 w-[1px] bg-zinc-800/80" />

              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {activeProject.title}
                  </h1>
                  <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    {activeProject.category || 'Geral'}
                  </span>
                </div>
                {activeProject.description && (
                  <p className="text-xs text-zinc-400 line-clamp-1 font-normal">{activeProject.description}</p>
                )}
              </div>
            </div>

            {/* Board Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Expandable Filter Input */}
              {isSearchExpanded || boardSearch ? (
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Filtrar cartões..."
                    value={boardSearch}
                    onChange={(e) => setBoardSearch(e.target.value)}
                    autoFocus
                    className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 w-44 sm:w-56 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => { setBoardSearch(''); setIsSearchExpanded(false); }}
                    className="absolute right-2 text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                    title="Fechar busca"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-orange-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Filtrar cartões"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}

              {/* Edit Project Icon Button */}
              <button
                type="button"
                onClick={(e) => handleOpenEditProjectModal(activeProject, e)}
                className="p-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-orange-400 border border-zinc-800 hover:border-orange-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Editar Projeto"
              >
                <Edit3 className="h-4 w-4 text-orange-400" />
              </button>

              {/* Add List Icon Button */}
              <button
                type="button"
                onClick={() => setIsAddListModalOpen(true)}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 transition-all cursor-pointer flex items-center gap-1.5"
                title="Nova Lista"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Lista</span>
              </button>
            </div>
          </div>

          {/* CENTERED COMPACT VIEW SWITCHER NAVBAR */}
          <div className="flex items-center justify-center w-full py-1">
            <div className="inline-flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-1.5 shadow-xl shadow-black/40 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveViewMode('quadro')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'quadro'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('tabela')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'tabela'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                }`}
              >
                <Table className="h-4 w-4" />
                <span>Tabela</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('cronograma')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'cronograma'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Cronograma</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('painel')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'painel'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/40'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Painel</span>
              </button>
            </div>
          </div>

          {/* 1. KANBAN BOARD CONTAINER (Horizontal Scrollable Column Layout with Expanded Widths) */}
          {activeViewMode === 'quadro' && (
            <div className="flex items-start gap-4 overflow-x-auto horizontal-scrollbar pb-6 pt-1 min-h-[calc(100vh-270px)]">
              {activeProject.lists.map(list => {
                // Get cards for this list
                const listCards = activeProject.cards.filter(c => {
                  const isList = c.listId === list.id;
                  if (!isList) return false;
                  if (!boardSearch) return true;
                  return c.title.toLowerCase().includes(boardSearch.toLowerCase()) ||
                    (c.description && c.description.toLowerCase().includes(boardSearch.toLowerCase()));
                });

                return (
                  <div
                    key={list.id}
                    onDragOver={(e) => handleListDragOver(e, list.id)}
                    onDrop={(e) => handleListDrop(e, list.id)}
                    className={`w-80 sm:w-96 md:w-[380px] lg:w-[420px] shrink-0 bg-zinc-900/40 backdrop-blur-md border ${
                      dragOverListId === list.id ? 'border-orange-500/80 bg-zinc-900/80 ring-2 ring-orange-500/20' : 'border-zinc-800/60'
                    } rounded-2xl flex flex-col max-h-[calc(100vh-270px)] shadow-xl transition-all`}
                  >
                    {/* List Header (Draggable for list reordering) */}
                    <div
                      draggable
                      onDragStart={(e) => handleListHeaderDragStart(e, list.id)}
                      className="p-3.5 border-b border-zinc-800/50 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-zinc-800/30 transition-colors rounded-t-2xl group/header"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-zinc-600 group-hover/header:text-orange-400 transition-colors" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                          {list.title}
                        </h3>
                        <span className="bg-zinc-800/80 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700/40 font-mono">
                          {listCards.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditListModal(list)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Editar Lista"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Cards Stack Area */}
                    <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                      {listCards.map(card => {
                        // Calculate checklist progress for preview
                        let completedChecklistItems = 0;
                        let totalChecklistItems = 0;
                        if (card.checklists) {
                          card.checklists.forEach(chk => {
                            chk.items.forEach(it => {
                              totalChecklistItems++;
                              if (it.completed) completedChecklistItems++;
                              if (it.subItems) {
                                it.subItems.forEach(sub => {
                                  totalChecklistItems++;
                                  if (sub.completed) completedChecklistItems++;
                                });
                              }
                            });
                          });
                        }

                        const dueStatus = checkDueStatus(card.dueDate, card.dueTime, card.completed);

                        return (
                          <motion.div
                            key={card.id}
                            layout
                            draggable
                            onDragStart={(e) => handleCardDragStart(e, card.id, list.id)}
                            onDragOver={(e) => handleCardDragOver(e, card.id)}
                            onDrop={(e) => handleListDrop(e, list.id)}
                            onClick={() => {
                              setSelectedCardForDetail(card);
                              setCardDescInput(card.description || '');
                              setCardEstimatedHoursInput(card.estimatedHours !== undefined ? card.estimatedHours.toString() : '');
                              setCardLoggedHoursInput(card.loggedHours !== undefined ? card.loggedHours.toString() : '');
                            }}
                            className={`bg-zinc-900/70 hover:bg-zinc-900 border ${
                              draggedCardId === card.id
                                ? 'border-orange-500 opacity-40 scale-95'
                                : dragOverCardId === card.id
                                ? 'border-t-2 border-t-orange-500 border-zinc-800/80'
                                : dueStatus.isOverdue
                                ? 'border-red-500/80 bg-red-950/20 ring-1 ring-red-500/40 shadow-lg shadow-red-500/10'
                                : dueStatus.isDueSoon
                                ? 'border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                                : card.completed
                                ? 'border-emerald-500/30 opacity-70'
                                : 'border-zinc-800/80 hover:border-orange-500/40'
                            } rounded-xl p-3 space-y-2.5 transition-all shadow-md hover:shadow-orange-500/5 cursor-grab active:cursor-grabbing relative group overflow-hidden`}
                          >
                            {/* Top Cover Bar */}
                            {card.coverColor && (
                              <div
                                className="h-1 w-full rounded-full mb-1 opacity-90"
                                style={{ backgroundColor: card.coverColor }}
                              />
                            )}

                            {/* Priority & Labels / Tags Pills */}
                            <div className="flex flex-wrap items-center gap-1">
                              {/* Priority Badge */}
                              {card.priority && PRIORITY_CONFIG[card.priority] && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border flex items-center gap-1 uppercase tracking-wider ${PRIORITY_CONFIG[card.priority].bg} ${PRIORITY_CONFIG[card.priority].text} ${PRIORITY_CONFIG[card.priority].border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[card.priority].dot}`} />
                                  <span>{PRIORITY_CONFIG[card.priority].label}</span>
                                </span>
                              )}

                              {/* Labels */}
                              {card.labels && card.labels.length > 0 && (
                                card.labels.map(lbl => (
                                  <span
                                    key={lbl.id}
                                    className="text-[9px] font-medium px-2 py-0.5 rounded-md text-white shadow-sm"
                                    style={{ backgroundColor: lbl.color || '#3b82f6' }}
                                  >
                                    {lbl.name}
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Title with Checkbox */}
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleToggleCardCompleted(card.id, e)}
                                className={`mt-0.5 shrink-0 h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                                  card.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-black'
                                    : 'border-zinc-700 hover:border-orange-500'
                                }`}
                              >
                                {card.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </button>

                              <span className={`text-xs font-semibold leading-snug flex-1 ${
                                card.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                              }`}>
                                {card.title}
                              </span>
                            </div>

                            {/* Footer Indicators */}
                            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 font-mono border-t border-zinc-800/50">
                              <div className="flex flex-wrap items-center gap-2">
                                {card.description && (
                                  <span title="Possui descrição">
                                    <List className="h-3 w-3 text-zinc-500" />
                                  </span>
                                )}

                                {totalChecklistItems > 0 && (
                                  <span
                                    className={`flex items-center gap-1 font-bold ${
                                      completedChecklistItems === totalChecklistItems
                                        ? 'text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'
                                        : 'text-zinc-400'
                                    }`}
                                    title="Checklist com sub-itens"
                                  >
                                    <CheckSquare className="h-3 w-3 text-orange-400" />
                                    <span>{completedChecklistItems}/{totalChecklistItems}</span>
                                  </span>
                                )}

                                {(card.estimatedHours !== undefined || card.loggedHours !== undefined) && (
                                  <span
                                    className="flex items-center gap-1 text-[9px] font-mono font-bold bg-zinc-950/90 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30"
                                    title={`Esforço: ${card.loggedHours || 0}h trabalhadas / ${card.estimatedHours || 0}h estimadas`}
                                  >
                                    <Clock className="h-3 w-3 text-orange-400" />
                                    <span>{card.loggedHours || 0}/{card.estimatedHours || 0}h</span>
                                  </span>
                                )}

                                {card.attachments && card.attachments.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-orange-400/90 font-bold" title={`${card.attachments.length} anexo(s)`}>
                                    <Paperclip className="h-3 w-3 text-orange-400" />
                                    <span>{card.attachments.length}</span>
                                  </span>
                                )}

                                {card.comments && card.comments.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-zinc-400" title="Comentários">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{card.comments.length}</span>
                                  </span>
                                )}
                              </div>

                              {card.dueDate && (
                                <span
                                  className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md border font-mono shrink-0 ${
                                    dueStatus.isOverdue
                                      ? 'bg-red-500/20 text-red-300 border-red-500/50 font-bold'
                                      : dueStatus.isDueSoon
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                      : 'bg-zinc-950/80 text-orange-400/90 border-zinc-800'
                                  }`}
                                >
                                  {dueStatus.isOverdue ? (
                                    <AlertTriangle className="h-3 w-3 text-red-400 animate-pulse" />
                                  ) : dueStatus.isDueSoon ? (
                                    <Flame className="h-3 w-3 text-amber-400 animate-bounce" />
                                  ) : (
                                    <Clock className="h-3 w-3 text-orange-400" />
                                  )}
                                  <span>{dueStatus.text || card.dueDate}</span>
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Add Card Button at Bottom of Column */}
                    <div className="p-2 border-t border-zinc-800/50">
                      {addingCardForListId === list.id ? (
                        <div className="space-y-2 p-1">
                          <textarea
                            placeholder="Digite o título do cartão..."
                            value={newCardTitleInput}
                            onChange={(e) => setNewCardTitleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddCardInline(list.id);
                              }
                            }}
                            autoFocus
                            rows={2}
                            className="w-full bg-zinc-950 border border-orange-500/50 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddCardInline(list.id)}
                              className="bg-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-orange-600 transition-colors cursor-pointer"
                            >
                              Adicionar cartão
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingCardForListId(null);
                                setNewCardTitleInput('');
                              }}
                              className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingCardForListId(list.id)}
                          className="w-full py-2 px-3 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-orange-400 transition-all text-xs font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <Plus className="h-4 w-4 text-orange-500" />
                          <span>Adicionar um cartão</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* "+ Adicionar outra lista" Column Button */}
              <div className="w-80 sm:w-96 md:w-[380px] lg:w-[420px] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewListModalTitle('');
                    setIsAddListModalOpen(true);
                  }}
                  className="w-full py-4 px-4 bg-zinc-900/30 hover:bg-zinc-900/60 border border-dashed border-zinc-800 hover:border-orange-500/50 rounded-2xl text-zinc-400 hover:text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-orange-500/5"
                >
                  <Plus className="h-4 w-4 text-orange-400" />
                  <span>Adicionar Nova Lista</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. TABELA VIEW */}
          {activeViewMode === 'tabela' && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 shadow-xl space-y-4 overflow-x-auto horizontal-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <h3 className="text-xs font-bold text-white uppercase font-sans tracking-wider flex items-center gap-2">
                  <Table className="h-4 w-4 text-orange-400" />
                  <span>Visão em Tabela</span>
                </h3>
                <span className="text-xs text-zinc-500 font-mono">
                  {activeProject.cards.length} tarefas cadastradas
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Lista / Etapa</th>
                    <th className="py-2.5 px-3">Título da Tarefa</th>
                    <th className="py-2.5 px-3">Atribuídos</th>
                    <th className="py-2.5 px-3">Etiquetas</th>
                    <th className="py-2.5 px-3">Prazo</th>
                    <th className="py-2.5 px-3">Progresso</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {activeProject.cards.filter(c => {
                    if (!boardSearch) return true;
                    return c.title.toLowerCase().includes(boardSearch.toLowerCase()) ||
                      (c.description && c.description.toLowerCase().includes(boardSearch.toLowerCase()));
                  }).map(card => {
                    let totalItems = 0;
                    let doneItems = 0;
                    (card.checklists || []).forEach(chk => {
                      chk.items.forEach(it => {
                        totalItems++;
                        if (it.completed) doneItems++;
                        (it.subItems || []).forEach(sub => {
                          totalItems++;
                          if (sub.completed) doneItems++;
                        });
                      });
                    });
                    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : (card.completed ? 100 : 0);

                    return (
                      <tr key={card.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="py-3 px-3">
                          <select
                            value={card.listId}
                            onChange={(e) => handleMoveCard(card.id, e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-orange-400 font-bold focus:outline-none cursor-pointer"
                          >
                            {activeProject.lists.map(l => (
                              <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 font-medium text-white">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCardForDetail(card);
                              setCardDescInput(card.description || '');
                            }}
                            className="hover:text-orange-400 transition-colors text-left font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <span className={card.completed ? 'line-through text-zinc-500' : ''}>{card.title}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {card.assignees && card.assignees.length > 0 ? (
                            <div className="flex -space-x-1">
                              {card.assignees.map(a => (
                                <span key={a.id} className="h-6 w-6 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-bold flex items-center justify-center uppercase" title={a.name}>
                                  {a.name.substring(0, 2)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[10px]">Sem atribuição</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {card.labels && card.labels.length > 0 ? (
                              card.labels.map(lbl => (
                                <span key={lbl.id} className="text-[9px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: lbl.color || '#3b82f6' }}>
                                  {lbl.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-600 font-mono text-[10px]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                          {card.dueDate ? (
                            <span className="flex items-center gap-1 text-orange-400 font-bold">
                              <Clock className="h-3 w-3" />
                              <span>{card.dueDate}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                              <span>{pct}%</span>
                              <span>{doneItems}/{totalItems}</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCardForDetail(card);
                              setCardDescInput(card.description || '');
                            }}
                            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Abrir Detalhes"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Tarefa"
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
          )}

          {/* 3. CRONOGRAMA / TIMELINE VIEW */}
          {activeViewMode === 'cronograma' && (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orange-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cronograma do Projeto</h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Planejamento {activeProject.targetYear || '2026'}</span>
              </div>

              <div className="space-y-3">
                {activeProject.cards.map(card => {
                  const list = activeProject.lists.find(l => l.id === card.listId);
                  return (
                    <div key={card.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-orange-500/40 transition-all">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                            {list ? list.title : 'Lista'}
                          </span>
                          <h4
                            className="text-sm font-semibold text-white hover:text-orange-400 transition-colors cursor-pointer"
                            onClick={() => { setSelectedCardForDetail(card); setCardDescInput(card.description || ''); }}
                          >
                            {card.title}
                          </h4>
                        </div>
                        {card.description && <p className="text-xs text-zinc-400 line-clamp-1">{card.description}</p>}
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs shrink-0">
                        <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                          <Clock className="h-3.5 w-3.5 text-orange-400" />
                          <span className="text-zinc-300">{card.startDate || 'Sem início'}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-orange-400 font-bold">{card.dueDate || 'Sem prazo'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => { setSelectedCardForDetail(card); setCardDescInput(card.description || ''); }}
                          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 px-3.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. PAINEL / DASHBOARD VIEW */}
          {activeViewMode === 'painel' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total de Tarefas</span>
                  <div className="text-2xl font-black text-white font-mono">{activeProject.cards.length}</div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tarefas Concluídas</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {activeProject.cards.filter(c => c.completed).length}
                    <span className="text-xs text-zinc-500 ml-2 font-sans font-normal">
                      ({activeProject.cards.length > 0 ? Math.round((activeProject.cards.filter(c => c.completed).length / activeProject.cards.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Horas Estimadas vs Logadas</span>
                  <div className="text-2xl font-black text-orange-400 font-mono">
                    {activeProject.cards.reduce((a, c) => a + (c.loggedHours || 0), 0)}h / {activeProject.cards.reduce((a, c) => a + (c.estimatedHours || 0), 0)}h
                  </div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tarefas com Prazo</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {activeProject.cards.filter(c => c.dueDate).length}
                  </div>
                </div>
              </div>

              {/* Burndown Chart Section */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      <span>Gráfico de Burndown & Progresso da Sprint</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Visualização da velocidade de conclusão de tarefas em relação ao prazo final
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-0.5 bg-zinc-500 border-t border-dashed border-zinc-400" />
                      <span className="text-zinc-400">Meta Ideal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-1 bg-orange-500 rounded-full" />
                      <span className="text-orange-400 font-bold">Progresso Real</span>
                    </div>
                  </div>
                </div>

                {/* SVG Interactive Burndown Graph */}
                {(() => {
                  const totalCards = activeProject.cards.length || 10;
                  const completedCards = activeProject.cards.filter(c => c.completed).length;
                  const totalDays = 10;
                  
                  // Construct 10-day sprint points
                  const points = Array.from({ length: totalDays + 1 }, (_, i) => {
                    const ideal = Math.max(0, totalCards - (i * (totalCards / totalDays)));
                    // Calculate actual remaining linearly progressing to current completion
                    const currentDay = 6;
                    let actual = null;
                    if (i <= currentDay) {
                      actual = Math.max(0, totalCards - Math.round((completedCards * (i / currentDay))));
                    }
                    return { day: i, ideal, actual };
                  });

                  const svgWidth = 600;
                  const svgHeight = 200;
                  const padding = 35;

                  const getX = (day: number) => padding + (day / totalDays) * (svgWidth - 2 * padding);
                  const getY = (val: number) => svgHeight - padding - (val / Math.max(1, totalCards)) * (svgHeight - 2 * padding);

                  const idealPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.ideal)}`).join(' ');
                  
                  const actualPoints = points.filter(p => p.actual !== null);
                  const actualPath = actualPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.actual!)}`).join(' ');

                  const fillPath = actualPoints.length > 0
                    ? `${actualPath} L ${getX(actualPoints[actualPoints.length - 1].day)} ${svgHeight - padding} L ${getX(0)} ${svgHeight - padding} Z`
                    : '';

                  return (
                    <div className="space-y-4">
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[550px]">
                          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
                            <defs>
                              <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                              </linearGradient>
                            </defs>

                            {/* Y-Axis Gridlines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                              const y = svgHeight - padding - ratio * (svgHeight - 2 * padding);
                              const val = Math.round(ratio * totalCards);
                              return (
                                <g key={ratio}>
                                  <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="3 3" />
                                  <text x={padding - 8} y={y + 4} fill="#71717a" fontSize="10" textAnchor="end" fontFamily="monospace">
                                    {val}
                                  </text>
                                </g>
                              );
                            })}

                            {/* X-Axis Labels */}
                            {points.map((p) => {
                              const x = getX(p.day);
                              return (
                                <text key={p.day} x={x} y={svgHeight - 10} fill="#71717a" fontSize="10" textAnchor="middle" fontFamily="monospace">
                                  D{p.day}
                                </text>
                              );
                            })}

                            {/* Area fill under actual path */}
                            {fillPath && <path d={fillPath} fill="url(#burndownGrad)" />}

                            {/* Ideal Burndown Line */}
                            <path d={idealPath} fill="none" stroke="#52525b" strokeWidth="2" strokeDasharray="4 4" />

                            {/* Actual Burndown Line */}
                            {actualPath && <path d={actualPath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />}

                            {/* Actual Dots */}
                            {actualPoints.map((p) => {
                              const x = getX(p.day);
                              const y = getY(p.actual!);
                              return (
                                <g key={p.day} className="group/dot cursor-pointer">
                                  <circle cx={x} cy={y} r="5" fill="#18181b" stroke="#f97316" strokeWidth="2.5" />
                                  <circle cx={x} cy={y} r="9" fill="#f97316" opacity="0.2" className="group-hover/dot:scale-150 transition-transform" />
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      {/* Burndown KPI summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono border-t border-zinc-800/60 text-xs">
                        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                          <span className="text-zinc-500 uppercase text-[10px] font-bold block">Velocidade Atual</span>
                          <span className="text-white font-bold text-sm">
                            {(completedCards / 6).toFixed(1)} tarefas / dia
                          </span>
                        </div>
                        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                          <span className="text-zinc-500 uppercase text-[10px] font-bold block">Horas de Esforço Logadas</span>
                          <span className="text-orange-400 font-bold text-sm">
                            {activeProject.cards.reduce((a, c) => a + (c.loggedHours || 0), 0)}h de {activeProject.cards.reduce((a, c) => a + (c.estimatedHours || 0), 0)}h estimadas
                          </span>
                        </div>
                        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                          <span className="text-zinc-500 uppercase text-[10px] font-bold block">Previsão da Sprint</span>
                          <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>100% No Prazo (Sprint Ativa)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quote & Lema Banner */}
              {activeProject.quote && (
                <div className="bg-gradient-to-r from-orange-950/30 via-zinc-900/40 to-zinc-900/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-5 space-y-1 shadow-lg">
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider block">
                    Frase de Inspiração do Projeto
                  </span>
                  <p className="text-sm font-serif italic text-orange-200">"{activeProject.quote}"</p>
                </div>
              )}

              {/* List Breakdown */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Distribuição por Lista
                </h3>

                <div className="space-y-3">
                  {activeProject.lists.map(list => {
                    const count = activeProject.cards.filter(c => c.listId === list.id).length;
                    const pct = activeProject.cards.length > 0 ? Math.round((count / activeProject.cards.length) * 100) : 0;

                    return (
                      <div key={list.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-300 font-bold">{list.title}</span>
                          <span className="text-orange-400 font-bold">{count} cartões ({pct}%)</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DETAILED CARD MODAL OVERLAY (Matching Reference Image 3)    */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedCardForDetail && activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCardForDetail(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-4xl w-full relative z-50 overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col"
            >
              {/* Optional Cover Banner Header */}
              {selectedCardForDetail.coverColor && (
                <div
                  className="h-10 w-full relative transition-all"
                  style={{ backgroundColor: selectedCardForDetail.coverColor }}
                />
              )}

              {/* Modal Top Header Bar */}
              <div className="p-4 sm:p-6 border-b border-zinc-900 flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* List Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">Em lista</span>
                    <select
                      value={selectedCardForDetail.listId}
                      onChange={(e) => handleMoveCard(selectedCardForDetail.id, e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-orange-400 font-bold focus:outline-none cursor-pointer"
                    >
                      {activeProject.lists.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Card Title Input */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleCardCompleted(selectedCardForDetail.id)}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedCardForDetail.completed
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'border-zinc-600 hover:border-orange-500'
                      }`}
                    >
                      {selectedCardForDetail.completed && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <h2 className={`text-xl font-black text-white tracking-tight ${
                      selectedCardForDetail.completed ? 'line-through text-zinc-500' : ''
                    }`}>
                      {selectedCardForDetail.title}
                    </h2>
                  </div>

                  {/* Due Warning Banner if due soon or overdue */}
                  {(() => {
                    const status = checkDueStatus(selectedCardForDetail.dueDate, selectedCardForDetail.dueTime, selectedCardForDetail.completed);
                    if (!status.isOverdue && !status.isDueSoon) return null;
                    return (
                      <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold font-mono ${
                        status.isOverdue
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          {status.isOverdue ? (
                            <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse shrink-0" />
                          ) : (
                            <Flame className="h-4 w-4 text-amber-400 animate-bounce shrink-0" />
                          )}
                          <span>
                            {status.isOverdue
                              ? `⚠️ ATENÇÃO: Esta tarefa está ATRASADA! Prazo final era ${selectedCardForDetail.dueDate} (${status.text}).`
                              : `🔥 ALERTA DE PRAZO PRÓXIMO: Esta tarefa vence em menos de 24h (${status.text})!`}
                          </span>
                        </div>
                        {selectedCardForDetail.dueTime && (
                          <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/10 shrink-0">
                            Hora: {selectedCardForDetail.dueTime}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Interactive Idea Banner if card is in Ideias list */}
                  {(() => {
                    const currentList = activeProject.lists.find(l => l.id === selectedCardForDetail.listId);
                    const isIdeaCard = (currentList && currentList.title.toLowerCase().includes('ideia')) || selectedCardForDetail.title.toLowerCase().includes('ideia');
                    if (!isIdeaCard) return null;

                    return (
                      <div className="mt-3 p-3.5 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                            <Lightbulb className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                              <span>Rascunho de Ideia Rápida</span>
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-500/30">Em Elaboração</span>
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Desenvolva suas anotações e checklists abaixo para estruturar esta ideia.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const planList = activeProject.lists.find(l => 
                                l.title.toLowerCase().includes('planejamento') || l.title.toLowerCase().includes('fazer') || l.title.toLowerCase().includes('backlog')
                              );
                              if (planList) {
                                handleMoveCard(selectedCardForDetail.id, planList.id);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Promover p/ Planejamento 📐</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCardForDetail(null)}
                  className="p-2 text-zinc-500 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Actions Bar (Etiquetas, Datas, Checklist, Membros, Capa) */}
              <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/50 border-b border-zinc-900 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {/* Cover Color Selector */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Capa:</span>
                  <div className="flex items-center gap-1">
                    {COVER_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSetCoverColor(c.hex)}
                        style={{ backgroundColor: c.hex || '#27272a' }}
                        className={`h-5 w-5 rounded-full border ${
                          selectedCardForDetail.coverColor === c.hex ? 'border-white scale-110' : 'border-transparent'
                        } cursor-pointer transition-transform`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-4 w-[1px] bg-zinc-800 shrink-0" />

                {/* Add Label */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLabelPicker(!showLabelPicker);
                      setActiveAddPopUp(null);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Tag className="h-3.5 w-3.5 text-orange-400" />
                    <span>Etiquetas</span>
                  </button>

                  {/* Label Picker Dropdown */}
                  {showLabelPicker && (
                    <div className="absolute top-10 left-0 z-50 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-2xl space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block font-mono">Criar etiqueta</span>
                      <input
                        type="text"
                        placeholder="Nome da etiqueta..."
                        value={newLabelInput}
                        onChange={(e) => setNewLabelInput(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        {['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f97316'].map(col => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setSelectedLabelColor(col)}
                            style={{ backgroundColor: col }}
                            className={`h-5 w-5 rounded-full border ${
                              selectedLabelColor === col ? 'border-white scale-110' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddLabelToCard}
                        className="w-full bg-orange-500 text-white font-bold text-xs py-1 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>

                {/* Priority Selector */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddPopUp(activeAddPopUp === 'prioridade' ? null : 'prioridade');
                      setShowLabelPicker(false);
                    }}
                    className={`border text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedCardForDetail.priority && PRIORITY_CONFIG[selectedCardForDetail.priority]
                        ? `${PRIORITY_CONFIG[selectedCardForDetail.priority].bg} ${PRIORITY_CONFIG[selectedCardForDetail.priority].text} ${PRIORITY_CONFIG[selectedCardForDetail.priority].border}`
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span>
                      {selectedCardForDetail.priority && PRIORITY_CONFIG[selectedCardForDetail.priority]
                        ? `Prioridade: ${PRIORITY_CONFIG[selectedCardForDetail.priority].label}`
                        : 'Prioridade'}
                    </span>
                  </button>

                  {/* Priority Picker Dropdown */}
                  {activeAddPopUp === 'prioridade' && (
                    <div className="absolute top-10 left-0 z-50 w-52 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl space-y-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono px-2 py-1">
                        Selecionar Prioridade
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetCardPriority(undefined)}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                          !selectedCardForDetail.priority ? 'text-orange-400 font-bold bg-zinc-800/50' : 'text-zinc-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                        <span>Sem Prioridade</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCardPriority('baixa')}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                          selectedCardForDetail.priority === 'baixa' ? 'text-emerald-400 font-bold bg-zinc-800/50' : 'text-zinc-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Baixa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCardPriority('media')}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                          selectedCardForDetail.priority === 'media' ? 'text-sky-400 font-bold bg-zinc-800/50' : 'text-zinc-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Média</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCardPriority('alta')}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                          selectedCardForDetail.priority === 'alta' ? 'text-orange-400 font-bold bg-zinc-800/50' : 'text-zinc-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span>Alta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCardPriority('urgente')}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors ${
                          selectedCardForDetail.priority === 'urgente' ? 'text-red-400 font-bold bg-zinc-800/50' : 'text-zinc-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>🔥 Urgente / Crítica</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Attachments / Links Button */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddPopUp(activeAddPopUp === 'anexo' ? null : 'anexo');
                      setShowLabelPicker(false);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-orange-400" />
                    <span>Anexos & Links</span>
                    {selectedCardForDetail.attachments && selectedCardForDetail.attachments.length > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {selectedCardForDetail.attachments.length}
                      </span>
                    )}
                  </button>

                  {/* Attachments Dropdown Modal */}
                  {activeAddPopUp === 'anexo' && (
                    <div className="absolute top-10 left-0 z-50 w-80 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5 text-orange-400" />
                          <span>Adicionar Anexo ou Link</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveAddPopUp(null)}
                          className="text-zinc-500 hover:text-white p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">
                          Tipo de Integração / Link:
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'link', label: 'Geral', icon: Link },
                            { id: 'figma', label: 'Figma', icon: Figma },
                            { id: 'github', label: 'GitHub', icon: Github },
                            { id: 'notion', label: 'Notion', icon: FileText },
                            { id: 'drive', label: 'Drive', icon: Globe },
                            { id: 'file', label: 'Arquivo', icon: Paperclip },
                          ].map(p => {
                            const Icon = p.icon;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setAttachmentPresetType(p.id as any)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                                  attachmentPresetType === p.id
                                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                <span>{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nome / Título (ex: Protótipo no Figma)..."
                          value={cardAttachmentNameInput}
                          onChange={(e) => setCardAttachmentNameInput(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                        />
                        <input
                          type="url"
                          placeholder="Link URL (https://...)..."
                          value={cardAttachmentUrlInput}
                          onChange={(e) => setCardAttachmentUrlInput(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                        />
                        <button
                          type="button"
                          onClick={handleAddAttachment}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Anexar ao Cartão
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Horas / Esforço Button */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddPopUp(activeAddPopUp === 'horas' ? null : 'horas');
                      setShowLabelPicker(false);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-orange-400" />
                    <span>Horas / Esforço</span>
                    {(selectedCardForDetail.estimatedHours !== undefined || selectedCardForDetail.loggedHours !== undefined) && (
                      <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                        {selectedCardForDetail.loggedHours || 0}/{selectedCardForDetail.estimatedHours || 0}h
                      </span>
                    )}
                  </button>

                  {/* Horas Dropdown Popup */}
                  {activeAddPopUp === 'horas' && (
                    <div className="absolute top-10 left-0 z-50 w-72 bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase">
                          <Clock className="h-3.5 w-3.5 text-orange-400" />
                          <span>Estimativa de Horas</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveAddPopUp(null)}
                          className="text-zinc-500 hover:text-white p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase block mb-1">
                            Horas Estimadas (Planejadas):
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="ex: 8"
                            value={cardEstimatedHoursInput}
                            onChange={(e) => setCardEstimatedHoursInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase block mb-1">
                            Horas Trabalhadas (Executadas):
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="ex: 4.5"
                            value={cardLoggedHoursInput}
                            onChange={(e) => setCardLoggedHoursInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveCardHours}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Salvar Esforço
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete Card */}
                <button
                  type="button"
                  onClick={() => handleDeleteCard(selectedCardForDetail.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ml-auto shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir Cartão</span>
                </button>
              </div>

              {/* Modal Body Grid (Left: Description & Checklists, Right: Activity & Comments) */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* Left Column (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Labels active display */}
                  {selectedCardForDetail.labels && selectedCardForDetail.labels.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-mono">Etiquetas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCardForDetail.labels.map(lbl => (
                          <span
                            key={lbl.id}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5"
                            style={{ backgroundColor: lbl.color || '#3b82f6' }}
                          >
                            <span>{lbl.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLabelFromCard(lbl.id)}
                              className="hover:text-black transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section: Descrição */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <List className="h-4 w-4 text-orange-400" />
                        <span>Descrição</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCardDesc(!editingCardDesc)}
                        className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                      >
                        {editingCardDesc ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>

                    {editingCardDesc ? (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={cardDescInput}
                          onChange={(e) => setCardDescInput(e.target.value)}
                          placeholder="Adicione uma descrição mais detalhada..."
                          className="w-full bg-zinc-900 border border-orange-500/50 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none resize-y"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCardDescription}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Salvar Descrição
                        </button>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {selectedCardForDetail.description || 'Nenhuma descrição informada. Clique em "Editar" para adicionar.'}
                      </div>
                    )}
                  </div>

                  {/* Section: Estimativa vs Horas Trabalhadas */}
                  {(selectedCardForDetail.estimatedHours !== undefined || selectedCardForDetail.loggedHours !== undefined) && (
                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <span>Estimativa e Horas de Esforço</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveAddPopUp('horas')}
                          className="text-[11px] text-orange-400 hover:underline font-mono cursor-pointer"
                        >
                          Editar Horas
                        </button>
                      </div>

                      {(() => {
                        const est = selectedCardForDetail.estimatedHours || 0;
                        const log = selectedCardForDetail.loggedHours || 0;
                        const pct = est > 0 ? Math.min(100, Math.round((log / est) * 100)) : (log > 0 ? 100 : 0);
                        const isOvertime = est > 0 && log > est;

                        return (
                          <div className="space-y-2 font-mono">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400">Progresso Executado:</span>
                              <span className={isOvertime ? 'text-red-400 font-bold' : 'text-orange-400 font-bold'}>
                                {log}h / {est}h ({pct}%)
                                {isOvertime && ` • +${(log - est).toFixed(1)}h acima`}
                              </span>
                            </div>

                            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOvertime ? 'bg-red-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Section: Anexos e Links Úteis */}
                  {selectedCardForDetail.attachments && selectedCardForDetail.attachments.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                          <Paperclip className="h-4 w-4 text-orange-400" />
                          <span>Anexos e Links Úteis ({selectedCardForDetail.attachments.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveAddPopUp(activeAddPopUp === 'anexo' ? null : 'anexo')}
                          className="text-xs font-bold text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedCardForDetail.attachments.map(att => {
                          const type = att.type || detectLinkType(att.url);
                          
                          const typeBadge = {
                            figma: { name: 'Figma', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-300', icon: Figma },
                            github: { name: 'GitHub', bg: 'bg-zinc-800 border-zinc-700 text-zinc-200', icon: Github },
                            notion: { name: 'Notion', bg: 'bg-slate-800 border-slate-700 text-slate-200', icon: FileText },
                            drive: { name: 'Google Drive', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', icon: Globe },
                            file: { name: 'Arquivo', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300', icon: Paperclip },
                            link: { name: 'Link', bg: 'bg-orange-500/15 border-orange-500/30 text-orange-300', icon: Link }
                          }[type] || { name: 'Link', bg: 'bg-zinc-800 border-zinc-700 text-zinc-300', icon: Link };

                          const IconComponent = typeBadge.icon;

                          return (
                            <div key={att.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3 group/att hover:border-orange-500/40 transition-all">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg border shrink-0 ${typeBadge.bg}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                                    {typeBadge.name}
                                  </span>
                                  <p className="text-xs font-bold text-white truncate group-hover/att:text-orange-400 transition-colors">
                                    {att.name}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                                    {att.url}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-zinc-400 hover:text-orange-400 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Abrir link externo"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(att.url);
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-white bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Copiar URL"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir anexo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section: Checklists */}
                  <div className="space-y-4">
                    {selectedCardForDetail.checklists && selectedCardForDetail.checklists.map(chk => {
                      let total = 0;
                      let done = 0;
                      chk.items.forEach(i => {
                        total++;
                        if (i.completed) done++;
                        if (i.subItems) {
                          i.subItems.forEach(s => {
                            total++;
                            if (s.completed) done++;
                          });
                        }
                      });
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                      return (
                        <div key={chk.id} className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                              <CheckSquare className="h-4 w-4 text-orange-400" />
                              <span>{chk.title}</span>
                              <span className="text-xs font-mono text-orange-400 font-bold">{pct}%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteChecklist(chk.id)}
                              className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Items List */}
                          <div className="space-y-2.5 pt-1">
                            {chk.items.map(item => (
                              <div key={item.id} className="space-y-1.5">
                                <div className="flex items-center justify-between group/item">
                                  <div className="flex items-center gap-2.5 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklistItem(chk.id, item.id)}
                                      className={`h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                        item.completed
                                          ? 'bg-emerald-500 border-emerald-500 text-black'
                                          : 'border-zinc-700 hover:border-orange-500'
                                      }`}
                                    >
                                      {item.completed && <CheckCircle2 className="h-3 w-3" />}
                                    </button>
                                    <span className={`text-xs ${
                                      item.completed ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'
                                    }`}>
                                      {item.text}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingSubItemForItemId(addingSubItemForItemId === item.id ? null : item.id);
                                      setSubItemInput('');
                                    }}
                                    className="text-[10px] text-zinc-500 hover:text-orange-400 font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-1"
                                    title="Adicionar sublista ao item"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Sublista</span>
                                  </button>
                                </div>

                                {/* Render Nested Sub-items */}
                                {item.subItems && item.subItems.length > 0 && (
                                  <div className="ml-6 border-l-2 border-zinc-800/80 pl-3 space-y-1.5 pt-1">
                                    {item.subItems.map(sub => (
                                      <div key={sub.id} className="flex items-center justify-between group/sub">
                                        <div className="flex items-center gap-2">
                                          <CornerDownRight className="h-3 w-3 text-zinc-600 shrink-0" />
                                          <button
                                            type="button"
                                            onClick={() => handleToggleSubChecklistItem(chk.id, item.id, sub.id)}
                                            className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                              sub.completed
                                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                                : 'border-zinc-700 hover:border-orange-500'
                                            }`}
                                          >
                                            {sub.completed && <Check className="h-2.5 w-2.5" />}
                                          </button>
                                          <span className={`text-[11px] ${
                                            sub.completed ? 'line-through text-zinc-500' : 'text-zinc-300'
                                          }`}>
                                            {sub.text}
                                          </span>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubChecklistItem(chk.id, item.id, sub.id)}
                                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-pointer p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Inline Sub-item Input */}
                                {addingSubItemForItemId === item.id && (
                                  <div className="ml-6 pl-3 flex items-center gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Novo subitem..."
                                      value={subItemInput}
                                      onChange={(e) => setSubItemInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddSubItemToChecklist(chk.id, item.id, subItemInput);
                                        if (e.key === 'Escape') setAddingSubItemForItemId(null);
                                      }}
                                      autoFocus
                                      className="flex-1 bg-zinc-950 border border-orange-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddSubItemToChecklist(chk.id, item.id, subItemInput)}
                                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                                    >
                                      Adicionar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAddingSubItemForItemId(null)}
                                      className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Checklist Item Form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Adicionar um item principal à lista..."
                        value={newChecklistItemInput}
                        onChange={(e) => setNewChecklistItemInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChecklistItem();
                        }}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklistItem}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Comments & Activity History */}
                <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-zinc-900 lg:pl-6 pt-4 lg:pt-0">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <MessageSquare className="h-4 w-4 text-orange-400" />
                    <span>Comentários e atividade</span>
                  </div>

                  {/* Comment Input Box */}
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={newCommentInput}
                      onChange={(e) => setNewCommentInput(e.target.value)}
                      placeholder="Escrever um comentário..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Comentar</span>
                    </button>
                  </div>

                  {/* Activity Timeline List */}
                  <div className="space-y-3 pt-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {selectedCardForDetail.comments && selectedCardForDetail.comments.length > 0 ? (
                      selectedCardForDetail.comments.map(comm => (
                        <div key={comm.id} className="flex items-start gap-2.5 bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl text-xs">
                          <img
                            src={comm.authorAvatar || userPhoto}
                            alt={comm.authorName}
                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 border border-orange-500/30"
                          />
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                              <span className="font-bold text-zinc-300">{comm.authorName}</span>
                              <span>{comm.createdAt}</span>
                            </div>
                            <p className="text-zinc-300 leading-relaxed font-sans">{comm.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 font-mono italic text-center py-4">Nenhuma atividade registrada.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 4. EXPANDED NEW / EDIT PROJECT MODAL                          */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onPaste={handlePaste}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProjectModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-5xl w-full p-6 sm:p-8 relative z-50 overflow-hidden shadow-2xl space-y-6 max-h-[90vh] flex flex-col my-auto"
            >
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight uppercase font-mono">
                      {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Personalize a capa, lema, prazos e estrutura do seu quadro Kanban.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body: Two-Column Expanded Desktop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {/* Left Column: Form Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Title & Quote */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block font-mono">
                        Título do Projeto *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Lançamento do App, Redesenho da Marca..."
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1.5 text-amber-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          Frase / Lema de Inspiração (Opcional)
                        </span>
                        <span className="text-[10px] text-zinc-500 lowercase font-sans">estilo vision board</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Foco total na experiência do usuário e escalabilidade..."
                        value={projectQuote}
                        onChange={(e) => setProjectQuote(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/60 rounded-xl px-4 py-2.5 text-xs text-amber-200/90 italic font-serif placeholder-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block font-mono">
                        Descrição ou Objetivo
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Descreva brevemente a meta final, contexto ou diretrizes..."
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Options Grid: Category, Year, Template, Favorite */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                        Área / Categoria
                      </label>
                      <select
                        value={projectCategory}
                        onChange={(e) => setProjectCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                        Ano / Prazo Alvo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2026, Q3 2026, Dez/2026"
                        value={projectTargetYear}
                        onChange={(e) => setProjectTargetYear(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    {!editingProject && (
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                          Modelo do Quadro Inicial
                        </label>
                        <select
                          value={projectTemplate}
                          onChange={(e) => setProjectTemplate(e.target.value as any)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="scrum">Scrum Completo (Backlog, Refinamento, Sprint, Dev, Revisão, Concluído)</option>
                          <option value="kanban">Kanban Padrão (A Fazer 📋, Em Progresso ⏳, Concluído ✅)</option>
                          <option value="vazio">Minimalista (1 Lista Inicial)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Personalização da Capa (Upload por Link, Clipboard, Arquivo Local, Presets) */}
                  <div className="space-y-3 pt-2 border-t border-zinc-900">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between font-mono">
                      <span>Capa do Card</span>
                      <span className="text-[10px] text-zinc-500 font-sans font-normal">Link, Arquivo ou Ctrl+V</span>
                    </label>

                    {/* Upload Actions Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-orange-400" />
                        <span>Upload Local</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Colar imagem ou URL copiada"
                      >
                        <Clipboard className="h-3.5 w-3.5 text-amber-400" />
                        <span>Colar da Área de Transferência</span>
                      </button>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <Link className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={projectCover}
                        onChange={(e) => setProjectCover(e.target.value)}
                        placeholder="Cole o link da imagem (https://...)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>

                    {/* Quick Preset Images */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">
                        Sugestões Rápida de Capa:
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {PRESET_COVERS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProjectCover(preset.url)}
                            className={`relative w-16 h-10 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer group ${
                              projectCover === preset.url ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <span className="absolute inset-0 bg-black/40 flex items-end p-1 text-[8px] font-bold text-white leading-tight truncate">
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Card Live Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <span>Pré-visualização do Card</span>
                    <span className="text-[10px] text-orange-400 font-sans font-normal">Ao vivo</span>
                  </div>

                  {/* Card Preview Box */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between sticky top-0">
                    {/* Cover Header */}
                    <div className="h-32 w-full relative overflow-hidden bg-zinc-900">
                      {projectCover ? (
                        <img
                          src={projectCover}
                          alt="Pré-visualização"
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-orange-950 to-amber-950 opacity-80" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-orange-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                            {projectCategory || 'Software'}
                          </span>
                          {projectTargetYear && (
                            <span className="bg-zinc-950/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {projectTargetYear}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setProjectFavorite(!projectFavorite)}
                          className={`p-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 transition-colors ${
                            projectFavorite ? 'text-amber-400 border-amber-500/40' : 'text-zinc-500 hover:text-white'
                          }`}
                          title="Favoritar"
                        >
                          <Star className={`h-3.5 w-3.5 ${projectFavorite ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-white leading-tight">
                          {projectTitle || 'Título do Seu Projeto'}
                        </h3>
                        {projectQuote && (
                          <p className="text-xs text-orange-300/90 italic font-serif border-l-2 border-orange-500/60 pl-2 my-1">
                            "{projectQuote}"
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                          {projectDesc || 'Descrição do projeto e metas gerais que ficarão visíveis para a equipe.'}
                        </p>
                      </div>

                      {/* Progress Bar Mock */}
                      <div className="space-y-2 pt-2 border-t border-zinc-900">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 font-medium">Progresso Inicial</span>
                          <span className="font-mono font-bold text-orange-400">0%</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full w-12" />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-zinc-900/40 border-t border-zinc-900 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">Modo Trello / Kanban</span>
                      <span className="text-orange-400 text-xs font-bold flex items-center gap-1">
                        Acessar <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-zinc-900 shrink-0">
                <p className="text-[11px] text-zinc-500 hidden sm:block">
                  Dica: Você pode arrastar ou colar imagens diretamente no modal.
                </p>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={!projectTitle.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{editingProject ? 'Salvar Alterações' : 'Criar Projeto'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: CRIAR NOVA LISTA (Modal Interface)                  */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddListModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 relative z-50 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Criar Nova Lista</h3>
                    <p className="text-[11px] text-zinc-400">Adicione uma nova coluna ao seu fluxo de trabalho.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddListModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                    Nome da Lista
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ideias 💡, Em planejamento 📐..."
                    value={newListModalTitle}
                    onChange={(e) => setNewListModalTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNewList();
                      if (e.key === 'Escape') setIsAddListModalOpen(false);
                    }}
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                    Sugestões Rápidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Ideias 💡',
                      'Em planejamento 📐',
                      'A Fazer 📋',
                      'Em desenvolvimento ⚡',
                      'Revisão de código 🔍',
                      'Em testes 🧪',
                      'Concluído 🎆'
                    ].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewListModalTitle(sug)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsAddListModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewList}
                  disabled={!newListModalTitle.trim()}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Criar Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: EDITAR NOME DA LISTA (Modal Interface)              */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {editingListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingListModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-5 relative z-50 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Editar Nome da Lista</h3>
                    <p className="text-[11px] text-zinc-400">Renomeie ou exclua esta coluna do Kanban.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingListModal(null)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                    Título da Coluna
                  </label>
                  <input
                    type="text"
                    value={editListTitleInput}
                    onChange={(e) => setEditListTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEditedList();
                      if (e.key === 'Escape') setEditingListModal(null);
                    }}
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block">
                    Sugestões de Ícone / Nome:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Ideias 💡',
                      'Em planejamento 📐',
                      'A Fazer 📋',
                      'Em desenvolvimento ⚡',
                      'Revisão de código 🔍',
                      'Concluído 🎆'
                    ].map(sug => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setEditListTitleInput(sug)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-zinc-900">
                <button
                  type="button"
                  onClick={handleDeleteListFromModal}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir Lista</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingListModal(null)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedList}
                    disabled={!editListTitleInput.trim()}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    Salvar Nome
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
