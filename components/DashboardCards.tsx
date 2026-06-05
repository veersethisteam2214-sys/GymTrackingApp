import Link from "next/link";
import { ArrowRight, Camera, Flame, Scale, Timer } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getCompletionCount } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import type { CheckInItem, DailyCheckIn, DailyStatus, Profile, WeightEntry } from "@/lib/types";

type Person = {
  profile: Profile;
  todayCheckin: DailyCheckIn | null;
  todayItems: CheckInItem[];
  latestWeight?: WeightEntry | null;
  monthStats: Record<string, number>;
  weekStats: Record<string, number>;
  currentStreak: number;
  todayStatus: DailyStatus;
};

export function DashboardCards({ people, currentUserId }: { people: Person[]; currentUserId: string }) {
  if (people.length === 0) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">No profiles yet</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Enter the shared app password, then save a profile to start tracking.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {people.map((person) => {
        const count = getCompletionCount(person.todayItems);
        const isMe = person.profile.id === currentUserId;
        return (
          <section
            key={person.profile.id}
            className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink/55">{isMe ? "You" : "Partner"}</p>
                <h2 className="text-2xl font-semibold text-ink">{person.profile.display_name}</h2>
              </div>
              <StatusBadge status={person.todayStatus} />
            </div>
            <div className="mt-4 rounded-3xl bg-ink p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/64">Today</span>
                <span className="text-2xl font-semibold">{count}/4</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/18">
                <div className="h-full rounded-full bg-mint" style={{ width: `${(count / 4) * 100}%` }} />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {CATEGORIES.map((category) => {
                const item = person.todayItems.find((entry) => entry.category === category.id);
                return (
                  <div
                    key={category.id}
                    className="flex min-h-12 items-center justify-between rounded-2xl border border-ink/8 bg-paper px-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`size-2.5 rounded-full ${category.accent}`} />
                      <span className="truncate text-sm font-semibold text-ink">{category.label}</span>
                    </div>
                    <StatusBadge status={item?.status ?? "missing"} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat icon={<Flame className="size-4" />} label="Streak" value={`${person.currentStreak}d`} />
              <MiniStat icon={<Scale className="size-4" />} label="Weight" value={person.latestWeight ? `${person.latestWeight.weight_value}kg` : "--"} />
              <MiniStat icon={<Timer className="size-4" />} label="Week" value={`${person.weekStats.complete ?? 0}`} />
            </div>
            <div className="mt-4 flex gap-2">
              {isMe ? (
                <Link
                  href="/today"
                  className="app-button flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-leaf px-4 text-sm font-semibold text-white shadow-soft hover:bg-ink"
                >
                  <Camera className="size-4" aria-hidden />
                  Upload
                </Link>
              ) : null}
              <Link
                href={`/user/${person.profile.id}`}
                className="app-button flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 text-sm font-semibold text-ink hover:border-leaf/40 hover:bg-mint"
              >
                View
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-mint/65 p-3">
      <div className="text-leaf">{icon}</div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="text-sm font-bold text-ink">{value}</p>
    </div>
  );
}
