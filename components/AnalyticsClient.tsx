"use client";

import { useMemo, useState } from "react";
import { Activity, Check, Dumbbell, GlassWater, Timer, Users } from "lucide-react";
import { CompletionBars, getProfileChartColor, WeightTrend } from "@/components/AnalyticsCharts";
import type { CardioEntry, CheckInItem, DailyCheckIn, Profile, WeightEntry } from "@/lib/types";

export function AnalyticsClient({
  currentProfileId,
  profiles,
  checkins,
  items,
  weights,
  cardio
}: {
  currentProfileId: string;
  profiles: Profile[];
  checkins: DailyCheckIn[];
  items: CheckInItem[];
  weights: WeightEntry[];
  cardio: CardioEntry[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([currentProfileId]);
  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selectedIds.includes(profile.id)),
    [profiles, selectedIds]
  );
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const filteredItems = useMemo(() => items.filter((item) => selectedIdSet.has(item.user_id)), [items, selectedIdSet]);
  const filteredCardio = useMemo(() => cardio.filter((entry) => selectedIdSet.has(entry.user_id)), [cardio, selectedIdSet]);
  const filteredWeights = useMemo(() => weights.filter((entry) => selectedIdSet.has(entry.user_id)), [weights, selectedIdSet]);
  const filteredCheckins = useMemo(() => checkins.filter((entry) => selectedIdSet.has(entry.user_id)), [checkins, selectedIdSet]);

  const gymUploads = filteredItems.filter((item) => item.category === "progress_photo" && item.status === "uploaded").length;
  const cardioUploads = filteredItems.filter((item) => item.category === "treadmill_photo" && item.status === "uploaded").length;
  const proteinUploads = filteredItems.filter((item) => item.category === "protein_shake_photo" && item.status === "uploaded").length;
  const cardioMinutes = filteredCardio.reduce((sum, entry) => sum + Number(entry.treadmill_minutes ?? 0), 0);

  function toggleUser(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function selectAll() {
    setSelectedIds(profiles.map((profile) => profile.id));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        <section className="app-surface-strong rounded-[2rem] p-5">
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Selected stats
          </p>
          <h2 className="display-font mt-1 text-5xl font-extrabold text-app">
            {selectedProfiles.length === 1 ? selectedProfiles[0]?.display_name ?? "Your stats" : `${selectedProfiles.length} users`}
          </h2>
          <p className="mt-2 text-sm text-muted">Choose users from the filter panel. The metrics and charts update together.</p>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric icon={<Dumbbell className="size-5" />} label="Gym uploads" value={gymUploads} />
          <Metric icon={<Timer className="size-5" />} label="Cardio uploads" value={cardioUploads} />
          <Metric icon={<GlassWater className="size-5" />} label="Protein uploads" value={proteinUploads} />
          <Metric icon={<Activity className="size-5" />} label="Cardio minutes" value={cardioMinutes} />
        </div>

        <section className="app-surface rounded-[2rem] p-4">
          <h2 className="text-xl font-extrabold text-app">This month</h2>
          <CompletionBars profiles={selectedProfiles} checkins={filteredCheckins} />
        </section>
        <section className="app-surface rounded-[2rem] p-4">
          <h2 className="text-xl font-extrabold text-app">Weight trend</h2>
          <WeightTrend profiles={selectedProfiles} weights={filteredWeights} />
        </section>
      </div>

      <aside className="app-surface xl:sticky xl:top-32 h-fit rounded-[2rem] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="brand-gradient grid size-11 place-items-center rounded-2xl text-black">
            <Users className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-extrabold text-app">Filter users</h2>
            <p className="text-xs font-bold text-muted">{selectedProfiles.length}/{profiles.length} selected</p>
          </div>
        </div>
        <button
          onClick={selectAll}
          className="app-button mb-3 min-h-11 w-full rounded-2xl px-4 text-sm font-extrabold"
          style={{ background: "var(--surface-soft)", color: "var(--text)" }}
        >
          Select all
        </button>
        <div className="space-y-2">
          {profiles.map((profile) => {
            const selected = selectedIds.includes(profile.id);
            return (
              <button
                key={profile.id}
                onClick={() => toggleUser(profile.id)}
                className="app-button flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left"
                style={{
                  background: selected ? "color-mix(in srgb, var(--brand) 16%, var(--surface-soft))" : "var(--surface-soft)",
                  color: "var(--text)",
                  border: selected ? "1px solid var(--brand)" : "1px solid var(--faint)"
                }}
              >
                <span className="truncate text-sm font-extrabold">{profile.display_name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className="size-3 rounded-full shadow-sm"
                    style={{
                      background: getProfileChartColor(profile.id),
                      boxShadow: selected ? `0 0 0 4px color-mix(in srgb, ${getProfileChartColor(profile.id)} 18%, transparent)` : "none"
                    }}
                    aria-hidden
                  />
                  <span className="grid size-7 place-items-center rounded-xl" style={{ background: selected ? "var(--brand)" : "transparent", color: selected ? "var(--bg)" : "var(--muted)" }}>
                    {selected ? <Check className="size-4" aria-hidden /> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <section className="app-surface rounded-[1.5rem] p-4">
      <div className="brand-gradient mb-3 grid size-10 place-items-center rounded-2xl text-black">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="display-font mt-1 text-4xl font-extrabold text-app">{value}</p>
    </section>
  );
}
