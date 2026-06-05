"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2, Save, Scale, Timer, UserRound } from "lucide-react";
import type { Profile } from "@/lib/types";

export function ProfileSetupForm({ profile }: { profile?: Profile | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [startingWeight, setStartingWeight] = useState(profile?.starting_weight?.toString() ?? "");
  const [gymRoutine, setGymRoutine] = useState(profile?.gym_routine ?? "");
  const [cardioRoutine, setCardioRoutine] = useState(profile?.cardio_routine ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        starting_weight: startingWeight ? Number(startingWeight) : null,
        gym_routine: gymRoutine,
        cardio_routine: cardioRoutine
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Could not save profile.");
      setBusy(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-5">
        <div className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-ink text-white shadow-soft">
          <UserRound className="size-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold text-ink">Set up your profile</h1>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          This saves your name, weight, and routines for your private dashboard.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<UserRound className="size-5" />} label="Name">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            className="w-full bg-transparent text-base outline-none"
            placeholder="Your name"
          />
        </Field>
        <Field icon={<Scale className="size-5" />} label="Current weight kg">
          <input
            value={startingWeight}
            onChange={(event) => setStartingWeight(event.target.value)}
            inputMode="decimal"
            className="w-full bg-transparent text-base outline-none"
            placeholder="Example: 82.5"
          />
        </Field>
        <TextArea
          icon={<Dumbbell className="size-5" />}
          label="Gym routine"
          value={gymRoutine}
          onChange={setGymRoutine}
          placeholder="Example: Push/pull/legs, 5 days a week"
        />
        <TextArea
          icon={<Timer className="size-5" />}
          label="Cardio routine"
          value={cardioRoutine}
          onChange={setCardioRoutine}
          placeholder="Example: Treadmill 25 min after lifting"
        />
        {error ? <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay">{error}</p> : null}
        <button
          disabled={busy}
          className="app-button flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save profile
        </button>
      </form>
    </section>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/15">
        <span className="text-ink/40">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function TextArea({
  icon,
  label,
  value,
  onChange,
  placeholder
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <div className="flex gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/15">
        <span className="mt-1 text-ink/40">{icon}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className="min-h-20 w-full resize-none bg-transparent text-base outline-none"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

