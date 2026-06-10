import { getCategoryById } from "@/lib/categories";
import { getSignedUrl } from "@/lib/data";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { CheckInCategory, FeatureAnnouncement, GroupNotification, Profile } from "@/lib/types";

type Supabase = NonNullable<ReturnType<typeof createAdminSupabase>>;

const ANNOUNCEMENT_ID = "2026-06-10-notifications-update";
const NEW_USER_ANNOUNCEMENT_ID = "new-user-overview-v1";
const SUNDAY_PROGRESS_PREFIX = "sunday-progress-reminder";
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

async function getProfile(supabase: Supabase, profileId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  return (data ?? null) as Profile | null;
}

function isMissingTargetColumnError(error?: { message?: string } | null) {
  return error?.message?.toLowerCase().includes("target_profile_id") ?? false;
}

function isSunday(dateString: string) {
  return new Date(`${dateString}T12:00:00`).getDay() === 0;
}

async function hasAnnouncementView(supabase: Supabase, profileId: string, announcementId: string) {
  const { data } = await supabase
    .from("feature_announcement_views")
    .select("announcement_id")
    .eq("profile_id", profileId)
    .eq("announcement_id", announcementId)
    .maybeSingle();

  return Boolean(data);
}

async function fetchAnnouncement(supabase: Supabase, announcementId: string) {
  const { data, error } = await supabase
    .from("feature_announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();

  if (error || !data) return null;
  return data as FeatureAnnouncement;
}

async function upsertSundayAnnouncement(supabase: Supabase, dateString: string) {
  const announcementId = `${SUNDAY_PROGRESS_PREFIX}-${dateString}`;
  const { data, error } = await supabase
    .from("feature_announcements")
    .upsert(
      {
        id: announcementId,
        title: "Sunday progress picture",
        body: "Today has an extra benchmark.\n\n- Complete gym attendance, cardio, weight, and protein as usual.\n- Also take your weekly progress picture.\n- Sunday is 5/5 instead of 4/4.",
        active_on: dateString
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error || !data) return null;
  return data as FeatureAnnouncement;
}

async function ensureTargetedSystemNotification(
  supabase: Supabase,
  profileId: string,
  key: string,
  title: string,
  body: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("group_notifications")
    .select("id")
    .eq("target_profile_id", profileId)
    .contains("metadata", { notice_key: key })
    .limit(1);

  if (existingError) {
    if (!isMissingTableError(existingError) && !isMissingTargetColumnError(existingError)) {
      console.error("Could not check targeted notification:", existingError.message);
    }
    return;
  }

  if ((existing ?? []).length > 0) return;

  const { error } = await supabase.from("group_notifications").insert({
    actor_profile_id: null,
    target_profile_id: profileId,
    notification_type: "system",
    title,
    body,
    metadata: { notice_key: key }
  });

  if (error && !isMissingTableError(error) && !isMissingTargetColumnError(error)) {
    console.error("Could not create targeted notification:", error.message);
  }
}

async function ensurePersonalNotifications(supabase: Supabase, profile: Profile) {
  const today = getBangkokDate();

  if (!(await hasAnnouncementView(supabase, profile.id, NEW_USER_ANNOUNCEMENT_ID))) {
    await ensureTargetedSystemNotification(
      supabase,
      profile.id,
      NEW_USER_ANNOUNCEMENT_ID,
      "Welcome to LOCKED IN",
      "Read the one-time app overview so you know how to use the tracker properly. For more information please ask 'Veer'."
    );
  }

  if (isSunday(today)) {
    await ensureTargetedSystemNotification(
      supabase,
      profile.id,
      `${SUNDAY_PROGRESS_PREFIX}-${today}`,
      "Sunday has 5 benchmarks",
      "Do the 4 normal benchmarks plus the weekly progress picture today."
    );
  }

  if (!profile.avatar_url) {
    await ensureTargetedSystemNotification(
      supabase,
      profile.id,
      "profile-photo-reminder-v1",
      "Add your profile picture",
      "Your profile does not have a photo yet. Open your profile settings and add one."
    );
  }
}

export async function createUploadNotification(
  supabase: Supabase,
  actorProfileId: string,
  category: CheckInCategory,
  checkinDate: string
) {
  const categoryLabel = getCategoryById(category)?.shortLabel ?? "proof";
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

export async function createChallengeNotification(
  supabase: Supabase,
  actorProfileId: string,
  challenge: { id: string; title: string; challenge_type?: string | null; start_date?: string | null; end_date?: string | null }
) {
  const actorName = await getProfileName(supabase, actorProfileId);
  const dateText =
    challenge.start_date && challenge.end_date
      ? ` from ${challenge.start_date} to ${challenge.end_date}`
      : challenge.start_date
        ? ` on ${challenge.start_date}`
        : "";
  const { data, error } = await supabase
    .from("group_notifications")
    .insert({
      actor_profile_id: actorProfileId,
      notification_type: "challenge",
      title: `${actorName} created a challenge`,
      body: `${actorName} added "${challenge.title}"${dateText}.`,
      metadata: {
        challenge_id: challenge.id,
        challenge_title: challenge.title,
        challenge_type: challenge.challenge_type ?? null,
        start_date: challenge.start_date ?? null,
        end_date: challenge.end_date ?? null
      }
    })
    .select("id")
    .single();

  if (error && !isMissingTableError(error)) {
    console.error("Could not create challenge notification:", error.message);
  }
  if (data?.id) await markSingleNotificationRead(supabase, actorProfileId, String(data.id));
}

export async function createProfileJoinedNotification(supabase: Supabase, actorProfileId: string, displayName: string) {
  const { data, error } = await supabase
    .from("group_notifications")
    .insert({
      actor_profile_id: actorProfileId,
      notification_type: "system",
      title: `Welcome new user: ${displayName}`,
      body: `${displayName} joined LOCKED IN.`,
      metadata: { notice_key: "user-joined", joined_profile_id: actorProfileId, joined_display_name: displayName }
    })
    .select("id")
    .single();

  if (error && !isMissingTableError(error)) {
    console.error("Could not create joined notification:", error.message);
  }
  if (data?.id) await markSingleNotificationRead(supabase, actorProfileId, String(data.id));
}

export async function fetchNotificationCenter(
  supabase: Supabase,
  profileId: string
): Promise<{ notifications: GroupNotification[]; unreadCount: number }> {
  const profile = await getProfile(supabase, profileId);
  if (profile) await ensurePersonalNotifications(supabase, profile);

  let { data: notifications, error } = await supabase
    .from("group_notifications")
    .select("*")
    .or(`target_profile_id.is.null,target_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error && isMissingTargetColumnError(error)) {
    const fallback = await supabase
      .from("group_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    notifications = fallback.data;
    error = fallback.error;
  }

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

  const newUserAnnouncement = await fetchAnnouncement(supabase, NEW_USER_ANNOUNCEMENT_ID);
  if (newUserAnnouncement && !(await hasAnnouncementView(supabase, profileId, NEW_USER_ANNOUNCEMENT_ID))) {
    return newUserAnnouncement;
  }

  if (isSunday(today)) {
    const sundayAnnouncement = await upsertSundayAnnouncement(supabase, today);
    if (sundayAnnouncement && !(await hasAnnouncementView(supabase, profileId, sundayAnnouncement.id))) {
      return sundayAnnouncement;
    }
  }

  if (today !== "2026-06-10") return null;

  const announcement = await fetchAnnouncement(supabase, ANNOUNCEMENT_ID);

  if (!announcement) return null;

  const { data: view } = await supabase
    .from("feature_announcement_views")
    .select("announcement_id")
    .eq("profile_id", profileId)
    .eq("announcement_id", ANNOUNCEMENT_ID)
    .maybeSingle();

  return view ? null : (announcement as FeatureAnnouncement);
}

export async function markNotificationsRead(supabase: Supabase, profileId: string) {
  let { data: notifications, error } = await supabase
    .from("group_notifications")
    .select("id")
    .or(`target_profile_id.is.null,target_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error && isMissingTargetColumnError(error)) {
    const fallback = await supabase
      .from("group_notifications")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100);
    notifications = fallback.data;
    error = fallback.error;
  }
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
