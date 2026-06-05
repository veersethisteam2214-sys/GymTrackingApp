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

export function ProfileSetupForm({ profile }: { profile?: Profile | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [startingWeight, setStartingWeight] = useState(profile?.starting_weight?.toString() ?? "");
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(profile?.target_date ?? "");
  const [goalMode, setGoalMode] = useState<"cutting" | "bulking">(profile?.goal_mode ?? "cutting");
  const [gymRoutine, setGymRoutine] = useState(profile?.gym_routine ?? "");
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
    <section className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="mb-5">
        <label className="app-button relative mb-4 flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-soft hover:bg-leaf">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <UserRound className="size-8" aria-hidden />
          )}
          <span className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-xl bg-white text-ink shadow-sm">
            <ImagePlus className="size-4" aria-hidden />
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(event) => selectAvatar(event.target.files?.[0])}
          />
        </label>
        <h1 className="text-3xl font-semibold text-ink">Set up your profile</h1>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          Save your photo, current weight, goal, and training routines for the shared dashboard.
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
        <div className="grid grid-cols-2 gap-2">
          <Field icon={<Scale className="size-5" />} label="Current kg">
            <input
              value={startingWeight}
              onChange={(event) => setStartingWeight(event.target.value)}
              inputMode="decimal"
              className="w-full bg-transparent text-base outline-none"
              placeholder="82.5"
            />
          </Field>
          <Field icon={<Target className="size-5" />} label="Goal kg">
            <input
              value={targetWeight}
              onChange={(event) => setTargetWeight(event.target.value)}
              inputMode="decimal"
              className="w-full bg-transparent text-base outline-none"
              placeholder="78"
            />
          </Field>
        </div>
        <Field icon={<CalendarDays className="size-5" />} label="Target date">
          <input
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            type="date"
            className="w-full bg-transparent text-base outline-none"
          />
        </Field>
        <div>
          <span className="mb-2 block text-sm font-medium text-ink">Goal type</span>
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
          placeholder="Example: Push/pull/legs, 5 days a week"
        />
        <TextArea
          icon={<Timer className="size-5" />}
          label="Cardio routine"
          value={cardioRoutine}
          onChange={setCardioRoutine}
          placeholder="Example: Treadmill 25 min after lifting"
        />
        <div className="rounded-3xl bg-paper p-3">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="size-5 text-leaf" aria-hidden />
            <h2 className="font-semibold text-ink">Reading target</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
            <Field icon={<BookOpen className="size-5" />} label="Current book">
              <input
                value={currentBookTitle}
                onChange={(event) => setCurrentBookTitle(event.target.value)}
                required
                className="w-full bg-transparent text-base outline-none"
                placeholder="Atomic Habits"
              />
            </Field>
            <Field icon={<BookOpen className="size-5" />} label="Pages">
              <input
                value={currentBookTotalPages}
                onChange={(event) => setCurrentBookTotalPages(event.target.value)}
                inputMode="numeric"
                required
                className="w-full bg-transparent text-base outline-none"
                placeholder="320"
              />
            </Field>
          </div>
        </div>
        {error ? (
          <p aria-live="polite" className="rounded-2xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay">
            {error}
          </p>
        ) : null}
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
      className={`app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold ${
        active
          ? "border-ink bg-ink text-white shadow-soft"
          : "border-ink/10 bg-white text-ink/62 hover:border-leaf/35 hover:bg-mint"
      }`}
    >
      {icon}
      {label}
    </button>
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
