import { Settings } from "lucide-react";

export function SetupMissing() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-soft backdrop-blur">
        <div className="mb-5 flex size-14 items-center justify-center rounded-3xl bg-sun/20 text-ink">
          <Settings className="size-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Supabase setup needed</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Add the Supabase environment variables listed in the README, then restart the app. The UI and routes are ready;
          they need the private backend connection before sign-in and uploads can work.
        </p>
      </section>
    </main>
  );
}

