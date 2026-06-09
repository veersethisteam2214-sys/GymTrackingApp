"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Save, UserCog, X } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import type { Profile } from "@/lib/types";

export function CredentialSettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/auth/update-credentials", {
      method: "POST",
      body: new FormData(event.currentTarget)
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Could not update login.");
      setBusy(false);
      return;
    }

    setSuccess("Login updated.");
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="app-surface rounded-[2rem] p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="brand-gradient grid size-12 place-items-center rounded-2xl text-black">
          <UserCog className="size-6" aria-hidden />
        </div>
        <div>
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.22em]" style={{ color: "var(--brand)" }}>
            Login controls
          </p>
          <h2 className="text-xl font-extrabold text-app">Username and password</h2>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-app">Username</span>
          <input
            name="username"
            defaultValue={profile.username ?? ""}
            required
            autoComplete="username"
            className="min-h-12 w-full rounded-2xl border px-4 text-base text-app outline-none placeholder:text-muted focus:ring-4"
            style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
          />
        </label>
        <PasswordInput label="Old password" name="current_password" autoComplete="current-password" />
        <PasswordInput label="New password" name="new_password" autoComplete="new-password" required={false} placeholder="Leave blank to keep current password" />
        <PasswordInput label="Confirm new password" name="confirm_password" autoComplete="new-password" required={false} />

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="app-button inline-flex min-h-10 items-center gap-2 rounded-2xl px-3 text-sm font-extrabold text-muted"
          style={{ background: "var(--surface-soft)" }}
        >
          <KeyRound className="size-4" aria-hidden />
          Forgot password?
        </button>

        {error ? (
          <p aria-live="polite" className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
            {error}
          </p>
        ) : null}
        {success ? (
          <p aria-live="polite" className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "color-mix(in srgb, var(--brand) 16%, transparent)", color: "var(--brand)" }}>
            {success}
          </p>
        ) : null}

        <button
          disabled={busy}
          className="app-button brand-gradient flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save login changes
        </button>
      </form>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <section className="reveal-in w-full max-w-sm rounded-[2rem] p-5 text-center" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}>
            <button
              onClick={() => setForgotOpen(false)}
              className="app-button ml-auto grid size-10 place-items-center rounded-2xl"
              style={{ background: "var(--surface-soft)", color: "var(--text)" }}
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
            <p className="display-font text-5xl font-extrabold text-app">Please contact Veer</p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
