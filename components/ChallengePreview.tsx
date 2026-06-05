import Link from "next/link";
import { ArrowRight, Target, Trophy } from "lucide-react";
import type { Challenge } from "@/lib/types";

export function ChallengePreview({ challenges }: { challenges: Challenge[] }) {
  const active = challenges[0];

  return (
    <section className="app-surface mt-5 rounded-[2rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Group challenge
          </p>
          <h2 className="mt-1 truncate text-2xl font-extrabold text-app">
            {active ? active.title : "No active challenge"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {active ? "Shared target for everyone in the group." : "Create one simple target for the whole group."}
          </p>
        </div>
        <Link
          href="/challenges"
          className="app-button brand-gradient flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-black shadow-sm focus:outline-none focus-visible:ring-4"
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
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-soft)" }}>
      <div style={{ color: "var(--brand)" }}>{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="truncate text-xs font-extrabold capitalize text-app">{value}</p>
    </div>
  );
}
