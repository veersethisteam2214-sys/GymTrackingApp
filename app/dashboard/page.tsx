import { AppShell } from "@/components/AppShell";
import { ChallengePreview } from "@/components/ChallengePreview";
import { DashboardCards } from "@/components/DashboardCards";
import { RecommendationBoard } from "@/components/RecommendationBoard";
import { SetupMissing } from "@/components/SetupMissing";
import { StatsDataChat } from "@/components/StatsDataChat";
import { requireAppProfile } from "@/lib/auth";
import { fetchChallenges, fetchDashboardData, fetchRecommendations } from "@/lib/data";

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
    <AppShell title="Today" profile={session.profile}>
      <DashboardCards
        people={data.people}
        currentUserId={data.currentUserId}
        today={data.today}
        monthCheckins={data.monthCheckins}
        monthItems={data.monthItems}
        todayCategories={data.todayCategories}
      />
      <StatsDataChat profiles={data.people.map((person) => person.profile)} checkins={data.monthCheckins} items={data.monthItems} />
      <ChallengePreview challenges={challenges} />
      <RecommendationBoard initialRecommendations={recommendations} currentProfile={session.profile} />
    </AppShell>
  );
}
