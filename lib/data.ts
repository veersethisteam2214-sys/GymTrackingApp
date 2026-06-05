import type { SupabaseClient, User } from "@supabase/supabase-js";
import { CATEGORIES, CATEGORY_IDS } from "@/lib/categories";
import { getLocalDateString, getMonthRange, getWeekRange } from "@/lib/dates";
import { calculateDailyStatus, getCurrentStreak, getStats } from "@/lib/status";
import type { CardioEntry, CheckInItem, DailyCheckIn, Profile, WeightEntry } from "@/lib/types";

type Client = SupabaseClient<any>;

export async function ensureProfile(supabase: Client, user: User) {
  const email = user.email ?? "";
  const fallbackName = email.split("@")[0] || "Training partner";

  const { data } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        display_name: user.user_metadata?.display_name ?? fallbackName
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  return data as Profile | null;
}

export async function getSignedUrl(supabase: Client, storagePath?: string | null) {
  if (!storagePath) return null;
  const path = storagePath.replace(/^checkin-uploads\//, "");
  const { data } = await supabase.storage.from("checkin-uploads").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function fetchDashboardData(supabase: Client, user: User) {
  const today = getLocalDateString();
  const { startDate: monthStart, endDate: monthEnd } = getMonthRange();
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange();

  await ensureProfile(supabase, user);

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
      supabase.from("weight_entries").select("*").order("measured_at", { ascending: false }).limit(20)
    ]);

  const people = ((profiles ?? []) as Profile[]).map((profile) => {
    const checkinsForUser = ((monthCheckins ?? []) as DailyCheckIn[]).filter((item) => item.user_id === profile.id);
    const todayCheckin = ((todayCheckins ?? []) as DailyCheckIn[]).find((item) => item.user_id === profile.id) ?? null;
    const todayItems = todayCheckin
      ? ((items ?? []) as CheckInItem[]).filter((item) => item.checkin_id === todayCheckin.id)
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
    currentUserId: user.id,
    today,
    people,
    monthCheckins: (monthCheckins ?? []) as DailyCheckIn[]
  };
}

export async function fetchTodayData(supabase: Client, user: User) {
  const today = getLocalDateString();
  const profile = await ensureProfile(supabase, user);
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
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
          user_id: user.id,
          category
        },
        { onConflict: "checkin_id,category" }
      )
    )
  );

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
    supabase.from("checkin_items").select("*").not("storage_path", "is", null).limit(80)
  ]);

  return {
    profiles: (profiles ?? []) as Profile[],
    checkins: (checkins ?? []) as DailyCheckIn[],
    items: (items ?? []) as CheckInItem[]
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
    profiles: (profiles ?? []) as Profile[],
    checkins: (checkins ?? []) as DailyCheckIn[],
    weekCheckins: ((checkins ?? []) as DailyCheckIn[]).filter(
      (item) => item.checkin_date >= weekStart && item.checkin_date <= weekEnd
    ),
    items: (items ?? []) as CheckInItem[],
    weights: (weights ?? []) as WeightEntry[],
    cardio: (cardio ?? []) as CardioEntry[]
  };
}

