import type React from 'react';
import { YearlyBook, BookTracker, WeeklyReview } from '../types';

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  // If it's already in DD/MM/YYYY format
  if (dateStr.includes('/')) return dateStr;
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  } catch (e) {
    console.error('Error formatting date', e);
  }
  return dateStr;
}

export function calculateReadingInterval(
  startDate?: string,
  endDate?: string,
  status?: 'lendo' | 'lido' | 'quero_ler' | 'dropado'
): string {
  const startBR = formatDateBR(startDate);
  const endBR = formatDateBR(endDate);

  if (status === 'lido') {
    if (startBR && endBR) return `${startBR} a ${endBR}`;
    if (endBR) return `Concluído em ${endBR}`;
    if (startBR) return `Iniciado em ${startBR} (Concluído)`;
    return 'Concluído';
  }

  if (status === 'dropado') {
    if (startBR && endBR) return `${startBR} a ${endBR} (Pausado)`;
    if (startBR) return `Iniciado em ${startBR} (Pausado)`;
    return 'Pausado / Dropado';
  }

  if (status === 'lendo') {
    if (startBR) return `${startBR} - Em andamento`;
    return 'Em andamento';
  }

  if (status === 'quero_ler') {
    return 'A iniciar';
  }

  if (startBR && endBR) return `${startBR} a ${endBR}`;
  if (startBR) return `${startBR} - Em andamento`;
  return 'A iniciar';
}

export function getISOWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function syncBookWithYearlyBooks(
  tracker: BookTracker,
  books: YearlyBook[],
  setBooks: React.Dispatch<React.SetStateAction<YearlyBook[]>>,
  weeklyReviews?: WeeklyReview[],
  setWeeklyReviews?: React.Dispatch<React.SetStateAction<WeeklyReview[]>>
): YearlyBook | null {
  if (!tracker || !tracker.bookName || !tracker.bookName.trim()) {
    return null;
  }

  const titleTrimmed = tracker.bookName.trim();
  const titleLower = titleTrimmed.toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const isCompleted = tracker.pagesRead >= tracker.totalPages && tracker.totalPages > 0;
  const status: 'lendo' | 'lido' = isCompleted ? 'lido' : 'lendo';

  let updatedBook: YearlyBook | null = null;

  setBooks(prevBooks => {
    const existingIndex = prevBooks.findIndex(
      b => b.title.trim().toLowerCase() === titleLower
    );

    if (existingIndex >= 0) {
      const existing = prevBooks[existingIndex];
      const startDate = existing.startDate || tracker.startedDate || todayStr;
      const endDate = isCompleted ? (existing.endDate || todayStr) : (status === 'lido' ? todayStr : undefined);
      const interval = calculateReadingInterval(startDate, endDate, status);

      const updated: YearlyBook = {
        ...existing,
        title: titleTrimmed,
        totalPages: tracker.totalPages,
        pagesRead: Math.min(tracker.pagesRead, tracker.totalPages),
        status: status,
        startDate: startDate,
        endDate: endDate,
        readingInterval: interval
      };

      updatedBook = updated;

      const newBooks = [...prevBooks];
      newBooks[existingIndex] = updated;
      return newBooks;
    } else {
      const startDate = tracker.startedDate || todayStr;
      const endDate = isCompleted ? todayStr : undefined;
      const interval = calculateReadingInterval(startDate, endDate, status);

      const newBook: YearlyBook = {
        id: 'bk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        year: currentYear,
        title: titleTrimmed,
        author: 'Autor',
        totalPages: tracker.totalPages,
        pagesRead: Math.min(tracker.pagesRead, tracker.totalPages),
        status: status,
        rating: 0,
        review: '',
        startDate: startDate,
        endDate: endDate,
        readingInterval: interval
      };

      updatedBook = newBook;
      return [newBook, ...prevBooks];
    }
  });

  // Sync to current week's weekly review if setWeeklyReviews provided
  if (setWeeklyReviews) {
    const currentWeekNum = getISOWeekNumber(new Date());

    setWeeklyReviews(prevWr => {
      const existingIndex = prevWr.findIndex(
        w => w.year === currentYear && w.weekNumber === currentWeekNum
      );

      const readingEntry = `📖 ${titleTrimmed}: ${tracker.pagesRead}/${tracker.totalPages} págs (${isCompleted ? 'Concluído' : 'Em andamento'})`;

      if (existingIndex >= 0) {
        const wr = prevWr[existingIndex];
        const currentReadings = wr.readings || '';
        let updatedReadings = currentReadings;

        if (!currentReadings.includes(titleTrimmed)) {
          updatedReadings = currentReadings 
            ? `${currentReadings}\n${readingEntry}`
            : readingEntry;
        } else {
          // Replace line containing titleTrimmed
          const lines = currentReadings.split('\n');
          const newLines = lines.map(line => 
            line.includes(titleTrimmed) ? readingEntry : line
          );
          updatedReadings = newLines.join('\n');
        }

        const newArr = [...prevWr];
        newArr[existingIndex] = {
          ...wr,
          readings: updatedReadings
        };
        return newArr;
      } else {
        const newWr: WeeklyReview = {
          id: 'wr-' + Date.now(),
          year: currentYear,
          weekNumber: currentWeekNum,
          oneSentence: '',
          memorableMoments: [],
          learnings: [],
          improvements: [],
          readings: readingEntry
        };
        return [...prevWr, newWr];
      }
    });
  }

  return updatedBook;
}
