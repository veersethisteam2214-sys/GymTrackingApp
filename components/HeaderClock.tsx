"use client";

import { useEffect, useState } from "react";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="min-w-0 rounded-2xl border px-3 py-2 text-right shadow-sm"
      style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">Now</p>
      <p className="truncate text-xs font-extrabold text-app sm:text-sm">{now ? formatDateTime(now) : "Loading time"}</p>
    </div>
  );
}
