/**
 * Utilities to track and persist deleted/excluded tasks per date.
 * Ensures tasks deleted for a specific day (like today) do not reappear,
 * without retroactively modifying historical records of previous days.
 */

export const getDeletedTaskIdsForDate = (dateStr: string): string[] => {
  if (!dateStr) return [];
  try {
    const saved = localStorage.getItem(`mbc_deleted_tasks_${dateStr}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(id => typeof id === 'string' && id.trim().length > 0);
      }
    }
  } catch (e) {
    console.error(`Error reading deleted tasks for ${dateStr}:`, e);
  }
  return [];
};

export const addDeletedTaskIdForDate = (dateStr: string, taskId: string): string[] => {
  if (!dateStr || !taskId) return [];
  try {
    const current = getDeletedTaskIdsForDate(dateStr);
    if (!current.includes(taskId)) {
      const updated = [...current, taskId];
      localStorage.setItem(`mbc_deleted_tasks_${dateStr}`, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (e) {
    console.error(`Error saving deleted task for ${dateStr}:`, e);
    return [];
  }
};

export const removeDeletedTaskIdForDate = (dateStr: string, taskId: string): string[] => {
  if (!dateStr || !taskId) return [];
  try {
    const current = getDeletedTaskIdsForDate(dateStr);
    const updated = current.filter(id => id !== taskId);
    localStorage.setItem(`mbc_deleted_tasks_${dateStr}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error(`Error removing deleted task for ${dateStr}:`, e);
    return [];
  }
};
