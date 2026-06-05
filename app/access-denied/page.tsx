import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/88 p-6 text-center shadow-soft backdrop-blur">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-clay/10 text-clay">
          <ShieldAlert className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          This tracker is private. Sign in with one of the two emails listed in
          <span className="font-medium text-ink"> ALLOWED_EMAILS</span>.
        </p>
        <Link
          href="/login"
          className="app-button mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-soft hover:bg-leaf focus:outline-none focus:ring-4 focus:ring-leaf/20"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}

