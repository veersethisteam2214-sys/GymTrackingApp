import Link from "next/link";
import { Settings, UserRound } from "lucide-react";
import { FeedbackPromptModal } from "@/components/FeedbackPromptModal";
import { HeaderClock } from "@/components/HeaderClock";
import { NotificationBell } from "@/components/NotificationBell";
import { StreakBreakModal } from "@/components/StreakBreakModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TodayReminder } from "@/components/TodayReminder";
import { TopNavLinks } from "@/components/TopNavLinks";
import { UpdateAnnouncementModal } from "@/components/UpdateAnnouncementModal";
import { fetchStreakBreakNotice, fetchTodayCompletionSummary } from "@/lib/data";
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
  const [{ notifications, unreadCount }, announcement, streakBreakNotice, feedbackPrompt, todayCompletion] =
    profile && supabase
      ? await Promise.all([
          fetchNotificationCenter(supabase, profile.id),
          getActiveAnnouncement(supabase, profile.id),
          fetchStreakBreakNotice(supabase, profile.id),
          getFeedbackPromptForProfile(supabase, profile.id),
          fetchTodayCompletionSummary(supabase, profile.id)
        ])
      : [{ notifications: [], unreadCount: 0 }, null, null, null, null];

  return (
    <div className="min-h-screen pb-8">
      <a href="#main-content" className="skip-link">
        Skip To Content
      </a>
      <header className="atelier-chrome sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="relative grid size-10 shrink-0 place-items-center rounded-xl sm:size-11"
              style={{ background: "rgba(216, 195, 154, 0.12)", border: "1px solid rgba(216, 195, 154, 0.3)" }}
              aria-hidden
            >
              <span className="display-font text-xl italic sm:text-2xl" style={{ color: "var(--brand)" }}>
                L
              </span>
            </div>
            <div className="min-w-0">
              <p className="display-font truncate text-xl leading-tight tracking-[-0.01em] sm:text-2xl" style={{ color: "var(--chrome-ink)" }}>
                Locked In
              </p>
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                {title}
                {subtitle ? <span className="hidden sm:inline"> · {subtitle}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:block">
              <HeaderClock />
            </div>
            <ThemeToggle />
            {profile ? <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} /> : null}
            <ProfileButton profile={profile} />
          </div>
        </div>
      </header>
      <TopNavLinks />
      <UpdateAnnouncementModal announcement={announcement} />
      {profile ? <TodayReminder completion={todayCompletion} /> : null}
      {profile ? <StreakBreakModal notice={streakBreakNotice} profileId={profile.id} /> : null}
      {profile ? <FeedbackPromptModal prompt={feedbackPrompt} /> : null}
      <main id="main-content" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-32 pt-6">
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
