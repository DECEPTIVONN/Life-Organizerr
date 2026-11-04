import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Check,
  Plus,
  X,
  Clock,
  Sun,
  Sunrise,
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
  Tag as TagIcon,
  Flame,
  Zap
} from 'lucide-react';
import { DailyTask, SubTask, BookTracker, BibleTracker, CalendarNote, Habit } from '../types';
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
  habits?: Habit[];
  setHabits?: React.Dispatch<React.SetStateAction<Habit[]>>;
  userName?: string;
  themeMode?: 'dark' | 'light';
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
  onOpenTrackers,
  habits,
  setHabits,
  userName = 'Yudi',
  themeMode = 'dark'
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
  const [formIsHabit, setFormIsHabit] = useState(false);

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

  // User setting: Show/hide tags on task cards (opcional exibir ou não as tags nos cards de cada tarefa)
  const [showTagsOnCards, setShowTagsOnCards] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_show_tags_on_cards');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleShowTagsOnCards = (enabled: boolean) => {
    setShowTagsOnCards(enabled);
    localStorage.setItem('mbc_show_tags_on_cards', JSON.stringify(enabled));
  };

  // User setting: Show/hide priority on task cards (opcional exibir ou não a prioridade nos cards de cada tarefa)
  const [showPriorityOnCards, setShowPriorityOnCards] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_show_priority_on_cards');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleShowPriorityOnCards = (enabled: boolean) => {
    setShowPriorityOnCards(enabled);
    localStorage.setItem('mbc_show_priority_on_cards', JSON.stringify(enabled));
  };

  // User setting: Show/hide shift / time on task cards (opcional exibir ou não turno/horário nos cards de cada tarefa)
  const [showShiftTimeOnCards, setShowShiftTimeOnCards] = useState<boolean>(() => {
    const saved = localStorage.getItem('mbc_show_shift_time_on_cards');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleShowShiftTimeOnCards = (enabled: boolean) => {
    setShowShiftTimeOnCards(enabled);
    localStorage.setItem('mbc_show_shift_time_on_cards', JSON.stringify(enabled));
  };

  const getTagColor = (tagName: string) => {
    const found = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    return found?.color || '#f97316';
  };

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

  // Reception greeting (Image 2: "Boa tarde, Yudi")
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) return 'Bom dia';
    if (currentHour >= 12 && currentHour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Formatted full date (Image 2: "Sexta-feira, 9 de outubro")
  const fullDateHeaderLabel = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const day = dateObj.getDate();
      const month = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      return `${capitalizedWeekday}, ${day} de ${month}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Period groups (Image 2: Manhã, Tarde, Noite, Geral)
  const taskGroups = useMemo(() => {
    const manha: DailyTask[] = [];
    const tarde: DailyTask[] = [];
    const noite: DailyTask[] = [];
    const geral: DailyTask[] = [];

    filteredTasks.forEach(task => {
      if (task.timeSlot === 'manha' || task.period === 'manha') {
        manha.push(task);
      } else if (task.timeSlot === 'tarde') {
        tarde.push(task);
      } else if (task.timeSlot === 'noite' || task.period === 'noite') {
        noite.push(task);
      } else {
        geral.push(task);
      }
    });

    return [
      { id: 'manha', title: 'Manhã', icon: 'sunrise', tasks: manha },
      { id: 'tarde', title: 'Tarde', icon: 'sun', tasks: tarde },
      { id: 'noite', title: 'Noite', icon: 'moon', tasks: noite },
      { id: 'geral', title: 'Outras Tarefas', icon: 'list', tasks: geral }
    ].filter(group => group.tasks.length > 0);
  }, [filteredTasks]);

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
    setFormIsHabit(false);
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
    setFormIsHabit(Boolean(task.isHabit || task.habitId));
    setIsTaskModalOpen(true);
  };

  // Keyboard shortcut listener for key 'N' (Image 2: [+ Adicionar tarefa  N])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isTaskModalOpen) {
          e.preventDefault();
          handleOpenCreateTask();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTaskModalOpen]);

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
      const targetHabitId = formIsHabit ? (editingTask.habitId || ('hab-' + editingTask.id)) : undefined;

      if (formIsHabit && setHabits) {
        setHabits(prevHabits => {
          const existing = prevHabits.find(h => h.id === targetHabitId || h.name.toLowerCase() === formTitle.trim().toLowerCase());
          if (existing) {
            return prevHabits.map(h => h.id === existing.id ? {
              ...h,
              name: formTitle.trim(),
              category: formTags[0] || h.category || 'Geral'
            } : h);
          }
          const newHab: Habit = {
            id: targetHabitId || ('hab-' + editingTask.id),
            name: formTitle.trim(),
            type: 'good',
            category: formTags[0] || 'Geral',
            frequency: formRecurrence === 'daily' ? 'Diário' : formRecurrence === 'weekly' ? 'Semanal' : 'Diário',
            history: editingTask.completed ? { [selectedDate]: true } : {},
            createdAt: selectedDate || new Date().toISOString().split('T')[0]
          };
          return [...prevHabits, newHab];
        });
      }

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
              specificDays: formRecurrence === 'specific_days' ? formSpecificDays : undefined,
              isHabit: formIsHabit,
              habitId: targetHabitId
            };
          }
          return t;
        })
      );
    } else {
      // Create new task
      const newTaskId = 'task-' + Math.random().toString(36).substring(2, 9);
      const targetHabitId = formIsHabit ? ('hab-' + newTaskId) : undefined;

      if (formIsHabit && setHabits) {
        setHabits(prevHabits => {
          const existing = prevHabits.find(h => h.name.toLowerCase() === formTitle.trim().toLowerCase());
          if (existing) {
            return prevHabits;
          }
          const newHab: Habit = {
            id: targetHabitId || ('hab-' + newTaskId),
            name: formTitle.trim(),
            type: 'good',
            category: formTags[0] || 'Geral',
            frequency: formRecurrence === 'daily' ? 'Diário' : formRecurrence === 'weekly' ? 'Semanal' : 'Diário',
            history: {},
            createdAt: selectedDate || new Date().toISOString().split('T')[0]
          };
          return [...prevHabits, newHab];
        });
      }

      const newTask: DailyTask = {
        id: newTaskId,
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
        specificDays: formRecurrence === 'specific_days' ? formSpecificDays : undefined,
        isHabit: formIsHabit,
        habitId: targetHabitId
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
        return 'Nenhuma';
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
      {/* RECEPTION GREETING & ACTION HEADER (IMAGE 2)             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-1 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white greeting-heading">
            {greeting}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 capitalize mt-0.5">
            {fullDateHeaderLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateTask}
          className="btn-add-task self-start sm:self-auto cursor-pointer"
          title="Criar nova tarefa (atalho N)"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Adicionar tarefa</span>
        </button>
      </div>

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
              <div className="flex items-center gap-1.5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`header-date-${selectedDate}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors inline-block"
                  >
                    {getDateHeaderLabel(selectedDate)}
                  </motion.span>
                </AnimatePresence>
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
            className={`square-btn-34 p-2 rounded-xl border transition-all ${
              isInlineCalendarOpen
                ? 'bg-zinc-100 text-zinc-950 border-zinc-200 shadow-sm'
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
            title="Abrir calendário mensal"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        {/* Right icons: Ofensiva, Visão Geral & Trackers */}
        <div className="flex items-center gap-1.5">
          {onOpenStreakHub && (
            <button
              type="button"
              onClick={onOpenStreakHub}
              className="streak-chip flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/20 px-2.5 py-1.5 rounded-xl text-xs text-orange-400 font-bold transition-all cursor-pointer group"
              title="Abrir Central de Ofensivas"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20 group-hover:scale-110 transition-transform" />
              <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsArchiveDrawerOpen(true)}
            className="square-btn-34 p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
            title="Visão Geral & Trackers"
          >
            <Archive className="w-4 h-4 text-amber-400" />
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
          className={`filter-pill px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'todas'
              ? 'active bg-white text-zinc-950 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Todas
        </button>

        {/* Ativas */}
        <button
          type="button"
          onClick={() => setFilterStatus('ativas')}
          className={`filter-pill px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'ativas'
              ? 'active bg-white text-zinc-950 shadow-sm'
              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
          }`}
        >
          Ativas
        </button>

        {/* Concluídas */}
        <button
          type="button"
          onClick={() => setFilterStatus('concluidas')}
          className={`filter-pill px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
            filterStatus === 'concluidas'
              ? 'active bg-white text-zinc-950 shadow-sm'
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
              className={`filter-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? 'active bg-zinc-100 text-zinc-950 shadow-sm'
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

        {/* Quick button to open Settings & Options */}
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="square-btn-34 p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-all shrink-0 ml-auto flex items-center justify-center"
          title="Opções de missões"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. TASK CARDS LIST (IMAGES 2, 3, 10, 11, 12)             */}
      {/* ======================================================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`missions-day-${selectedDate}-${filterStatus}-${selectedTagFilter || 'all'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full space-y-6"
        >
          {taskGroups.length === 0 ? (
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
        <div className="space-y-6">
          {taskGroups.map(group => (
            <div key={group.id} className="space-y-2.5">
              {/* Period Section Header */}
              <div className="flex items-center gap-2 px-1 pt-2 pb-0.5">
                <span className="flex items-center justify-center shrink-0">
                  {group.id === 'manha' && <Sunrise className="w-4 h-4 text-amber-500 dark:text-amber-400 stroke-[2.2]" />}
                  {group.id === 'tarde' && <Sun className="w-4 h-4 text-orange-500 dark:text-orange-400 stroke-[2.2]" />}
                  {group.id === 'noite' && <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 stroke-[2.2]" />}
                  {group.id === 'geral' && <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 stroke-[2.2]" />}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 section-period-title tracking-tight">
                  {group.title}
                </h3>
                <span className="section-period-counter text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-zinc-800">
                  {group.tasks.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.tasks.map(task => {
                  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                  const isExpanded = !!expandedTasks[task.id];

                  // Priority dot
                  const pDotClass = getPriorityDot(task.priority);

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      className="task-card-layered bg-[#18181b] hover:bg-[#1f1f23] transition-colors rounded-[18px] px-4 py-3 sm:py-3.5 border border-zinc-800/50 shadow-sm relative group"
                    >
                      {/* Top Row: Checkbox + Priority Dot + Title + Chevron/Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTask(task.id);
                            }}
                            className={`task-checkbox w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              task.completed
                                ? 'task-completed bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-950 shadow-sm'
                                : 'border border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 bg-transparent'
                            }`}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                    {/* Content area */}
                    <div
                      className="flex-1 min-w-0 select-none cursor-pointer"
                      onClick={() => handleOpenEditTask(task)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority dot (opcional pelas opções de missões) */}
                        {showPriorityOnCards && (
                          <span
                            className={`w-2 h-2 rounded-full ${pDotClass} shrink-0`}
                            title={`Prioridade: ${task.priority}`}
                          />
                        )}
                        <h4
                          className={`text-sm sm:text-base font-semibold tracking-tight leading-snug transition-all ${
                            task.completed ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.text}
                        </h4>

                        {/* Ícones de manhã e noite na mesma linha do TÍTULO DA TAREFA (opcional pelas opções de missões) */}
                        {showShiftTimeOnCards && (
                          (task.timeSlot === 'manha' || task.period === 'manha') ? (
                            <span
                              className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 dark:border-amber-500/30 text-amber-500 dark:text-amber-400 shrink-0"
                              title="Manhã"
                            >
                              <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
                            </span>
                          ) : task.timeSlot === 'tarde' ? (
                            <span
                              className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/25 dark:border-orange-500/30 text-orange-500 dark:text-orange-400 shrink-0"
                              title="Tarde"
                            >
                              <Sun className="w-3.5 h-3.5 stroke-[2.2]" />
                            </span>
                          ) : (task.timeSlot === 'noite' || task.period === 'noite') ? (
                            <span
                              className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 shrink-0"
                              title="Noite"
                            >
                              <Moon className="w-3.5 h-3.5 stroke-[2.2]" />
                            </span>
                          ) : null
                        )}
                      </div>

                      {/* Description underneath */}
                      {task.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Badges row: tags (opcional), hábito, recorrência, hora personalizada e retroativo */}
                      {(() => {
                        const hasTags = showTagsOnCards && ((task.tags && task.tags.length > 0) || Boolean(task.category));
                        const hasHabit = Boolean(task.isHabit);
                        const hasRecurrence = task.recurrence && task.recurrence !== 'none';
                        const hasReminderTime = showShiftTimeOnCards && Boolean(task.reminderTime && task.timeSlot !== 'manha' && task.timeSlot !== 'tarde' && task.timeSlot !== 'noite' && task.period !== 'manha' && task.period !== 'noite');
                        const hasRetroactive = Boolean(task.isRetroactive || task.completedRetroactively);

                        if (!hasTags && !hasHabit && !hasRecurrence && !hasReminderTime && !hasRetroactive) return null;

                        return (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {/* Habit badge */}
                            {hasHabit && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 font-semibold shadow-xs">
                                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span>Hábito</span>
                              </span>
                            )}

                            {/* Tag badge (opcional pelas opções de missões) */}
                            {hasTags && (
                              task.tags && task.tags.length > 0 ? (
                                task.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium"
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: getTagColor(tag) }}
                                    />
                                    <span className="capitalize">{tag}</span>
                                  </span>
                                ))
                              ) : task.category ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                  <span>{task.category}</span>
                                </span>
                              ) : null
                            )}

                            {/* Recurrence badge */}
                            {hasRecurrence && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-400 font-medium">
                                <Repeat className="w-3 h-3 text-zinc-400" />
                                <span>{getRecurrenceText(task.recurrence)}</span>
                              </span>
                            )}

                            {/* Custom Reminder Time badge */}
                            {hasReminderTime && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-medium">
                                <Clock className="w-3 h-3" />
                                <span>{task.reminderTime}</span>
                              </span>
                            )}

                            {/* Retroactive badge */}
                            {hasRetroactive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-400 font-bold uppercase">
                                <Clock className="w-2.5 h-2.5" />
                                Retroativo
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right actions: Subtasks dropdown toggle + Edit + Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasSubtasks && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                        }}
                        className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-all border cursor-pointer ${
                          isExpanded
                            ? 'bg-zinc-800 text-orange-400 border-orange-500/40 shadow-xs'
                            : 'bg-zinc-900/90 text-zinc-400 border-zinc-700/60 hover:bg-zinc-800 hover:text-white'
                        }`}
                        title={isExpanded ? 'Recolher subtarefas' : 'Abrir dropdown de subtarefas'}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-orange-400' : 'text-zinc-400'
                          }`}
                        />
                      </button>
                    )}
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
                  </div>
                </div>

                {/* Subtarefas em Dropdown: Todas na mesma linha, cada uma mantendo sua própria checkbox */}
                {hasSubtasks && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex flex-wrap items-center gap-x-4 gap-y-2">
                          {task.subtasks!.map(st => (
                            <div
                              key={st.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSubtask(task.id, st.id);
                              }}
                              className="inline-flex items-center gap-2 cursor-pointer group/st py-0.5 select-none hover:opacity-90 transition-opacity"
                              title={st.completed ? 'Desmarcar subtarefa' : 'Concluir subtarefa'}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSubtask(task.id, st.id);
                                }}
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  st.completed
                                    ? 'bg-white border-white text-zinc-950 shadow-xs'
                                    : 'border-zinc-700 bg-zinc-900 group-hover/st:border-zinc-500'
                                }`}
                                aria-label={st.text}
                              >
                                {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>
                              <span
                                className={`text-xs transition-colors whitespace-nowrap ${
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 5. FLOATING ACTION BUTTON (FAB) (+)                      */}
      {/* ======================================================== */}
      <button
        type="button"
        onClick={handleOpenCreateTask}
        className="fab-circular-add fixed bottom-28 sm:bottom-8 right-5 sm:right-8 z-40 w-[52px] h-[52px] rounded-full bg-[#09090b]/80 hover:bg-[#141419]/90 active:scale-95 shadow-xl backdrop-blur-md transition-all flex items-center justify-center cursor-pointer group outline-none select-none border-0"
        aria-label="Nova tarefa"
      >
        <Plus 
          className="w-6 h-6 stroke-[2.5] text-white transition-transform duration-200 group-hover:scale-110 group-active:scale-90" 
        />
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
              className="w-full h-full sm:h-auto sm:max-h-[94vh] md:w-[98vw] md:max-w-[1600px] lg:max-w-[1750px] bg-black border border-zinc-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Top Navigation Bar: ✕  Nova tarefa  Salvar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-black">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                  </h3>
                  <span className="hidden md:inline-block text-[11px] text-zinc-500 font-medium px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-900">
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
              <div className="p-5 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-black">
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
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-4 py-3 text-base sm:text-lg font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
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
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
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
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                              ? 'bg-zinc-900 border-zinc-800 text-white'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                              ? 'bg-zinc-900 border-zinc-800 text-white'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                          className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtaskToForm}
                          className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Adicionar</span>
                        </button>
                      </div>

                      {/* Added subtasks list */}
                      {formSubtasks.length > 0 && (
                        <div className="space-y-1.5 bg-zinc-950/80 p-2.5 rounded-2xl border border-zinc-900 max-h-56 overflow-y-auto">
                          {formSubtasks.map(st => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 bg-black/90 border border-zinc-900/60 rounded-xl hover:border-zinc-800 transition-colors"
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
                                className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
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
                  <div className="lg:col-span-5 xl:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l border-zinc-900 lg:pl-8 pt-5 lg:pt-0">
                    {/* HORÁRIO Section */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        TURNO / HORÁRIO
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {formTimeSlot && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-850 text-xs text-white font-semibold shadow-sm">
                            {formTimeSlot === 'manha' ? (
                              <Sun className="w-4 h-4 text-amber-400" />
                            ) : formTimeSlot === 'tarde' ? (
                              <Sunset className="w-4 h-4 text-sky-400" />
                            ) : formTimeSlot === 'noite' ? (
                              <Moon className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            {formTimeSlot === 'custom' && <span>{formCustomTime || 'Horário'}</span>}
                            <button
                              type="button"
                              onClick={() => {
                                setFormTimeSlot('');
                                setFormCustomTime('');
                              }}
                              className="ml-1 text-zinc-400 hover:text-white"
                              title="Remover horário"
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
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Hora</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('manha')}
                              className="p-2 sm:px-2.5 rounded-full text-xs font-semibold bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all flex items-center justify-center"
                              title="Manhã"
                              aria-label="Manhã"
                            >
                              <Sun className="w-4 h-4 text-amber-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('tarde')}
                              className="p-2 sm:px-2.5 rounded-full text-xs font-semibold bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all flex items-center justify-center"
                              title="Tarde"
                              aria-label="Tarde"
                            >
                              <Sunset className="w-4 h-4 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setFormTimeSlot('noite')}
                              className="p-2 sm:px-2.5 rounded-full text-xs font-semibold bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 transition-all flex items-center justify-center"
                              title="Noite"
                              aria-label="Noite"
                            >
                              <Moon className="w-4 h-4 text-indigo-400" />
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
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                                  ? 'bg-zinc-900 border-zinc-700 text-white shadow-sm'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                          className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
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
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
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
                              ? 'bg-zinc-900 border-zinc-700 text-white'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Data</span>
                          {formReminderDate && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                        </button>
                      </div>
                    </div>

                    {/* HÁBITO Section - Assinalar como hábito para rastreamento */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                        RASTREADOR DE HÁBITOS
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormIsHabit(prev => !prev)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          formIsHabit
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${formIsHabit ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                          <div className="text-left">
                            <span className="block font-medium">Rastrear como Hábito</span>
                            <span className="text-[10px] text-zinc-400 font-normal block">
                              Sincronizar progresso no Rastreador de Hábitos
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2 ${
                            formIsHabit
                              ? 'bg-amber-500 border-amber-500 text-zinc-950'
                              : 'border-zinc-700 bg-transparent'
                          }`}
                        >
                          {formIsHabit && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    </div>

                    {/* RECORRÊNCIA Section - Only displayed when editing the task */}
                    {editingTask && (
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5">
                          RECORRÊNCIA
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsRecurrenceModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Repeat className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{getRecurrenceText(formRecurrence)}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-900 bg-black">
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
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
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
              className="w-full max-w-sm bg-black border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-4"
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
              className="w-full sm:max-w-sm bg-black border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3"
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
              className="w-full sm:max-w-sm bg-black border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
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
              className="w-full max-w-xs bg-black border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3"
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
              className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Visão Geral & Trackers</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsArchiveDrawerOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
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
                    className="p-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl text-left transition-colors flex items-center gap-2.5"
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
                    className="p-3 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl text-left transition-colors flex items-center gap-2.5"
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
                    className="w-full py-2.5 px-3 bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Rotinas Concluídas no Dia</span>
                    </div>
                    <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full font-mono text-zinc-300">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-900 text-xs text-zinc-300"
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
              className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-sm font-bold text-white">Opções de Missões</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tag Cards Configuration Section (Opcional exibir ou não as tags nos cards de cada tarefa) */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-orange-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Exibir Tags nos Cards</span>
                      <span className="text-[10px] text-zinc-500">Mostrar tags em cada cartão de tarefa</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleShowTagsOnCards(!showTagsOnCards)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showTagsOnCards ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                    aria-label="Alternar exibição de tags nos cards"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showTagsOnCards ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {showTagsOnCards
                    ? 'As tags das tarefas aparecem nos cards da lista.'
                    : 'Tags ocultas nos cards para uma visualização mais limpa.'}
                </p>
              </div>

              {/* Priority Cards Configuration Section (Opcional exibir ou não a prioridade nos cards de cada tarefa) */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">Exibir Prioridade nos Cards</span>
                      <span className="text-[10px] text-zinc-500">Mostrar ponto colorido de prioridade</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleShowPriorityOnCards(!showPriorityOnCards)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showPriorityOnCards ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                    aria-label="Alternar exibição de prioridade nos cards"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showPriorityOnCards ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {showPriorityOnCards
                    ? 'O ponto colorido indicando a prioridade é exibido nos cards.'
                    : 'Prioridade oculta nos cards para um visual mais minimalista.'}
                </p>
              </div>

              {/* Turno / Horário Configuration Section (Opcional exibir ou não o turno/horário nos cards de cada tarefa) */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Exibir Turno / Horário nos Cards</span>
                      <span className="text-[10px] text-zinc-500">Mostrar ícones de período e horários</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleShowShiftTimeOnCards(!showShiftTimeOnCards)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      showShiftTimeOnCards ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                    aria-label="Alternar exibição de turno e horário nos cards"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        showShiftTimeOnCards ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {showShiftTimeOnCards
                    ? 'Ícones de turno (manhã, tarde, noite) e horários aparecem nos cards.'
                    : 'Turno e horários ocultos nos cards para uma visualização simplificada.'}
                </p>
              </div>

              {/* Tag Shortcuts Configuration Section */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 space-y-3">
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
                      showTagShortcuts ? 'bg-amber-500' : 'bg-zinc-800'
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
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
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
                              className="flex items-center justify-between p-2 rounded-lg bg-black border border-zinc-900 hover:border-zinc-800 cursor-pointer transition-colors"
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
                    className="w-full p-3 text-left rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-colors flex items-center justify-between"
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
                  className="w-full p-3 text-left rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-200 hover:text-white transition-colors flex items-center justify-between"
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
