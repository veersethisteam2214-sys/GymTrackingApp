import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek
} from "date-fns";

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateString: string) {
  return format(parseISO(`${dateString}T12:00:00`), "MMM d, yyyy");
}

export function getMonthRange(date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    startDate: getLocalDateString(start),
    endDate: getLocalDateString(end)
  };
}

export function getWeekRange(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return {
    startDate: getLocalDateString(start),
    endDate: getLocalDateString(end)
  };
}

export function getMonthDays(date = new Date()) {
  const days: string[] = [];
  let cursor = startOfMonth(date);
  const end = endOfMonth(date);

  while (cursor <= end) {
    days.push(getLocalDateString(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
}

