"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Flag, Home, LineChart, Settings, Trophy, UploadCloud } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: UploadCloud },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Stats", icon: LineChart },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Flag },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function TopNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-3xl p-1" style={{ background: "var(--surface-soft)" }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="app-button inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-3 text-xs font-extrabold sm:px-4 sm:text-sm"
            style={{
              background: active ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "transparent",
              color: active ? "var(--bg)" : "var(--muted)"
            }}
          >
            <span className="grid size-7 place-items-center rounded-xl" style={{ background: active ? "rgba(0,0,0,.1)" : "var(--surface-soft)" }}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
