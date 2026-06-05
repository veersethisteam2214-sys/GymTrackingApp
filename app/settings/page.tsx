import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProfileSetupForm } from "@/components/ProfileSetupForm";
import { SetupMissing } from "@/components/SetupMissing";
import { requireAppProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAppProfile();
  if (session.setupMissing || !session.supabase || !session.profile) return <SetupMissing />;

  return (
    <AppShell title="Settings" subtitle="Private account controls" profile={session.profile}>
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-mint text-leaf">
            <UserRound className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-ink">{session.profile.display_name}</h2>
            <p className="truncate text-sm text-ink/55">Password-protected profile</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 text-leaf" aria-hidden />
            <p className="text-sm leading-6 text-ink/64">
              Access is protected by the shared app password. Your app profile is saved after you press Save profile.
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
      <div className="mt-4">
        <ProfileSetupForm profile={session.profile} />
      </div>
    </AppShell>
  );
}
