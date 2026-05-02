const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(date.getDate() + amount);
  return next;
};

export const startOfWeek = (date: Date): Date => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const endOfWeek = (date: Date): Date => addDays(startOfWeek(date), 6);

export const diffInDays = (start: Date, end: Date): number => {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / ONE_DAY_MS);
};

export const minDate = (dates: Date[]): Date => new Date(Math.min(...dates.map((date) => date.getTime())));

export const maxDate = (dates: Date[]): Date => new Date(Math.max(...dates.map((date) => date.getTime())));

export const listDays = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  let cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
};

export const listWeeks = (start: Date, end: Date): Array<{ start: Date; end: Date; days: number }> => {
  const weeks: Array<{ start: Date; end: Date; days: number }> = [];
  let cursor = startOfWeek(start);

  while (cursor <= end) {
    const weekEnd = endOfWeek(cursor);
    const visibleStart = cursor < start ? start : cursor;
    const visibleEnd = weekEnd > end ? end : weekEnd;
    weeks.push({
      start: visibleStart,
      end: visibleEnd,
      days: diffInDays(visibleStart, visibleEnd) + 1,
    });
    cursor = addDays(cursor, 7);
  }

  return weeks;
};

export const formatKoreanMonthDay = (date: Date): string => `${date.getMonth() + 1}월 ${date.getDate()}일`;

export const formatShortDate = (value?: string): string => {
  const date = parseDate(value);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : '';
};

export const getTaskDateRange = (startDate?: string, dueDate?: string): { start: Date; end: Date } | null => {
  const parsedStart = parseDate(startDate);
  const parsedDue = parseDate(dueDate);

  if (!parsedStart && !parsedDue) {
    return null;
  }

  const start = parsedStart ?? parsedDue;
  const end = parsedDue ?? parsedStart;

  if (!start || !end) {
    return null;
  }

  return start <= end ? { start, end } : { start: end, end: start };
};
