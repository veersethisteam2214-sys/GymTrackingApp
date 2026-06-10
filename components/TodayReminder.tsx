"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, X } from "lucide-react";
import type { TodayCompletionSummary } from "@/lib/types";

const STORAGE_KEY = "discipline-today-reminder-seen";

export function TodayReminder({ completion }: { completion: TodayCompletionSummary | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shouldShow = Boolean(completion);
  const hasStarted = Boolean(completion && completion.completed > 0);
  const isComplete = Boolean(completion && completion.completed >= completion.required);
  const storageKey = completion ? `${STORAGE_KEY}:${completion.completed}/${completion.required}` : STORAGE_KEY;

  useEffect(() => {
    if (!shouldShow) return;
    if (pathname === "/today") return;
    if (window.sessionStorage.getItem(storageKey) === "true") return;
    window.sessionStorage.setItem(storageKey, "true");
    setOpen(true);
  }, [pathname, shouldShow, storageKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="reveal-in w-full max-w-md rounded-[2rem] p-5" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="brand-gradient grid size-12 place-items-center rounded-2xl text-black">
            <Camera className="size-6" aria-hidden />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="app-button grid size-10 place-items-center rounded-2xl"
            style={{ background: "var(--surface-soft)", color: "var(--text)" }}
            aria-label="Close reminder"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="display-font mt-4 text-5xl font-extrabold leading-none text-app">
          {isComplete ? "Well done" : hasStarted ? "Finish Daily Uploads" : "Cmon, lock in"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isComplete
            ? `${completion?.completed}/${completion?.required} is excellent. That's what locked in looks like.`
            : hasStarted
              ? `You're at ${completion?.completed}/${completion?.required}. Finish the remaining proof while it is fresh.`
              : `0/${completion?.required} is poor. Get today started and upload your first proof now.`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => setOpen(false)}
            className="app-button min-h-12 rounded-2xl px-4 text-sm font-extrabold text-muted"
            style={{ background: "var(--surface-soft)" }}
          >
            Later
          </button>
          <Link
            href={isComplete ? "/dashboard" : "/today"}
            onClick={() => setOpen(false)}
            className="app-button brand-gradient flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-extrabold text-black"
          >
            {isComplete ? "Dashboard" : "Go to Uploads"}
          </Link>
        </div>
      </section>
    </div>
  );
}
