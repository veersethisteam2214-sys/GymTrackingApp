import { ALL_CATEGORY_IDS, getCategoryIdsForDate } from "@/lib/categories";
import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

export type LeaderboardPerson<T extends { profile: Profile; todayItems: CheckInItem[]; currentStreak: number }> = T & {
  todayTasks: number;
  score: number;
};

export function getLeaderboardScore(userId: string, checkins: DailyCheckIn[], items: CheckInItem[]) {
  const userCheckins = checkins.filter((checkin) => checkin.user_id === userId);
  return userCheckins.reduce((score, checkin) => {
    const dayItems = items.filter((item) => item.checkin_id === checkin.id);
    return score + getUploadCount(dayItems);
  }, 0);
}

export function getUploadCount(items: CheckInItem[]) {
  return items.filter((item) => ALL_CATEGORY_IDS.includes(item.category) && item.status === "uploaded").length;
}

export function rankPeople<T extends { profile: Profile; todayItems: CheckInItem[]; currentStreak: number }>(
  people: T[],
  checkins: DailyCheckIn[],
  items: CheckInItem[]
): LeaderboardPerson<T>[] {
  return people
    .map((person) => ({
      ...person,
      todayTasks: getUploadCount(person.todayItems),
      score: getLeaderboardScore(person.profile.id, checkins, items)
    }))
    .sort((a, b) => b.score - a.score || b.currentStreak - a.currentStreak || b.todayTasks - a.todayTasks);
}

export function getMaxDailyPoints(dateString?: string) {
  return dateString ? getCategoryIdsForDate(dateString).length : 4;
}

export function getRankBadge(index: number) {
  if (index === 0) return { label: "Trophy", symbol: "1", color: "#f6c453" };
  if (index === 1) return { label: "Silver trophy", symbol: "2", color: "#cbd5e1" };
  if (index === 2) return { label: "Bronze trophy", symbol: "3", color: "#c08457" };
  return { label: `Rank ${index + 1}`, symbol: String(index + 1), color: "var(--text)" };
}
