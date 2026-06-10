"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, X } from "lucide-react";

const STORAGE_KEY = "discipline-today-reminder-seen";

export function TodayReminder() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/today") return;
    if (window.sessionStorage.getItem(STORAGE_KEY) === "true") return;
    window.sessionStorage.setItem(STORAGE_KEY, "true");
    setOpen(true);
  }, [pathname]);

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
        <p className="display-font mt-4 text-5xl font-extrabold leading-none text-app">Finish Daily Uploads</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add today&apos;s proof while it is fresh. Gym attendance, cardio, weight, and protein all live in Daily Uploads.
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
            href="/today"
            onClick={() => setOpen(false)}
            className="app-button brand-gradient flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-extrabold text-black"
          >
            Go to Uploads
          </Link>
        </div>
      </section>
    </div>
  );
}
