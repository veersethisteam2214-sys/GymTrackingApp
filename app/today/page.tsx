import { AppShell } from "@/components/AppShell";
import { SetupMissing } from "@/components/SetupMissing";
import { TodayClient } from "@/components/TodayClient";
import { requireAppProfile } from "@/lib/auth";
import { fetchTodayData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const data = await fetchTodayData(session.supabase, session.profile);

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
