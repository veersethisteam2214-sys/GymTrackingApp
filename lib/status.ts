import { CATEGORY_IDS } from "@/lib/categories";
import type { CheckInItem, DailyCheckIn, DailyStatus } from "@/lib/types";

type CountableItem = Pick<CheckInItem, "status"> & Partial<Pick<CheckInItem, "category">>;

function isActiveItem(item: CountableItem, categoryIds: string[] = CATEGORY_IDS) {
  return !item.category || categoryIds.includes(item.category);
}

export function getCompletionCount(items: CountableItem[] = [], categoryIds: string[] = CATEGORY_IDS) {
  return items.filter((item) => isActiveItem(item, categoryIds) && (item.status === "uploaded" || item.status === "excused")).length;
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

export function getCurrentStreak(checkins: Pick<DailyCheckIn, "checkin_date" | "overall_status">[]) {
  const sorted = [...checkins].sort((a, b) => b.checkin_date.localeCompare(a.checkin_date));
  let streak = 0;

  for (const checkin of sorted) {
    if (checkin.overall_status === "complete" || checkin.overall_status === "excused") {
      streak += 1;
      continue;
    }
    break;
  }

  return streak;
}

export function getLongestStreak(checkins: Pick<DailyCheckIn, "overall_status">[]) {
  let longest = 0;
  let current = 0;

  for (const checkin of checkins) {
    if (checkin.overall_status === "complete" || checkin.overall_status === "excused") {
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
