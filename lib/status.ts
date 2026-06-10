import { CATEGORY_IDS } from "@/lib/categories";
import type { CheckInItem, DailyCheckIn, DailyStatus } from "@/lib/types";

type CountableItem = Pick<CheckInItem, "status"> & Partial<Pick<CheckInItem, "category">>;

function isActiveItem(item: CountableItem, categoryIds: string[] = CATEGORY_IDS) {
  return !item.category || categoryIds.includes(item.category);
}

export function getCompletionCount(items: CountableItem[] = [], categoryIds: string[] = CATEGORY_IDS) {
  return items.filter((item) => isActiveItem(item, categoryIds) && item.status === "uploaded").length;
}

export function calculateDailyStatus(
  items: CountableItem[] = [],
  isRestDay = false,
  categoryIds: string[] = CATEGORY_IDS
): DailyStatus {
  if (isRestDay) return "excused";
  const completionCount = getCompletionCount(items, categoryIds);
  if (completionCount >= categoryIds.length) return "complete";
  if (completionCount > 0) return "partial";
  return "missing";
}

export function statusTone(status: DailyStatus | "uploaded" | "excused") {
  switch (status) {
    case "complete":
    case "uploaded":
      return "bg-leaf text-white";
    case "partial":
      return "bg-sun text-ink";
    case "excused":
      return "bg-sky text-white";
    default:
      return "bg-ink/8 text-ink/55";
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(dateString: string, amount: number) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isStreakStatus(status: DailyStatus) {
  return status === "complete" || status === "excused";
}

export function getCurrentStreak(checkins: Pick<DailyCheckIn, "checkin_date" | "overall_status">[], anchorDate = getTodayString()) {
  const byDate = new Map(checkins.map((checkin) => [checkin.checkin_date, checkin.overall_status]));
  const anchorStatus = byDate.get(anchorDate);
  let cursor = anchorStatus && isStreakStatus(anchorStatus) ? anchorDate : shiftDate(anchorDate, -1);
  let streak = 0;

  while (true) {
    const status = byDate.get(cursor);
    if (!status || !isStreakStatus(status)) break;
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

export function getLongestStreak(checkins: Pick<DailyCheckIn, "overall_status">[]) {
  let longest = 0;
  let current = 0;

  for (const checkin of checkins) {
    if (isStreakStatus(checkin.overall_status)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export function getStats(checkins: Pick<DailyCheckIn, "overall_status">[]) {
  return {
    complete: checkins.filter((item) => item.overall_status === "complete").length,
    partial: checkins.filter((item) => item.overall_status === "partial").length,
    missing: checkins.filter((item) => item.overall_status === "missing").length,
    excused: checkins.filter((item) => item.overall_status === "excused").length
  };
}
