import { LockKeyhole } from "lucide-react";

export function AccessForm({ hasError, nextPath }: { hasError: boolean; nextPath: string }) {
  return (
    <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-soft backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-mint text-leaf">
          <LockKeyhole className="size-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Private access</h1>
          <p className="text-sm text-ink/60">Enter the shared app password.</p>
        </div>
      </div>
      <form action="/api/access" method="post" className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/15"
          />
        </label>
        {hasError ? (
          <p className="rounded-2xl bg-clay/10 px-4 py-3 text-sm font-medium text-clay">
            That password did not match.
          </p>
        ) : null}
        <button className="app-button min-h-12 w-full rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-leaf focus:outline-none focus:ring-4 focus:ring-leaf/20">
          Continue
        </button>
      </form>
    </section>
  );
}

