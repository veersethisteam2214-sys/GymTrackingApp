import { NextResponse } from "next/server";
import { getTodayContext } from "@/app/api/today/_helpers";
import { calculateDailyStatus } from "@/lib/status";
import type { CheckInItem } from "@/lib/types";

export async function PATCH(request: Request) {
  const context = await getTodayContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const payload = await request.json();
  const isRestDay = Boolean(payload.is_rest_day);
  const reason = payload.rest_day_reason ? String(payload.rest_day_reason) : null;
  const { data: items } = await context.supabase.from("checkin_items").select("*").eq("checkin_id", context.checkin.id);

  const { data, error } = await context.supabase
    .from("daily_checkins")
    .update({
      is_rest_day: isRestDay,
      rest_day_reason: isRestDay ? reason : null,
      overall_status: calculateDailyStatus((items ?? []) as CheckInItem[], isRestDay),
      updated_at: new Date().toISOString()
    })
    .eq("id", context.checkin.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not update rest day." }, { status: 500 });
  }

  return NextResponse.json({ checkin: data });
}

