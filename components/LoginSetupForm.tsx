"use client";

import { useState } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import type { Profile } from "@/lib/types";

export function LoginSetupForm({ profile }: { profile: Profile }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/setup-login", {
      method: "POST",
      body: formData
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not save login.");
      setBusy(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <section className="app-surface-strong w-full max-w-md rounded-[2rem] p-5">
      <div className="brand-gradient mb-4 grid size-14 place-items-center rounded-3xl text-black">
        <KeyRound className="size-6" aria-hidden />
      </div>
      <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
        Link this profile
      </p>
      <h1 className="display-font mt-1 text-5xl font-extrabold text-app">{profile.display_name}</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Create a username and password for this profile so you can log in from any device.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <Field label="Username" name="username" autoComplete="username" />
        <Field label="Password" name="password" type="password" autoComplete="new-password" />
        <Field label="Confirm password" name="confirm_password" type="password" autoComplete="new-password" />
        <label className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-app" style={{ background: "var(--surface-soft)" }}>
          <input name="save_login" type="checkbox" defaultChecked className="size-4 accent-[var(--brand)]" />
          Save login on this device
        </label>
        {error ? (
          <p aria-live="polite" className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}
        <button
          disabled={busy}
          className="app-button brand-gradient flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save login
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        className="min-h-12 w-full rounded-2xl border px-4 text-base text-app outline-none placeholder:text-muted focus:ring-4"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      />
    </label>
  );
}
