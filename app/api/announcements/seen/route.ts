import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { markAnnouncementSeen } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;
  if (!profileId) return NextResponse.json({ error: "Set up your app profile first." }, { status: 401 });

  const supabase = createAdminSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const payload = await request.json().catch(() => ({}));
  const announcementId = String(payload.announcement_id ?? "").trim();
  if (!announcementId) return NextResponse.json({ error: "Missing announcement." }, { status: 400 });

  await markAnnouncementSeen(supabase, profileId, announcementId);
  return NextResponse.json({ ok: true });
}
