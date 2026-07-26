import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Tag, 
  Edit3, 
  Save, 
  X,
  FileText,
  CalendarDays,
  Archive,
  Bell,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note } from '../types';

interface NotesViewProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  addXp: (amount: number) => void;
}

export default function NotesView({ notes, setNotes, addXp }: NotesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Note Form / Selection states
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form input states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderRecurrence, setReminderRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  // Collect all unique tags for filter row based on active view mode
  const allTags = Array.from(
    new Set(notes.filter(n => viewMode === 'archived' ? !!n.archived : !n.archived).flatMap(n => n.tags))
  ).filter(Boolean);

  const handleCreateNewNote = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      title: 'Nota sem título',
      content: '',
      tags: [],
      createdAt: today,
      updatedAt: today,
      archived: false
    };

    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setIsEditing(true);
    
    setTitle('Nota sem título');
    setContent('');
    setTagsInput('');
    setReminderTime('');
    setReminderDate('');
    setReminderRecurrence('none');

    // Reward XP
    addXp(15);
  };

  const handleSaveNote = () => {
    if (!activeNote) return;

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updatedNotes = notes.map(n => {
      if (n.id === activeNote.id) {
        return {
          ...n,
          title: title.trim() || 'Nota sem título',
          content,
          tags: parsedTags,
          reminderTime: reminderTime.trim() || undefined,
          reminderDate: reminderDate.trim() || undefined,
          reminderRecurrence,
          updatedAt: new Date().toLocaleDateString('pt-BR')
        };
      }
      return n;
    });

    setNotes(updatedNotes);
    setIsEditing(false);
    
    // Refresh active note
    setActiveNote(updatedNotes.find(n => n.id === activeNote.id) || null);
    
    // Reward XP
    addXp(20);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };

  const handleToggleArchiveNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedNotes = notes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          archived: !n.archived
        };
      }
      return n;
    });
    setNotes(updatedNotes);
    
    // If the active note is archived/unarchived, update the active note state
    if (activeNote?.id === id) {
      setActiveNote(prev => prev ? { ...prev, archived: !prev.archived } : null);
    }
  };

  const handleDeleteTagFromAllNotes = (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = notes.map(n => ({
      ...n,
      tags: n.tags.filter(t => t !== tagToDelete)
    }));
    setNotes(updatedNotes);
    if (selectedTag === tagToDelete) {
      setSelectedTag(null);
    }
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTagsInput(note.tags.join(', '));
    setReminderTime(note.reminderTime || '');
    setReminderDate(note.reminderDate || '');
    setReminderRecurrence(note.reminderRecurrence || 'none');
    setIsEditing(false);
  };

  // Filter notes based on viewMode (Active or Archived)
  const filteredNotes = notes.filter(note => {
    const isNoteArchived = !!note.archived;
    const matchesArchive = viewMode === 'archived' ? isNoteArchived : !isNoteArchived;

    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = !selectedTag || note.tags.includes(selectedTag);

    return matchesArchive && matchesSearch && matchesTag;
  });

  return (
    <div id="notes-view" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-orange-500" />
            Segundo Cérebro: Notas
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Banco de dados de notas rápidas, diários e estudos com tags customizáveis, estilo Notion
          </p>
        </div>

        <button
          onClick={handleCreateNewNote}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Nova Nota
        </button>
      </div>

      {/* Control Actions / Search and Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Toggle between Active and Archived */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/60 w-fit">
          <button
            onClick={() => {
              setViewMode('active');
              setSelectedTag(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'active' 
                ? 'bg-orange-500 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Ativas
          </button>
          <button
            onClick={() => {
              setViewMode('archived');
              setSelectedTag(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'archived' 
                ? 'bg-orange-500 text-white' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            Arquivadas
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por título, conteúdo ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0c]/40 border border-zinc-800/40 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Quick Tag Row Filter */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Tags de Estudo</span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pb-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                !selectedTag ? 'bg-orange-500 text-white' : 'bg-zinc-900/60 text-gray-500 hover:text-gray-300 border border-zinc-800/40'
              }`}
            >
              Todas
            </button>
            {allTags.map(tag => (
              <div key={tag} className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/30 rounded-lg p-0.5 group">
                <button
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                    selectedTag === tag ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </button>
                <button
                  onClick={(e) => handleDeleteTagFromAllNotes(tag, e)}
                  className="text-zinc-600 hover:text-red-500 p-1 rounded-md transition-colors"
                  title={`Excluir tag "${tag}" de todas as notas`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Grid (Instead of split view when active) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-zinc-900/10 rounded-2xl border border-zinc-800/20">
            <FileText className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">Nenhuma nota encontrada.</p>
            <p className="text-xs text-gray-600 mt-1">Sua busca não retornou resultados ou você não possui notas nesta seção.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className="p-5 rounded-2xl border bg-zinc-900/15 border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/30 text-left cursor-pointer transition-all duration-300 group relative flex flex-col justify-between h-48 hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-white group-hover:text-orange-500 transition-colors truncate">
                    {note.title}
                  </h3>
                  
                  {/* Action buttons (Archive, Delete) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleArchiveNote(note.id, e)}
                      className="text-zinc-500 hover:text-orange-400 p-1 hover:bg-zinc-800/80 rounded-md transition-colors"
                      title={note.archived ? "Desarquivar Nota" : "Arquivar Nota"}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-zinc-500 hover:text-red-500 p-1 hover:bg-zinc-800/80 rounded-md transition-colors"
                      title="Excluir Nota"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400/80 line-clamp-3 leading-relaxed break-words">
                  {note.content || 'Sem conteúdo adicional'}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900/60 min-w-0">
                <div className="flex flex-wrap gap-1 max-w-[65%] truncate">
                  {note.reminderTime && (
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <Bell className="h-2.5 w-2.5 text-indigo-400" /> {note.reminderTime}
                      {note.reminderRecurrence === 'daily' && ' (Diário)'}
                      {note.reminderRecurrence === 'weekly' && ' (Semanal)'}
                      {note.reminderRecurrence === 'monthly' && ' (Mensal)'}
                    </span>
                  )}
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] bg-zinc-950 border border-zinc-800/40 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[8px] bg-zinc-950 border border-zinc-800/40 text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-zinc-550 font-mono flex items-center gap-1 shrink-0">
                  <CalendarDays className="h-3 w-3" />
                  {note.updatedAt}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Individual Note View/Editor Overlay (Fullscreen) */}
      <AnimatePresence>
        {activeNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex flex-col justify-start"
          >
            <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col space-y-6">
              
              {/* Top Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveNote(null);
                      setIsEditing(false);
                    }}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center justify-center border border-zinc-800/40"
                    title="Fechar nota e voltar ao painel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div>
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">Nota em Foco</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {activeNote.updatedAt ? `Última edição: ${activeNote.updatedAt}` : `Criada em: ${activeNote.createdAt}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Archive inside fullscreen */}
                  <button
                    onClick={() => handleToggleArchiveNote(activeNote.id)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-bold border flex items-center gap-1.5 transition-colors ${
                      activeNote.archived
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-gray-300 hover:text-white hover:border-zinc-700'
                    }`}
                    title={activeNote.archived ? "Desarquivar Nota" : "Arquivar Nota"}
                  >
                    <Archive className="h-4 w-4" />
                    {activeNote.archived ? 'Arquivada (Desarquivar)' : 'Arquivar'}
                  </button>

                  {/* Delete inside fullscreen */}
                  <button
                    onClick={(e) => {
                      handleDeleteNote(activeNote.id, e);
                    }}
                    className="bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 text-xs text-gray-400 hover:text-red-500 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    title="Excluir Nota"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>

                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-gray-400 hover:text-white px-3.5 py-1.5 transition-colors"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_2px_12px_rgba(249,115,22,0.3)]"
                      >
                        <Save className="h-4 w-4" /> Salvar Nota (+20 XP)
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500 px-4 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="h-4 w-4" /> Editar Nota
                    </button>
                  )}
                </div>
              </div>

              {/* Editor or Viewer Body */}
              <div className="flex-1 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col min-h-[60vh] shadow-inner">
                {isEditing ? (
                  <div className="flex-1 flex flex-col space-y-5">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider">Título da Nota</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Insira o título da nota..."
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-orange-500/40 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                          <Bell className="h-3 w-3 text-orange-500" /> Horário (Notificação)
                        </label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-orange-500" /> Data (Opcional)
                        </label>
                        <input
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-500" /> Recorrência
                        </label>
                        <select
                          value={reminderRecurrence}
                          onChange={(e) => setReminderRecurrence(e.target.value as any)}
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                        >
                          <option value="none">Nenhuma (Apenas Data)</option>
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider">Tags (Separadas por vírgula)</label>
                        {tagsInput.split(',').map(t => t.trim()).filter(Boolean).length > 0 && (
                          <span className="text-[9px] text-zinc-500 font-mono">Pressione vírgula ou salve para consolidar</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Ex: estudos, ideias, mbc, finanças"
                        className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500/40 font-mono"
                      />
                      
                      {/* Individual tag delete option inside editor */}
                      {activeNote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {activeNote.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-zinc-950 border border-zinc-800/80 text-gray-400 pl-2.5 pr-1 py-0.5 rounded-full font-mono uppercase tracking-wide flex items-center gap-1 group">
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove tag from tag list in editor
                                  const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                  const updated = currentTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
                                  setTagsInput(updated.join(', '));
                                }}
                                className="text-gray-600 hover:text-red-500 p-0.5"
                                title={`Remover tag "${tag}"`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase tracking-wider">Conteúdo</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Digite suas anotações aqui... Suporta escrita livre e organização de ideias."
                        className="w-full flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 text-sm text-white focus:outline-none focus:border-orange-500/40 resize-none min-h-[350px] font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">{activeNote.title}</h2>
                      
                      {activeNote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {activeNote.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-orange-500/10 border border-orange-500/10 text-orange-400 px-3 py-1 rounded-full font-mono uppercase tracking-wide font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-sm md:text-base text-gray-300 leading-relaxed break-words whitespace-pre-wrap font-sans border-t border-zinc-900/80 pt-6">
                      {activeNote.content ? (
                        activeNote.content
                      ) : (
                        <p className="text-gray-600 italic">Esta nota está vazia. Clique em "Editar Nota" para começar a escrever.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
