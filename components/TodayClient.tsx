"use client";

import { useRef, useState } from "react";
import { Activity, Camera, Check, Dumbbell, GlassWater, ImagePlus, Loader2, Scale, ShieldCheck, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { calculateDailyStatus } from "@/lib/status";
import type { CardioEntry, CheckInCategory, CheckInItem, DailyCheckIn, WeightEntry } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const categoryIcons: Record<CheckInCategory, React.ReactNode> = {
  progress_photo: <Dumbbell className="size-5" />,
  treadmill_photo: <Activity className="size-5" />,
  weight_scale_photo: <Scale className="size-5" />,
  protein_shake_photo: <GlassWater className="size-5" />
};

export function TodayClient({
  checkin,
  initialItems,
  initialWeight,
  initialCardio
}: {
  checkin: DailyCheckIn;
  initialItems: CheckInItem[];
  initialWeight: WeightEntry | null;
  initialCardio: CardioEntry | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [restDay, setRestDay] = useState(checkin.is_rest_day);
  const [reason, setReason] = useState(checkin.rest_day_reason ?? "");
  const [weight, setWeight] = useState(initialWeight?.weight_value?.toString() ?? "");
  const [minutes, setMinutes] = useState(initialCardio?.treadmill_minutes?.toString() ?? "");
  const [distance, setDistance] = useState(initialCardio?.treadmill_distance?.toString() ?? "");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CheckInCategory>(
    items.find((item) => item.status === "missing")?.category ?? CATEGORIES[0].id
  );

  const completionCount = items.filter((item) => item.status === "uploaded" || item.status === "excused").length;
  const selectedMeta = CATEGORIES.find((category) => category.id === selectedCategory) ?? CATEGORIES[0];
  const selectedItem = items.find((entry) => entry.category === selectedCategory);

  async function upload(category: CheckInItem["category"], file: File | null, note: string) {
    if (category !== "weight_scale_photo") {
      if (!file) return setToast("Choose an image first.");
      if (!ACCEPTED_TYPES.includes(file.type)) return setToast("Use JPG, PNG, WEBP, HEIC, or HEIF images.");
      if (file.size > MAX_FILE_SIZE) return setToast("Image must be 10 MB or smaller.");
    }

    setBusyKey(category);
    const formData = new FormData();
    formData.set("category", category);
    formData.set("note", note);
    if (file) formData.set("file", file);
    formData.set("weight", weight);
    formData.set("minutes", minutes);
    formData.set("distance", distance);

    const response = await fetch("/api/today/upload", {
      method: "POST",
      body: formData
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setToast(payload.error ?? "Upload failed.");
      setBusyKey(null);
      return;
    }

    const nextItems = items.map((item) =>
      item.category === category ? (payload.item as CheckInItem) : item
    );
    setItems(nextItems);
    setToast("Saved.");
    setBusyKey(null);
  }

  async function markExcused(category: CheckInItem["category"]) {
    setBusyKey(category);
    const response = await fetch("/api/today/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, action: "excuse" })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setToast(payload.error ?? "Could not update item.");
      setBusyKey(null);
      return;
    }
    const nextItems = items.map((item) => (item.category === category ? (payload.item as CheckInItem) : item));
    setItems(nextItems);
    setToast("Marked excused.");
    setBusyKey(null);
  }

  async function remove(category: CheckInItem["category"]) {
    setBusyKey(category);
    const response = await fetch("/api/today/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, action: "clear" })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setToast(payload.error ?? "Could not clear item.");
      setBusyKey(null);
      return;
    }
    const nextItems = items.map((item) => (item.category === category ? (payload.item as CheckInItem) : item));
    setItems(nextItems);
    setToast("Removed.");
    setBusyKey(null);
  }

  async function setRestDayState(next: boolean, nextReason = reason) {
    setRestDay(next);
    await fetch("/api/today/rest", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_rest_day: next,
        rest_day_reason: next ? nextReason : null,
        overall_status: calculateDailyStatus(items, next)
      })
    });
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] bg-ink text-white shadow-soft">
        <div className="border-b border-white/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint/75">Today upload deck</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/62">Completion</p>
              <h2 className="text-4xl font-semibold">{completionCount}/4</h2>
            </div>
            <button
              onClick={() => setRestDayState(!restDay)}
              className={`app-button flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-semibold ${
                restDay ? "bg-sky text-white" : "bg-white/12 text-white hover:bg-white/18"
              }`}
            >
              <ShieldCheck className="size-4" aria-hidden />
              Rest day
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-mint" style={{ width: `${(completionCount / 4) * 100}%` }} />
          </div>
          {restDay ? (
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setRestDayState(true, reason)}
              placeholder="Optional reason"
              className="mt-3 min-h-11 w-full rounded-2xl border border-white/12 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/45"
            />
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-px bg-white/10">
          {CATEGORIES.map((category) => {
            const item = items.find((entry) => entry.category === category.id);
            const isSelected = category.id === selectedCategory;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`app-button min-h-24 bg-ink p-2 text-left hover:bg-white/8 ${
                  isSelected ? "ring-2 ring-inset ring-mint" : ""
                }`}
              >
                <span className={`mb-2 flex size-9 items-center justify-center rounded-2xl ${category.accent}`}>
                  {categoryIcons[category.id]}
                </span>
                <span className="block truncate text-xs font-bold text-white">{category.shortLabel}</span>
                <span className="mt-1 block text-[10px] font-bold capitalize text-white/42">{item?.status ?? "missing"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <UploadPanel
        key={selectedCategory}
        item={selectedItem}
        category={selectedMeta}
        busy={busyKey === selectedCategory}
        weight={weight}
        minutes={minutes}
        distance={distance}
        onWeight={setWeight}
        onMinutes={setMinutes}
        onDistance={setDistance}
        onUpload={upload}
        onExcuse={markExcused}
        onDelete={remove}
      />

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <h3 className="text-lg font-semibold text-ink">All criteria</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CATEGORIES.map((category) => {
            const item = items.find((entry) => entry.category === category.id);
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="app-button flex min-h-14 items-center justify-between rounded-2xl bg-paper px-3 text-left hover:bg-mint/60"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-white ${category.accent}`}>
                    {categoryIcons[category.id]}
                  </span>
                  <span className="truncate text-sm font-bold text-ink">{category.shortLabel}</span>
                </span>
                <span className="text-xs font-bold capitalize text-ink/45">{item?.status ?? "missing"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {toast ? (
        <button
          onClick={() => setToast("")}
          className="app-button fixed bottom-24 left-4 right-4 z-40 mx-auto min-h-12 max-w-md rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-soft"
        >
          {toast}
        </button>
      ) : null}
    </div>
  );
}

function UploadPanel({
  item,
  category,
  busy,
  weight,
  minutes,
  distance,
  onWeight,
  onMinutes,
  onDistance,
  onUpload,
  onExcuse,
  onDelete
}: {
  item?: CheckInItem;
  category: (typeof CATEGORIES)[number];
  busy: boolean;
  weight: string;
  minutes: string;
  distance: string;
  onWeight: (value: string) => void;
  onMinutes: (value: string) => void;
  onDistance: (value: string) => void;
  onUpload: (category: CheckInItem["category"], file: File | null, note: string) => void;
  onExcuse: (category: CheckInItem["category"]) => void;
  onDelete: (category: CheckInItem["category"]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(item?.signedUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(item?.note ?? "");
  const isWeightEntry = category.id === "weight_scale_photo";

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`flex size-10 items-center justify-center rounded-2xl text-white ${category.accent}`}>
              {categoryIcons[category.id]}
            </span>
            <h3 className="text-lg font-semibold text-ink">{category.label}</h3>
          </div>
          <p className="mt-1 text-sm leading-5 text-ink/55">{category.helper}</p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold capitalize text-ink/60">
          {item?.status ?? "missing"}
        </span>
      </div>

      {isWeightEntry ? (
        <MetricInput label="Weight kg" value={weight} onChange={onWeight} />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="app-button relative mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed border-ink/18 bg-paper hover:border-leaf/50 hover:bg-mint/50"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto size-9 text-ink/35" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-ink">Tap to add image</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </button>
      )}
      {isWeightEntry ? (
        <div className="mt-3 rounded-2xl bg-mint/55 px-4 py-3 text-sm font-semibold text-ink/70">
          Weight is saved as a number entry. No photo needed.
        </div>
      ) : null}
      {category.id === "treadmill_photo" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricInput label="Minutes" value={minutes} onChange={onMinutes} />
          <MetricInput label="Distance km" value={distance} onChange={onDistance} />
        </div>
      ) : null}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note"
        className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => onUpload(category.id, file, note)}
          disabled={(!file && !isWeightEntry) || busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-leaf px-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {isWeightEntry ? "Save" : "Save"}
        </button>
        <button
          onClick={() => onExcuse(category.id)}
          disabled={busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky/30 bg-sky/10 px-3 text-sm font-semibold text-sky hover:bg-sky hover:text-white"
        >
          <Check className="size-4" />
          Excuse
        </button>
        <button
          onClick={() => onDelete(category.id)}
          disabled={busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-clay/20 bg-clay/8 px-3 text-sm font-semibold text-clay hover:bg-clay hover:text-white"
        >
          {item?.storage_path ? <Trash2 className="size-4" /> : <X className="size-4" />}
          Clear
        </button>
      </div>
    </section>
  );
}

function MetricInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="min-h-11 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
      />
    </label>
  );
}
