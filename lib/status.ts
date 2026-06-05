import { CATEGORY_IDS } from "@/lib/categories";
import type { CheckInItem, DailyCheckIn, DailyStatus } from "@/lib/types";

export function getCompletionCount(items: Pick<CheckInItem, "status">[] = []) {
  return items.filter((item) => item.status === "uploaded" || item.status === "excused").length;
}

export function calculateDailyStatus(
  items: Pick<CheckInItem, "status">[] = [],
  isRestDay = false
): DailyStatus {
  if (isRestDay) return "excused";
  const completionCount = getCompletionCount(items);
  if (completionCount >= CATEGORY_IDS.length) return "complete";
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

