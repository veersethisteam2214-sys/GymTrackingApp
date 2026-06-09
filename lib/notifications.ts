import { CATEGORIES } from "@/lib/categories";
import { getSignedUrl } from "@/lib/data";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { CheckInCategory, FeatureAnnouncement, GroupNotification, Profile } from "@/lib/types";

type Supabase = NonNullable<ReturnType<typeof createAdminSupabase>>;

const ANNOUNCEMENT_ID = "2026-06-10-notifications-update";
const APP_TIME_ZONE = "Asia/Bangkok";

function getBangkokDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function isMissingTableError(error?: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || error?.message?.toLowerCase().includes("does not exist");
}

async function getProfileName(supabase: Supabase, profileId: string) {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", profileId).maybeSingle();
  return String(data?.display_name ?? "Someone");
}

export async function createUploadNotification(
  supabase: Supabase,
  actorProfileId: string,
  category: CheckInCategory,
  checkinDate: string
) {
  const categoryLabel = CATEGORIES.find((item) => item.id === category)?.shortLabel ?? "proof";
  const actorName = await getProfileName(supabase, actorProfileId);
  const { data, error } = await supabase
    .from("group_notifications")
    .insert({
      actor_profile_id: actorProfileId,
      notification_type: "upload",
      title: `${actorName} updated ${categoryLabel}`,
      body: `${actorName} uploaded ${categoryLabel} proof for ${checkinDate}.`,
      metadata: { category, checkin_date: checkinDate }
    })
    .select("id")
    .single();

  if (error && !isMissingTableError(error)) {
    console.error("Could not create upload notification:", error.message);
  }
  if (data?.id) await markSingleNotificationRead(supabase, actorProfileId, String(data.id));
}

export async function createRecommendationNotification(supabase: Supabase, actorProfileId: string, title: string) {
  const actorName = await getProfileName(supabase, actorProfileId);
  const { data, error } = await supabase
    .from("group_notifications")
    .insert({
      actor_profile_id: actorProfileId,
      notification_type: "recommendation",
      title: `${actorName} added a recommendation`,
      body: `${actorName} recommends: ${title}.`,
      metadata: { recommendation_title: title }
    })
    .select("id")
    .single();

  if (error && !isMissingTableError(error)) {
    console.error("Could not create recommendation notification:", error.message);
  }
  if (data?.id) await markSingleNotificationRead(supabase, actorProfileId, String(data.id));
}

export async function fetchNotificationCenter(
  supabase: Supabase,
  profileId: string
): Promise<{ notifications: GroupNotification[]; unreadCount: number }> {
  const { data: notifications, error } = await supabase
    .from("group_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    if (!isMissingTableError(error)) console.error("Could not load notifications:", error.message);
    return { notifications: [] as GroupNotification[], unreadCount: 0 };
  }

  const rows = (notifications ?? []) as Omit<GroupNotification, "actor" | "read">[];
  if (rows.length === 0) return { notifications: [] as GroupNotification[], unreadCount: 0 };

  const notificationIds = rows.map((notification) => notification.id);
  const actorIds = Array.from(
    new Set(rows.map((notification) => notification.actor_profile_id).filter((id): id is string => Boolean(id)))
  );

  const [{ data: reads }, { data: actors }] = await Promise.all([
    supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("profile_id", profileId)
      .in("notification_id", notificationIds),
    actorIds.length
      ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", actorIds)
      : Promise.resolve({ data: [] })
  ]);

  const readIds = new Set((reads ?? []).map((read) => String(read.notification_id)));
  const actorEntries = await Promise.all(
    ((actors ?? []) as Profile[]).map(async (profile): Promise<[string, Pick<Profile, "display_name" | "avatarSignedUrl">]> => [
        profile.id,
        {
          display_name: profile.display_name,
          avatarSignedUrl: await getSignedUrl(supabase, profile.avatar_url)
        }
      ])
  );
  const actorMap = new Map(actorEntries);

  const signedNotifications: GroupNotification[] = rows.map((notification) => ({
    ...notification,
    actor: notification.actor_profile_id ? actorMap.get(notification.actor_profile_id) ?? null : null,
    read: readIds.has(notification.id)
  }));

  return {
    notifications: signedNotifications,
    unreadCount: signedNotifications.filter((notification) => !notification.read).length
  };
}

export async function getActiveAnnouncement(supabase: Supabase, profileId: string) {
  const today = getBangkokDate();
  if (today !== "2026-06-10") return null;

  const { data: announcement, error } = await supabase
    .from("feature_announcements")
    .select("*")
    .eq("id", ANNOUNCEMENT_ID)
    .eq("active_on", today)
    .maybeSingle();

  if (error || !announcement) {
    if (error && !isMissingTableError(error)) console.error("Could not load announcement:", error.message);
    return null;
  }

  const { data: view } = await supabase
    .from("feature_announcement_views")
    .select("announcement_id")
    .eq("profile_id", profileId)
    .eq("announcement_id", ANNOUNCEMENT_ID)
    .maybeSingle();

  return view ? null : (announcement as FeatureAnnouncement);
}

export async function markNotificationsRead(supabase: Supabase, profileId: string) {
  const { data: notifications, error } = await supabase
    .from("group_notifications")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return;

  const rows = (notifications ?? []).map((notification) => ({
    notification_id: String(notification.id),
    profile_id: profileId
  }));

  if (rows.length > 0) {
    await supabase.from("notification_reads").upsert(rows, { onConflict: "notification_id,profile_id" });
  }
}

async function markSingleNotificationRead(supabase: Supabase, profileId: string, notificationId: string) {
  await supabase.from("notification_reads").upsert(
    {
      notification_id: notificationId,
      profile_id: profileId
    },
    { onConflict: "notification_id,profile_id" }
  );
}

export async function markAnnouncementSeen(supabase: Supabase, profileId: string, announcementId: string) {
  await supabase.from("feature_announcement_views").upsert(
    {
      announcement_id: announcementId,
      profile_id: profileId
    },
    { onConflict: "announcement_id,profile_id" }
  );
}
