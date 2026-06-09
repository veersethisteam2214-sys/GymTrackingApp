import { AppShell } from "@/components/AppShell";
import { SetupMissing } from "@/components/SetupMissing";
import { CATEGORIES } from "@/lib/categories";
import { requireAppProfile } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { getCompletionCount } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const data = await fetchDashboardData(session.supabase, session.profile.id);
  const ranked = data.people
    .map((person) => {
      const todayTasks = getCompletionCount(person.todayItems);
      const score =
        person.monthStats.complete * 10 +
        person.monthStats.excused * 8 +
        person.monthStats.partial * 4 +
        person.currentStreak * 3 +
        todayTasks;

      return {
        ...person,
        todayTasks,
        score
      };
    })
    .sort((a, b) => b.score - a.score || b.currentStreak - a.currentStreak || b.todayTasks - a.todayTasks);

  const maxScore = Math.max(...ranked.map((person) => person.score), 1);

  return (
    <AppShell title="Leaderboard" subtitle={`Consistency rankings for ${formatDisplayDate(data.today)}`} profile={session.profile}>
      <section className="app-surface-strong overflow-hidden rounded-[2rem] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Discipline rankings
            </p>
            <h2 className="display-font mt-1 text-6xl font-extrabold leading-none text-app">Most consistent</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Scores use this month&apos;s complete days, excused days, partial days, current streak, and today&apos;s completed tasks.
            </p>
          </div>
          <div className="rounded-3xl p-4 text-right" style={{ background: "var(--surface-soft)" }}>
            <p className="display-font text-4xl font-extrabold text-app">{ranked.length}</p>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">profiles</p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3">
        {ranked.map((person, index) => {
          const percent = Math.round((person.score / maxScore) * 100);
          const isMe = person.profile.id === data.currentUserId;
          return (
            <article
              key={person.profile.id}
              className="reveal-in app-surface rounded-[2rem] p-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="display-font grid size-12 shrink-0 place-items-center rounded-2xl text-2xl font-extrabold" style={{ background: index === 0 ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--surface-soft)", color: index === 0 ? "var(--bg)" : "var(--text)" }}>
                  {index + 1}
                </div>
                <Avatar name={person.profile.display_name} src={person.profile.avatarSignedUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold text-app">{person.profile.display_name}</p>
                      <p className="truncate text-xs font-bold text-muted">{isMe ? "You" : person.profile.goal_mode}</p>
                    </div>
                    <div className="text-right">
                      <p className="display-font text-3xl font-extrabold" style={{ color: "var(--brand)" }}>{person.score}</p>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">score</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                    <div className="h-full rounded-full brand-gradient" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label="Complete" value={person.monthStats.complete} />
                <Stat label="Partial" value={person.monthStats.partial} />
                <Stat label="Excused" value={person.monthStats.excused} />
                <Stat label="Streak" value={`${person.currentStreak}d`} />
                <Stat label="Today" value={`${person.todayTasks}/${CATEGORIES.length}`} />
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-3xl brand-gradient font-black text-black">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-soft)" }}>
      <p className="display-font text-2xl font-extrabold text-app">{value}</p>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{label}</p>
    </div>
  );
}
