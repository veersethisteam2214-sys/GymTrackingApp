"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  ImagePlus,
  Loader2,
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

export function ProfileSetupForm({ profile }: { profile?: Profile | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [startingWeight, setStartingWeight] = useState(profile?.starting_weight?.toString() ?? "");
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(profile?.target_date ?? "");
  const [goalMode, setGoalMode] = useState<"cutting" | "bulking">(profile?.goal_mode ?? "cutting");
  const [gymRoutine, setGymRoutine] = useState(profile?.gym_routine ?? WEEKLY_GYM_TEMPLATE);
  const [cardioRoutine, setCardioRoutine] = useState(profile?.cardio_routine ?? "");
  const [currentBookTitle, setCurrentBookTitle] = useState(profile?.current_book_title ?? "");
  const [currentBookTotalPages, setCurrentBookTotalPages] = useState(profile?.current_book_total_pages?.toString() ?? "");
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
    formData.set("starting_weight", startingWeight);
    formData.set("target_weight", targetWeight);
    formData.set("target_date", targetDate);
    formData.set("goal_mode", goalMode);
    formData.set("gym_routine", gymRoutine);
    formData.set("cardio_routine", cardioRoutine);
    formData.set("current_book_title", currentBookTitle);
    formData.set("current_book_total_pages", currentBookTotalPages);
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
          Add your avatar, training plan, goal, and reading target. Friends see this after they tap your profile.
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
        <TextArea
          icon={<Dumbbell className="size-5" />}
          label="Gym routine"
          value={gymRoutine}
          onChange={setGymRoutine}
          placeholder={WEEKLY_GYM_TEMPLATE}
        />
        <TextArea
          icon={<Timer className="size-5" />}
          label="Cardio routine"
          value={cardioRoutine}
          onChange={setCardioRoutine}
          placeholder="Example: Treadmill 25 min after lifting"
        />
        <div className="rounded-3xl p-3" style={{ background: "var(--surface-soft)" }}>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-5 text-leaf" aria-hidden />
            <h2 className="font-semibold text-app">Reading target</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
            <Field icon={<BookOpen className="size-5" />} label="Current book">
              <input
                value={currentBookTitle}
                onChange={(event) => setCurrentBookTitle(event.target.value)}
                required
                className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
                placeholder="Atomic Habits"
              />
            </Field>
            <Field icon={<BookOpen className="size-5" />} label="Pages">
              <input
                value={currentBookTotalPages}
                onChange={(event) => setCurrentBookTotalPages(event.target.value)}
                inputMode="numeric"
                required
                className="w-full bg-transparent text-base text-app outline-none placeholder:text-muted"
                placeholder="320"
              />
            </Field>
          </div>
        </div>
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
