"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

export function ProfileLoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: formData
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not log in.");
      setBusy(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <section className="app-surface-strong w-full max-w-md rounded-[2rem] p-5">
      <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
        Profile login
      </p>
      <h1 className="display-font mt-1 text-5xl font-extrabold text-app">Use your profile</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Log in with your profile username and password on any device.</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <Field label="Username" name="username" autoComplete="username" />
        <PasswordInput label="Password" name="password" autoComplete="current-password" />
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
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Log in
        </button>
      </form>
      <Link href="/profile-setup" className="mt-4 block text-center text-sm font-bold text-muted">
        Create a new profile
      </Link>
    </section>
  );
}

function Field({
  label,
  name,
  autoComplete
}: {
  label: string;
  name: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-app">{label}</span>
      <input
        name={name}
        required
        autoComplete={autoComplete}
        className="min-h-12 w-full rounded-2xl border px-4 text-base text-app outline-none placeholder:text-muted focus:ring-4"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
      />
    </label>
  );
}
