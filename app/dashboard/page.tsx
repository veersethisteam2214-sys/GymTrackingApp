import { AppShell } from "@/components/AppShell";
import { DashboardCards } from "@/components/DashboardCards";
import { RecommendationBoard } from "@/components/RecommendationBoard";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchDashboardData, fetchRecommendations } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const [data, recommendations] = await Promise.all([
    fetchDashboardData(session.supabase, session.profile.id),
    fetchRecommendations(session.supabase, session.profile.id)
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
      <RecommendationBoard
        initialRecommendations={recommendations}
        currentProfile={session.profile}
        profiles={data.people.map((person) => person.profile)}
      />
    </AppShell>
  );
}
