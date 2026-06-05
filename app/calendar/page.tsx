import { AppShell } from "@/components/AppShell";
import { CalendarClient } from "@/components/CalendarClient";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAllowedUser } from "@/lib/auth";
import { fetchCalendarData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await requireAllowedUser();
  if (session.setupMissing || !session.supabase || !session.user) return <SetupMissing />;
  const data = await fetchCalendarData(session.supabase);
  const profile = data.profiles.find((item) => item.id === session.user.id) ?? null;

  return (
    <AppShell title="Calendar" subtitle="Monthly accountability view" profile={profile}>
      <CalendarClient profiles={data.profiles} checkins={data.checkins} items={data.items} />
    </AppShell>
  );
}

