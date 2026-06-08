import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const saveLogin = formData.get("save_login") === "on";

  if (!username || !password) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile?.password_hash || !profile.password_salt || !verifyPassword(password, profile.password_hash, profile.password_salt)) {
    return NextResponse.json({ error: "Username or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("gym_profile_id", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: saveLogin ? 60 * 60 * 24 * 365 : undefined,
    path: "/"
  });
  return response;
}
