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
        className="app-button mb-4 inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold shadow-sm"
        style={{ background: "var(--surface-soft)", color: "var(--text)" }}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <section className="app-surface-strong mb-4 overflow-hidden rounded-[2rem] p-4">
        <div className="flex items-center gap-4">
          <div className="brand-gradient relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] text-black">
            {profile.avatarSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black">{profile.display_name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>Shared profile</p>
            <h2 className="truncate text-3xl font-extrabold text-app">{profile.display_name}</h2>
            <p className="mt-1 text-sm text-muted">Everyone can see this overview.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
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
          <GoalChip
            icon={<Flame className="size-4" />}
            label="Mode"
            value={profile.goal_mode}
          />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Flame className="size-5" />} label="Current streak" value={getCurrentStreak(checkins)} />
        <Stat icon={<Flame className="size-5" />} label="Longest streak" value={getLongestStreak(checkins)} />
        <Stat icon={<Scale className="size-5" />} label="Latest weight" value={latestWeight} />
        <Stat icon={<Timer className="size-5" />} label="Cardio minutes" value={cardioMinutes} />
      </div>
      <section className="app-surface mt-4 rounded-[2rem] p-4">
        <h2 className="text-xl font-extrabold text-app">Routine</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl p-3" style={{ background: "var(--surface-soft)" }}>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em]" style={{ color: "var(--brand)" }}>Gym</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-app">{profile.gym_routine}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "var(--surface-soft)" }}>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em]" style={{ color: "var(--brand)" }}>Cardio</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-app">{profile.cardio_routine}</p>
          </div>
        </div>
      </section>
      <section className="app-surface mt-4 rounded-[2rem] p-4">
        <h2 className="text-xl font-extrabold text-app">Month summary</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Pill label="Complete" value={stats.complete} />
          <Pill label="Partial" value={stats.partial} />
          <Pill label="Missing" value={stats.missing} />
          <Pill label="Excused" value={stats.excused} />
        </div>
      </section>
      <section className="app-surface mt-4 rounded-[2rem] p-4">
        <h2 className="text-xl font-extrabold text-app">Weight trend</h2>
        <WeightTrend profiles={[profile]} weights={weights} />
      </section>
    </AppShell>
  );
}

function GoalChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
      <div style={{ color: "var(--brand)" }}>{icon}</div>
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="truncate text-sm font-extrabold text-app">{value}</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <section className="app-surface rounded-[1.5rem] p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--brand) 16%, transparent)", color: "var(--brand)" }}>{icon}</div>
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-app">{value}</p>
    </section>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: "var(--surface-soft)" }}>
      <p className="text-lg font-extrabold text-app">{value}</p>
      <p className="text-[11px] font-extrabold text-muted">{label}</p>
    </div>
  );
}
