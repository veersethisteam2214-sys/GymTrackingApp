import { AppShell } from "@/components/AppShell";
import { DashboardCards } from "@/components/DashboardCards";
import { MonthPreview } from "@/components/MonthPreview";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const data = await fetchDashboardData(session.supabase, session.profile.id);

  return (
    <AppShell title="Today" subtitle={formatDisplayDate(data.today)} profile={session.profile}>
      <DashboardCards people={data.people} currentUserId={data.currentUserId} />
      <MonthPreview checkins={data.monthCheckins} />
    </AppShell>
  );
}
