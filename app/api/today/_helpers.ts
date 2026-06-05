import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/server";
import { ensureTodayCheckin, getSignedUrl } from "@/lib/data";
import { calculateDailyStatus } from "@/lib/status";
import type { CheckInCategory, CheckInItem } from "@/lib/types";

export async function getTodayContext() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("gym_access_granted")?.value === "true";
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!hasAccess || !profileId) {
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
  const overallStatus = calculateDailyStatus((items ?? []) as CheckInItem[], Boolean(checkin?.is_rest_day));

  await supabase
    .from("daily_checkins")
    .update({ overall_status: overallStatus, updated_at: new Date().toISOString() })
    .eq("id", checkinId);

  return overallStatus;
}

export function isValidCategory(value: unknown): value is CheckInCategory {
  return (
    value === "progress_photo" ||
    value === "treadmill_photo" ||
    value === "weight_scale_photo" ||
    value === "protein_shake_photo"
  );
}

export async function withSignedUrl(supabase: NonNullable<ReturnType<typeof createAdminSupabase>>, item: CheckInItem) {
  return {
    ...item,
    signedUrl: await getSignedUrl(supabase, item.storage_path)
  };
}

