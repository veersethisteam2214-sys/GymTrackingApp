import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("gym_access_granted")?.value === "true";

  if (!hasAccess) {
    return NextResponse.json({ error: "Enter the app password first." }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const payload = await request.json();
  const displayName = String(payload.display_name ?? "").trim();
  const gymRoutine = String(payload.gym_routine ?? "").trim();
  const cardioRoutine = String(payload.cardio_routine ?? "").trim();
  const startingWeight = payload.starting_weight === null ? null : Number(payload.starting_weight);

  if (!displayName || !gymRoutine || !cardioRoutine) {
    return NextResponse.json({ error: "Name, gym routine, and cardio routine are required." }, { status: 400 });
  }

  const currentProfileId = cookieStore.get("gym_profile_id")?.value;
  const values = {
    display_name: displayName,
    starting_weight: Number.isFinite(startingWeight) ? startingWeight : null,
    weight_unit: "kg",
    gym_routine: gymRoutine,
    cardio_routine: cardioRoutine,
    updated_at: new Date().toISOString()
  };

  const query = currentProfileId
    ? supabase.from("profiles").update(values).eq("id", currentProfileId).select("*").single()
    : supabase.from("profiles").insert(values).select("*").single();

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save profile." }, { status: 500 });
  }

  const response = NextResponse.json({ profile: data });
  response.cookies.set("gym_profile_id", data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return response;
}

