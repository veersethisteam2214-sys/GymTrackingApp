"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, Home, LineChart, Trophy, UploadCloud } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/today", label: "Uploads", icon: UploadCloud },
  { href: "/analytics", label: "Stats", icon: LineChart },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
  { href: "/challenges", label: "Challenges", icon: Flag }
];

export function TopNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="atelier-pill pointer-events-auto flex gap-1 rounded-full p-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`app-button flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold tracking-[0.02em] sm:px-4 ${active ? "brand-gradient" : ""}`}
              style={
                active
                  ? undefined
                  : { color: "rgba(244, 237, 227, 0.6)", background: "transparent", border: "1px solid transparent" }
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className={active ? "" : "hidden min-[420px]:inline"}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
