import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;
  if (!profileId) return NextResponse.json({ error: "Set up your app profile first." }, { status: 401 });

  const supabase = createAdminSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  await markNotificationsRead(supabase, profileId);
  return NextResponse.json({ ok: true });
}
