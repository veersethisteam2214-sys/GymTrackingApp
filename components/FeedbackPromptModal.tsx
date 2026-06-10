"use client";

import { useState } from "react";
import { Lightbulb, Loader2, MessageSquareText, Send, X } from "lucide-react";
import type { FeedbackPrompt } from "@/lib/types";

export function FeedbackPromptModal({ prompt }: { prompt: FeedbackPrompt | null }) {
  const [open, setOpen] = useState(Boolean(prompt));
  const [responseText, setResponseText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!prompt || !open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = responseText.trim();
    if (!trimmed || busy || !prompt) return;

    setBusy(true);
    setError("");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt_id: prompt.id,
        response_text: trimmed
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not send feedback.");
      setBusy(false);
      return;
    }

    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-[58] flex items-end bg-black/60 p-3 backdrop-blur-md sm:items-center sm:justify-center">
      <section
        className="reveal-in relative w-full max-w-lg overflow-hidden rounded-[2rem] p-5"
        style={{
          background:
            "radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--brand) 26%, transparent), transparent 15rem), radial-gradient(circle at 90% 10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 16rem), var(--surface-strong)",
          border: "1px solid var(--faint)",
          boxShadow: "var(--shadow)"
        }}
      >
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="brand-gradient grid size-14 shrink-0 place-items-center rounded-3xl text-black shadow-soft">
              <MessageSquareText className="size-7" aria-hidden />
            </div>
            <div>
              <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
                Quick feedback
              </p>
              <h2 className="display-font mt-1 text-5xl font-extrabold leading-none text-app">Help improve LOCKED IN</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="app-button grid size-10 shrink-0 place-items-center rounded-2xl"
            style={{ background: "var(--surface-soft)", color: "var(--text)" }}
            aria-label="Close feedback prompt"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <p className="relative mt-4 text-sm font-bold leading-6 text-muted">{prompt.prompt_text}</p>

        <form onSubmit={submit} className="relative mt-4 space-y-3">
          <textarea
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
            autoFocus
            placeholder="Type your idea, issue, benchmark, or feature request..."
            className="min-h-32 w-full resize-none rounded-3xl border px-4 py-3 text-sm text-app outline-none placeholder:text-muted focus-visible:ring-4"
            style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
          />
          {error ? (
            <p
              aria-live="polite"
              className="rounded-2xl px-4 py-3 text-sm font-bold"
              style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}
            >
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="app-button min-h-12 rounded-2xl px-4 text-sm font-extrabold text-muted"
              style={{ background: "var(--surface-soft)" }}
            >
              Later
            </button>
            <button
              disabled={busy || responseText.trim().length < 2}
              className="app-button brand-gradient flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
              Send
            </button>
          </div>
        </form>

        <div className="relative mt-4 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--surface-soft)" }}>
          <Lightbulb className="size-4 shrink-0" style={{ color: "var(--brand)" }} aria-hidden />
          <p className="text-xs font-bold text-muted">Your answer goes privately to Veer Sethi only.</p>
        </div>
      </section>
    </div>
  );
}
