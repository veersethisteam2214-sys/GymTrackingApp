import { AppShell } from "@/components/AppShell";
import { AnalyticsClient } from "@/components/AnalyticsClient";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchAnalyticsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;
  const data = await fetchAnalyticsData(session.supabase);

  return (
    <AppShell title="Stats" subtitle="Filter your progress and compare with friends" profile={session.profile}>
      <AnalyticsClient
        currentProfileId={session.profile.id}
        profiles={data.profiles}
        checkins={data.checkins}
        items={data.items}
        weights={data.weights}
        cardio={data.cardio}
      />
    </AppShell>
  );
}
