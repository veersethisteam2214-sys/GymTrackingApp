import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/server";
import { ensureTodayCheckin, getSignedUrl } from "@/lib/data";
import { ALL_CATEGORY_IDS, getCategoryIdsForDate } from "@/lib/categories";
import { applyGymRestDayExcuses } from "@/lib/rest-days";
import { calculateDailyStatus } from "@/lib/status";
import type { CheckInCategory, CheckInItem } from "@/lib/types";

export async function getTodayContext() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!profileId) {
    return { error: "Set up your app profile first.", status: 401 as const };
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return { error: "Supabase is not configured.", status: 500 as const };
  }

  const checkin = await ensureTodayCheckin(supabase, profileId);
  return { supabase, profileId, checkin };
}

export async function recalculateTodayStatus(supabase: NonNullable<ReturnType<typeof createAdminSupabase>>, checkinId: string) {
  const { data: items } = await supabase.from("checkin_items").select("*").eq("checkin_id", checkinId);
  const { data: checkin } = await supabase.from("daily_checkins").select("*").eq("id", checkinId).single();
  const { data: profile } = checkin?.user_id
    ? await supabase.from("profiles").select("id,gym_routine").eq("id", String(checkin.user_id)).maybeSingle()
    : { data: null };
  const categoryIds = checkin?.checkin_date ? getCategoryIdsForDate(String(checkin.checkin_date)) : undefined;
  const effectiveItems = checkin
    ? applyGymRestDayExcuses(
        (items ?? []) as CheckInItem[],
        [checkin],
        profile ? [profile] : []
      )
    : ((items ?? []) as CheckInItem[]);
  const overallStatus = calculateDailyStatus(effectiveItems, Boolean(checkin?.is_rest_day), categoryIds);

  await supabase
    .from("daily_checkins")
    .update({ overall_status: overallStatus, updated_at: new Date().toISOString() })
    .eq("id", checkinId);

  return overallStatus;
}

export function isValidCategory(value: unknown): value is CheckInCategory {
  return typeof value === "string" && ALL_CATEGORY_IDS.includes(value as CheckInCategory);
}

export async function withSignedUrl(supabase: NonNullable<ReturnType<typeof createAdminSupabase>>, item: CheckInItem) {
  return {
    ...item,
    signedUrl: await getSignedUrl(supabase, item.storage_path)
  };
}
