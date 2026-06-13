"use client";

import { useEffect, useState } from "react";
import { ShieldQuestion, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ExcuseRequest, Profile } from "@/lib/types";

type VoteRequest = ExcuseRequest & {
  label?: string;
  requester?: Pick<Profile, "display_name" | "avatarSignedUrl"> | null;
};

export function ExcuseVoteModal() {
  const [requests, setRequests] = useState<VoteRequest[]>([]);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = requests[0];

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/excuses", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const payload = await response.json().catch(() => ({}));
      const nextRequests = Array.isArray(payload.requests) ? payload.requests : [];
      if (nextRequests.length > 0) {
        setRequests(nextRequests);
        setVisible(true);
      }
    }, 10_000);

    return () => window.clearTimeout(timer);
  }, []);

  async function vote(nextVote: "allow" | "deny") {
    if (!current) return;
    setBusy(true);
    setError("");

    const response = await fetch("/api/excuses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: current.id, vote: nextVote })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not submit vote.");
      setBusy(false);
      return;
    }

    const remaining = requests.slice(1);
    setRequests(remaining);
    setVisible(remaining.length > 0);
    setBusy(false);
  }

  if (!visible || !current) return null;

  const requesterName = current.requester?.display_name ?? "Someone";
  const deadline = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(current.deadline_at));

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section
        className="reveal-in w-full max-w-lg rounded-[2rem] p-5"
        style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="brand-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-black">
              <ShieldQuestion className="size-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="display-font text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "var(--brand)" }}>
                Excuse vote
              </p>
              <h2 className="display-font text-3xl font-extrabold text-app">{requesterName}</h2>
            </div>
          </div>
          <p className="rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-muted" style={{ background: "var(--surface-soft)" }}>
            Vote required
          </p>
        </div>

        <div className="mt-5 rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Request</p>
          <p className="mt-1 text-lg font-extrabold text-app">{current.label ?? "Excuse"}</p>
          <p className="mt-3 text-sm font-bold leading-6 text-app">{current.reason}</p>
          <p className="mt-3 text-xs font-bold text-muted">Voting closes at {deadline} Thai time. Majority allow = point approved.</p>
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => vote("deny")}
            disabled={busy}
            className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold disabled:opacity-50"
            style={{ background: "color-mix(in srgb, var(--danger) 12%, var(--surface-soft))", color: "var(--danger)" }}
          >
            <ThumbsDown className="size-4" aria-hidden />
            Deny
          </button>
          <button
            onClick={() => vote("allow")}
            disabled={busy}
            className="app-button brand-gradient flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-black disabled:opacity-50"
          >
            <ThumbsUp className="size-4" aria-hidden />
            Allow
          </button>
        </div>
      </section>
    </div>
  );
}
