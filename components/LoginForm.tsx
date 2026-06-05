"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Mail, KeyRound } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm({ mode, message }: { mode?: string; message?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [error, setError] = useState(message ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (!supabase) {
      setError("Supabase environment variables are not configured yet.");
      setBusy(false);
      return;
    }

    const authCall = isSignUp
      ? supabase.auth.signUp({ email, password })
      : supabase.auth.signInWithPassword({ email, password });
    const { error: authError } = await authCall;

    if (authError) {
      setError(authError.message);
      setBusy(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur">
      <div className="mb-6">
        <div className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-ink text-white shadow-soft">
          <Dumbbell className="size-7" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-normal text-ink">Daily discipline</h1>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          Private sign-in for the two approved training partners.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Email</span>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/15">
            <Mail className="size-5 text-ink/40" aria-hidden />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="w-full bg-transparent text-base outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Password</span>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/15">
            <KeyRound className="size-5 text-ink/40" aria-hidden />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
              className="w-full bg-transparent text-base outline-none"
            />
          </div>
        </label>
        {error ? (
          <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay">{error}</p>
        ) : null}
        <button
          disabled={busy}
          className="app-button min-h-12 w-full rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-leaf focus:outline-none focus:ring-4 focus:ring-leaf/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Checking..." : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>
      <button
        onClick={() => {
          setIsSignUp((value) => !value);
          setError("");
        }}
        className="app-button mt-4 min-h-11 w-full rounded-2xl border border-ink/10 bg-white px-5 text-sm font-semibold text-ink hover:border-leaf/40 hover:bg-mint/60"
      >
        {isSignUp ? "Use existing account" : "Create approved account"}
      </button>
    </section>
  );
}

