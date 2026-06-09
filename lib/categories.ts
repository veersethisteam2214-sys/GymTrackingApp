import type { CategoryMeta } from "@/lib/types";

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "progress_photo",
    label: "Gym attendance proof",
    shortLabel: "Gym",
    helper: "Take a live photo of yourself at the gym for attendance proof.",
    accent: "bg-leaf"
  },
  {
    id: "treadmill_photo",
    label: "Cardio proof",
    shortLabel: "Cardio",
    helper: "Treadmill screen, timer, or cardio summary photo.",
    accent: "bg-sky"
  },
  {
    id: "weight_scale_photo",
    label: "Weight entry",
    shortLabel: "Weight",
    helper: "Upload a scale photo and enter today's weight.",
    accent: "bg-sun"
  },
  {
    id: "protein_shake_photo",
    label: "Protein proof",
    shortLabel: "Protein",
    helper: "Protein shake or prepared protein photo.",
    accent: "bg-clay"
  }
];

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id);

export const GROUP_CHALLENGE_CATEGORY_ID = "group_challenge_ab_photo" as const;
export const GROUP_CHALLENGE_DATES = ["2026-06-11", "2026-06-13"];
export const WEEKLY_PROGRESS_CATEGORY_ID = "weekly_progress_photo" as const;

export function isGroupChallengeDate(dateString: string) {
  return GROUP_CHALLENGE_DATES.includes(dateString);
}

export function getGroupChallengeCategory(createdByName?: string | null): CategoryMeta {
  const creator = createdByName?.trim() || "user";

  return {
    id: GROUP_CHALLENGE_CATEGORY_ID,
    label: `Group challenge (AB): created by ${creator}`,
    shortLabel: "Group challenge",
    helper: "Upload the extra AB group challenge proof for today.",
    accent: "bg-sky"
  };
}

export function isSunday(dateString: string) {
  return new Date(`${dateString}T12:00:00`).getDay() === 0;
}

export function getWeeklyProgressCategory(): CategoryMeta {
  return {
    id: WEEKLY_PROGRESS_CATEGORY_ID,
    label: "Weekly progress picture",
    shortLabel: "Progress",
    helper: "Sunday-only weekly progress photo. Take a clear live picture once per week.",
    accent: "bg-leaf"
  };
}

export function getCategoriesForDate(dateString: string, challengeCreatorName?: string | null) {
  return [
    ...CATEGORIES,
    ...(isSunday(dateString) ? [getWeeklyProgressCategory()] : []),
    ...(isGroupChallengeDate(dateString) ? [getGroupChallengeCategory(challengeCreatorName)] : [])
  ];
}

export function getCategoryIdsForDate(dateString: string) {
  return getCategoriesForDate(dateString).map((category) => category.id);
}

export function getAllCategories(challengeCreatorName?: string | null) {
  return [...CATEGORIES, getWeeklyProgressCategory(), getGroupChallengeCategory(challengeCreatorName)];
}

export const ALL_CATEGORY_IDS = getAllCategories().map((category) => category.id);

export function getCategoryById(categoryId: string, challengeCreatorName?: string | null) {
  return getAllCategories(challengeCreatorName).find((category) => category.id === categoryId) ?? null;
}
