"use client";

import { useRef, useState } from "react";
import {
  BicepsFlexed,
  Camera,
  Check,
  Dna,
  Footprints,
  Gauge,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { calculateDailyStatus } from "@/lib/status";
import type { CardioEntry, CheckInCategory, CheckInItem, DailyCheckIn, WeightEntry } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const categoryIcons: Record<CheckInCategory, React.ReactNode> = {
  progress_photo: <BicepsFlexed className="size-5" />,
  treadmill_photo: <Footprints className="size-5" />,
  weight_scale_photo: <Gauge className="size-5" />,
  protein_shake_photo: <Dna className="size-5" />
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
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CheckInCategory>(
    items.find((item) => item.status === "missing")?.category ?? CATEGORIES[0].id
  );

  const completionCount = items.filter((item) => item.status === "uploaded" || item.status === "excused").length;
  const selectedMeta = CATEGORIES.find((category) => category.id === selectedCategory) ?? CATEGORIES[0];
  const selectedItem = items.find((entry) => entry.category === selectedCategory);

  async function upload(category: CheckInItem["category"], file: File | null, note: string) {
    if (!file) return setToast(category === "weight_scale_photo" ? "Upload a scale photo first." : "Choose an image first.");
    if (!ACCEPTED_TYPES.includes(file.type)) return setToast("Use JPG, PNG, WEBP, HEIC, or HEIF images.");
    if (file.size > MAX_FILE_SIZE) return setToast("Image must be 10 MB or smaller.");

    if (category === "weight_scale_photo") {
      const nextWeight = Number(weight.trim());
      if (!weight.trim() || !Number.isFinite(nextWeight)) {
        return setToast("Enter today's weight.");
      }
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
    setMobilePanelOpen(false);
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
    setMobilePanelOpen(false);
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
    setMobilePanelOpen(false);
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
      <section className="app-surface-strong overflow-hidden rounded-[2rem]">
        <div className="p-4" style={{ borderBottom: "1px solid var(--faint)" }}>
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--brand)" }}>Today upload deck</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Completion</p>
              <h2 className="display-font text-5xl font-extrabold text-app">
                {completionCount}/{CATEGORIES.length}
              </h2>
            </div>
            <button
              onClick={() => setRestDayState(!restDay)}
              className="app-button flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold"
              style={{
                background: restDay ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--surface-soft)",
                color: restDay ? "var(--bg)" : "var(--text)"
              }}
            >
              <ShieldCheck className="size-4" aria-hidden />
              Rest day
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div className="h-full rounded-full brand-gradient" style={{ width: `${(completionCount / CATEGORIES.length) * 100}%` }} />
          </div>
          {restDay ? (
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setRestDayState(true, reason)}
              placeholder="Optional reason"
              className="mt-3 min-h-11 w-full rounded-2xl border px-4 text-sm text-app outline-none placeholder:text-muted"
              style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
            />
          ) : null}
        </div>
        <div className="grid grid-cols-4 gap-px" style={{ background: "var(--faint)" }}>
          {CATEGORIES.map((category) => {
            const item = items.find((entry) => entry.category === category.id);
            const isSelected = category.id === selectedCategory;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setMobilePanelOpen(true);
                }}
                className="app-button min-h-24 p-2 text-left"
                style={{
                  background: isSelected ? "color-mix(in srgb, var(--brand) 12%, var(--surface-strong))" : "var(--surface-strong)",
                  boxShadow: isSelected ? "inset 0 0 0 2px var(--brand)" : "none"
                }}
              >
                <span className={`mb-2 flex size-9 items-center justify-center rounded-2xl ${category.accent}`}>
                  {categoryIcons[category.id]}
                </span>
                <span className="block truncate text-xs font-bold text-app">{category.shortLabel}</span>
                <span className="mt-1 block text-[10px] font-bold capitalize text-muted">{item?.status ?? "missing"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="hidden md:block">
        <UploadPanel
          key={`desktop-${selectedCategory}`}
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
      </div>

      <section className="app-surface rounded-[2rem] p-4">
        <h3 className="text-lg font-extrabold text-app">All criteria</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CATEGORIES.map((category) => {
            const item = items.find((entry) => entry.category === category.id);
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setMobilePanelOpen(true);
                }}
                className="app-button flex min-h-14 items-center justify-between rounded-2xl px-3 text-left"
                style={{ background: "var(--surface-soft)" }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-white ${category.accent}`}>
                    {categoryIcons[category.id]}
                  </span>
                  <span className="truncate text-sm font-bold text-app">{category.shortLabel}</span>
                </span>
                <span className="text-xs font-bold capitalize text-muted">{item?.status ?? "missing"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {mobilePanelOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm md:hidden">
          <section className="reveal-in max-h-[88vh] w-full overflow-y-auto rounded-[2rem] p-1" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}>
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <p className="text-sm font-extrabold text-muted">Upload {selectedMeta.shortLabel}</p>
              <button
                onClick={() => setMobilePanelOpen(false)}
                className="app-button grid size-10 place-items-center rounded-2xl"
                style={{ background: "var(--surface-soft)", color: "var(--text)" }}
                aria-label="Close upload panel"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <UploadPanel
              key={`mobile-${selectedCategory}`}
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
          </section>
        </div>
      ) : null}

      {toast ? (
        <button
          onClick={() => setToast("")}
          aria-live="polite"
          className="app-button fixed bottom-6 left-4 right-4 z-40 mx-auto min-h-12 max-w-md rounded-2xl px-4 text-sm font-extrabold shadow-soft"
          style={{ background: "var(--text)", color: "var(--bg)" }}
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
    <section className="app-surface rounded-[2rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`flex size-10 items-center justify-center rounded-2xl text-white ${category.accent}`}>
              {categoryIcons[category.id]}
            </span>
            <h3 className="text-lg font-extrabold text-app">{category.label}</h3>
          </div>
          <p className="mt-1 text-sm leading-5 text-muted">{category.helper}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-bold capitalize text-muted" style={{ background: "var(--surface-soft)" }}>
          {item?.status ?? "missing"}
        </span>
      </div>

      {isWeightEntry ? <MetricInput label="Weight kg" value={weight} onChange={onWeight} /> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="app-button relative mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <ImagePlus className="mx-auto size-9 text-muted" aria-hidden />
            <p className="mt-2 text-sm font-extrabold text-app">{isWeightEntry ? "Tap to add scale photo" : "Tap to add image"}</p>
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
      {isWeightEntry ? (
        <div className="mt-3 rounded-2xl px-4 py-3 text-sm font-bold text-muted" style={{ background: "var(--surface-soft)" }}>
          Save requires both the weight number and a clear scale photo.
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
        className="mt-3 min-h-20 w-full resize-none rounded-2xl border px-4 py-3 text-sm text-app outline-none placeholder:text-muted focus:ring-4"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => onUpload(category.id, file, note)}
          disabled={!file || (isWeightEntry && !weight.trim()) || busy}
          className="app-button brand-gradient flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {isWeightEntry ? "Save" : "Save"}
        </button>
        <button
          onClick={() => onExcuse(category.id)}
          disabled={busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-extrabold"
          style={{ borderColor: "var(--faint)", background: "var(--surface-soft)", color: "var(--text)" }}
        >
          <Check className="size-4" />
          Excuse
        </button>
        <button
          onClick={() => onDelete(category.id)}
          disabled={busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-extrabold"
          style={{ borderColor: "color-mix(in srgb, var(--danger) 34%, transparent)", background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}
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
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="min-h-11 w-full rounded-2xl border px-4 text-sm text-app outline-none focus:ring-4"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      />
    </label>
  );
}
