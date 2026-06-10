import Link from "next/link";
import { LockKeyhole, Settings, UserRound } from "lucide-react";
import { FeedbackPromptModal } from "@/components/FeedbackPromptModal";
import { HeaderClock } from "@/components/HeaderClock";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakBreakModal } from "@/components/StreakBreakModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TodayReminder } from "@/components/TodayReminder";
import { TopNavLinks } from "@/components/TopNavLinks";
import { UpdateAnnouncementModal } from "@/components/UpdateAnnouncementModal";
import { fetchStreakBreakNotice } from "@/lib/data";
import { getFeedbackPromptForProfile } from "@/lib/feedback";
import { fetchNotificationCenter, getActiveAnnouncement } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function AppShell({
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
  const supabase = profile ? createAdminSupabase() : null;
  const [{ notifications, unreadCount }, announcement, streakBreakNotice, feedbackPrompt] =
    profile && supabase
      ? await Promise.all([
          fetchNotificationCenter(supabase, profile.id),
          getActiveAnnouncement(supabase, profile.id),
          fetchStreakBreakNotice(supabase, profile.id),
          getFeedbackPromptForProfile(supabase, profile.id)
        ])
      : [{ notifications: [], unreadCount: 0 }, null, null, null];

  return (
    <div className="min-h-screen pb-8">
      <a href="#main-content" className="skip-link">
        Skip To Content
      </a>
      <header className="sticky top-0 z-30 border-b backdrop-blur-2xl" style={{ borderColor: "var(--faint)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="brand-gradient relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-black shadow-soft sm:size-12"
                aria-hidden
              >
                <div className="absolute inset-0 bg-white/18" />
                <LockKeyhole className="relative z-10 size-5 drop-shadow-sm sm:size-6" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <p className="display-font truncate text-2xl font-extrabold uppercase leading-none tracking-[0.16em] sm:text-3xl" style={{ color: "var(--brand)" }}>
                  LOCKED IN
                </p>
                <h1 className="truncate text-xl font-extrabold text-app">{title}</h1>
                {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              {profile ? <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} /> : null}
              <ProfileButton profile={profile} />
            </div>
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto">
            <TopNavLinks />
            <div className="hidden items-center gap-2 lg:flex">
              <HeaderClock />
              <ThemeToggle />
              {profile ? <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} /> : null}
              <ProfileButton profile={profile} />
            </div>
          </div>
        </div>
      </header>
      <UpdateAnnouncementModal announcement={announcement} />
      {profile ? <TodayReminder /> : null}
      {profile ? <StreakBreakModal notice={streakBreakNotice} profileId={profile.id} /> : null}
      {profile ? <FeedbackPromptModal prompt={feedbackPrompt} /> : null}
      <main id="main-content" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function ProfileButton({ profile }: { profile?: Profile | null }) {
  if (!profile) return null;

  return (
    <details className="group relative shrink-0">
      <summary
        className="app-button relative grid size-11 cursor-pointer list-none place-items-center overflow-hidden rounded-2xl border text-sm font-black shadow-sm [&::-webkit-details-marker]:hidden"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)", color: "var(--text)" }}
        title="Open profile menu"
      >
        {profile.avatarSignedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          profile.display_name.slice(0, 1).toUpperCase()
        )}
      </summary>
      <div
        className="absolute right-0 top-14 z-50 w-56 rounded-3xl p-2 shadow-soft"
        style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)" }}
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-extrabold text-app">{profile.display_name}</p>
          <p className="truncate text-xs font-bold text-muted">{profile.username ?? "Profile menu"}</p>
        </div>
        <Link
          href="/profile-setup"
          className="app-button flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold"
          style={{ color: "var(--text)" }}
        >
          <UserRound className="size-4" aria-hidden />
          Edit your profile
        </Link>
        <Link
          href="/settings"
          className="app-button mt-1 flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold"
          style={{ color: "var(--text)" }}
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Link>
      </div>
    </details>
  );
}
