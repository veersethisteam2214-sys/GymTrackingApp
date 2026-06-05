import { AppShell } from "@/components/AppShell";
import { ChallengesClient } from "@/components/ChallengesClient";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchChallenges } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const challenges = await fetchChallenges(session.supabase);

  return (
    <AppShell title="Challenges" subtitle="Shared group goals" profile={session.profile}>
      <ChallengesClient initialChallenges={challenges} />
    </AppShell>
  );
}

