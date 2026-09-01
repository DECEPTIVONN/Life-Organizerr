import { RoutineItem } from '../types';

/**
 * Returns the Monday (YYYY-MM-DD) for the week containing the given date.
 * Weeks run from Monday to Sunday.
 */
export const getWeekMondayStr = (dateInput?: string | Date): string => {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput.getTime());
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
};

/**
 * Checks if a given createdDate belongs to a past week (a week that has ended).
 */
export const isPastWeek = (createdDateStr?: string, referenceDateStr?: string): boolean => {
  if (!createdDateStr) return false;
  const itemWeekMonday = getWeekMondayStr(createdDateStr);
  const currentWeekMonday = getWeekMondayStr(referenceDateStr || new Date());
  return itemWeekMonday < currentWeekMonday;
};

/**
 * Cleans up non-recurring grid routine time blocks whose week has ended.
 */
export const cleanupExpiredGridRoutine = (
  grid: Record<string, any> | undefined | null,
  referenceDateStr?: string
): { cleaned: Record<string, any>; removedCount: number } => {
  if (!grid || typeof grid !== 'object') {
    return { cleaned: {}, removedCount: 0 };
  }

  const cleaned: Record<string, any> = {};
  let removedCount = 0;
  const currentWeekMonday = getWeekMondayStr(referenceDateStr);

  Object.entries(grid).forEach(([key, block]) => {
    if (!block || typeof block !== 'object') return;

    // Check if the block is non-recurring
    const isNonRecurring = block.isWeeklyRecurring === false;

    if (isNonRecurring) {
      const blockCreatedDate = block.createdDate;
      if (blockCreatedDate) {
        const blockWeekMonday = getWeekMondayStr(blockCreatedDate);
        if (blockWeekMonday < currentWeekMonday) {
          // Block is from a past week that ended -> remove it
          removedCount++;
          return;
        }
      }
    }

    cleaned[key] = block;
  });

  return { cleaned, removedCount };
};

/**
 * Cleans up non-recurring RoutineItems whose week has ended.
 */
export const cleanupExpiredRoutineItems = (
  items: RoutineItem[] | undefined | null,
  referenceDateStr?: string
): { cleaned: RoutineItem[]; removedCount: number } => {
  if (!items || !Array.isArray(items)) {
    return { cleaned: [], removedCount: 0 };
  }

  const currentWeekMonday = getWeekMondayStr(referenceDateStr);
  let removedCount = 0;

  const cleaned = items.filter(item => {
    if (!item) return false;

    const isNonRecurring = item.isWeeklyRecurring === false;
    if (isNonRecurring && item.createdDate) {
      const itemWeekMonday = getWeekMondayStr(item.createdDate);
      if (itemWeekMonday < currentWeekMonday) {
        // Item is from a past week that ended -> remove it
        removedCount++;
        return false;
      }
    }
    return true;
  });

  return { cleaned, removedCount };
};
