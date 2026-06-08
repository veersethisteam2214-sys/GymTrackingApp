import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PROFILES = 13;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function nullableInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const gymRoutine = String(formData.get("gym_routine") ?? "").trim();
  const cardioRoutine = String(formData.get("cardio_routine") ?? "").trim();
  const goalMode = String(formData.get("goal_mode") ?? "cutting").trim();
  const currentBookTitle = String(formData.get("current_book_title") ?? "").trim();
  const targetDate = String(formData.get("target_date") ?? "").trim();
  const avatar = formData.get("avatar");

  if (!displayName || !email || !gymRoutine || !cardioRoutine) {
    return NextResponse.json({ error: "Name, email, gym routine, and cardio routine are required." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const currentBookTotalPages = nullableInteger(formData.get("current_book_total_pages"));

  if (!currentBookTitle || !currentBookTotalPages) {
    return NextResponse.json({ error: "Current book and total pages are required." }, { status: 400 });
  }

  if (!["cutting", "bulking"].includes(goalMode)) {
    return NextResponse.json({ error: "Choose cutting or bulking." }, { status: 400 });
  }

  const currentProfileId = cookieStore.get("gym_profile_id")?.value;
  let shouldInsert = !currentProfileId;

  if (currentProfileId) {
    const { data: existingProfile, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", currentProfileId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    shouldInsert = !existingProfile;
  }

  if (shouldInsert) {
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_PROFILES) {
      return NextResponse.json({ error: `This group is full. The app supports up to ${MAX_PROFILES} people.` }, { status: 400 });
    }
  }

  const values = {
    display_name: displayName,
    email,
    starting_weight: nullableNumber(formData.get("starting_weight")),
    target_weight: nullableNumber(formData.get("target_weight")),
    target_date: targetDate || null,
    weight_unit: "kg",
    goal_mode: goalMode,
    gym_routine: gymRoutine,
    cardio_routine: cardioRoutine,
    current_book_title: currentBookTitle || null,
    current_book_total_pages: currentBookTotalPages,
    updated_at: new Date().toISOString()
  };

  const query = !shouldInsert && currentProfileId
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

  const response = NextResponse.json({
    profile: {
      ...profile,
      password_hash: null,
      password_salt: null
    }
  });
  response.cookies.set("gym_profile_id", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/"
  });
  return response;
}
