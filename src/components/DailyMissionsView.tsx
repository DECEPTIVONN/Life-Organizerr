import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Check,
  Plus,
  X,
  Clock,
  Sun,
  Sunset,
  Moon,
  Bell,
  Trash2,
  Edit3,
  Repeat,
  Archive,
  Settings,
  BookOpen,
  Book,
  History,
  Tag as TagIcon
} from 'lucide-react';
import { DailyTask, SubTask, BookTracker, BibleTracker, CalendarNote } from '../types';
import { loadStoredTags, createNewTag, TagItem, COLOR_PALETTE } from '../utils/tagStore';
import { isTaskScheduledForDate } from '../utils/taskDateUtils';

interface DailyMissionsViewProps {
  dailyTasks: DailyTask[];
  activeTasks: DailyTask[];
  updateActiveTasks: (updater: (prev: DailyTask[]) => DailyTask[], deletedTaskId?: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todayStr: string;
  isToday: boolean;
  addXp: (amount: number) => void;
  handleToggleTask: (id: string, forceRetroactive?: boolean) => void;
  handleToggleSubtask: (taskId: string, subtaskId: string) => void;
  handleDeleteTask: (id: string, completed: boolean, xpReward: number) => void;
  calendarNotes?: CalendarNote[];
  streak: number;
  onOpenStreakHub?: () => void;
  bookTracker?: BookTracker;
  bibleTracker?: BibleTracker;
  completedRoutineTasks?: DailyTask[];
  setShowCompletedRoutinesModal?: (show: boolean) => void;
  handleResetForNewDay?: () => void;
  onOpenTrackers?: () => void;
}

export default function DailyMissionsView({
  dailyTasks,
  activeTasks,
  updateActiveTasks,
  selectedDate,
  setSelectedDate,
  todayStr,
  isToday,
  addXp,
  handleToggleTask,
  handleToggleSubtask,
  handleDeleteTask,
  calendarNotes = [],
  streak,
  onOpenStreakHub,
  bookTracker,
  bibleTracker,
  completedRoutineTasks = [],
  setShowCompletedRoutinesModal,
  handleResetForNewDay,
  onOpenTrackers
}: DailyMissionsViewProps) {
  // Filters: Todas, Ativas, Concluídas
  const [filterStatus, setFilterStatus] = useState<'todas' | 'ativas' | 'concluidas'>('todas');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Inline monthly calendar toggle
  const [isInlineCalendarOpen, setIsInlineCalendarOpen] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  });

  // Expanded subtasks state per task id
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Quick Drawers / Modals
  const [isArchiveDrawerOpen, setIsArchiveDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Task creation/editing modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // Task form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDates, setFormDates] = useState<string[]>([selectedDate]);
  const [formHasNoDate, setFormHasNoDate] = useState(false);
  const [formTimeSlot, setFormTimeSlot] = useState<'' | 'manha' | 'tarde' | 'noite' | 'custom'>('');
  const [formCustomTime, setFormCustomTime] = useState('');
  const [formPriority, setFormPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [formReminderHour, setFormReminderHour] = useState(false);
  const [formReminderDate, setFormReminderDate] = useState(false);
  const [formRecurrence, setFormRecurrence] = useState<'none' | 'daily' | 'weekly' | 'weekends' | 'specific_days' | 'monthly'>('none');
  const [formSpecificDays, setFormSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Sub-modals for task creation
  const [isDatePickerModalOpen, setIsDatePickerModalOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  });
  const [tempPickerDates, setTempPickerDates] = useState<string[]>([selectedDate]);

  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ffffff');
  const [isCustomTimeModalOpen, setIsCustomTimeModalOpen] = useState(false);

  // All available tags from storage
  const [allTags, setAllTags] = useState<TagItem[]>(() => loadStoredTags());

  // Reload tags when tag modal opens
  const refreshTags = () => {
    setAllTags(loadStoredTags());
  };

  // Helper to parse date string YYYY-MM-DD
  const parseDateStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  };

  // Helper to format date string
  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Compute label for selected date: "Hoje", "Amanhã", "Ontem", or "20 Set"
  const getDateHeaderLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hoje';
    const sel = parseDateStr(dateStr);
    const tod = parseDateStr(todayStr);

    const diffDays = Math.round((sel.getTime() - tod.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';

    const day = sel.getDate();
    const month = sel.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${day} ${capitalizedMonth}`;
  };

  // Navigate back/forward one day
  const handlePrevDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateStr(d));
  };

  const handleNextDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateStr(d));
  };

  // Tag shortcuts visibility settings (User requested: tags should not always be displayed as shortcuts)
  const [showTagShortcuts, setShowTagShortcuts] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_show_tag_shortcuts');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [visibleTagShortcuts, setVisibleTagShortcuts] = useState<string[]>(() => {
    const saved = localStorage.getItem('mbc_visible_tag_shortcuts');
    return saved !== null ? JSON.parse(saved) : [];
  });

  const handleToggleTagShortcuts = (enabled: boolean) => {
    setShowTagShortcuts(enabled);
    localStorage.setItem('mbc_show_tag_shortcuts', JSON.stringify(enabled));
  };

  const handleToggleTagShortcut = (tagName: string) => {
    setVisibleTagShortcuts(prev => {
      const lower = tagName.toLowerCase();
      const updated = prev.includes(lower)
        ? prev.filter(t => t !== lower)
        : [...prev, lower];
      localStorage.setItem('mbc_visible_tag_shortcuts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectAllTags = () => {
    const all = displayTags.map(t => t.name.toLowerCase());
    setVisibleTagShortcuts(all);
    localStorage.setItem('mbc_visible_tag_shortcuts', JSON.stringify(all));
  };

  const handleDeselectAllTags = () => {
    setVisibleTagShortcuts([]);
    localStorage.setItem('mbc_visible_tag_shortcuts', JSON.stringify([]));
  };

  // Compute tasks strictly scheduled for the selected date
  const tasksForSelectedDay = useMemo(() => {
    return activeTasks.filter(task => isTaskScheduledForDate(task, selectedDate));
  }, [activeTasks, selectedDate]);

  const totalCount = tasksForSelectedDay.length;
  const completedCount = tasksForSelectedDay.filter(t => t.completed === true).length;

  // Filter tasks: Strictly for selectedDate, strictly for filterStatus, and tag filter
  const filteredTasks = useMemo(() => {
    return activeTasks.filter(task => {
      // 1. Must strictly belong to selectedDate
      if (!isTaskScheduledForDate(task, selectedDate)) return false;

      // 2. Status filter: Strictly ensure completed vs active
      if (filterStatus === 'ativas' && task.completed === true) return false;
      if (filterStatus === 'concluidas' && task.completed !== true) return false;

      // 3. Tag filter
      if (selectedTagFilter) {
        const hasTag = task.tags?.some(t => t.toLowerCase() === selectedTagFilter.toLowerCase());
        const hasCategory = task.category?.toLowerCase() === selectedTagFilter.toLowerCase();
        if (!hasTag && !hasCategory) return false;
      }

      return true;
    });
  }, [activeTasks, filterStatus, selectedTagFilter, selectedDate]);

  // Collect all unique tags currently present across tasks + stored tags
  const displayTags = useMemo(() => {
    const tagMap = new Map<string, string>();
    allTags.forEach(t => tagMap.set(t.name.toLowerCase(), t.color || '#f97316'));
    activeTasks.forEach(t => {
      t.tags?.forEach(tag => {
        if (!tagMap.has(tag.toLowerCase())) {
          tagMap.set(tag.toLowerCase(), '#ef4444');
        }
      });
      if (t.category && !tagMap.has(t.category.toLowerCase())) {
        tagMap.set(t.category.toLowerCase(), '#3b82f6');
      }
    });
    return Array.from(tagMap.entries()).map(([name, color]) => ({ name, color }));
  }, [allTags, activeTasks]);

  // Tags that should actually appear in the filter bar shortcuts
  const shortcutTags = useMemo(() => {
    if (!showTagShortcuts) return [];
    return displayTags.filter(t => visibleTagShortcuts.includes(t.name.toLowerCase()));
  }, [showTagShortcuts, visibleTagShortcuts, displayTags]);

  // Set of dates that have tasks, for dots in calendar
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    // Check calendar notes
    calendarNotes.forEach(n => {
      if (n.checklist && n.checklist.length > 0) {
        dates.add(n.date);
      }
    });
    // Check tasks with specific dates or recurrence
    dailyTasks.forEach(t => {
      if (t.createdDate) dates.add(t.createdDate);
      if (t.dates) t.dates.forEach(d => dates.add(d));
    });
    activeTasks.forEach(t => {
      if (t.createdDate) dates.add(t.createdDate);
      if (t.dates) t.dates.forEach(d => dates.add(d));
    });
    return dates;
  }, [dailyTasks, activeTasks, calendarNotes]);

  // Open task modal for CREATE
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormDates([selectedDate]);
    setFormHasNoDate(false);
    setFormTimeSlot('');
    setFormCustomTime('');
    setFormPriority('media');
    setFormTags([]);
    setFormSubtasks([]);
    setSubtaskInput('');
    setFormReminderHour(false);
    setFormReminderDate(false);
    setFormRecurrence('none');
    setFormSpecificDays([1, 2, 3, 4, 5]);
    setIsTaskModalOpen(true);
  };

  // Open task modal for EDIT
  const handleOpenEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setFormTitle(task.text);
    setFormDescription(task.description || '');
    setFormDates(task.dates && task.dates.length > 0 ? task.dates : [task.createdDate || selectedDate]);
    setFormHasNoDate(task.dates?.length === 0);
    if (task.timeSlot === 'manha' || task.timeSlot === 'tarde' || task.timeSlot === 'noite') {
      setFormTimeSlot(task.timeSlot);
    } else if (task.period === 'manha' || task.period === 'noite') {
      setFormTimeSlot(task.period);
    } else if (task.reminderTime) {
      setFormTimeSlot('custom');
      setFormCustomTime(task.reminderTime);
    } else {
      setFormTimeSlot('');
    }
    setFormPriority(task.priority || 'media');
    setFormTags(task.tags || (task.category ? [task.category] : []));
    setFormSubtasks(task.subtasks ? task.subtasks.map(s => ({ ...s })) : []);
    setSubtaskInput('');
    setFormReminderHour(Boolean(task.reminderEnabled || task.reminderTime));
    setFormReminderDate(Boolean(task.reminderDateEnabled || task.reminderDate));
    if (task.recurrence) {
      setFormRecurrence(task.recurrence);
    } else if (task.isRecurring) {
      setFormRecurrence('daily');
    } else {
      setFormRecurrence('none');
    }
    setFormSpecificDays(task.specificDays || [1, 2, 3, 4, 5]);
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Edit)
  const handleSaveTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formTitle.trim()) return;

    const mappedSubtasks: SubTask[] = formSubtasks.map(s => ({
      id: s.id || 'st-' + Math.random().toString(36).substring(2, 9),
      text: s.text,
      completed: s.completed || false
    }));

    const finalPeriod: 'manha' | 'noite' | 'geral' =
      formTimeSlot === 'manha' ? 'manha' : formTimeSlot === 'noite' ? 'noite' : 'geral';

    const finalReminderTime =
      formTimeSlot === 'custom'
        ? formCustomTime
        : formTimeSlot === 'manha'
        ? '08:00'
        : formTimeSlot === 'tarde'
        ? '14:00'
        : formTimeSlot === 'noite'
        ? '20:00'
        : undefined;

    const isRecur = formRecurrence === 'daily' || formRecurrence === 'weekly' || formRecurrence === 'weekends';

    if (editingTask) {
      // Edit existing task
      updateActiveTasks(prev =>
        prev.map(t => {
          if (t.id === editingTask.id) {
            return {
              ...t,
              text: formTitle.trim(),
              description: formDescription.trim() || undefined,
              priority: formPriority,
              tags: formTags.length > 0 ? formTags : undefined,
              category: formTags[0] || t.category || 'Geral',
              dates: formHasNoDate ? [] : formDates,
              createdDate: formHasNoDate ? undefined : formDates[0] || selectedDate,
              timeSlot: formTimeSlot || undefined,
              period: finalPeriod,
              reminderTime: formReminderHour ? finalReminderTime : undefined,
              reminderEnabled: formReminderHour,
              reminderDateEnabled: formReminderDate,
              recurrence: formRecurrence,
              isRecurring: isRecur,
              subtasks: mappedSubtasks.length > 0 ? mappedSubtasks : undefined,
              specificDays: formRecurrence === 'specific_days' ? formSpecificDays : undefined
            };
          }
          return t;
        })
      );
    } else {
      // Create new task
      const newTask: DailyTask = {
        id: 'task-' + Math.random().toString(36).substring(2, 9),
        text: formTitle.trim(),
        description: formDescription.trim() || undefined,
        completed: false,
        xpReward: 15,
        category: formTags[0] || 'Geral',
        priority: formPriority,
        tags: formTags.length > 0 ? formTags : undefined,
        dates: formHasNoDate ? [] : formDates,
        createdDate: formHasNoDate ? undefined : formDates[0] || selectedDate,
        timeSlot: formTimeSlot || undefined,
        period: finalPeriod,
        reminderTime: formReminderHour ? finalReminderTime : undefined,
        reminderEnabled: formReminderHour,
        reminderDateEnabled: formReminderDate,
        recurrence: formRecurrence,
        isRecurring: isRecur,
        subtasks: mappedSubtasks.length > 0 ? mappedSubtasks : undefined,
        specificDays: formRecurrence === 'specific_days' ? formSpecificDays : undefined
      };
      updateActiveTasks(prev => [...prev, newTask]);
      addXp(5);
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Add subtask inside form
  const handleAddSubtaskToForm = () => {
    if (!subtaskInput.trim()) return;
    setFormSubtasks(prev => [
      ...prev,
      {
        id: 'st-' + Math.random().toString(36).substring(2, 9),
        text: subtaskInput.trim(),
        completed: false
      }
    ]);
    setSubtaskInput('');
  };

  // Toggle subtask inside form
  const handleToggleFormSubtask = (id: string) => {
    setFormSubtasks(prev =>
      prev.map(s => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  // Remove subtask inside form
  const handleRemoveFormSubtask = (id: string) => {
    setFormSubtasks(prev => prev.filter(s => s.id !== id));
  };

  // Create new Tag
  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const created = createNewTag(newTagName.trim(), 'Geral', newTagColor);
      refreshTags();
      // Auto-select in form
      if (!formTags.includes(created.name)) {
        setFormTags(prev => [...prev, created.name]);
      }
      setNewTagName('');
      setIsNewTagModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle tag selection in task form
  const handleToggleTagInForm = (tagName: string) => {
    setFormTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  // Open date picker modal
  const handleOpenDatePicker = () => {
    setTempPickerDates(formDates.length > 0 ? [...formDates] : [selectedDate]);
    setIsDatePickerModalOpen(true);
  };

  // Confirm date picker selection
  const handleConfirmDatePicker = () => {
    if (tempPickerDates.length > 0) {
      setFormDates(tempPickerDates);
      setFormHasNoDate(false);
    }
    setIsDatePickerModalOpen(false);
  };

  // Toggle date in multi-day picker
  const handleTogglePickerDate = (dateStr: string) => {
    setTempPickerDates(prev => {
      if (prev.includes(dateStr)) {
        // don't remove if it's the only one
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Inline Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Month navigation in inline calendar
  const handlePrevMonthInline = () => {
    setCalendarViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonthInline = () => {
    setCalendarViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Month navigation in date picker modal
  const handlePrevMonthPicker = () => {
    setDatePickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonthPicker = () => {
    setDatePickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Priority labels & colors
  const getPriorityDot = (p?: 'baixa' | 'media' | 'alta') => {
    if (p === 'baixa') return 'bg-emerald-500';
    if (p === 'alta') return 'bg-rose-500';
    return 'bg-amber-400';
  };

  // Recurrence label
  const getRecurrenceText = (rec?: string) => {
    switch (rec) {
      case 'daily':
        return 'Todo dia';
      case 'weekly':
        return 'Toda semana';
      case 'weekends':
        return 'Fins de semana';
      case 'specific_days':
        return 'Dias específicos';
      case 'monthly':
        return 'Todo mês';
      default:
        return 'Adicionar recorrência';
    }
  };

  // Time slot label
  const getTimeSlotLabel = (slot?: string, customTime?: string) => {
    if (slot === 'manha') return 'Manhã';
    if (slot === 'tarde') return 'Tarde';
    if (slot === 'noite') return 'Noite';
    if (slot === 'custom') return customTime || 'Horário';
    return '';
  };

  // Date label in form
  const getFormDateButtonLabel = () => {
    if (formHasNoDate) return 'Sem data';
    if (formDates.length === 0) return 'Selecionar';
    if (formDates.length === 1) {
      if (formDates[0] === todayStr) return 'Hoje';
      return getDateHeaderLabel(formDates[0]);
    }
    const hasToday = formDates.includes(todayStr);
    if (hasToday) {
      return `Hoje +${formDates.length - 1}`;
    }
    return `${formDates.length} dias`;
  };

  return (
    <div className="w-full space-y-4 pb-20 relative">
      {/* ======================================================== */}
      {/* 1. TOP HEADER: < Data >  📅              🗂  ⚙️       */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* Left: Date navigation + calendar toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsInlineCalendarOpen(prev => !prev)}
              className="group flex flex-col items-start px-1 text-left"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
                  {getDateHeaderLabel(selectedDate)}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                {completedCount}/{totalCount} concluídas
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar icon button: toggles inline calendar */}
          <button
            type="button"
            onClick={() => setIsInlineCalendarOpen(prev => !prev)}
            className={`p-2 rounded-xl border transition-all ${
              isInlineCalendarOpen
                ? 'bg-zinc-100 text-zinc-950 border-zinc-200 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
            title="Abrir calendário mensal"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Right icons: Drawer/Archive & Settings */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsArchiveDrawerOpen(true)}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
            title="Gaveta de Tags e Histórico"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
            title="Opções da Rotina"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. INLINE MONTHLY CALENDAR (IMAGE 13)                    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isInlineCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#18181b] border border-zinc-800/80 rounded-2xl p-4 shadow-xl"
          >
            {/* Month Header: < Setembro 2026 >         Hoje */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonthInline}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-white capitalize">
                  {calendarViewMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonthInline}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {!isToday && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    const [y, m, d] = todayStr.split('-').map(Number);
                    setCalendarViewMonth(new Date(y, m - 1, d));
                  }}
                  className="text-xs font-semibold text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Weekday headers: Se Te Qu Qu Se Sá Do */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá', 'Do'].map((dayName, idx) => (
                <span key={idx} className="text-[11px] font-semibold text-zinc-500">
                  {dayName}
                </span>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = calendarViewMonth.getFullYear();
                const month = calendarViewMonth.getMonth();
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                // 0 is Sunday, 1 is Monday... convert so Monday is first (index 0)
                const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
                const daysInMonth = getDaysInMonth(year, month);
                const cells = [];

                // Empty padding cells before 1st of month
                for (let i = 0; i < offset; i++) {
                  cells.push(<div key={`pad-${i}`} className="h-9" />);
                }

                // Days
                for (let d = 1; d <= daysInMonth; d++) {
                  const mStr = String(month + 1).padStart(2, '0');
                  const dStr = String(d).padStart(2, '0');
                  const cellDateStr = `${year}-${mStr}-${dStr}`;

                  const isSelected = selectedDate === cellDateStr;
                  const isCurrentDay = todayStr === cellDateStr;
                  const hasTasks = datesWithTasks.has(cellDateStr);

                  cells.push(
                    <button
                      key={cellDateStr}
                      type="button"
                      onClick={() => setSelectedDate(cellDateStr)}
                      className="h-9 w-full flex flex-col items-center justify-center relative rounded-xl transition-all group"
                    >
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-white text-zinc-950 font-bold shadow-md'
                            : isCurrentDay
                            ? 'border border-zinc-500 text-white font-bold'
                            : 'text-zinc-300 group-hover:bg-zinc-800'
                        }`}
                      >
                        {d}
                      </span>
                      {hasTasks && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isSelected ? 'bg-zinc-950' : 'bg-amber-400'
                          }`}
                        />
                      )}
                    </button>
                  );
                }

                return cells;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 3. FILTER PILLS BAR (IMAGES 2, 9, 10, 12)                */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar select-none">
        {/* Todas */}
        <button
          type="button"
          onClick={() => setFilterStatus('todas')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'todas'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Todas
        </button>

        {/* Ativas */}
        <button
          type="button"
          onClick={() => setFilterStatus('ativas')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'ativas'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Ativas
        </button>

        {/* Concluídas */}
        <button
          type="button"
          onClick={() => setFilterStatus('concluidas')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'concluidas'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Concluídas {completedCount > 0 ? `(${completedCount})` : ''}
        </button>

        {/* Vertical divider if tag shortcuts are enabled and present */}
        {shortcutTags.length > 0 && <span className="text-zinc-700 text-sm font-light">|</span>}

        {/* Configured tag shortcut pills (only when enabled by user in settings) */}
        {shortcutTags.map(tag => {
          const isSelected = selectedTagFilter?.toLowerCase() === tag.name.toLowerCase();
          return (
            <button
              key={tag.name}
              type="button"
              onClick={() => setSelectedTagFilter(prev => (prev?.toLowerCase() === tag.name.toLowerCase() ? null : tag.name))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="capitalize">{tag.name}</span>
            </button>
          );
        })}

        {/* Quick button to open Settings & configure visible tags */}
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all shrink-0 ml-auto"
          title="Configurar atalhos de tags na barra"
        >
          <TagIcon className="w-3 h-3 text-zinc-400" />
          <span className="text-[11px] font-medium hidden sm:inline">Tags</span>
          <Settings className="w-3 h-3 text-zinc-500" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. TASK CARDS LIST (IMAGES 2, 3, 10, 11, 12)             */}
      {/* ======================================================== */}
      {filteredTasks.length === 0 ? (
        /* Empty State (Image 9) */
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-zinc-800/70 rounded-2xl flex items-center justify-center text-zinc-400 mb-3 border border-zinc-700/40">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-white">Sem tarefas</h3>
          <p className="text-xs text-zinc-400 mt-1">
            {filterStatus === 'todas'
              ? 'Sem tarefas neste dia'
              : 'Nenhuma tarefa encontrada com este filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(task => {
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const completedSubCount = hasSubtasks ? task.subtasks!.filter(s => s.completed).length : 0;
            const totalSubCount = hasSubtasks ? task.subtasks!.length : 0;
            const isExpanded = !!expandedTasks[task.id];

            // Priority dot
            const pDotClass = getPriorityDot(task.priority);

            return (
              <motion.div
                key={task.id}
                layout
                className="bg-[#18181b] hover:bg-[#1f1f23] transition-colors rounded-2xl p-4 border border-zinc-800/50 shadow-sm relative group"
              >
                {/* Top Row: Checkbox + Priority Dot + Title + Chevron/Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        task.completed
                          ? 'bg-white border-white text-zinc-950 shadow-sm'
                          : 'border border-zinc-600 hover:border-zinc-400 bg-transparent'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Content area */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer select-none"
                      onClick={() => {
                        if (hasSubtasks) {
                          setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                        } else {
                          handleOpenEditTask(task);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Priority dot */}
                        <span className={`w-2 h-2 rounded-full ${pDotClass} shrink-0`} />
                        <h4
                          className={`text-sm sm:text-base font-semibold tracking-tight leading-snug transition-all ${
                            task.completed ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.text}
                        </h4>
                      </div>

                      {/* Description underneath */}
                      {task.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* Tag badge */}
                        {task.tags && task.tags.length > 0 ? (
                          task.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className="capitalize">{tag}</span>
                            </span>
                          ))
                        ) : task.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span>{task.category}</span>
                          </span>
                        ) : null}

                        {/* Recurrence badge */}
                        {(task.recurrence && task.recurrence !== 'none') || task.isRecurring ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-400 font-medium">
                            <Repeat className="w-3 h-3 text-zinc-400" />
                            <span>{getRecurrenceText(task.recurrence)}</span>
                          </span>
                        ) : null}

                        {/* Time slot badge */}
                        {task.timeSlot === 'manha' || task.period === 'manha' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-amber-400 font-medium">
                            <Sun className="w-3 h-3" />
                            <span>Manhã</span>
                          </span>
                        ) : task.timeSlot === 'tarde' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-sky-400 font-medium">
                            <Sunset className="w-3 h-3" />
                            <span>Tarde</span>
                          </span>
                        ) : task.timeSlot === 'noite' || task.period === 'noite' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-indigo-400 font-medium">
                            <Moon className="w-3 h-3" />
                            <span>Noite</span>
                          </span>
                        ) : task.reminderTime ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{task.reminderTime}</span>
                          </span>
                        ) : null}

                        {/* Retroactive badge */}
                        {(task.isRetroactive || task.completedRetroactively) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-400 font-bold uppercase">
                            <Clock className="w-2.5 h-2.5" />
                            Retroativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions: Edit, Delete, Chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100"
                      title="Editar tarefa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id, task.completed, task.xpReward)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {hasSubtasks && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))
                        }
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtasks Progress Line (when collapsed) */}
                {hasSubtasks && !isExpanded && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between gap-3">
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all rounded-full"
                        style={{
                          width: `${totalSubCount > 0 ? (completedSubCount / totalSubCount) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                      {completedSubCount}/{totalSubCount}
                    </span>
                  </div>
                )}

                {/* Subtasks Expanded List (Image 3) */}
                {hasSubtasks && isExpanded && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/60 pl-8 space-y-2">
                    {task.subtasks!.map(st => (
                      <div
                        key={st.id}
                        onClick={() => handleToggleSubtask(task.id, st.id)}
                        className="flex items-center gap-2.5 cursor-pointer group/st py-0.5"
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            st.completed
                              ? 'bg-white border-white text-zinc-950'
                              : 'border-zinc-700 bg-transparent group-hover/st:border-zinc-500'
                          }`}
                        >
                          {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs transition-colors ${
                            st.completed
                              ? 'line-through text-zinc-500'
                              : 'text-zinc-300 group-hover/st:text-white'
                          }`}
                        >
                          {st.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FLOATING ACTION BUTTON (FAB) (+)                      */}
      {/* ======================================================== */}
      <button
        type="button"
        onClick={handleOpenCreateTask}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 shadow-2xl flex items-center justify-center font-bold text-2xl transition-all cursor-pointer"
        aria-label="Nova tarefa"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* ======================================================== */}
      {/* 6. MODAL: NOVA TAREFA / EDITAR TAREFA (DESKTOP FULL WIDTH) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div
            onClick={() => setIsTaskModalOpen(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 md:p-6 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full h-full sm:h-auto sm:max-h-[94vh] md:w-[98vw] md:max-w-[1600px] lg:max-w-[1750px] bg-[#18181b] border border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Top Navigation Bar: ✕  Nova tarefa  Salvar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h3>
                  <span className="hidden md:inline-block text-[11px] text-zinc-500 font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
                    ESC para fechar
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteTask(editingTask.id, editingTask.completed, editingTask.xpReward);
                        setIsTaskModalOpen(false);
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveTask()}
                    disabled={!formTitle.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </div>

              {/* Scrollable Form Body - Full Width Grid on Desktop */}
              <div className="p-5 sm:p-6 lg:p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                  {/* Left Column: Title, Description, Date, Subtasks */}
                  <div className="lg:col-span-7 xl:col-span-7 space-y-5">
                    {/* Title input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                        TÍTULO DA TAREFA *
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="O que você precisa realizar?"
                        autoFocus
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 text-base sm:text-lg font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                        maxLength={120}
                      />
                    </div>

                    {/* Description input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                        DESCRIÇÃO & NOTAS
                      </label>
                      <textarea
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Adicione detalhes, observações ou links úteis..."
                        rows={3}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
                      />
                    </div>

                    {/* DATA Section */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                        DATA PROGRAMADA
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Hoje */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormHasNoDate(false);
                            setFormDates([todayStr]);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            !formHasNoDate && formDates.length === 1 && formDates[0] === todayStr
                              ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Hoje
                        </button>

                        {/* Amanhã */}
                        <button
                          type="button"
                          onClick={() => {
                            const d = parseDateStr(todayStr);
                            d.setDate(d.getDate() + 1);
                            setFormHasNoDate(false);
                            setFormDates([formatDateStr(d)]);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            !formHasNoDate && formDates.length === 1 && formDates[0] !== todayStr && getDateHeaderLabel(formDates[0]) === 'Amanhã'
                              ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          Amanhã
                        </button>

                        {/* Date Picker Trigger */}
                        <button
                          type="button"
                          onClick={handleOpenDatePicker}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                            !formHasNoDate
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{getFormDateButtonLabel()}</span>
                        </button>

                        {/* Sem data */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormHasNoDate(true);
                            setFormDates([]);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            formHasNoDate
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span className="font-mono text-sm leading-none">∞</span>
                          <span>Sem data</span>
                        </button>
                      </div>
                    </div>

                    {/* SUBTAREFAS Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block">
                          SUBTAREFAS {formSubtasks.length > 0 && `(${formSubtasks.filter(s => s.completed).length}/${formSubtasks.length})`}
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={subtaskInput}
                          onChange={e => setSubtaskInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtaskToForm();
                            }
                          }}
                          placeholder="Adicionar subtarefa e pressionar Enter..."
                          className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtaskToForm}
                          className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Adicionar</span>
                        </button>
                      </div>

                      {/* Added subtasks list */}
                      {formSubtasks.length > 0 && (
                        <div className="space-y-1.5 bg-zinc-900/40 p-2.5 rounded-2xl border border-zinc-800/60 max-h-56 overflow-y-auto">
                          {formSubtasks.map(st => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900/80 rounded-xl hover:bg-zinc-900 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleFormSubtask(st.id)}
                                className="flex items-center gap-2.5 text-left flex-1"
                              >
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    st.completed
                                      ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                                      : 'border-zinc-700 bg-transparent'
                                  }`}
                                >
                                  {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-xs font-medium ${
                                    st.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                                  }`}
                                >
                                  {st.text}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFormSubtask(st.id)}
                                className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Time, Priority, Tags, Reminders, Recurrence */}
                  <div className="lg:col-span-5 xl:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l border-zinc-800/80 lg:pl-8 pt-5 lg:pt-0">
                    {/* HORÁRIO Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        TURNO / HORÁRIO
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {formTimeSlot && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-white font-semibold shadow-sm">
                            <Bell className="w-3.5 h-3.5 text-amber-400" />
                            <span>{getTimeSlotLabel(formTimeSlot, formCustomTime)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormTimeSlot('');
                                setFormCustomTime('');
                              }}
                              className="ml-1 text-zinc-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}

                        {!formTimeSlot && (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsCustomTimeModalOpen(true)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Hora Exata</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('manha')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <Sun className="w-3.5 h-3.5 text-amber-400" />
                              <span>Manhã</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('tarde')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <Sunset className="w-3.5 h-3.5 text-sky-400" />
                              <span>Tarde</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('noite')}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <Moon className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Noite</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* PRIORIDADE Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        PRIORIDADE
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'baixa' as const, label: 'Baixa', dot: 'bg-emerald-500', activeClass: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' },
                          { id: 'media' as const, label: 'Média', dot: 'bg-amber-400', activeClass: 'border-amber-400 bg-amber-500/10 text-amber-300' },
                          { id: 'alta' as const, label: 'Alta', dot: 'bg-rose-500', activeClass: 'border-rose-500/60 bg-rose-500/10 text-rose-400' }
                        ].map(p => {
                          const isSel = formPriority === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setFormPriority(p.id)}
                              className={`py-2 px-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
                                isSel
                                  ? p.activeClass
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${p.dot} shrink-0`} />
                              <span>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TAGS Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        TAGS
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {allTags.map(tag => {
                          const isSel = formTags.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleToggleTagInForm(tag.name)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isSel
                                  ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="capitalize">{tag.name}</span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setIsNewTagModalOpen(true)}
                          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                          title="Nova tag"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* LEMBRETE Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-1 mb-1.5">
                        <span>LEMBRETES</span>
                        {(formReminderHour || formReminderDate) && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormReminderHour(prev => !prev)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            formReminderHour
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Hora</span>
                          {formReminderHour && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormReminderDate(prev => !prev)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            formReminderDate
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Data</span>
                          {formReminderDate && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                        </button>
                      </div>
                    </div>

                    {/* RECORRÊNCIA Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        RECORRÊNCIA
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRecurrenceModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Repeat className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{getRecurrenceText(formRecurrence)}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/60">
                <div>
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteTask(editingTask.id, editingTask.completed, editingTask.xpReward);
                        setIsTaskModalOpen(false);
                      }}
                      className="flex sm:hidden items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir tarefa</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTask()}
                    disabled={!formTitle.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 7. MODAL: DATE PICKER (MULTI-DAY SELECTION, IMAGES 7 & 8) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isDatePickerModalOpen && (
          <div
            onClick={() => setIsDatePickerModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#18181b] border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-4"
            >
              {/* Header: < Setembro 2026 > */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevMonthPicker}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="text-sm font-bold text-white capitalize">
                  {datePickerMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  type="button"
                  onClick={handleNextMonthPicker}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Se', 'Te', 'Qu', 'Qu', 'Se', 'Sá', 'Do'].map((d, i) => (
                  <span key={i} className="text-[11px] font-semibold text-zinc-500">
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid of days */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const y = datePickerMonth.getFullYear();
                  const m = datePickerMonth.getMonth();
                  const firstDay = new Date(y, m, 1).getDay();
                  const offset = firstDay === 0 ? 6 : firstDay - 1;
                  const countDays = getDaysInMonth(y, m);
                  const cells = [];

                  for (let i = 0; i < offset; i++) {
                    cells.push(<div key={`pad-${i}`} className="h-9" />);
                  }

                  for (let d = 1; d <= countDays; d++) {
                    const mStr = String(m + 1).padStart(2, '0');
                    const dStr = String(d).padStart(2, '0');
                    const cellDate = `${y}-${mStr}-${dStr}`;
                    const isSelected = tempPickerDates.includes(cellDate);

                    cells.push(
                      <button
                        key={cellDate}
                        type="button"
                        onClick={() => handleTogglePickerDate(cellDate)}
                        className="h-9 w-full flex items-center justify-center"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-white text-zinc-950 font-bold shadow-md'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {d}
                        </span>
                      </button>
                    );
                  }

                  return cells;
                })()}
              </div>

              {/* Footer: Count of selected days + Cancelar / OK */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-xs font-medium text-zinc-400">
                  {tempPickerDates.length} {tempPickerDates.length === 1 ? 'dia' : 'dias'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDatePicker}
                    className="px-4 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 8. MODAL: RECORRÊNCIA (IMAGE 4)                          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isRecurrenceModalOpen && (
          <div
            onClick={() => setIsRecurrenceModalOpen(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full sm:max-w-sm bg-[#18181b] border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3"
            >
              <h4 className="text-xs font-bold text-zinc-400 tracking-wider uppercase mb-3">
                RECORRÊNCIA
              </h4>
              <div className="space-y-1">
                {[
                  { id: 'none' as const, label: 'Nenhuma', icon: '⊘' },
                  { id: 'daily' as const, label: 'Todo dia', icon: '∞' },
                  { id: 'weekly' as const, label: 'Toda semana', icon: '📅' },
                  { id: 'weekends' as const, label: 'Fins de semana', icon: '☂' },
                  { id: 'specific_days' as const, label: 'Dias específicos', icon: '🎛' },
                  { id: 'monthly' as const, label: 'Todo mês', icon: '📅' }
                ].map(opt => {
                  const isSel = formRecurrence === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFormRecurrence(opt.id);
                        setIsRecurrenceModalOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-mono">{opt.icon}</span>
                        <span className="text-xs font-semibold text-white">{opt.label}</span>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-amber-400 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 9. MODAL: NOVA TAG (IMAGE 5)                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isNewTagModalOpen && (
          <div
            onClick={() => setIsNewTagModalOpen(false)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="w-full sm:max-w-sm bg-[#18181b] border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <h4 className="text-base font-bold text-white">Nova tag</h4>

              <div>
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Nome da tag"
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-2">
                  COR
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#ffffff', '#38bdf8', '#a855f7', '#22c55e', '#eab308', '#ef4444', ...COLOR_PALETTE].slice(0, 10).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTagColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newTagColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNewTag}
                disabled={!newTagName.trim()}
                className="w-full py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors disabled:opacity-40"
              >
                Criar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 10. MODAL: HORÁRIO PERSONALIZADO                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isCustomTimeModalOpen && (
          <div
            onClick={() => setIsCustomTimeModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xs bg-[#18181b] border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3"
            >
              <h4 className="text-sm font-bold text-white">Definir Horário</h4>
              <input
                type="time"
                value={formCustomTime}
                onChange={e => setFormCustomTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-700"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomTimeModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formCustomTime) {
                      setFormTimeSlot('custom');
                    }
                    setIsCustomTimeModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 11. DRAWER / MODAL: ARCHIVE / TAGS & HISTÓRICO (🗂)      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isArchiveDrawerOpen && (
          <div
            onClick={() => setIsArchiveDrawerOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Visão Geral & Trackers</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchiveDrawerOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Trackers Quick Access */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Trackers Ativos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsArchiveDrawerOpen(false);
                      if (onOpenTrackers) onOpenTrackers();
                    }}
                    className="p-3 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-colors flex items-center gap-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-orange-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Leitura</span>
                      <span className="text-[10px] text-zinc-400">
                        {bookTracker?.bookName || 'Nenhum livro'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsArchiveDrawerOpen(false);
                      if (onOpenTrackers) onOpenTrackers();
                    }}
                    className="p-3 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-colors flex items-center gap-2.5"
                  >
                    <Book className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Bíblia</span>
                      <span className="text-[10px] text-zinc-400">
                        {bibleTracker?.capitulosJaLidos || 0} capítulos
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Rotinas Concluídas */}
              {completedRoutineTasks.length > 0 && setShowCompletedRoutinesModal && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsArchiveDrawerOpen(false);
                      setShowCompletedRoutinesModal(true);
                    }}
                    className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Rotinas Concluídas no Dia</span>
                    </div>
                    <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                      {completedRoutineTasks.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Tags Catalog */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tags Registradas ({allTags.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsArchiveDrawerOpen(false);
                      setIsNewTagModalOpen(true);
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    + Nova Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {allTags.map(t => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="capitalize">{t.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 12. MODAL: SETTINGS / PREFERÊNCIAS (⚙️)                  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div
            onClick={() => setIsSettingsModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-sm font-bold text-white">Opções de Missões</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tag Shortcuts Configuration Section (User requested: tags should not always be displayed as shortcuts) */}
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Atalhos de Tags na Barra</span>
                      <span className="text-[10px] text-zinc-500">Exibir tags como filtros rápidos</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTagShortcuts(!showTagShortcuts)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showTagShortcuts ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showTagShortcuts ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {showTagShortcuts
                    ? 'Defina abaixo quais tags devem aparecer como atalhos na barra de filtros:'
                    : 'Atalhos de tags desativados. Apenas os filtros Todas, Ativas e Concluídas serão exibidos.'}
                </p>

                {showTagShortcuts && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-medium">
                        {visibleTagShortcuts.length} de {displayTags.length} visíveis
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllTags}
                          className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          Habilitar todas
                        </button>
                        <span className="text-zinc-600">|</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllTags}
                          className="text-zinc-400 hover:text-zinc-200 font-semibold cursor-pointer"
                        >
                          Desabilitar todas
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {displayTags.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 italic py-2 text-center">Nenhuma tag cadastrada ainda.</p>
                      ) : (
                        displayTags.map(tag => {
                          const isChecked = visibleTagShortcuts.includes(tag.name.toLowerCase());
                          return (
                            <label
                              key={tag.name}
                              className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-xs font-medium text-zinc-200 capitalize">
                                  {tag.name}
                                </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleTagShortcut(tag.name)}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs pt-1">
                {handleResetForNewDay && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      handleResetForNewDay();
                    }}
                    className="w-full p-3 text-left rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>Redefinir checklist deste dia</span>
                    <Repeat className="w-4 h-4 text-zinc-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    if (onOpenTrackers) onOpenTrackers();
                  }}
                  className="w-full p-3 text-left rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Abrir Leitura Semanal & Bíblia</span>
                  <BookOpen className="w-4 h-4 text-orange-400" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
