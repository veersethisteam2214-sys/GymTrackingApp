import { AppShell } from "@/components/AppShell";
import { SetupMissing } from "@/components/SetupMissing";
import { TodayClient } from "@/components/TodayClient";
import { requireAllowedUser } from "@/lib/auth";
import { fetchTodayData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await requireAllowedUser();
  if (session.setupMissing || !session.supabase || !session.user) return <SetupMissing />;

  const data = await fetchTodayData(session.supabase, session.user);

  return (
    <AppShell title="Upload proof" subtitle={formatDisplayDate(data.checkin.checkin_date)} profile={data.profile}>
      <TodayClient
        checkin={data.checkin}
        initialItems={data.items}
        initialWeight={data.weightEntry}
        initialCardio={data.cardioEntry}
      />
    </AppShell>
  );
}

