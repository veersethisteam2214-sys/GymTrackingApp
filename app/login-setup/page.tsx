import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginSetupForm } from "@/components/LoginSetupForm";
import { SetupMissing } from "@/components/SetupMissing";
import { signProfile } from "@/lib/data";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LoginSetupPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("gym_access_granted")?.value !== "true") {
    redirect("/access?next=/login-setup");
  }

  const profileId = cookieStore.get("gym_profile_id")?.value;
  if (!profileId) redirect("/login");

  const supabase = createAdminSupabase();
  if (!supabase) return <SetupMissing />;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (!profile) redirect("/login");
  if (profile.username && profile.password_hash && profile.password_salt) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <LoginSetupForm profile={await signProfile(supabase, profile as Profile)} />
    </main>
  );
}
