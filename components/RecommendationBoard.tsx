"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown, ImagePlus, Lightbulb, Link as LinkIcon, Loader2, Send, Users } from "lucide-react";
import type { Profile, Recommendation } from "@/lib/types";

export function RecommendationBoard({
  initialRecommendations,
  currentProfile,
  profiles
}: {
  initialRecommendations: Recommendation[];
  currentProfile: Profile;
  profiles: Profile[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [note, setNote] = useState("");
  const [audienceType, setAudienceType] = useState<"everyone" | "specific">("everyone");
  const [targetProfileIds, setTargetProfileIds] = useState<string[]>([]);
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
    formData.set("audience_type", audienceType);
    if (audienceType === "specific") {
      targetProfileIds.forEach((profileId) => formData.append("target_profile_ids", profileId));
    }
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
    setAudienceType("everyone");
    setTargetProfileIds([]);
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

  function toggleTarget(profileId: string) {
    setTargetProfileIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId]
    );
  }

  return (
    <section className="app-surface reveal-in mt-5 overflow-hidden rounded-[2rem]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="app-button flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-white/5"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="brand-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-black">
            <Lightbulb className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Recommendations
            </p>
            <h2 className="text-2xl font-extrabold text-app">Tap to add or view recommendations</h2>
            <p className="mt-1 text-sm text-muted">
              {recommendations.length} saved / title-only until opened
            </p>
          </div>
        </div>
        <ChevronDown className={`size-5 shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {isOpen ? (
        <div className="border-t p-5" style={{ borderColor: "var(--faint)" }}>
          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_16rem]">
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
                  placeholder="Category, e.g. gear / meal / video"
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
              <div className="rounded-3xl border p-3" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
                <div className="mb-3 flex items-center gap-2">
                  <Users className="size-4" style={{ color: "var(--brand)" }} aria-hidden />
                  <p className="text-sm font-extrabold text-app">Send recommendation to</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AudienceButton
                    active={audienceType === "everyone"}
                    label="Everyone"
                    helper="All users see the notification."
                    onClick={() => {
                      setAudienceType("everyone");
                      setTargetProfileIds([]);
                    }}
                  />
                  <AudienceButton
                    active={audienceType === "specific"}
                    label="Specific users"
                    helper="Only selected users get notified."
                    onClick={() => setAudienceType("specific")}
                  />
                </div>
                {audienceType === "specific" ? (
                  <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {profiles.map((profile) => {
                      const selected = targetProfileIds.includes(profile.id);
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => toggleTarget(profile.id)}
                          className="app-button flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-left"
                          style={{
                            borderColor: selected ? "var(--brand)" : "var(--faint)",
                            background: selected ? "color-mix(in srgb, var(--brand) 12%, var(--surface-strong))" : "var(--surface-soft)"
                          }}
                        >
                          <span
                            className="grid size-6 shrink-0 place-items-center rounded-lg"
                            style={{ background: selected ? "var(--brand)" : "var(--surface-soft)", color: selected ? "var(--bg)" : "var(--muted)" }}
                          >
                            {selected ? <Check className="size-4" aria-hidden /> : null}
                          </span>
                          <span className="min-w-0 truncate text-sm font-bold text-app">{profile.display_name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
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
                disabled={busy || (audienceType === "specific" && targetProfileIds.length === 0)}
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

          <div className="mt-5 grid gap-2">
            {recommendations.length === 0 ? (
              <div className="rounded-3xl p-5 text-sm font-bold text-muted" style={{ background: "var(--surface-soft)" }}>
                No recommendations yet.
              </div>
            ) : (
              recommendations.slice(0, 8).map((recommendation) => {
                const expanded = expandedId === recommendation.id;
                return (
                  <article key={recommendation.id} className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : recommendation.id)}
                      className="app-button flex w-full items-center justify-between gap-3 p-4 text-left"
                      aria-expanded={expanded}
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-app">{recommendation.title}</h3>
                        <p className="mt-1 truncate text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
                          {recommendation.profile?.display_name ?? "Someone"}
                          {recommendation.category ? ` / ${recommendation.category}` : ""}
                          {recommendation.audience_type === "specific" ? " / selected users" : " / everyone"}
                        </p>
                      </div>
                      <ChevronDown className={`size-4 shrink-0 text-muted transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                    {expanded ? (
                      <div className="border-t p-4" style={{ borderColor: "var(--faint)" }}>
                        {recommendation.signedUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={recommendation.signedUrl} alt="" className="mb-3 h-40 w-full rounded-3xl object-cover" />
                        ) : null}
                        {recommendation.note ? <p className="text-sm leading-5 text-muted">{recommendation.note}</p> : null}
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
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AudienceButton({
  active,
  label,
  helper,
  onClick
}: {
  active: boolean;
  label: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="app-button rounded-2xl border p-3 text-left"
      style={{
        borderColor: active ? "var(--brand)" : "var(--faint)",
        background: active ? "color-mix(in srgb, var(--brand) 12%, var(--surface-strong))" : "var(--surface-soft)"
      }}
    >
      <span className="text-sm font-extrabold text-app">{label}</span>
      <span className="mt-1 block text-xs font-bold text-muted">{helper}</span>
    </button>
  );
}
