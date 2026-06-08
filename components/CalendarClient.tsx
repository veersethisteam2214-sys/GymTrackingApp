"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Filter, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getMonthDays } from "@/lib/dates";
import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

const tones = {
  complete: "var(--brand)",
  partial: "var(--accent)",
  missing: "var(--faint)",
  excused: "#4ea7ff"
};

export function CalendarClient({
  profiles,
  checkins,
  items
}: {
  profiles: Profile[];
  checkins: DailyCheckIn[];
  items: CheckInItem[];
}) {
  const days = getMonthDays();
  const [selectedDay, setSelectedDay] = useState<string | null>(days.find((day) => day === new Date().toISOString().slice(0, 10)) ?? days[0] ?? null);
  const [filterUserId, setFilterUserId] = useState("all");
  const visibleProfiles = filterUserId === "all" ? profiles : profiles.filter((profile) => profile.id === filterUserId);
  const selectedCheckins = useMemo(
    () => checkins.filter((checkin) => checkin.checkin_date === selectedDay),
    [checkins, selectedDay]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
      <section className="app-surface rounded-[2rem] p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Calendar
            </p>
            <h2 className="display-font text-5xl font-extrabold text-app">Pick a date</h2>
          </div>
          <label className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--surface-soft)" }}>
            <Filter className="size-4 text-muted" aria-hidden />
            <select
              value={filterUserId}
              onChange={(event) => setFilterUserId(event.target.value)}
              className="bg-transparent text-sm font-bold text-app outline-none"
            >
              <option value="all">View all users</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayCheckins = checkins.filter((checkin) => checkin.checkin_date === day);
            const active = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="app-button reveal-in min-h-24 rounded-3xl border p-2 text-left hover:-translate-y-0.5"
                style={{
                  animationDelay: `${index * 10}ms`,
                  borderColor: active ? "var(--brand)" : "var(--faint)",
                  background: active ? "color-mix(in srgb, var(--brand) 12%, var(--surface))" : "var(--surface-soft)"
                }}
              >
                <span className="display-font text-2xl font-extrabold text-app">{Number(day.slice(-2))}</span>
                <span className="mt-2 grid grid-cols-7 gap-1">
                  {profiles.slice(0, 13).map((profile) => {
                    const status =
                      dayCheckins.find((checkin) => checkin.user_id === profile.id)?.overall_status ?? "missing";
                    return (
                      <span
                        key={profile.id}
                        className="block h-1.5 rounded-full"
                        style={{ background: tones[status] }}
                        title={`${profile.display_name}: ${status}`}
                      />
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <DayDetail
        selectedDay={selectedDay}
        profiles={visibleProfiles}
        checkins={selectedCheckins}
        items={items}
        onClearFilter={() => setFilterUserId("all")}
        isFiltered={filterUserId !== "all"}
      />
    </div>
  );
}

function DayDetail({
  selectedDay,
  profiles,
  checkins,
  items,
  onClearFilter,
  isFiltered
}: {
  selectedDay: string | null;
  profiles: Profile[];
  checkins: DailyCheckIn[];
  items: CheckInItem[];
  onClearFilter: () => void;
  isFiltered: boolean;
}) {
  const [openItem, setOpenItem] = useState<CheckInItem | null>(null);

  return (
    <aside className="app-surface-strong rounded-[2rem] p-5 xl:sticky xl:top-32 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Day detail
          </p>
          <h2 className="display-font text-4xl font-extrabold text-app">{selectedDay ?? "Select date"}</h2>
        </div>
        {isFiltered ? (
          <button onClick={onClearFilter} className="app-button grid size-10 place-items-center rounded-2xl" style={{ background: "var(--surface-soft)", color: "var(--text)" }}>
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <div className="brand-gradient grid size-10 place-items-center rounded-2xl text-black">
            <CalendarDays className="size-4" aria-hidden />
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {profiles.map((profile) => {
          const checkin = checkins.find((entry) => entry.user_id === profile.id);
          const checkinItems = checkin ? items.filter((item) => item.checkin_id === checkin.id) : [];
          return (
            <article key={profile.id} className="rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar profile={profile} />
                  <div className="min-w-0">
                    <h3 className="truncate font-extrabold text-app">{profile.display_name}</h3>
                    <p className="text-xs font-bold capitalize text-muted">{checkin?.overall_status ?? "missing"}</p>
                  </div>
                </div>
                <span className="grid size-9 place-items-center rounded-2xl" style={{ background: checkin?.overall_status === "complete" ? "var(--brand)" : "var(--surface-soft)", color: checkin?.overall_status === "complete" ? "var(--bg)" : "var(--muted)" }}>
                  {checkin?.overall_status === "complete" ? <Check className="size-4" /> : null}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {CATEGORIES.map((category) => {
                  const item = checkinItems.find((entry) => entry.category === category.id);
                  const done = item?.status === "uploaded" || item?.status === "excused";
                  return (
                    <button
                      key={category.id}
                      onClick={() => item && setOpenItem(item)}
                      className="app-button rounded-2xl p-2 text-center"
                      style={{ background: done ? "color-mix(in srgb, var(--brand) 14%, transparent)" : "var(--surface-soft)" }}
                    >
                      <span className="mx-auto grid size-8 place-items-center rounded-xl" style={{ background: done ? "var(--brand)" : "var(--surface-soft)", color: done ? "var(--bg)" : "var(--muted)" }}>
                        {done ? <Check className="size-4" /> : null}
                      </span>
                      <span className="mt-1 block truncate text-[10px] font-extrabold text-app">{category.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {openItem ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <section className="reveal-in w-full max-w-lg rounded-[2rem] p-5" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)" }}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="display-font text-4xl font-extrabold text-app">{openItem.category.replaceAll("_", " ")}</h3>
              <button onClick={() => setOpenItem(null)} className="grid size-10 place-items-center rounded-2xl" style={{ background: "var(--surface-soft)" }}>
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {openItem.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={openItem.signedUrl} alt="" className="mt-4 max-h-[60vh] w-full rounded-3xl object-cover" />
            ) : null}
            <p className="mt-4 whitespace-pre-wrap rounded-3xl p-4 text-sm text-app" style={{ background: "var(--surface-soft)" }}>
              {openItem.note || openItem.status}
            </p>
          </section>
        </div>
      ) : null}
    </aside>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  return (
    <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl brand-gradient font-black text-black">
      {profile.avatarSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        profile.display_name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}
