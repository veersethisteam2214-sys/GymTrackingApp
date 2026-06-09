import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createAdminSupabase } from "@/lib/supabase/server";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!profileId) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your old password first." }, { status: 400 });
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: "Username must be 3-24 characters: letters, numbers, dot, dash, or underscore." }, { status: 400 });
  }

  if (newPassword && newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  if (newPassword && newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, password_hash, password_salt")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.password_hash || !profile.password_salt) {
    return NextResponse.json({ error: "This profile does not have login credentials yet." }, { status: 400 });
  }

  if (!verifyPassword(currentPassword, profile.password_hash, profile.password_salt)) {
    return NextResponse.json({ error: "Old password is incorrect." }, { status: 401 });
  }

  const { data: usernameOwner } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (usernameOwner && usernameOwner.id !== profileId) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
  }

  const values: Record<string, string> = {
    username,
    login_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (newPassword) {
    const { hash, salt } = hashPassword(newPassword);
    values.password_hash = hash;
    values.password_salt = salt;
  }

  const { error } = await supabase.from("profiles").update(values).eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
