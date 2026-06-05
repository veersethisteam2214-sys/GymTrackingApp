import Link from "next/link";
import { ArrowLeft, CalendarDays, Flame, Scale, Target, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WeightTrend } from "@/components/AnalyticsCharts";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchAnalyticsData } from "@/lib/data";
import { getCurrentStreak, getLongestStreak, getStats } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const routeParams = await params;
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;
  const data = await fetchAnalyticsData(session.supabase);
  const profile = data.profiles.find((item) => item.id === routeParams.userId);

  if (!profile) {
    return (
      <AppShell title="Profile" subtitle="No matching user" profile={session.profile}>
        <Link href="/dashboard" className="font-semibold text-leaf">Back to dashboard</Link>
      </AppShell>
    );
  }

  const checkins = data.checkins.filter((item) => item.user_id === profile.id);
  const stats = getStats(checkins);
  const weights = data.weights.filter((item) => item.user_id === profile.id);
  const latestWeight = weights.at(-1)?.weight_value ?? profile.starting_weight ?? "--";
  const cardioMinutes = data.cardio
    .filter((item) => item.user_id === profile.id)
    .reduce((sum, item) => sum + Number(item.treadmill_minutes ?? 0), 0);

  return (
    <AppShell title={profile.display_name} subtitle="Profile progress" profile={session.profile}>
      <Link
        href="/dashboard"
        className="app-button mb-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-ink shadow-sm hover:bg-mint"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <section className="mb-4 overflow-hidden rounded-[2rem] bg-ink p-4 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] bg-white text-ink">
            {profile.avatarSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black">{profile.display_name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint/70">Shared profile</p>
            <h2 className="truncate text-3xl font-semibold">{profile.display_name}</h2>
            <p className="mt-1 text-sm text-white/55">Everyone can see this overview.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <GoalChip icon={<Scale className="size-4" />} label="Current" value={latestWeight === "--" ? "--" : `${latestWeight}kg`} />
          <GoalChip
            icon={<Target className="size-4" />}
            label="Goal"
            value={profile.target_weight ? `${profile.target_weight}kg` : "--"}
          />
          <GoalChip
            icon={<CalendarDays className="size-4" />}
            label="Target date"
            value={profile.target_date ?? "--"}
          />
          <GoalChip
            icon={<Timer className="size-4" />}
            label="Cardio"
            value={`${cardioMinutes} min`}
          />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Flame className="size-5" />} label="Current streak" value={getCurrentStreak(checkins)} />
        <Stat icon={<Flame className="size-5" />} label="Longest streak" value={getLongestStreak(checkins)} />
        <Stat icon={<Scale className="size-5" />} label="Latest weight" value={latestWeight} />
        <Stat icon={<Timer className="size-5" />} label="Cardio minutes" value={cardioMinutes} />
      </div>
      <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Routine</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl bg-paper p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">Gym</p>
            <p className="mt-1 text-sm leading-6 text-ink/70">{profile.gym_routine}</p>
          </div>
          <div className="rounded-2xl bg-paper p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">Cardio</p>
            <p className="mt-1 text-sm leading-6 text-ink/70">{profile.cardio_routine}</p>
          </div>
        </div>
      </section>
      <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Month summary</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Pill label="Complete" value={stats.complete} />
          <Pill label="Partial" value={stats.partial} />
          <Pill label="Missing" value={stats.missing} />
          <Pill label="Excused" value={stats.excused} />
        </div>
      </section>
      <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Weight trend</h2>
        <WeightTrend profiles={[profile]} weights={weights} />
      </section>
    </AppShell>
  );
}

function GoalChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-3">
      <div className="text-mint">{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">{label}</p>
      <p className="truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <section className="rounded-[1.5rem] border border-white/70 bg-white/90 p-4 shadow-soft">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-mint text-leaf">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </section>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-paper p-3 text-center">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-[11px] font-bold text-ink/45">{label}</p>
    </div>
  );
}
