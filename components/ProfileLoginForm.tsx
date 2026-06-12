"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
    <section className="w-full">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Member name" name="username" autoComplete="username" />
        <PasswordInput label="Passphrase" name="password" autoComplete="current-password" />
        <label className="app-surface flex items-center gap-3 rounded-[15px] px-4 py-3.5 text-sm font-semibold text-app">
          <input name="save_login" type="checkbox" defaultChecked className="size-4 accent-[var(--accent)]" />
          Save login on this device
        </label>
        {error ? (
          <p
            aria-live="polite"
            className="rounded-[15px] px-4 py-3 text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}
          >
            {error}
          </p>
        ) : null}
        <button
          disabled={busy}
          className="a-btn brand-gradient display-font flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[15px] px-5 text-lg italic disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Enter the room
        </button>
      </form>
      <Link href="/profile-setup" className="mt-5 block text-center text-sm font-semibold" style={{ color: "var(--muted)" }}>
        Request a seat — create a profile
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
      <span className="mb-2 block text-sm font-semibold text-app">{label}</span>
      <input
        name={name}
        required
        autoComplete={autoComplete}
        className="app-surface min-h-[52px] w-full rounded-[15px] px-4 text-base text-app outline-none placeholder:text-muted focus:ring-2"
      />
    </label>
  );
}
