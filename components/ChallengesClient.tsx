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
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
      <section className="app-surface-strong rounded-[2rem] p-5">
        <div className="flex items-start gap-3">
          <div className="brand-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-black">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Future mode
            </p>
            <h2 className="display-font mt-1 text-4xl font-extrabold text-app">Create Challenge</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Add a simple shared target for the group. Keep it clear enough that everyone knows what to do.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label="Challenge Title">
            <TextInput
              name="challenge-title"
              value={title}
              onChange={setTitle}
              required
              placeholder="5 Gym Days This Week..."
            />
          </Field>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-app">Type</span>
            <select
              name="challenge-type"
              value={challengeType}
              onChange={(event) => setChallengeType(event.target.value)}
              className="min-h-12 w-full rounded-2xl border px-4 text-sm font-bold text-app outline-none focus-visible:ring-4"
              style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
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
              <TextInput
                name="challenge-target"
                value={targetValue}
                onChange={setTargetValue}
                inputMode="decimal"
                placeholder="5..."
              />
            </Field>
            <Field label="Unit">
              <TextInput
                name="challenge-unit"
                value={targetUnit}
                onChange={setTargetUnit}
                placeholder="days..."
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start">
              <DateInput name="challenge-start" value={startDate} onChange={setStartDate} />
            </Field>
            <Field label="End">
              <DateInput name="challenge-end" value={endDate} onChange={setEndDate} />
            </Field>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-app">Notes</span>
            <textarea
              name="challenge-notes"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Rules, reward, or penalty..."
              className="min-h-24 w-full resize-none rounded-2xl border px-4 py-3 text-sm text-app outline-none placeholder:text-muted focus-visible:ring-4"
              style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
            />
          </label>
          {error ? (
            <p
              aria-live="polite"
              className="rounded-2xl px-4 py-3 text-sm font-bold"
              style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}
            >
              {error}
            </p>
          ) : null}
          <button
            disabled={busy}
            className="app-button brand-gradient flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            Add Challenge
          </button>
        </form>
      </section>

      <section className="app-surface rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Group board
            </p>
            <h2 className="display-font mt-1 text-4xl font-extrabold text-app">Active Challenges</h2>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-extrabold text-muted" style={{ background: "var(--surface-soft)" }}>
            {challenges.length}
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {challenges.length ? (
            challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
          ) : (
            <div className="rounded-3xl p-5 text-center" style={{ background: "var(--surface-soft)" }}>
              <Trophy className="mx-auto size-8 text-muted" aria-hidden />
              <p className="mt-3 text-sm font-extrabold text-app">No challenges yet.</p>
              <p className="mt-1 text-sm text-muted">Create one simple group target to start.</p>
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
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  name,
  value,
  onChange,
  placeholder,
  required,
  inputMode
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      inputMode={inputMode}
      placeholder={placeholder}
      className="min-h-12 w-full rounded-2xl border px-4 text-sm text-app outline-none placeholder:text-muted focus-visible:ring-4"
      style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
    />
  );
}

function DateInput({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      name={name}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 w-full rounded-2xl border px-3 text-sm text-app outline-none focus-visible:ring-4"
      style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
    />
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <article className="rounded-3xl border p-4" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em]" style={{ color: "var(--brand)" }}>
            {challenge.challenge_type}
          </p>
          <h3 className="mt-1 break-words text-lg font-extrabold text-app">{challenge.title}</h3>
        </div>
        <div className="brand-gradient grid size-10 shrink-0 place-items-center rounded-2xl text-black">
          <Trophy className="size-5" aria-hidden />
        </div>
      </div>
      {challenge.description ? <p className="mt-2 break-words text-sm leading-6 text-muted">{challenge.description}</p> : null}
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
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-soft)" }}>
      <div style={{ color: "var(--brand)" }}>{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="truncate text-xs font-extrabold text-app">{value}</p>
    </div>
  );
}
