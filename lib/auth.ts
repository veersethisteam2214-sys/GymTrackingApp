import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase/server";
import { signProfile } from "@/lib/data";
import type { Profile } from "@/lib/types";

export async function getProfileIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("gym_profile_id")?.value ?? null;
}

export async function requireAppProfile() {
  const supabase = createAdminSupabase();

  if (!supabase) {
    return { supabase: null, profile: null, setupMissing: true as const };
  }

  const profileId = await getProfileIdFromCookie();
  if (!profileId) {
    redirect("/profile-setup");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", profileId).single();

  if (!profile) {
    redirect("/profile-setup");
  }

  return { supabase, profile: await signProfile(supabase, profile as Profile), setupMissing: false as const };
}
