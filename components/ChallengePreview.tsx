import Link from "next/link";
import { ArrowRight, Target, Trophy } from "lucide-react";
import type { Challenge } from "@/lib/types";

export function ChallengePreview({ challenges }: { challenges: Challenge[] }) {
  const active = challenges[0];

  return (
    <section className="mt-5 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Group challenge</p>
          <h2 className="mt-1 truncate text-xl font-semibold text-ink">{active ? active.title : "No active challenge"}</h2>
          <p className="mt-1 text-sm text-ink/55">
            {active ? "Shared target for everyone in the group." : "Create one simple target for the whole group."}
          </p>
        </div>
        <Link
          href="/challenges"
          className="app-button flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-bold text-white shadow-sm hover:bg-leaf focus:outline-none focus-visible:ring-4 focus-visible:ring-leaf/20"
        >
          Open
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {active ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Mini icon={<Trophy className="size-4" />} label="Type" value={active.challenge_type} />
          <Mini
            icon={<Target className="size-4" />}
            label="Target"
            value={active.target_value ? `${active.target_value} ${active.target_unit ?? ""}` : "--"}
          />
          <Mini icon={<ArrowRight className="size-4" />} label="Ends" value={active.end_date ?? "--"} />
        </div>
      ) : null}
    </section>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <div className="text-leaf">{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/42">{label}</p>
      <p className="truncate text-xs font-bold capitalize text-ink">{value}</p>
    </div>
  );
}

