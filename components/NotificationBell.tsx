"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Sparkles } from "lucide-react";
import type { GroupNotification } from "@/lib/types";

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount
}: {
  initialNotifications: GroupNotification[];
  initialUnreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    async function refresh() {
      const response = await fetch("/api/notifications").catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json().catch(() => null)) as
        | { notifications?: GroupNotification[]; unreadCount?: number }
        | null;
      if (!payload?.notifications) return;
      setNotifications(payload.notifications);
      setUnreadCount(Number(payload.unreadCount ?? 0));
    }

    const timer = window.setInterval(refresh, 45_000);
    return () => window.clearInterval(timer);
  }, []);

  async function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      await fetch("/api/notifications/read", { method: "POST" }).catch(() => null);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={toggleOpen}
        className="app-button relative grid size-11 place-items-center rounded-2xl border shadow-sm"
        style={{ borderColor: "var(--faint)", background: "var(--surface-soft)", color: "var(--text)" }}
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 size-3 rounded-full border-2 border-white bg-red-500" aria-label={`${unreadCount} unread notifications`} />
        ) : null}
      </button>

      {open ? (
        <section
          className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-3xl p-3 shadow-soft"
          style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-extrabold text-app">Notifications</h2>
              <p className="text-xs font-bold text-muted">Uploads, data, and recommendations</p>
            </div>
            <span className="grid size-9 place-items-center rounded-2xl" style={{ background: "var(--surface-soft)", color: "var(--brand)" }}>
              <Sparkles className="size-4" aria-hidden />
            </span>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="rounded-2xl p-4 text-sm font-bold text-muted" style={{ background: "var(--surface-soft)" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-2xl p-3"
                  style={{
                    background: notification.read ? "var(--surface-soft)" : "color-mix(in srgb, var(--brand) 13%, var(--surface-soft))",
                    border: notification.read ? "1px solid var(--faint)" : "1px solid color-mix(in srgb, var(--brand) 42%, transparent)"
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar notification={notification} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-extrabold text-app">{notification.title}</h3>
                        {notification.read ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">{notification.body}</p>
                      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Avatar({ notification }: { notification: GroupNotification }) {
  const name = notification.actor?.display_name ?? "U";

  return (
    <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl brand-gradient text-sm font-black text-black">
      {notification.actor?.avatarSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={notification.actor.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}
