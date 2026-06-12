import { AppShell } from "@/components/AppShell";
import { LeaderboardPodium, StreakFlame } from "@/components/LeaderboardPodium";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";
import { fetchDashboardData } from "@/lib/data";
import { formatDisplayDate } from "@/lib/dates";
import { getDenseRank, getMaxDailyPoints, rankPeople } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  const data = await fetchDashboardData(session.supabase, session.profile.id);
  const ranked = rankPeople(data.people, data.monthCheckins, data.monthItems);

  const maxScore = Math.max(...ranked.map((person) => person.score), 1);
  const maxDailyPoints = getMaxDailyPoints(data.today);

  return (
    <AppShell title="Standings" subtitle={formatDisplayDate(data.today)} profile={session.profile}>
      <div className="a-up">
        <h2 className="display-font text-5xl leading-none text-app">Standings</h2>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--muted)" }}>
          Month to date · max {maxDailyPoints} points a day
        </p>
      </div>

      {ranked.length >= 3 ? (
        <section className="app-surface a-up mt-4 overflow-hidden rounded-[22px] px-4 pb-5 pt-2" style={{ animationDelay: "80ms" }}>
          <LeaderboardPodium
            entries={ranked.slice(0, 3).map((person, index) => ({
              id: person.profile.id,
              name: person.profile.display_name,
              avatarUrl: person.profile.avatarSignedUrl,
              score: person.score,
              rank: getDenseRank(ranked, index),
              streak: person.currentStreak
            }))}
          />
        </section>
      ) : null}

      <div className="a-up mt-6" style={{ animationDelay: "140ms" }}>
        <div className="atelier-rule">
          <span className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: "var(--muted)" }}>
            The full table
          </span>
          <span className="atelier-tick" />
        </div>
      </div>

      <section className="mt-3 grid gap-2.5">
        {ranked.map((person, index) => {
          const percent = Math.round((person.score / maxScore) * 100);
          const isMe = person.profile.id === data.currentUserId;
          const rank = getDenseRank(ranked, index);
          return (
            <article
              key={person.profile.id}
              className="a-card app-surface rounded-[16px] p-4"
              style={{
                animationDelay: `${200 + index * 48}ms`,
                ...(isMe ? { background: "linear-gradient(120deg, var(--accent-dim), var(--surface)) padding-box, var(--card-edge) border-box" } : {})
              }}
            >
              <div className="flex items-center gap-3.5">
                <span className="display-font w-6 shrink-0 text-lg italic" style={{ color: rank <= 3 ? "var(--brand)" : "var(--muted)" }}>
                  {rank}
                </span>
                <Avatar name={person.profile.display_name} src={person.profile.avatarSignedUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="display-font truncate text-lg text-app">
                      {person.profile.display_name}
                      {isMe ? (
                        <span className="ml-1.5 text-xs font-bold not-italic" style={{ color: "var(--accent)", fontFamily: "var(--body-font)" }}>
                          · you
                        </span>
                      ) : null}
                    </p>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="flex items-center gap-1">
                        <StreakFlame streak={person.currentStreak} />
                        <span className="text-xs font-extrabold" style={{ color: person.currentStreak >= 7 ? "var(--brand)" : "var(--muted)" }}>
                          {person.currentStreak}d
                        </span>
                      </span>
                      <span className="text-[17px] font-extrabold tabular-nums text-app">{person.score}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-full" style={{ background: "var(--faint)" }}>
                    <div
                      className="a-meter h-full rounded-full"
                      style={{ width: `${percent}%`, background: isMe ? "var(--accent)" : "var(--brand-2)", animationDelay: `${260 + index * 48}ms` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label="Complete" value={person.monthStats.complete} />
                <Stat label="Partial" value={person.monthStats.partial} />
                <Stat label="Excused" value={person.monthStats.excused} />
                <Stat label="Streak" value={`${person.currentStreak}d`} />
                <Stat label="Today" value={`${person.todayTasks}/${maxDailyPoints}`} />
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
    <div
      className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full"
      style={{ background: "linear-gradient(150deg, var(--surface-strong), var(--bg-2))", border: "1px solid var(--line-2)" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="display-font text-base italic text-app">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: "var(--surface-soft)" }}>
      <p className="display-font text-lg italic text-app">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
        {label}
      </p>
    </div>
  );
}
