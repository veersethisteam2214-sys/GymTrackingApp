import { cookies } from "next/headers";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { SetupMissing } from "@/components/SetupMissing";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfileSetupPage() {
  const supabase = createAdminSupabase();
  if (!supabase) return <SetupMissing />;

  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;
  let profile: Profile | null = null;

  if (profileId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", profileId).single();
    profile = data as Profile | null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <ProfileSetupForm profile={profile} />
    </main>
  );
}

