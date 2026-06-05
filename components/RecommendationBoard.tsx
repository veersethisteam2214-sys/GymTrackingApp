"use client";

import { useRef, useState } from "react";
import { ImagePlus, Lightbulb, Link as LinkIcon, Loader2, Send } from "lucide-react";
import type { Profile, Recommendation } from "@/lib/types";

export function RecommendationBoard({
  initialRecommendations,
  currentProfile
}: {
  initialRecommendations: Recommendation[];
  currentProfile: Profile;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const formData = new FormData();
    formData.set("title", title);
    formData.set("category", category);
    formData.set("link_url", linkUrl);
    formData.set("note", note);
    if (photo) formData.set("photo", photo);

    const response = await fetch("/api/recommendations", {
      method: "POST",
      body: formData
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
        signedUrl: preview,
        profile: currentProfile
      },
      ...recommendations
    ]);
    setTitle("");
    setCategory("");
    setLinkUrl("");
    setNote("");
    setPhoto(null);
    setPreview(null);
    setMessage("Recommendation added.");
    setBusy(false);
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <section className="app-surface reveal-in mt-5 rounded-[2rem] p-5">
      <div className="flex items-start gap-3">
        <div className="brand-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-black">
          <Lightbulb className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Recommendations
          </p>
          <h2 className="text-2xl font-extrabold text-app">Recommend anything useful</h2>
          <p className="mt-1 text-sm text-muted">Books, gear, videos, supplements, apps, meals, or anything worth sharing.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-3 lg:grid-cols-[1fr_16rem]">
        <div className="grid gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Recommendation title"
            className="min-h-12 rounded-2xl border bg-transparent px-4 text-sm font-bold text-app outline-none placeholder:text-muted focus:ring-4"
            style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category, e.g. book / gear"
              className="min-h-12 rounded-2xl border bg-transparent px-4 text-sm text-app outline-none placeholder:text-muted focus:ring-4"
              style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
            />
            <input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="Optional link"
              className="min-h-12 rounded-2xl border bg-transparent px-4 text-sm text-app outline-none placeholder:text-muted focus:ring-4"
              style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
            />
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why should the group check it out?"
            className="min-h-24 resize-none rounded-2xl border bg-transparent px-4 py-3 text-sm text-app outline-none placeholder:text-muted focus:ring-4"
            style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
          />
        </div>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="app-button relative flex min-h-32 items-center justify-center overflow-hidden rounded-3xl border"
            style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-center text-sm font-extrabold text-muted">
                <ImagePlus className="mx-auto mb-2 size-6" aria-hidden />
                Optional photo
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={(event) => choosePhoto(event.target.files?.[0])}
          />
          <button
            disabled={busy}
            className="app-button brand-gradient flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-black hover:scale-[1.01] disabled:opacity-55"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Add
          </button>
        </div>
      </form>

      {message ? (
        <p aria-live="polite" className="mt-3 rounded-2xl px-4 py-3 text-sm font-bold text-muted" style={{ background: "var(--surface-soft)" }}>
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recommendations.length === 0 ? (
          <div className="rounded-3xl p-5 text-sm font-bold text-muted" style={{ background: "var(--surface-soft)" }}>
            No recommendations yet.
          </div>
        ) : (
          recommendations.slice(0, 8).map((recommendation) => (
            <article key={recommendation.id} className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
              {recommendation.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={recommendation.signedUrl} alt="" className="h-32 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
                  {recommendation.profile?.display_name ?? "Someone"}
                  {recommendation.category ? ` / ${recommendation.category}` : ""}
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-app">{recommendation.title}</h3>
                {recommendation.note ? <p className="mt-2 text-sm leading-5 text-muted">{recommendation.note}</p> : null}
                {recommendation.link_url ? (
                  <a
                    href={recommendation.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="app-button mt-3 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold"
                    style={{ background: "var(--surface-soft)", color: "var(--text)" }}
                  >
                    <LinkIcon className="size-3.5" aria-hidden />
                    Open link
                  </a>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
