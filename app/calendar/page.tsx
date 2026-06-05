import { AppShell } from "@/components/AppShell";
import { CalendarClient } from "@/components/CalendarClient";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchCalendarData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;
  const data = await fetchCalendarData(session.supabase);

  return (
    <AppShell title="Calendar" subtitle="Monthly accountability view" profile={session.profile}>
      <CalendarClient profiles={data.profiles} checkins={data.checkins} items={data.items} />
    </AppShell>
  );
}
