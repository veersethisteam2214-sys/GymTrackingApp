"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, Home, LineChart, Settings, Trophy, UploadCloud } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/today", label: "Today", icon: UploadCloud },
  { href: "/analytics", label: "Stats", icon: LineChart },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Flag },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function TopNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="grid w-full grid-cols-6 gap-1 rounded-3xl p-1 lg:w-auto" style={{ background: "var(--surface-soft)" }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="app-button flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-extrabold leading-none sm:min-h-11 sm:flex-row sm:px-2 sm:text-xs xl:px-3"
            style={{
              background: active ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "transparent",
              color: active ? "var(--bg)" : "var(--muted)"
            }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-xl" style={{ background: active ? "rgba(0,0,0,.1)" : "var(--surface-soft)" }}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="w-full truncate text-center sm:w-auto">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
