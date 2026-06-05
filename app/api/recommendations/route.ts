import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("gym_access_granted")?.value === "true";
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!hasAccess || !profileId) {
    return NextResponse.json({ error: "Set up your app profile first." }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const payload = await request.json().catch(() => ({}));
  const title = String(payload.title ?? "").trim();
  const note = String(payload.note ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Enter a book title." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      created_by_profile_id: profileId,
      title,
      note: note || null
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save recommendation." }, { status: 500 });
  }

  return NextResponse.json({ recommendation: data });
}
