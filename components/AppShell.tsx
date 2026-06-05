import Link from "next/link";
import { CalendarDays, Dumbbell, Home, LineChart, Settings, UploadCloud } from "lucide-react";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: UploadCloud },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Stats", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

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
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-paper/84 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white shadow-soft">
              <Dumbbell className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
                Discipline Tracker
              </p>
              <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-ink/55">{subtitle}</p> : null}
            </div>
          </div>
          {profile ? (
            <Link
              href={`/user/${profile.id}`}
              className="app-button relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-white text-sm font-bold text-ink shadow-sm hover:border-leaf/40 hover:bg-mint/70"
              title={profile.display_name}
            >
              {profile.avatarSignedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                profile.display_name.slice(0, 1).toUpperCase()
              )}
            </Link>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5">{children}</main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink/8 bg-white/92 px-2 pt-2 shadow-[0_-12px_30px_rgba(21,35,30,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="app-button flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-ink/58 hover:bg-mint hover:text-leaf focus:outline-none focus:ring-4 focus:ring-leaf/15"
              >
                <Icon className="size-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <aside className="fixed bottom-5 left-1/2 z-30 hidden -translate-x-1/2 rounded-3xl border border-white/70 bg-white/92 p-2 shadow-soft backdrop-blur-xl lg:block">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="app-button flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-ink/64 hover:bg-mint hover:text-leaf"
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
