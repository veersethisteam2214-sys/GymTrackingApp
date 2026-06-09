"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { FeatureAnnouncement } from "@/lib/types";

export function UpdateAnnouncementModal({ announcement }: { announcement: FeatureAnnouncement | null }) {
  const [visible, setVisible] = useState(Boolean(announcement));

  if (!announcement || !visible) return null;
  const currentAnnouncement = announcement;

  async function dismiss() {
    setVisible(false);
    await fetch("/api/announcements/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement_id: currentAnnouncement.id })
    }).catch(() => null);
  }

  const lines = currentAnnouncement.body.split("\n");

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section
        className="reveal-in max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-5"
        style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-black">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="display-font text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--brand)" }}>
                App update
              </p>
              <h2 className="display-font text-4xl font-extrabold text-app">{currentAnnouncement.title}</h2>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="app-button grid size-11 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--surface-soft)", color: "var(--text)" }}
            aria-label="Close update popup"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 space-y-2 rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
          {lines.map((line, index) =>
            line.startsWith("- ") ? (
              <p key={`${line}-${index}`} className="flex gap-2 text-sm font-bold leading-6 text-app">
                <span style={{ color: "var(--brand)" }}>•</span>
                <span>{line.slice(2)}</span>
              </p>
            ) : (
              <p key={`${line}-${index}`} className="text-sm font-bold leading-6 text-muted">
                {line || "\u00a0"}
              </p>
            )
          )}
        </div>

        <button
          onClick={dismiss}
          className="app-button brand-gradient mt-4 min-h-12 w-full rounded-2xl px-4 text-sm font-extrabold text-black"
        >
          Got it
        </button>
      </section>
    </div>
  );
}
