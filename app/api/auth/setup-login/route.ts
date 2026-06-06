import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("gym_access_granted")?.value === "true";
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!hasAccess || !profileId) {
    return NextResponse.json({ error: "Open your profile first." }, { status: 401 });
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const saveLogin = formData.get("save_login") === "on";

  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3-24 characters: letters, numbers, dot, dash, or underscore." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: usernameOwner } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (usernameOwner && usernameOwner.id !== profileId) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 400 });
  }

  const { hash, salt } = hashPassword(password);
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      password_hash: hash,
      password_salt: salt,
      login_updated_at: new Date().toISOString()
    })
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("gym_profile_id", profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: saveLogin ? 60 * 60 * 24 * 365 : undefined,
    path: "/"
  });
  return response;
}
