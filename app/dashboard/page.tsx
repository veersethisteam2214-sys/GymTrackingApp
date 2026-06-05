import { AppShell } from "@/components/AppShell";
import { ChallengePreview } from "@/components/ChallengePreview";
import { DashboardCards } from "@/components/DashboardCards";
import { MonthPreview } from "@/components/MonthPreview";
import { RecommendationBoard } from "@/components/RecommendationBoard";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchChallenges, fetchDashboardData, fetchRecommendations } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const [data, challenges, recommendations] = await Promise.all([
    fetchDashboardData(session.supabase, session.profile.id),
    fetchChallenges(session.supabase),
    fetchRecommendations(session.supabase)
  ]);

  return (
    <AppShell title="Today" subtitle={formatDisplayDate(data.today)} profile={session.profile}>
      <DashboardCards people={data.people} currentUserId={data.currentUserId} />
      <ChallengePreview challenges={challenges} />
      <RecommendationBoard initialRecommendations={recommendations} currentProfile={session.profile} />
      <MonthPreview checkins={data.monthCheckins} profiles={data.people.map((person) => person.profile)} />
    </AppShell>
  );
}
