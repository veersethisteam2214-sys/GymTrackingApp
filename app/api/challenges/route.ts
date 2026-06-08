import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value ?? null;

  if (!profileId) {
    return NextResponse.json({ error: "Set up your profile first." }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const payload = await request.json();
  const title = String(payload.title ?? "").trim();
  const description = String(payload.description ?? "").trim();
  const challengeType = String(payload.challenge_type ?? "consistency").trim() || "consistency";
  const targetUnit = String(payload.target_unit ?? "").trim();
  const targetValueText = String(payload.target_value ?? "").trim();
  const targetValue = targetValueText ? Number(targetValueText) : null;
  const startDate = String(payload.start_date ?? "").trim();
  const endDate = String(payload.end_date ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Challenge title is required." }, { status: 400 });
  }

  if (targetValue !== null && !Number.isFinite(targetValue)) {
    return NextResponse.json({ error: "Target must be a number." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      title,
      description: description || null,
      challenge_type: challengeType,
      target_value: targetValue,
      target_unit: targetUnit || null,
      start_date: startDate || null,
      end_date: endDate || null,
      created_by_profile_id: profileId
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create challenge." }, { status: 500 });
  }

  return NextResponse.json({ challenge: data });
}
