import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMonthDays } from "@/lib/dates";
import type { DailyCheckIn, Profile } from "@/lib/types";

const tones = {
  complete: "bg-leaf",
  partial: "bg-sun",
  missing: "bg-ink/12",
  excused: "bg-sky"
};

export function MonthPreview({ checkins, profiles }: { checkins: DailyCheckIn[]; profiles: Profile[] }) {
  const days = getMonthDays();

  return (
    <section className="mt-5 rounded-[2rem] border border-white/70 bg-white/88 p-4 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">History access</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Current month</h2>
          <p className="text-sm text-ink/55">Group completion snapshot</p>
        </div>
        <Link
          href="/calendar"
          className="app-button flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-bold text-white shadow-sm hover:bg-leaf"
        >
          Open
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayCheckins = checkins.filter((item) => item.checkin_date === day);
          return (
            <div key={day} className="aspect-square rounded-2xl border border-ink/8 bg-paper p-1.5">
              <p className="text-[11px] font-semibold text-ink/45">{Number(day.slice(-2))}</p>
              <div className="mt-1 grid grid-cols-5 gap-1">
                {profiles.slice(0, 10).map((profile) => {
                  const status =
                    dayCheckins.find((item) => item.user_id === profile.id)?.overall_status ?? "missing";
                  return <span key={profile.id} className={`h-2.5 rounded-full ${tones[status]}`} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/60">
        <Legend tone="bg-leaf" label="Complete" />
        <Legend tone="bg-sun" label="Partial" />
        <Legend tone="bg-ink/12" label="Missing" />
        <Legend tone="bg-sky" label="Excused" />
      </div>
    </section>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1">
      <span className={`size-2 rounded-full ${tone}`} />
      {label}
    </span>
  );
}
