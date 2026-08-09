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
  Check
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

  // Sub-items & Card Features State
  const [addingSubItemForItemId, setAddingSubItemForItemId] = useState<string | null>(null);
  const [subItemInput, setSubItemInput] = useState('');
  const [newChecklistGroupTitle, setNewChecklistGroupTitle] = useState('');

  // Modals / Dropdowns inside Card Detail Modal ("Adicionar ao cartão")
  const [activeAddPopUp, setActiveAddPopUp] = useState<'etiquetas' | 'datas' | 'checklist' | 'membros' | 'anexo' | 'campos' | null>(null);
  const [cardStartDateInput, setCardStartDateInput] = useState('');
  const [cardDueDateInput, setCardDueDateInput] = useState('');
  const [cardAssigneeInput, setCardAssigneeInput] = useState('');
  const [cardAttachmentNameInput, setCardAttachmentNameInput] = useState('');
  const [cardAttachmentUrlInput, setCardAttachmentUrlInput] = useState('');
  const [cardCustomFieldNameInput, setCardCustomFieldNameInput] = useState('');
  const [cardCustomFieldValueInput, setCardCustomFieldValueInput] = useState('');

  // New List State
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

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
          { id: 'l-backlog', title: 'Backlog', order: 0 },
          { id: 'l-refinement', title: 'REFINAMENTO', order: 1 },
          { id: 'l-sprint', title: 'SPRINT BACKLOG', order: 2 },
          { id: 'l-dev', title: 'Em desenvolvimento', order: 3 },
          { id: 'l-review', title: 'Revisão de código', order: 4 },
          { id: 'l-tests', title: 'Em testes', order: 5 },
          { id: 'l-done', title: 'Concluído 🎆', order: 6 },
        ],
        cards: [
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
          { id: `l-${Date.now()}-1`, title: 'Backlog', order: 0 },
          { id: `l-${Date.now()}-2`, title: 'REFINAMENTO', order: 1 },
          { id: `l-${Date.now()}-3`, title: 'SPRINT BACKLOG', order: 2 },
          { id: `l-${Date.now()}-4`, title: 'Em desenvolvimento', order: 3 },
          { id: `l-${Date.now()}-5`, title: 'Revisão de código', order: 4 },
          { id: `l-${Date.now()}-6`, title: 'Concluído 🎆', order: 5 },
        ];
      } else if (projectTemplate === 'kanban') {
        defaultLists = [
          { id: `l-${Date.now()}-1`, title: 'A Fazer 📋', order: 0 },
          { id: `l-${Date.now()}-2`, title: 'Em Progresso ⏳', order: 1 },
          { id: `l-${Date.now()}-3`, title: 'Concluído ✅', order: 2 },
        ];
      } else {
        defaultLists = [
          { id: `l-${Date.now()}-1`, title: 'A Fazer', order: 0 }
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
  const handleAddList = () => {
    if (!newListTitle.trim() || !activeProjectId) return;
    const title = newListTitle.trim();

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

    setNewListTitle('');
    setIsAddingList(false);
    addXp(10);
  };

  const handleDeleteList = (listId: string) => {
    if (!activeProjectId) return;
    if (window.confirm('Excluir esta lista e todos os seus cartões?')) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            lists: p.lists.filter(l => l.id !== listId),
            cards: p.cards.filter(c => c.listId !== listId),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    }
  };

  const handleRenameList = (listId: string, currentTitle: string) => {
    const newName = window.prompt('Novo nome para esta lista:', currentTitle);
    if (newName && newName.trim() && activeProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            lists: p.lists.map(l => l.id === listId ? { ...l, title: newName.trim() } : l),
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      }));
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
        return {
          ...p,
          cards: p.cards.map(c => {
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
              return { ...c, checklists: updatedChecklists };
            }
            return c;
          })
        };
      }
      return p;
    }));

    setSelectedCardForDetail(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checklists: (prev.checklists || []).map(chk => {
          if (chk.id === chkId) {
            return {
              ...chk,
              items: chk.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
            };
          }
          return chk;
        })
      };
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

  const handleAddAttachment = () => {
    if (!selectedCardForDetail || !cardAttachmentNameInput.trim() || !activeProjectId) return;

    const newAtt = {
      id: `att-${Date.now()}`,
      name: cardAttachmentNameInput.trim(),
      url: cardAttachmentUrlInput.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000'
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
    setActiveAddPopUp(null);
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
                className="p-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl border border-zinc-800/80 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:border-orange-500/40 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 text-orange-500" />
                <span className="hidden sm:inline">Hub</span>
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
              {/* Filter input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filtrar cartões..."
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 w-36 sm:w-48 transition-all shadow-inner"
                />
              </div>

              {/* Edit Project Button */}
              <button
                type="button"
                onClick={(e) => handleOpenEditProjectModal(activeProject, e)}
                className="bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-orange-400 border border-zinc-800 hover:border-orange-500/40 text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Editar capa, lema e detalhes do projeto"
              >
                <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                <span className="hidden sm:inline">Editar Projeto</span>
              </button>

              {/* Add List Button */}
              <button
                onClick={() => setIsAddingList(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-orange-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Lista</span>
              </button>
            </div>
          </div>

          {/* New List Input Bar (if open) */}
          <AnimatePresence>
            {isAddingList && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/90 border border-orange-500/40 rounded-2xl p-3 flex items-center gap-2 max-w-md shadow-xl backdrop-blur-md"
              >
                <input
                  type="text"
                  placeholder="Nome da lista (ex: Em Testes, Revisão...)"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') setIsAddingList(false);
                  }}
                  autoFocus
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={handleAddList}
                  className="bg-orange-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  Criar
                </button>
                <button
                  onClick={() => setIsAddingList(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VIEW SWITCHER TABS (Quadro, Tabela, Cronograma, Painel) */}
          <div className="flex items-center justify-between gap-3 bg-zinc-950/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-1 overflow-x-auto horizontal-scrollbar">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveViewMode('quadro')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'quadro'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <LayoutGrid className={`h-3.5 w-3.5 ${activeViewMode === 'quadro' ? 'text-orange-400' : ''}`} />
                <span>Quadro Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('tabela')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'tabela'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Table className={`h-3.5 w-3.5 ${activeViewMode === 'tabela' ? 'text-orange-400' : ''}`} />
                <span>Tabela</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('cronograma')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'cronograma'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <CalendarDays className={`h-3.5 w-3.5 ${activeViewMode === 'cronograma' ? 'text-orange-400' : ''}`} />
                <span>Cronograma</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('painel')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeViewMode === 'painel'
                    ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <BarChart3 className={`h-3.5 w-3.5 ${activeViewMode === 'painel' ? 'text-orange-400' : ''}`} />
                <span>Painel</span>
              </button>
            </div>

            {activeViewMode === 'quadro' && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 px-3">
                <ArrowRightLeft className="h-3 w-3 text-orange-400/80" />
                <span>Navegação horizontal</span>
              </div>
            )}
          </div>

          {/* 1. KANBAN BOARD CONTAINER (Horizontal Scrollable Column Layout with Custom Scrollbar) */}
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
                    className="w-72 sm:w-80 shrink-0 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl flex flex-col max-h-[calc(100vh-270px)] shadow-xl"
                  >
                    {/* List Header */}
                    <div className="p-3.5 border-b border-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                          {list.title}
                        </h3>
                        <span className="bg-zinc-800/80 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700/40 font-mono">
                          {listCards.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRenameList(list.id, list.title)}
                          className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Renomear Lista"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Excluir Lista"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

                        return (
                          <motion.div
                            key={card.id}
                            layout
                            onClick={() => {
                              setSelectedCardForDetail(card);
                              setCardDescInput(card.description || '');
                            }}
                            className={`bg-zinc-900/70 hover:bg-zinc-900 border ${
                              card.completed ? 'border-emerald-500/30 opacity-70' : 'border-zinc-800/80 hover:border-orange-500/40'
                            } rounded-xl p-3 space-y-2.5 transition-all shadow-md hover:shadow-orange-500/5 cursor-pointer relative group overflow-hidden`}
                          >
                            {/* Top Cover Bar */}
                            {card.coverColor && (
                              <div
                                className="h-1 w-full rounded-full mb-1 opacity-90"
                                style={{ backgroundColor: card.coverColor }}
                              />
                            )}

                            {/* Labels / Tags Pills */}
                            {card.labels && card.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {card.labels.map(lbl => (
                                  <span
                                    key={lbl.id}
                                    className="text-[9px] font-medium px-2 py-0.5 rounded-md text-white shadow-sm"
                                    style={{ backgroundColor: lbl.color || '#3b82f6' }}
                                  >
                                    {lbl.name}
                                  </span>
                                ))}
                              </div>
                            )}

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
                              <div className="flex items-center gap-2">
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

                                {card.comments && card.comments.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-zinc-400" title="Comentários">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{card.comments.length}</span>
                                  </span>
                                )}
                              </div>

                              {card.dueDate && (
                                <span className="flex items-center gap-1 text-[9px] bg-zinc-950/80 px-2 py-0.5 rounded-md border border-zinc-800 text-orange-400/90 font-mono">
                                  <Clock className="h-3 w-3 text-orange-400" />
                                  <span>{card.dueDate}</span>
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
              <div className="w-72 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingList(true)}
                  className="w-full py-4 px-4 bg-zinc-900/30 hover:bg-zinc-900/60 border border-dashed border-zinc-800 hover:border-orange-500/50 rounded-2xl text-zinc-400 hover:text-orange-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar outra lista</span>
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
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Listas Ativas</span>
                  <div className="text-2xl font-black text-orange-400 font-mono">{activeProject.lists.length}</div>
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-4 space-y-1">
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Tarefas com Prazo</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {activeProject.cards.filter(c => c.dueDate).length}
                  </div>
                </div>
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
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Tag className="h-3.5 w-3.5 text-orange-400" />
                    <span>Etiquetas</span>
                  </button>

                  {/* Label Picker Dropdown */}
                  {showLabelPicker && (
                    <div className="absolute top-10 left-0 z-50 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-2xl space-y-2">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase block">Criar etiqueta</span>
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
    </div>
  );
}
