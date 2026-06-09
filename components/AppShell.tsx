import Link from "next/link";
import { HeaderClock } from "@/components/HeaderClock";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TodayReminder } from "@/components/TodayReminder";
import { TopNavLinks } from "@/components/TopNavLinks";
import type { Profile } from "@/lib/types";

export function AppShell({
  children,
  title,
  subtitle,
  profile
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  profile?: Profile | null;
}) {
  return (
    <div className="min-h-screen pb-8">
      <a href="#main-content" className="skip-link">
        Skip To Content
      </a>
      <header className="sticky top-0 z-30 border-b backdrop-blur-2xl" style={{ borderColor: "var(--faint)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="display-font truncate text-xl font-extrabold uppercase leading-none tracking-[0.18em] sm:text-2xl" style={{ color: "var(--brand)" }}>
                  Discipline Tracker
                </p>
                <h1 className="truncate text-xl font-extrabold text-app">{title}</h1>
                {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <HeaderClock />
              <ThemeToggle />
              <ProfileButton profile={profile} />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <TopNavLinks />
            <div className="hidden items-center gap-2 lg:flex">
              <HeaderClock />
              <ThemeToggle />
              <ProfileButton profile={profile} />
            </div>
          </div>
        </div>
      </header>
      {profile ? <TodayReminder /> : null}
      <main id="main-content" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function ProfileButton({ profile }: { profile?: Profile | null }) {
  if (!profile) return null;

  return (
    <Link
      href="/settings"
      className="app-button relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border text-sm font-black shadow-sm"
      style={{ borderColor: "var(--faint)", background: "var(--surface-soft)", color: "var(--text)" }}
      title="Open settings"
    >
      {profile.avatarSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        profile.display_name.slice(0, 1).toUpperCase()
      )}
    </Link>
  );
}
