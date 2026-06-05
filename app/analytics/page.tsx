import { Activity, BookOpen, Dumbbell, GlassWater, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CompletionBars, WeightTrend } from "@/components/AnalyticsCharts";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchAnalyticsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;
  const data = await fetchAnalyticsData(session.supabase);

  const gymUploads = data.items.filter((item) => item.category === "progress_photo" && item.status === "uploaded").length;
  const cardioUploads = data.items.filter((item) => item.category === "treadmill_photo" && item.status === "uploaded").length;
  const proteinUploads = data.items.filter((item) => item.category === "protein_shake_photo" && item.status === "uploaded").length;
  const readingUploads = data.items.filter((item) => item.category === "reading_proof" && item.status === "uploaded").length;
  const cardioMinutes = data.cardio.reduce((sum, entry) => sum + Number(entry.treadmill_minutes ?? 0), 0);

  return (
    <AppShell title="Analytics" subtitle="Neutral weekly and monthly stats" profile={session.profile}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric icon={<Dumbbell className="size-5" />} label="Gym uploads" value={gymUploads} />
        <Metric icon={<Timer className="size-5" />} label="Cardio uploads" value={cardioUploads} />
        <Metric icon={<GlassWater className="size-5" />} label="Protein uploads" value={proteinUploads} />
        <Metric icon={<BookOpen className="size-5" />} label="Reading proofs" value={readingUploads} />
        <Metric icon={<Activity className="size-5" />} label="Cardio minutes" value={cardioMinutes} />
      </div>
      <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">This month</h2>
        <CompletionBars profiles={data.profiles} checkins={data.checkins} />
      </section>
      <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Weight trend</h2>
        <WeightTrend profiles={data.profiles} weights={data.weights} />
      </section>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-soft">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-mint text-leaf">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </section>
  );
}
