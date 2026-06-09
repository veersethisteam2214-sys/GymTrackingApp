"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  ImagePlus,
  Loader2,
  Mail,
  Save,
  Scale,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  UserRound
} from "lucide-react";
import type { Profile } from "@/lib/types";

const WEEKLY_GYM_TEMPLATE = `Monday -
Tuesday -
Wednesday -
Thursday -
Friday -
Saturday -
Sunday -`;

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function parseGymRoutine(routine?: string | null) {
  return WEEKDAYS.reduce<Record<string, string>>((days, day) => {
    const line = routine
      ?.split(/\r?\n/)
      .find((entry) => entry.trim().toLowerCase().startsWith(day.toLowerCase()));
    days[day] = line?.split("-").slice(1).join("-").trim() ?? "";
    return days;
  }, {});
}

function serializeGymRoutine(days: Record<string, string>) {
  return WEEKDAYS.map((day) => `${day} - ${days[day] ?? ""}`).join("\n");
}

export function ProfileSetupForm({ profile }: { profile?: Profile | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [startingWeight, setStartingWeight] = useState(profile?.starting_weight?.toString() ?? "");
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(profile?.target_date ?? "");
  const [goalMode, setGoalMode] = useState<"cutting" | "bulking">(profile?.goal_mode ?? "cutting");
  const [gymDays, setGymDays] = useState(() => parseGymRoutine(profile?.gym_routine ?? WEEKLY_GYM_TEMPLATE));
  const [cardioRoutine, setCardioRoutine] = useState(profile?.cardio_routine ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatarSignedUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const formData = new FormData();
    formData.set("display_name", displayName);
    formData.set("email", email);
    formData.set("starting_weight", startingWeight);
    formData.set("target_weight", targetWeight);
    formData.set("target_date", targetDate);
    formData.set("goal_mode", goalMode);
    formData.set("gym_routine", serializeGymRoutine(gymDays));
    formData.set("cardio_routine", cardioRoutine);
    if (avatarFile) formData.set("avatar", avatarFile);

    const response = await fetch("/api/profile", {
      method: "POST",
      body: formData
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

  function selectAvatar(file?: File) {
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <section className="app-surface-strong w-full max-w-2xl rounded-[2rem] p-5">
      <div className="mb-5">
        <label className="app-button relative mb-4 grid size-24 cursor-pointer place-items-center overflow-hidden rounded-[1.75rem] brand-gradient text-black shadow-soft hover:scale-[1.02]">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <UserRound className="size-8" aria-hidden />
          )}
          <span className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-xl bg-black text-white shadow-sm">
            <ImagePlus className="size-4" aria-hidden />
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(event) => selectAvatar(event.target.files?.[0])}
          />
        </label>
        <h1 className="display-font text-5xl font-extrabold text-app">Set up your profile</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add your avatar, training plan, and goal. Friends see this after they tap your profile.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field icon={<UserRound className="size-5" />} label="Name">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
            placeholder="Your name"
          />
        </Field>
        <Field icon={<Mail className="size-5" />} label="Email for weekly summary">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
            className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
            placeholder="you@example.com"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field icon={<Scale className="size-5" />} label="Current kg">
            <input
              value={startingWeight}
              onChange={(event) => setStartingWeight(event.target.value)}
              inputMode="decimal"
              className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
              placeholder="82.5"
            />
          </Field>
          <Field icon={<Target className="size-5" />} label="Goal kg">
            <input
              value={targetWeight}
              onChange={(event) => setTargetWeight(event.target.value)}
              inputMode="decimal"
              className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
              placeholder="78"
            />
          </Field>
        </div>
        <Field icon={<CalendarDays className="size-5" />} label="Target date">
          <input
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            type="date"
            className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
          />
        </Field>
        <div>
          <span className="mb-2 block text-sm font-bold text-app">Goal type</span>
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={goalMode === "cutting"}
              icon={<TrendingDown className="size-5" />}
              label="Cutting"
              onClick={() => setGoalMode("cutting")}
            />
            <ModeButton
              active={goalMode === "bulking"}
              icon={<TrendingUp className="size-5" />}
              label="Bulking"
              onClick={() => setGoalMode("bulking")}
            />
          </div>
        </div>
        <WeeklyRoutineInput
          icon={<Dumbbell className="size-5" />}
          label="Gym routine"
          days={gymDays}
          onChange={(day, value) => setGymDays((current) => ({ ...current, [day]: value }))}
        />
        <TextArea
          icon={<Timer className="size-5" />}
          label="Cardio routine"
          value={cardioRoutine}
          onChange={setCardioRoutine}
          placeholder="Example: Treadmill 25 min after lifting"
        />
        {error ? (
          <p aria-live="polite" className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}
        <button
          disabled={busy}
          className="app-button brand-gradient flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-black shadow-soft hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save profile
        </button>
      </form>
    </section>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-extrabold"
      style={{
        borderColor: active ? "var(--brand)" : "var(--faint)",
        background: active ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--surface-soft)",
        color: active ? "var(--bg)" : "var(--muted)"
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border px-4 focus-within:ring-4" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
        <span className="grid size-7 place-items-center text-muted">{icon}</span>
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
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <div className="flex gap-3 rounded-2xl border px-4 py-3 focus-within:ring-4" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
        <span className="mt-1 grid size-7 place-items-center text-muted">{icon}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          className="min-h-32 w-full resize-none bg-transparent text-base text-app outline-none placeholder:text-muted"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function WeeklyRoutineInput({
  icon,
  label,
  days,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  days: Record<string, string>;
  onChange: (day: string, value: string) => void;
}) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
        <div className="mb-3 flex items-center gap-3 text-muted">
          <span className="grid size-7 place-items-center">{icon}</span>
          <p className="text-sm font-bold">Weekdays are locked. Fill in the plan beside each day.</p>
        </div>
        <div className="grid gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:items-center">
              <span className="rounded-xl px-3 py-2 text-sm font-extrabold text-app" style={{ background: "var(--surface-soft)" }}>
                {day} -
              </span>
              <input
                value={days[day] ?? ""}
                onChange={(event) => onChange(day, event.target.value)}
                placeholder="Rest, Chest, Legs..."
                className="min-h-11 rounded-xl border bg-transparent px-3 text-sm text-app outline-none placeholder:text-muted focus:ring-4"
                style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
