import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/categories";
import { getLocalDateString, getMonthRange, getWeekRange } from "@/lib/dates";
import { calculateDailyStatus, getCurrentStreak, getStats } from "@/lib/status";
import type { CardioEntry, CheckInItem, DailyCheckIn, Profile, WeightEntry } from "@/lib/types";

type Client = SupabaseClient<any>;

export async function getSignedUrl(supabase: Client, storagePath?: string | null) {
  if (!storagePath) return null;
  const path = storagePath.replace(/^checkin-uploads\//, "");
  const { data } = await supabase.storage.from("checkin-uploads").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function signProfile(supabase: Client, profile: Profile): Promise<Profile> {
  return {
    ...profile,
    avatarSignedUrl: await getSignedUrl(supabase, profile.avatar_url)
  };
}

async function signProfiles(supabase: Client, profiles: Profile[]) {
  return Promise.all(profiles.map((profile) => signProfile(supabase, profile)));
}

export async function fetchDashboardData(supabase: Client, profileId: string) {
  const today = getLocalDateString();
  const { startDate: monthStart, endDate: monthEnd } = getMonthRange();
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange();

  const [{ data: profiles }, { data: todayCheckins }, { data: monthCheckins }, { data: items }, { data: weights }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("daily_checkins").select("*").eq("checkin_date", today),
      supabase
        .from("daily_checkins")
        .select("*")
        .gte("checkin_date", monthStart)
        .lte("checkin_date", monthEnd)
        .order("checkin_date", { ascending: true }),
      supabase
        .from("checkin_items")
        .select("*")
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`),
      supabase.from("weight_entries").select("*").order("measured_at", { ascending: false }).limit(40)
    ]);

  const signedMonthItems = await Promise.all(
    ((items ?? []) as CheckInItem[]).map(async (item) => ({
      ...item,
      signedUrl: await getSignedUrl(supabase, item.storage_path)
    }))
  );

  const signedProfiles = await signProfiles(supabase, (profiles ?? []) as Profile[]);

  const people = signedProfiles.map((profile) => {
    const checkinsForUser = ((monthCheckins ?? []) as DailyCheckIn[]).filter((item) => item.user_id === profile.id);
    const todayCheckin = ((todayCheckins ?? []) as DailyCheckIn[]).find((item) => item.user_id === profile.id) ?? null;
    const todayItems = todayCheckin
      ? signedMonthItems.filter((item) => item.checkin_id === todayCheckin.id)
      : [];
    const latestWeight = ((weights ?? []) as WeightEntry[]).find((item) => item.user_id === profile.id);
    const weekCheckins = checkinsForUser.filter(
      (item) => item.checkin_date >= weekStart && item.checkin_date <= weekEnd
    );

    return {
      profile,
      todayCheckin,
      todayItems,
      latestWeight,
      monthStats: getStats(checkinsForUser),
      weekStats: getStats(weekCheckins),
      currentStreak: getCurrentStreak(checkinsForUser),
      todayStatus: todayCheckin?.overall_status ?? calculateDailyStatus(todayItems, false)
    };
  });

  return {
    currentUserId: profileId,
    today,
    people,
    monthCheckins: (monthCheckins ?? []) as DailyCheckIn[]
  };
}

export async function ensureTodayCheckin(supabase: Client, profileId: string) {
  const today = getLocalDateString();
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: profileId,
        checkin_date: today
      },
      { onConflict: "user_id,checkin_date" }
    )
    .select("*")
    .single();

  const dailyCheckin = checkin as DailyCheckIn;

  await Promise.all(
    CATEGORY_IDS.map((category) =>
      supabase.from("checkin_items").upsert(
        {
          checkin_id: dailyCheckin.id,
          user_id: profileId,
          category
        },
        { onConflict: "checkin_id,category" }
      )
    )
  );

  return dailyCheckin;
}

export async function fetchTodayData(supabase: Client, profile: Profile) {
  const dailyCheckin = await ensureTodayCheckin(supabase, profile.id);

  const [{ data: items }, { data: weightEntries }, { data: cardioEntries }] = await Promise.all([
    supabase.from("checkin_items").select("*").eq("checkin_id", dailyCheckin.id),
    supabase.from("weight_entries").select("*").eq("checkin_id", dailyCheckin.id).limit(1),
    supabase.from("cardio_entries").select("*").eq("checkin_id", dailyCheckin.id).limit(1)
  ]);

  const signedItems = await Promise.all(
    ((items ?? []) as CheckInItem[]).map(async (item) => ({
      ...item,
      signedUrl: await getSignedUrl(supabase, item.storage_path)
    }))
  );

  return {
    profile,
    checkin: dailyCheckin,
    items: signedItems,
    weightEntry: ((weightEntries ?? []) as WeightEntry[])[0] ?? null,
    cardioEntry: ((cardioEntries ?? []) as CardioEntry[])[0] ?? null,
    categories: CATEGORIES
  };
}

export async function fetchCalendarData(supabase: Client) {
  const { startDate, endDate } = getMonthRange();
  const [{ data: profiles }, { data: checkins }, { data: items }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase
      .from("daily_checkins")
      .select("*")
      .gte("checkin_date", startDate)
      .lte("checkin_date", endDate)
      .order("checkin_date", { ascending: true }),
    supabase.from("checkin_items").select("*").not("storage_path", "is", null).limit(120)
  ]);

  const signedItems = await Promise.all(
    ((items ?? []) as CheckInItem[]).map(async (item) => ({
      ...item,
      signedUrl: await getSignedUrl(supabase, item.storage_path)
    }))
  );

  return {
    profiles: await signProfiles(supabase, (profiles ?? []) as Profile[]),
    checkins: (checkins ?? []) as DailyCheckIn[],
    items: signedItems
  };
}

export async function fetchAnalyticsData(supabase: Client) {
  const { startDate: monthStart, endDate: monthEnd } = getMonthRange();
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange();

  const [{ data: profiles }, { data: checkins }, { data: items }, { data: weights }, { data: cardio }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase
        .from("daily_checkins")
        .select("*")
        .gte("checkin_date", monthStart)
        .lte("checkin_date", monthEnd)
        .order("checkin_date", { ascending: true }),
      supabase.from("checkin_items").select("*"),
      supabase.from("weight_entries").select("*").order("measured_at", { ascending: true }),
      supabase.from("cardio_entries").select("*")
    ]);

  return {
    profiles: await signProfiles(supabase, (profiles ?? []) as Profile[]),
    checkins: (checkins ?? []) as DailyCheckIn[],
    weekCheckins: ((checkins ?? []) as DailyCheckIn[]).filter(
      (item) => item.checkin_date >= weekStart && item.checkin_date <= weekEnd
    ),
    items: (items ?? []) as CheckInItem[],
    weights: (weights ?? []) as WeightEntry[],
    cardio: (cardio ?? []) as CardioEntry[]
  };
}
