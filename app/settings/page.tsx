import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAllowedUser } from "@/lib/auth";
import { ensureProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAllowedUser();
  if (session.setupMissing || !session.supabase || !session.user) return <SetupMissing />;
  const profile = await ensureProfile(session.supabase, session.user);

  return (
    <AppShell title="Settings" subtitle="Private account controls" profile={profile}>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-mint text-leaf">
            <UserRound className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-ink">{profile?.display_name ?? "Profile"}</h2>
            <p className="truncate text-sm text-ink/55">{session.user.email}</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-leaf" aria-hidden />
            <p className="text-sm leading-6 text-ink/64">
              Access is protected by the shared app password, Supabase Auth, the allowlisted emails variable, and
              Supabase Row Level Security policies.
            </p>
          </div>
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="app-button mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-soft hover:bg-clay">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </section>
    </AppShell>
  );
}

