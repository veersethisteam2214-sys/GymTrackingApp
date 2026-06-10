import { CATEGORIES } from "@/lib/categories";
import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

export const GYM_REST_DAY_NOTE = "It's their gym rest day. No image is required to be uploaded.";

const DAY_ALIASES: Record<number, string[]> = {
  0: ["sunday", "sun"],
  1: ["monday", "mon"],
  2: ["tuesday", "tue", "tues"],
  3: ["wednesday", "wed"],
  4: ["thursday", "thu", "thur", "thurs"],
  5: ["friday", "fri"],
  6: ["saturday", "sat"]
};

function getDayAliases(dateString: string) {
  return DAY_ALIASES[new Date(`${dateString}T12:00:00`).getDay()] ?? [];
}

function normalizeRoutineLine(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s:-]/g, " ").replace(/\s+/g, " ").trim();
}

function getRoutineForDate(gymRoutine: string | null, dateString: string) {
  if (!gymRoutine) return "";
  const aliases = getDayAliases(dateString);
  const line = gymRoutine
    .split(/\r?\n/)
    .map((entry) => normalizeRoutineLine(entry))
    .find((entry) => aliases.some((alias) => entry.startsWith(alias)));
  return line?.split(/[-:]/).slice(1).join("-").trim() ?? "";
}

export function isGymRestDay(gymRoutine: string | null, dateString: string) {
  const routine = getRoutineForDate(gymRoutine, dateString);
  return /\brest\b/.test(routine);
}

function createRestDayGymItem(checkin: DailyCheckIn): CheckInItem {
  return {
    id: `${checkin.id}:gym-rest-day`,
    checkin_id: checkin.id,
    user_id: checkin.user_id,
    category: "progress_photo",
    status: "excused",
    storage_path: null,
    original_filename: null,
    mime_type: null,
    file_size_bytes: null,
    uploaded_at: null,
    note: GYM_REST_DAY_NOTE,
    created_at: checkin.created_at,
    updated_at: checkin.updated_at,
    signedUrl: null
  };
}

export function applyGymRestDayExcuses<T extends CheckInItem>(
  items: T[],
  checkins: DailyCheckIn[],
  profiles: Pick<Profile, "id" | "gym_routine">[]
): CheckInItem[] {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const nextItems: CheckInItem[] = [...items];

  for (const checkin of checkins) {
    const profile = profileMap.get(checkin.user_id);
    if (!profile || !isGymRestDay(profile.gym_routine, checkin.checkin_date)) continue;

    const existingIndex = nextItems.findIndex((item) => item.checkin_id === checkin.id && item.category === "progress_photo");
    if (existingIndex >= 0) {
      const existing = nextItems[existingIndex];
      if (existing.status !== "uploaded") {
        nextItems[existingIndex] = {
          ...existing,
          status: "excused",
          note: existing.note || GYM_REST_DAY_NOTE,
          signedUrl: null
        };
      }
      continue;
    }

    nextItems.push(createRestDayGymItem(checkin));
  }

  return nextItems;
}

export function getGymCategoryRestLabel(categoryId: string, item?: Pick<CheckInItem, "status" | "note"> | null) {
  if (categoryId !== CATEGORIES[0].id || item?.status !== "excused") return null;
  return item.note || GYM_REST_DAY_NOTE;
}
