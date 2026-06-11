import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

export const REST_DAY_AUTO_CREDIT_NOTE = "It's their rest day. No image is required to be uploaded, but they can still upload one if they want.";
export const GYM_REST_DAY_NOTE = REST_DAY_AUTO_CREDIT_NOTE;
export const REST_DAY_AUTO_CREDIT_CATEGORIES = ["progress_photo", "treadmill_photo"] as const;

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

function createRestDayItem(checkin: DailyCheckIn, category: (typeof REST_DAY_AUTO_CREDIT_CATEGORIES)[number]): CheckInItem {
  return {
    id: `${checkin.id}:${category}-rest-day`,
    checkin_id: checkin.id,
    user_id: checkin.user_id,
    category,
    status: "excused",
    storage_path: null,
    original_filename: null,
    mime_type: null,
    file_size_bytes: null,
    uploaded_at: null,
    note: REST_DAY_AUTO_CREDIT_NOTE,
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

    for (const category of REST_DAY_AUTO_CREDIT_CATEGORIES) {
      const existingIndex = nextItems.findIndex((item) => item.checkin_id === checkin.id && item.category === category);
      if (existingIndex >= 0) {
        const existing = nextItems[existingIndex];
        if (existing.status !== "uploaded") {
          nextItems[existingIndex] = {
            ...existing,
            status: "excused",
            note: existing.note || REST_DAY_AUTO_CREDIT_NOTE,
            signedUrl: null
          };
        }
        continue;
      }

      nextItems.push(createRestDayItem(checkin, category));
    }
  }

  return nextItems;
}

export function getRestDayAutoCreditLabel(categoryId: string, item?: Pick<CheckInItem, "status" | "note"> | null) {
  if (!REST_DAY_AUTO_CREDIT_CATEGORIES.includes(categoryId as (typeof REST_DAY_AUTO_CREDIT_CATEGORIES)[number]) || item?.status !== "excused") return null;
  return item.note || REST_DAY_AUTO_CREDIT_NOTE;
}
