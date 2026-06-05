import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

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

  const formData = await request.formData();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const gymRoutine = String(formData.get("gym_routine") ?? "").trim();
  const cardioRoutine = String(formData.get("cardio_routine") ?? "").trim();
  const targetDate = String(formData.get("target_date") ?? "").trim();
  const avatar = formData.get("avatar");

  if (!displayName || !gymRoutine || !cardioRoutine) {
    return NextResponse.json({ error: "Name, gym routine, and cardio routine are required." }, { status: 400 });
  }

  const currentProfileId = cookieStore.get("gym_profile_id")?.value;
  const values = {
    display_name: displayName,
    starting_weight: nullableNumber(formData.get("starting_weight")),
    target_weight: nullableNumber(formData.get("target_weight")),
    target_date: targetDate || null,
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

  let profile = data;

  if (avatar instanceof File && avatar.size > 0) {
    if (!ACCEPTED_TYPES.includes(avatar.type) || avatar.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Profile photo must be an allowed image under 10 MB." }, { status: 400 });
    }

    if (profile.avatar_url) {
      await supabase.storage.from("checkin-uploads").remove([profile.avatar_url.replace(/^checkin-uploads\//, "")]);
    }

    const safeName = avatar.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `profile-photos/${profile.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("checkin-uploads").upload(path, avatar, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const updated = await supabase
      .from("profiles")
      .update({ avatar_url: `checkin-uploads/${path}`, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("*")
      .single();

    if (updated.error || !updated.data) {
      return NextResponse.json({ error: updated.error?.message ?? "Could not save profile photo." }, { status: 500 });
    }

    profile = updated.data;
  }

  const response = NextResponse.json({ profile });
  response.cookies.set("gym_profile_id", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return response;
}

