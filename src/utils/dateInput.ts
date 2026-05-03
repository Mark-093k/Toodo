const pad2 = (value: number) => String(value).padStart(2, '0');

const koreanFullDatePattern = new RegExp(
  '^(\\d{4})\\s*\\uB144\\s*(\\d{1,2})\\s*\\uC6D4\\s*(\\d{1,2})\\s*\\uC77C?$',
);
const koreanPartialDatePattern = new RegExp('^(\\d{1,2})\\s*\\uC6D4\\s*(\\d{1,2})\\s*\\uC77C?$');

export const formatDateForStorage = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const isValidDateParts = (year: number, month: number, day: number) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (year < 1900 || year > 2999 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const toStorageDate = (year: number, month: number, day: number) => {
  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

export const normalizeDateInput = (input: string, activeYear: number): string | null => {
  const value = input.trim();
  if (!value) {
    return null;
  }

  const fullDateMatch = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (fullDateMatch) {
    return toStorageDate(Number(fullDateMatch[1]), Number(fullDateMatch[2]), Number(fullDateMatch[3]));
  }

  const koreanFullDateMatch = value.match(koreanFullDatePattern);
  if (koreanFullDateMatch) {
    return toStorageDate(
      Number(koreanFullDateMatch[1]),
      Number(koreanFullDateMatch[2]),
      Number(koreanFullDateMatch[3]),
    );
  }

  const partialDateMatch = value.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (partialDateMatch) {
    return toStorageDate(activeYear, Number(partialDateMatch[1]), Number(partialDateMatch[2]));
  }

  const koreanPartialDateMatch = value.match(koreanPartialDatePattern);
  if (koreanPartialDateMatch) {
    return toStorageDate(activeYear, Number(koreanPartialDateMatch[1]), Number(koreanPartialDateMatch[2]));
  }

  return null;
};

export const isValidDateString = (value: string) =>
  /^(\d{4})-(\d{2})-(\d{2})$/.test(value) && normalizeDateInput(value, 2000) === value;
