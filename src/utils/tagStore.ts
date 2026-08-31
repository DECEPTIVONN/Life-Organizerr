import { Note, CalendarNote, Goal, QuickReminder, FutureEvent } from '../types';

export interface TagItem {
  id: string;
  name: string;
  group: string; // "Lazer", "Foco", "Rotina", "Exercício", "Espiritualidade", or custom
  parentTagId?: string;
  parentTagName?: string;
  color: string; // hex or CSS color
  description?: string;
  createdAt: string;
}

export interface TagHistoryItem {
  id: string;
  sourceModule: 'Notas' | 'Meu Dia' | 'Espaço Diário & Fé' | 'Anuais / Metas' | 'Lembretes' | 'Eventos';
  title: string;
  date: string;
  snippet: string;
  rawItem?: any;
}

const LOCAL_STORAGE_KEY = 'life_organizer_tags_v2';

// Default initial tag structure requested by user
export const DEFAULT_TAG_GROUPS = [
  'Lazer',
  'Foco',
  'Rotina',
  'Exercício',
  'Espiritualidade'
];

export const INITIAL_TAGS: TagItem[] = [
  // Lazer Group
  { id: 'tag-lazer', name: 'Lazer', group: 'Lazer', color: '#ec4899', createdAt: '2026-01-01' },
  { id: 'tag-games', name: 'Games', group: 'Lazer', parentTagId: 'tag-lazer', parentTagName: 'Lazer', color: '#f43f5e', createdAt: '2026-01-01' },
  { id: 'tag-ac-shadows', name: "Assassin's Creed Shadows", group: 'Lazer', parentTagId: 'tag-games', parentTagName: 'Games', color: '#e11d48', createdAt: '2026-01-01' },
  { id: 'tag-filme', name: 'Filme', group: 'Lazer', parentTagId: 'tag-lazer', parentTagName: 'Lazer', color: '#d946ef', createdAt: '2026-01-01' },
  { id: 'tag-serie', name: 'Série', group: 'Lazer', parentTagId: 'tag-lazer', parentTagName: 'Lazer', color: '#a855f7', createdAt: '2026-01-01' },

  // Foco Group
  { id: 'tag-foco', name: 'Foco', group: 'Foco', color: '#3b82f6', createdAt: '2026-01-01' },
  { id: 'tag-financeiro', name: 'Financeiro', group: 'Foco', color: '#10b981', createdAt: '2026-01-01' },
  { id: 'tag-estudo', name: 'Estudo', group: 'Foco', color: '#6366f1', createdAt: '2026-01-01' },
  { id: 'tag-trabalho', name: 'Trabalho', group: 'Foco', color: '#2563eb', createdAt: '2026-01-01' },
  { id: 'tag-pessoa', name: 'Pessoa', group: 'Foco', color: '#8b5cf6', createdAt: '2026-01-01' },

  // Rotina Group
  { id: 'tag-rotina', name: 'Rotina', group: 'Rotina', color: '#f59e0b', createdAt: '2026-01-01' },
  { id: 'tag-manha', name: 'Manhã', group: 'Rotina', parentTagId: 'tag-rotina', parentTagName: 'Rotina', color: '#eab308', createdAt: '2026-01-01' },
  { id: 'tag-planejamento', name: 'Planejamento', group: 'Rotina', parentTagId: 'tag-rotina', parentTagName: 'Rotina', color: '#d97706', createdAt: '2026-01-01' },

  // Exercício Group
  { id: 'tag-exercicio', name: 'Exercício', group: 'Exercício', color: '#ef4444', createdAt: '2026-01-01' },
  { id: 'tag-musculacao', name: 'Musculação', group: 'Exercício', parentTagId: 'tag-exercicio', parentTagName: 'Exercício', color: '#f97316', createdAt: '2026-01-01' },
  { id: 'tag-corrida', name: 'Corrida', group: 'Exercício', parentTagId: 'tag-exercicio', parentTagName: 'Exercício', color: '#fb923c', createdAt: '2026-01-01' },

  // Espiritualidade Group
  { id: 'tag-espiritualidade', name: 'Espiritualidade', group: 'Espiritualidade', color: '#8b5cf6', createdAt: '2026-01-01' },
  { id: 'tag-oracao', name: 'Oração', group: 'Espiritualidade', parentTagId: 'tag-espiritualidade', parentTagName: 'Espiritualidade', color: '#a855f7', createdAt: '2026-01-01' },
  { id: 'tag-biblia', name: 'Bíblia', group: 'Espiritualidade', parentTagId: 'tag-espiritualidade', parentTagName: 'Espiritualidade', color: '#7c3aed', createdAt: '2026-01-01' },
  { id: 'tag-devocional', name: 'Devocional', group: 'Espiritualidade', parentTagId: 'tag-espiritualidade', parentTagName: 'Espiritualidade', color: '#c084fc', createdAt: '2026-01-01' },
];

export const COLOR_PALETTE = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#d946ef', // Fuchsia
  '#a855f7', // Purple
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#64748b'  // Slate
];

export function loadStoredTags(): TagItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load stored tags:', e);
  }
  return INITIAL_TAGS;
}

export function saveStoredTags(tags: TagItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Failed to save tags:', e);
  }
}

export function createNewTag(
  name: string,
  group: string = 'Foco',
  color?: string,
  parentTagId?: string,
  parentTagName?: string
): TagItem {
  const cleanName = name.replace(/^[@#]+/, '').replace(/#/g, '').trim();
  if (!cleanName) {
    throw new Error('Tag name cannot be empty');
  }
  const existingTags = loadStoredTags();
  
  // Check if exists
  const existing = existingTags.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return existing;
  }

  const newTag: TagItem = {
    id: 'tag-' + Math.random().toString(36).substring(2, 9),
    name: cleanName,
    group: group || 'Foco',
    parentTagId,
    parentTagName,
    color: color || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = [...existingTags, newTag];
  saveStoredTags(updated);
  return newTag;
}

export function queryTagHistory(
  tagName: string,
  allNotes: Note[] = [],
  allCalendarNotes: CalendarNote[] = [],
  allGoals: Goal[] = [],
  allReminders: QuickReminder[] = []
): TagHistoryItem[] {
  const clean = tagName.replace(/^[@#]+/, '').toLowerCase();
  const history: TagHistoryItem[] = [];

  // Search Notes
  allNotes.forEach(note => {
    const matchTag = note.tags?.some(t => t.toLowerCase() === clean);
    const matchMention = note.content?.toLowerCase().includes(`@${clean}`) || note.title?.toLowerCase().includes(`@${clean}`);
    if (matchTag || matchMention) {
      history.push({
        id: `note-${note.id}`,
        sourceModule: 'Notas',
        title: note.title || 'Nota sem título',
        date: note.updatedAt || note.createdAt || 'Recentemente',
        snippet: note.content ? (note.content.substring(0, 120) + '...') : 'Anotação guardada em Notas.',
        rawItem: note
      });
    }
  });

  // Search Calendar / Meu Dia
  allCalendarNotes.forEach(cn => {
    const combinedText = `
      ${cn.title || ''} ${cn.content || ''} ${cn.journalText || ''} 
      ${cn.gratitudeText || ''} ${cn.decreesText || ''} ${cn.prayerText || ''}
    `.toLowerCase();

    if (combinedText.includes(`@${clean}`) || combinedText.includes(clean)) {
      history.push({
        id: `cal-${cn.id}`,
        sourceModule: 'Meu Dia',
        title: cn.title || `Registro do dia ${cn.date}`,
        date: cn.date,
        snippet: cn.journalText || cn.prayerText || cn.content || 'Registro diário ou pedido de fé.',
        rawItem: cn
      });
    }
  });

  // Search Goals / Anuais
  allGoals.forEach(g => {
    const combinedText = `${g.title || ''} ${g.notes?.map(n => n.text).join(' ') || ''}`.toLowerCase();
    if (combinedText.includes(`@${clean}`) || combinedText.includes(clean)) {
      history.push({
        id: `goal-${g.id}`,
        sourceModule: 'Anuais / Metas',
        title: g.title,
        date: g.createdAt || g.deadline || 'Metas Anuais',
        snippet: `Meta anual de ${g.area || 'Desenvolvimento'}: ${g.actionsDone}/${g.actionsTotal} ações concluídas.`,
        rawItem: g
      });
    }
  });

  // Search Reminders
  allReminders.forEach(r => {
    const combinedText = `${r.title || ''} ${r.description || ''}`.toLowerCase();
    if (combinedText.includes(`@${clean}`) || combinedText.includes(clean)) {
      history.push({
        id: `rem-${r.id}`,
        sourceModule: 'Lembretes',
        title: r.title,
        date: r.createdAt || r.scheduledDate || 'Timer',
        snippet: r.description || `Lembrete agendado (${r.category || 'Geral'}).`,
        rawItem: r
      });
    }
  });

  // Sort history by date descending
  return history.sort((a, b) => b.date.localeCompare(a.date));
}
