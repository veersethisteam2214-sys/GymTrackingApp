"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Check, ImagePlus, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { calculateDailyStatus } from "@/lib/status";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { CardioEntry, CheckInItem, DailyCheckIn, WeightEntry } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

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
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [items, setItems] = useState(initialItems);
  const [restDay, setRestDay] = useState(checkin.is_rest_day);
  const [reason, setReason] = useState(checkin.rest_day_reason ?? "");
  const [weight, setWeight] = useState(initialWeight?.weight_value?.toString() ?? "");
  const [minutes, setMinutes] = useState(initialCardio?.treadmill_minutes?.toString() ?? "");
  const [distance, setDistance] = useState(initialCardio?.treadmill_distance?.toString() ?? "");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const completionCount = items.filter((item) => item.status === "uploaded" || item.status === "excused").length;

  async function refreshItems(nextItems?: CheckInItem[]) {
    if (!supabase) return;
    const sourceItems = nextItems ?? items;
    const overall = calculateDailyStatus(sourceItems, restDay);
    await supabase.from("daily_checkins").update({ overall_status: overall, updated_at: new Date().toISOString() }).eq("id", checkin.id);
  }

  async function upload(category: CheckInItem["category"], file: File, note: string) {
    if (!supabase) return setToast("Supabase is not configured.");
    if (!ACCEPTED_TYPES.includes(file.type)) return setToast("Use JPG, PNG, WEBP, HEIC, or HEIF images.");
    if (file.size > MAX_FILE_SIZE) return setToast("Image must be 10 MB or smaller.");

    setBusyKey(category);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return setBusyKey(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${checkin.checkin_date}/${category}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("checkin-uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      setToast(uploadError.message);
      setBusyKey(null);
      return;
    }

    const { data: signed } = await supabase.storage.from("checkin-uploads").createSignedUrl(path, 60 * 60);
    const { data, error } = await supabase
      .from("checkin_items")
      .update({
        status: "uploaded",
        storage_path: `checkin-uploads/${path}`,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
        note,
        updated_at: new Date().toISOString()
      })
      .eq("checkin_id", checkin.id)
      .eq("category", category)
      .select("*")
      .single();

    if (error) {
      setToast(error.message);
      setBusyKey(null);
      return;
    }

    const nextItems = items.map((item) =>
      item.category === category ? ({ ...(data as CheckInItem), signedUrl: signed?.signedUrl ?? null } as CheckInItem) : item
    );
    setItems(nextItems);
    await saveMetric(category);
    await refreshItems(nextItems);
    setToast("Saved.");
    setBusyKey(null);
  }

  async function saveMetric(category: CheckInItem["category"]) {
    if (!supabase) return;
    const base = { user_id: checkin.user_id, checkin_id: checkin.id };
    if (category === "weight_scale_photo" && weight) {
      await supabase.from("weight_entries").upsert(
        {
          ...base,
          weight_value: Number(weight),
          weight_unit: "kg",
          measured_at: new Date().toISOString()
        },
        { onConflict: "user_id,checkin_id" }
      );
    }
    if (category === "treadmill_photo" && (minutes || distance)) {
      await supabase.from("cardio_entries").upsert(
        {
          ...base,
          treadmill_minutes: minutes ? Number(minutes) : null,
          treadmill_distance: distance ? Number(distance) : null,
          distance_unit: "km"
        },
        { onConflict: "user_id,checkin_id" }
      );
    }
  }

  async function markExcused(category: CheckInItem["category"]) {
    if (!supabase) return;
    setBusyKey(category);
    const { data } = await supabase
      .from("checkin_items")
      .update({ status: "excused", updated_at: new Date().toISOString() })
      .eq("checkin_id", checkin.id)
      .eq("category", category)
      .select("*")
      .single();
    const nextItems = items.map((item) => (item.category === category ? (data as CheckInItem) : item));
    setItems(nextItems);
    await refreshItems(nextItems);
    setToast("Marked excused.");
    setBusyKey(null);
  }

  async function remove(category: CheckInItem["category"]) {
    if (!supabase) return;
    setBusyKey(category);
    const current = items.find((item) => item.category === category);
    if (current?.storage_path) {
      await supabase.storage.from("checkin-uploads").remove([current.storage_path.replace(/^checkin-uploads\//, "")]);
    }
    const { data } = await supabase
      .from("checkin_items")
      .update({
        status: "missing",
        storage_path: null,
        original_filename: null,
        mime_type: null,
        file_size_bytes: null,
        uploaded_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("checkin_id", checkin.id)
      .eq("category", category)
      .select("*")
      .single();
    const nextItems = items.map((item) => (item.category === category ? (data as CheckInItem) : item));
    setItems(nextItems);
    await refreshItems(nextItems);
    setToast("Removed.");
    setBusyKey(null);
  }

  async function setRestDayState(next: boolean, nextReason = reason) {
    if (!supabase) return;
    setRestDay(next);
    await supabase
      .from("daily_checkins")
      .update({
        is_rest_day: next,
        rest_day_reason: next ? nextReason : null,
        overall_status: calculateDailyStatus(items, next),
        updated_at: new Date().toISOString()
      })
      .eq("id", checkin.id);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] bg-ink p-4 text-white shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/62">Today progress</p>
            <h2 className="text-3xl font-semibold">{completionCount}/4</h2>
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
        {restDay ? (
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            onBlur={() => setRestDayState(true, reason)}
            placeholder="Optional reason"
            className="mt-3 min-h-11 w-full rounded-2xl border border-white/12 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/45"
          />
        ) : null}
      </section>

      {CATEGORIES.map((category) => {
        const item = items.find((entry) => entry.category === category.id);
        return (
          <UploadPanel
            key={category.id}
            item={item}
            category={category}
            busy={busyKey === category.id}
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
        );
      })}

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
  onUpload: (category: CheckInItem["category"], file: File, note: string) => void;
  onExcuse: (category: CheckInItem["category"]) => void;
  onDelete: (category: CheckInItem["category"]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(item?.signedUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(item?.note ?? "");

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
            <span className={`size-3 rounded-full ${category.accent}`} />
            <h3 className="text-lg font-semibold text-ink">{category.label}</h3>
          </div>
          <p className="mt-1 text-sm leading-5 text-ink/55">{category.helper}</p>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold capitalize text-ink/60">
          {item?.status ?? "missing"}
        </span>
      </div>

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

      {category.id === "weight_scale_photo" ? (
        <MetricInput label="Weight kg" value={weight} onChange={onWeight} />
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
          onClick={() => file && onUpload(category.id, file, note)}
          disabled={!file || busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-leaf px-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Save
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
