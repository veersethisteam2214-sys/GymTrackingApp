import { AppShell } from "@/components/AppShell";
import { ChallengePreview } from "@/components/ChallengePreview";
import { DashboardCards } from "@/components/DashboardCards";
import { MonthPreview } from "@/components/MonthPreview";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchChallenges, fetchDashboardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const [data, challenges] = await Promise.all([
    fetchDashboardData(session.supabase, session.profile.id),
    fetchChallenges(session.supabase)
  ]);

  return (
    <AppShell title="Today" subtitle={formatDisplayDate(data.today)} profile={session.profile}>
      <DashboardCards people={data.people} currentUserId={data.currentUserId} />
      <ChallengePreview challenges={challenges} />
      <MonthPreview checkins={data.monthCheckins} />
    </AppShell>
  );
}
