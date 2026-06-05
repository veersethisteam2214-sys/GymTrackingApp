"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getMonthDays } from "@/lib/dates";
import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

const tones = {
  complete: "bg-leaf text-white",
  partial: "bg-sun text-ink",
  missing: "bg-ink/10 text-ink/55",
  excused: "bg-sky text-white"
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const selectedCheckins = checkins.filter((checkin) => checkin.checkin_date === selectedDay);

  return (
    <>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayCheckins = checkins.filter((checkin) => checkin.checkin_date === day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="app-button aspect-square rounded-2xl border border-ink/8 bg-paper p-1.5 text-left hover:border-leaf/40 hover:bg-mint/60 focus:outline-none focus:ring-4 focus:ring-leaf/15"
              >
                <span className="text-xs font-bold text-ink/50">{Number(day.slice(-2))}</span>
                <span className="mt-1 grid grid-cols-5 gap-1">
                  {profiles.slice(0, 10).map((profile) => {
                    const status =
                      dayCheckins.find((checkin) => checkin.user_id === profile.id)?.overall_status ?? "missing";
                    return (
                      <span
                        key={profile.id}
                        className={`block h-2.5 rounded-full ${tones[status]}`}
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

      {selectedDay ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
          <section className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Day detail</p>
                <h2 className="text-2xl font-semibold text-ink">{selectedDay}</h2>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="app-button flex size-11 items-center justify-center rounded-2xl bg-paper text-ink hover:bg-mint"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="space-y-3">
              {profiles.map((profile) => {
                const checkin = selectedCheckins.find((entry) => entry.user_id === profile.id);
                const checkinItems = checkin ? items.filter((item) => item.checkin_id === checkin.id) : [];
                return (
                  <div key={profile.id} className="rounded-3xl border border-ink/8 bg-paper p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-ink">{profile.display_name}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[checkin?.overall_status ?? "missing"]}`}>
                        {checkin?.overall_status ?? "missing"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {CATEGORIES.map((category) => {
                        const item = checkinItems.find((entry) => entry.category === category.id);
                        return (
                          <div key={category.id} className="overflow-hidden rounded-2xl bg-white">
                            <div className="relative aspect-square bg-ink/5">
                              {item?.signedUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="px-2 py-2">
                              <span className="block truncate text-[11px] font-bold text-ink">{category.shortLabel}</span>
                              <span className="text-[10px] font-bold capitalize text-ink/45">{item?.status ?? "missing"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
