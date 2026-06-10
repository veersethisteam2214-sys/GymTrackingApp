"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Target, X, Zap } from "lucide-react";
import type { StreakBreakNotice } from "@/lib/types";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

export function StreakBreakModal({
  notice,
  profileId
}: {
  notice: StreakBreakNotice | null;
  profileId: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const storageKey = `locked-in-streak-break-seen:${profileId}:${notice.date}`;
    if (window.localStorage.getItem(storageKey) === "true") return;
    window.localStorage.setItem(storageKey, "true");
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [notice, profileId]);

  if (!notice || !open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-3 backdrop-blur-md sm:items-center sm:justify-center">
      <section
        className="reveal-in relative w-full max-w-md overflow-hidden rounded-[2rem] p-5"
        style={{
          background:
            "radial-gradient(circle at 18% 0%, rgba(255,106,79,.34), transparent 15rem), radial-gradient(circle at 88% 10%, rgba(255,184,76,.18), transparent 16rem), var(--surface-strong)",
          border: "1px solid color-mix(in srgb, var(--danger) 44%, var(--faint))",
          boxShadow: "0 30px 100px rgba(255, 89, 45, 0.22), var(--shadow)"
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-orange-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-6 size-36 rounded-full bg-red-500/18 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="grid size-14 shrink-0 place-items-center rounded-3xl"
              style={{
                background: "linear-gradient(135deg, #ffb84c, #ff5b35)",
                color: "#120704",
                boxShadow: "0 18px 50px rgba(255, 91, 53, .38)"
              }}
            >
              <Flame className="size-8" strokeWidth={2.6} aria-hidden />
            </div>
            <div>
              <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--danger)" }}>
                Streak broken
              </p>
              <h2 className="display-font mt-1 text-5xl font-extrabold leading-none text-app">Unlucky.</h2>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="app-button grid size-10 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--surface-soft)", color: "var(--text)" }}
            aria-label="Close streak broken popup"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <p className="relative mt-4 text-sm font-bold leading-6 text-app">
          You were on a {notice.previousStreak} day streak, but {formatDate(notice.date)} finished at{" "}
          <span style={{ color: "var(--danger)" }}>{notice.completed}/{notice.required}</span>.
        </p>
        <p className="relative mt-2 text-sm leading-6 text-muted">
          Need to be more consistent. Complete {notice.required}/{notice.required} every day for a consecutive streak to count.
        </p>

        <div className="relative mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => setOpen(false)}
            className="app-button min-h-12 rounded-2xl px-4 text-sm font-extrabold text-muted"
            style={{ background: "var(--surface-soft)" }}
          >
            I got it
          </button>
          <Link
            href="/today"
            onClick={() => setOpen(false)}
            className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-black"
            style={{ background: "linear-gradient(135deg, #ffb84c, #ff5b35)" }}
          >
            <Target className="size-4" aria-hidden />
            Lock in
          </Link>
        </div>

        <div className="relative mt-4 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--surface-soft)" }}>
          <Zap className="size-4 shrink-0" style={{ color: "var(--danger)" }} aria-hidden />
          <p className="text-xs font-bold text-muted">Next streak starts with the next full completion day.</p>
        </div>
      </section>
    </div>
  );
}
