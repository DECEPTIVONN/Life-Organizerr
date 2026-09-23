import { DailyTask } from '../types';

/**
 * Checks if a task is scheduled for a specific date (YYYY-MM-DD).
 * Follows strict calendar rules:
 * - If task has explicit `dates` array and not empty:
 *   - Matches if `dates.includes(dateStr)`
 *   - If not in `dates` and recurrence is 'none' or absent, returns false
 * - If task is non-recurring (isRecurring === false or recurrence === 'none'):
 *   - Only matches if dateStr matches task.dates or task.createdDate
 * - If task has recurrence:
 *   - 'daily': every day on or after createdDate (or all days if no createdDate)
 *   - 'weekends': only Saturdays and Sundays
 *   - 'weekly': matches same day of the week as createdDate
 *   - 'specific_days': matches specificDays list (1=Mon..7=Sun or 0=Sun..6=Sat)
 *   - 'monthly': matches day of month
 * - Routine tasks (id starts with 'grid-' or 'routine-') are generated per day
 */
export function isTaskScheduledForDate(task: DailyTask, dateStr: string): boolean {
  if (!task || !dateStr) return false;

  // Routine tasks generated dynamically for the day
  if (task.id.startsWith('grid-') || task.id.startsWith('routine-') || task.id.startsWith('dt-day-')) {
    return true;
  }

  // 1. If task has specific explicit dates
  if (task.dates && task.dates.length > 0) {
    if (task.dates.includes(dateStr)) return true;
    // If it has dates and recurrence is 'none' or absent, it strictly only belongs to those dates
    if (!task.recurrence || task.recurrence === 'none') {
      return false;
    }
  }

  // 2. If recurrence is explicitly 'none' or isRecurring is false
  if (task.recurrence === 'none' || task.isRecurring === false) {
    if (task.dates && task.dates.length > 0) {
      return task.dates.includes(dateStr);
    }
    if (task.createdDate) {
      return task.createdDate === dateStr;
    }
    // If neither is present, it does not belong to any specific day
    return false;
  }

  // 3. If task has recurrence
  if (task.recurrence) {
    // Cannot appear before creation date (if specified)
    if (task.createdDate && dateStr < task.createdDate) {
      return false;
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    const dayOfWeekSun0 = dateObj.getDay(); // 0=Sun, 1=Mon... 6=Sat
    const dayOfWeekMon1 = dayOfWeekSun0 === 0 ? 7 : dayOfWeekSun0; // 1=Mon... 7=Sun

    if (task.recurrence === 'daily') {
      return true;
    }
    if (task.recurrence === 'weekends') {
      return dayOfWeekSun0 === 0 || dayOfWeekSun0 === 6;
    }
    if (task.recurrence === 'weekly') {
      const baseDateStr = task.createdDate || (task.dates && task.dates[0]) || dateStr;
      const [by, bm, bd] = baseDateStr.split('-').map(Number);
      const baseObj = new Date(by, bm - 1, bd, 12, 0, 0);
      return baseObj.getDay() === dayOfWeekSun0;
    }
    if (task.recurrence === 'specific_days' && task.specificDays && task.specificDays.length > 0) {
      return task.specificDays.includes(dayOfWeekMon1) || task.specificDays.includes(dayOfWeekSun0);
    }
    if (task.recurrence === 'monthly') {
      const baseDateStr = task.createdDate || (task.dates && task.dates[0]) || dateStr;
      const baseDay = parseInt(baseDateStr.split('-')[2], 10);
      return d === baseDay;
    }
  }

  // 4. If isRecurring is true (fallback recurring)
  if (task.isRecurring) {
    if (task.createdDate && dateStr < task.createdDate) {
      return false;
    }
    return true;
  }

  // 5. Default non-recurring fallback: only match createdDate
  if (task.createdDate) {
    return task.createdDate === dateStr;
  }

  return false;
}
