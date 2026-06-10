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
  return items.filter((item) => ALL_CATEGORY_IDS.includes(item.category) && (item.status === "uploaded" || item.status === "excused")).length;
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

export function getDenseRank<T extends { score: number }>(people: T[], index: number) {
  const score = people[index]?.score;
  if (score === undefined) return index + 1;
  const higherScores = new Set(people.slice(0, index).filter((person) => person.score > score).map((person) => person.score));
  return higherScores.size + 1;
}

export function getRankBadge(rank: number) {
  if (rank === 1) return { label: "Trophy", symbol: "1", color: "#f6c453" };
  if (rank === 2) return { label: "Silver trophy", symbol: "2", color: "#cbd5e1" };
  if (rank === 3) return { label: "Bronze trophy", symbol: "3", color: "#c08457" };
  return { label: `Rank ${rank}`, symbol: String(rank), color: "var(--text)" };
}
