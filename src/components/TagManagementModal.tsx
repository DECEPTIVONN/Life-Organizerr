import React, { useState, useEffect } from 'react';
import { 
  Tag as TagIcon, 
  X, 
  Plus, 
  Search, 
  Palette, 
  Folder, 
  History, 
  ChevronRight, 
  Check, 
  Trash2, 
  Edit3,
  Calendar,
  BookOpen,
  Target,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TagItem, 
  TagHistoryItem, 
  loadStoredTags, 
  saveStoredTags, 
  createNewTag, 
  queryTagHistory, 
  COLOR_PALETTE, 
  DEFAULT_TAG_GROUPS 
} from '../utils/tagStore';
import { Note, CalendarNote, Goal, QuickReminder } from '../types';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNotes?: Note[];
  allCalendarNotes?: CalendarNote[];
  allGoals?: Goal[];
  allReminders?: QuickReminder[];
  initialSelectedTagId?: string | null;
  onSelectTagToFilter?: (tagName: string) => void;
}

export default function TagManagementModal({
  isOpen,
  onClose,
  allNotes = [],
  allCalendarNotes = [],
  allGoals = [],
  allReminders = [],
  initialSelectedTagId,
  onSelectTagToFilter
}: TagManagementModalProps) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  
  // New Tag Form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagGroup, setNewTagGroup] = useState('Lazer');
  const [newTagColor, setNewTagColor] = useState('#f59e0b');
  const [newTagParentId, setNewTagParentId] = useState<string>('');

  // Editing state for selected tag
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editParentId, setEditParentId] = useState('');

  // Custom group creation
  const [customGroupInput, setCustomGroupInput] = useState('');
  const [showCustomGroup, setShowCustomGroup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loaded = loadStoredTags();
      setTags(loaded);
      if (initialSelectedTagId) {
        const found = loaded.find(t => t.id === initialSelectedTagId || t.name.toLowerCase() === initialSelectedTagId.toLowerCase());
        if (found) {
          handleSelectTag(found);
        }
      }
    }
  }, [isOpen, initialSelectedTagId]);

  if (!isOpen) return null;

  const handleSelectTag = (tag: TagItem) => {
    setSelectedTag(tag);
    setEditName(tag.name);
    setEditGroup(tag.group);
    setEditColor(tag.color);
    setEditParentId(tag.parentTagId || '');
  };

  const handleSaveSelectedTagEdits = () => {
    if (!selectedTag) return;
    const cleanName = editName.trim();
    if (!cleanName) return;

    const parentTag = tags.find(t => t.id === editParentId);

    const updated = tags.map(t => {
      if (t.id === selectedTag.id) {
        return {
          ...t,
          name: cleanName,
          group: editGroup || 'Foco',
          color: editColor,
          parentTagId: editParentId || undefined,
          parentTagName: parentTag?.name || undefined
        };
      }
      return t;
    });

    setTags(updated);
    saveStoredTags(updated);
    setSelectedTag(prev => prev ? {
      ...prev,
      name: cleanName,
      group: editGroup || 'Foco',
      color: editColor,
      parentTagId: editParentId || undefined,
      parentTagName: parentTag?.name || undefined
    } : null);
  };

  const handleCreateNewTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const groupToUse = showCustomGroup && customGroupInput.trim() ? customGroupInput.trim() : newTagGroup;
    const parentTag = tags.find(t => t.id === newTagParentId);

    const created = createNewTag(
      newTagName,
      groupToUse,
      newTagColor,
      newTagParentId || undefined,
      parentTag?.name || undefined
    );

    const reloaded = loadStoredTags();
    setTags(reloaded);
    setIsCreating(false);
    setNewTagName('');
    setShowCustomGroup(false);
    setCustomGroupInput('');
    handleSelectTag(created);
  };

  const handleDeleteTag = (id: string) => {
    const filtered = tags.filter(t => t.id !== id);
    setTags(filtered);
    saveStoredTags(filtered);
    if (selectedTag?.id === id) {
      setSelectedTag(null);
    }
  };

  // Group tags by group
  const allGroups = Array.from(new Set([...DEFAULT_TAG_GROUPS, ...tags.map(t => t.group)])).filter(Boolean);

  const filteredTags = tags.filter(t => {
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.group.toLowerCase().includes(q) || (t.parentTagName && t.parentTagName.toLowerCase().includes(q));
  });

  // History query for selected tag
  const selectedTagHistory: TagHistoryItem[] = selectedTag
    ? queryTagHistory(selectedTag.name, allNotes, allCalendarNotes, allGoals, allReminders)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Central de Tags
              </h2>
              <p className="text-xs text-zinc-400">
                Organize suas marcas, cores, sub-tags e consulte o histórico de menções
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Tag List & Groups */}
          <div className="w-full md:w-1/2 border-r border-zinc-800/80 flex flex-col bg-zinc-950/20 overflow-hidden">
            {/* Search & Add Bar */}
            <div className="p-4 border-b border-zinc-800/60 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar tags por nome ou grupo..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsCreating(!isCreating);
                    setSelectedTag(null);
                  }}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Tag</span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center justify-between px-1">
                <span>Dica: Use <code className="text-orange-400 font-mono">@</code> para invocar tags e <code className="text-orange-400 font-mono">@#Nome</code> para criar.</span>
              </div>
            </div>

            {/* Tag List Grouped */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {isCreating ? (
                /* New Tag Creation Form */
                <form onSubmit={handleCreateNewTagSubmit} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Criar Nova Tag
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-zinc-500 hover:text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nome da Tag</label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="Ex: Assassin's Creed Shadows, Estudo, Oração..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Group Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-400">Grupo</label>
                      <button
                        type="button"
                        onClick={() => setShowCustomGroup(!showCustomGroup)}
                        className="text-[10px] text-orange-400 hover:underline"
                      >
                        {showCustomGroup ? 'Escolher existente' : '+ Novo Grupo'}
                      </button>
                    </div>

                    {showCustomGroup ? (
                      <input
                        type="text"
                        value={customGroupInput}
                        onChange={e => setCustomGroupInput(e.target.value)}
                        placeholder="Nome do novo grupo..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                      />
                    ) : (
                      <select
                        value={newTagGroup}
                        onChange={e => setNewTagGroup(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        {allGroups.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Parent Tag Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Sub-tag de (Opcional)</label>
                    <select
                      value={newTagParentId}
                      onChange={e => setNewTagParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Nenhuma (Tag Principal)</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.group} &gt; {t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Cor da Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewTagColor(c)}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            newTagColor === c ? 'scale-125 border-white ring-2 ring-orange-500/50' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Salvar Tag
                  </button>
                </form>
              ) : (
                /* Grouped Tags List */
                allGroups.map(groupName => {
                  const groupTags = filteredTags.filter(t => t.group === groupName);
                  if (groupTags.length === 0 && searchQuery) return null;

                  // Separate parent tags vs sub tags inside this group
                  const mainTags = groupTags.filter(t => !t.parentTagId);

                  return (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/40 pb-1">
                        <span className="flex items-center gap-1.5">
                          <Folder className="h-3.5 w-3.5 text-orange-400" />
                          {groupName}
                        </span>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full font-mono">
                          {groupTags.length}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {groupTags.map(tag => {
                          const isSelected = selectedTag?.id === tag.id;
                          return (
                            <button
                              key={tag.id}
                              onClick={() => handleSelectTag(tag)}
                              className={`group relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                                isSelected 
                                  ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-950 border-white text-white' 
                                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800/80 text-zinc-200'
                              }`}
                            >
                              <span 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: tag.color }} 
                              />
                              <span>
                                {tag.parentTagName && (
                                  <span className="text-zinc-500 text-[10px] mr-1">
                                    {tag.parentTagName} &gt;
                                  </span>
                                )}
                                #{tag.name}
                              </span>

                              {isSelected && (
                                <ChevronRight className="h-3.5 w-3.5 text-orange-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Selected Tag Details & Usage History */}
          <div className="w-full md:w-1/2 flex flex-col bg-zinc-900/50 overflow-hidden">
            {selectedTag ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Tag Header Settings */}
                <div className="p-5 border-b border-zinc-800 space-y-4 bg-zinc-900/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: editColor }}
                      />
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Editar Tag: #{selectedTag.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectTagToFilter && (
                        <button
                          onClick={() => {
                            onSelectTagToFilter(selectedTag.name);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold hover:bg-orange-500 hover:text-white transition-all"
                        >
                          Filtrar por esta Tag
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTag(selectedTag.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir Tag"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Nome</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={handleSaveSelectedTagEdits}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Grupo</label>
                      <select
                        value={editGroup}
                        onChange={e => {
                          setEditGroup(e.target.value);
                          setTimeout(handleSaveSelectedTagEdits, 50);
                        }}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        {allGroups.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Color Palette Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Escolher Cor da Tag</label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setEditColor(c);
                            setTimeout(handleSaveSelectedTagEdits, 50);
                          }}
                          className={`w-5 h-5 rounded-full transition-all ${
                            editColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tag Usage History Section */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4 text-orange-400" />
                      Histórico de Uso (#{selectedTag.name})
                    </span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded-full">
                      {selectedTagHistory.length} Ocorrência(s)
                    </span>
                  </div>

                  {selectedTagHistory.length === 0 ? (
                    <div className="text-center py-12 space-y-2 text-zinc-500">
                      <TagIcon className="h-8 w-8 mx-auto opacity-30 text-zinc-400" />
                      <p className="text-xs">Nenhum registro encontrado com esta tag ainda.</p>
                      <p className="text-[11px] text-zinc-600">
                        Digite <code className="text-orange-400">@{selectedTag.name}</code> em Notas, Diário ou Anuais para vinculá-la.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTagHistory.map(item => {
                        let moduleIcon = <BookOpen className="h-3.5 w-3.5 text-orange-400" />;
                        let moduleBadgeClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';

                        if (item.sourceModule === 'Meu Dia' || item.sourceModule === 'Espaço Diário & Fé') {
                          moduleIcon = <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
                          moduleBadgeClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                        } else if (item.sourceModule === 'Anuais / Metas') {
                          moduleIcon = <Target className="h-3.5 w-3.5 text-emerald-400" />;
                          moduleBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        }

                        return (
                          <div 
                            key={item.id}
                            className="bg-zinc-950 border border-zinc-800/80 p-3.5 rounded-xl space-y-1.5 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${moduleBadgeClass}`}>
                                {moduleIcon}
                                {item.sourceModule}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {item.date}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white tracking-tight">
                              {item.title}
                            </h4>

                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                              {item.snippet}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-3">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-600">
                  <TagIcon className="h-10 w-10 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-300">Nenhuma tag selecionada</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Clique em uma tag à esquerda para definir cor, grupo ou visualizar todas as vezes que ela foi usada.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
