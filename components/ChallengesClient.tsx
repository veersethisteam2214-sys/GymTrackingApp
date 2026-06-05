"use client";

import { useState } from "react";
import { CalendarDays, Dumbbell, Loader2, Plus, Target, Trophy } from "lucide-react";
import type { Challenge } from "@/lib/types";

const challengeTypes = [
  { value: "consistency", label: "Consistency" },
  { value: "cardio", label: "Cardio" },
  { value: "weight", label: "Weight" },
  { value: "protein", label: "Protein" }
];

export function ChallengesClient({ initialChallenges }: { initialChallenges: Challenge[] }) {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState("consistency");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        challenge_type: challengeType,
        target_value: targetValue,
        target_unit: targetUnit,
        start_date: startDate,
        end_date: endDate
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not create challenge.");
      setBusy(false);
      return;
    }

    setChallenges((current) => [payload.challenge as Challenge, ...current]);
    setTitle("");
    setDescription("");
    setTargetValue("");
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
      <section className="rounded-[2rem] bg-ink p-4 text-white shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-mint text-ink">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint/70">Future mode</p>
            <h2 className="mt-1 text-2xl font-semibold">Create Challenge</h2>
            <p className="mt-1 text-sm leading-6 text-white/55">
              Add a simple shared target for the group. Keep it clear enough that everyone knows what to do.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label="Challenge Title">
            <input
              name="challenge-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="5 Gym Days This Week…"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/35 focus-visible:ring-4 focus-visible:ring-mint/25"
            />
          </Field>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/72">Type</span>
            <select
              name="challenge-type"
              value={challengeType}
              onChange={(event) => setChallengeType(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white px-4 text-sm font-semibold text-ink outline-none focus-visible:ring-4 focus-visible:ring-mint/25"
            >
              {challengeTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Target">
              <input
                name="challenge-target"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                inputMode="decimal"
                placeholder="5…"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/35 focus-visible:ring-4 focus-visible:ring-mint/25"
              />
            </Field>
            <Field label="Unit">
              <input
                name="challenge-unit"
                value={targetUnit}
                onChange={(event) => setTargetUnit(event.target.value)}
                placeholder="days…"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/35 focus-visible:ring-4 focus-visible:ring-mint/25"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start">
              <input
                name="challenge-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white px-3 text-sm text-ink outline-none focus-visible:ring-4 focus-visible:ring-mint/25"
              />
            </Field>
            <Field label="End">
              <input
                name="challenge-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white px-3 text-sm text-ink outline-none focus-visible:ring-4 focus-visible:ring-mint/25"
              />
            </Field>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/72">Notes</span>
            <textarea
              name="challenge-notes"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Rules, reward, or penalty…"
              className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus-visible:ring-4 focus-visible:ring-mint/25"
            />
          </label>
          {error ? (
            <p aria-live="polite" className="rounded-2xl bg-clay/20 px-4 py-3 text-sm font-semibold text-white">
              {error}
            </p>
          ) : null}
          <button
            disabled={busy}
            className="app-button flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-mint px-4 text-sm font-bold text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            Add Challenge
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Group board</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">Active Challenges</h2>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink/55">{challenges.length}</span>
        </div>
        <div className="mt-4 grid gap-3">
          {challenges.length ? (
            challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
          ) : (
            <div className="rounded-3xl bg-paper p-5 text-center">
              <Trophy className="mx-auto size-8 text-ink/28" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ink">No challenges yet.</p>
              <p className="mt-1 text-sm text-ink/55">Create one simple group target to start.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/72">{label}</span>
      {children}
    </label>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <article className="rounded-3xl border border-ink/8 bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-leaf">{challenge.challenge_type}</p>
          <h3 className="mt-1 break-words text-lg font-semibold text-ink">{challenge.title}</h3>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
          <Trophy className="size-5" aria-hidden />
        </div>
      </div>
      {challenge.description ? <p className="mt-2 break-words text-sm leading-6 text-ink/62">{challenge.description}</p> : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Mini icon={<Target className="size-4" />} label="Target" value={challenge.target_value ? `${challenge.target_value} ${challenge.target_unit ?? ""}` : "--"} />
        <Mini icon={<CalendarDays className="size-4" />} label="Start" value={challenge.start_date ?? "--"} />
        <Mini icon={<Dumbbell className="size-4" />} label="End" value={challenge.end_date ?? "--"} />
      </div>
    </article>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="text-leaf">{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/42">{label}</p>
      <p className="truncate text-xs font-bold text-ink">{value}</p>
    </div>
  );
}
