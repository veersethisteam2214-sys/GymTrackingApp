"use client";

import { useState } from "react";
import { BookOpen, Loader2, Send } from "lucide-react";
import type { Profile, Recommendation } from "@/lib/types";

export function RecommendationBoard({
  initialRecommendations,
  currentProfile
}: {
  initialRecommendations: Recommendation[];
  currentProfile: Profile;
}) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, note })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(payload.error ?? "Could not save recommendation.");
      setBusy(false);
      return;
    }

    setRecommendations([
      {
        ...payload.recommendation,
        profile: currentProfile
      },
      ...recommendations
    ]);
    setTitle("");
    setNote("");
    setMessage("Recommendation added.");
    setBusy(false);
  }

  return (
    <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <BookOpen className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Book recommendations</p>
          <h2 className="text-xl font-semibold text-ink">Group reading ideas</h2>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Book title"
            className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why should the group read it?"
            className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15"
          />
        </div>
        <button
          disabled={busy}
          className="app-button flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-bold text-white hover:bg-leaf disabled:opacity-55 sm:min-w-28"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Add
        </button>
      </form>

      {message ? (
        <p aria-live="polite" className="mt-3 rounded-2xl bg-paper px-4 py-3 text-sm font-semibold text-ink/65">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {recommendations.length === 0 ? (
          <div className="rounded-2xl bg-paper px-4 py-5 text-sm font-semibold text-ink/55">
            No recommendations yet.
          </div>
        ) : (
          recommendations.slice(0, 5).map((recommendation) => (
            <article key={recommendation.id} className="rounded-2xl bg-paper p-3">
              <p className="text-sm font-semibold text-ink">
                {recommendation.profile?.display_name ?? "Someone"} recommends "{recommendation.title}"
              </p>
              {recommendation.note ? <p className="mt-1 text-sm leading-5 text-ink/58">{recommendation.note}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
