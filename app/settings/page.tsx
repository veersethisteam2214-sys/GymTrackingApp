import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { SetupMissing } from "@/components/SetupMissing";
import { ThemeToggle } from "@/components/ThemeToggle";
import { requireAppProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  return (
    <AppShell title="Settings" subtitle="Private account controls" profile={session.profile}>
      <section className="app-surface rounded-[2rem] p-5">
        <div className="flex items-center gap-3">
          <div className="brand-gradient grid size-12 place-items-center rounded-2xl text-black">
            <UserRound className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-app">{session.profile.display_name}</h2>
            <p className="truncate text-sm text-muted">Password-protected profile</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-leaf" aria-hidden />
            <p className="text-sm leading-6 text-muted">
              Your profile is protected by your username and password. Your app profile is saved after you press Save profile.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
          <div>
            <h3 className="font-extrabold text-app">Appearance</h3>
            <p className="text-sm text-muted">Switch between dark and light theme.</p>
          </div>
          <ThemeToggle />
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="app-button mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold shadow-soft" style={{ background: "var(--danger)", color: "white" }}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </form>
      </section>
      <div className="mt-4">
        <ProfileSetupForm profile={session.profile} />
      </div>
    </AppShell>
  );
}
