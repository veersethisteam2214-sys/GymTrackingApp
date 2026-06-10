import type { SupabaseClient } from "@supabase/supabase-js";
import { ALL_CATEGORY_IDS, getCategoriesForDate, getCategoryIdsForDate } from "@/lib/categories";
import { getLocalDateString, getMonthRange, getWeekRange } from "@/lib/dates";
import { applyGymRestDayExcuses } from "@/lib/rest-days";
import { calculateDailyStatus, getCompletionCount, getCurrentStreak, getStats, getStreakEndingOn, isStreakStatus, shiftDate } from "@/lib/status";
import type {
  CardioEntry,
  Challenge,
  CheckInItem,
  DailyCheckIn,
  Profile,
  Recommendation,
  StreakBreakNotice,
  TodayCompletionSummary,
  WeightEntry
} from "@/lib/types";

type Client = SupabaseClient<any>;
const RECOMMENDATIONS_RESET_AT = "2026-06-10T07:40:14.000Z";

function createVirtualCheckin(profileId: string, dateString: string): DailyCheckIn {
  return {
    id: `virtual-${profileId}-${dateString}`,
    user_id: profileId,
    checkin_date: dateString,
    overall_status: "missing",
    is_rest_day: false,
    rest_day_reason: null,
    created_at: "",
    updated_at: ""
  };
}

export async function getSignedUrl(supabase: Client, storagePath?: string | null) {
  if (!storagePath) return null;
  const path = storagePath.replace(/^checkin-uploads\//, "");
  const { data } = await supabase.storage.from("checkin-uploads").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function signProfile(supabase: Client, profile: Profile): Promise<Profile> {
  return {
    ...profile,
    password_hash: null,
    password_salt: null,
    avatarSignedUrl: await getSignedUrl(supabase, profile.avatar_url)
  };
}

async function signProfiles(supabase: Client, profiles: Profile[]) {
  return Promise.all(profiles.map((profile) => signProfile(supabase, profile)));
}

async function fetchLatestChallengeCreatorName(supabase: Client) {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("created_by_profile_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const creatorId = challenge?.created_by_profile_id;
  if (!creatorId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", creatorId)
    .maybeSingle();

  return typeof profile?.display_name === "string" ? profile.display_name : null;
}

function normalizeCheckinStatuses(checkins: DailyCheckIn[], items: CheckInItem[], profiles: Pick<Profile, "id" | "gym_routine">[] = []) {
  const effectiveItems = profiles.length ? applyGymRestDayExcuses(items, checkins, profiles) : items;
  const itemsByCheckin = new Map<string, CheckInItem[]>();
  for (const item of effectiveItems) {
    const current = itemsByCheckin.get(item.checkin_id);
    if (current) current.push(item);
    else itemsByCheckin.set(item.checkin_id, [item]);
  }

  return checkins.map((checkin) => {
    const categoryIds = getCategoryIdsForDate(checkin.checkin_date);
    const dayItems = itemsByCheckin.get(checkin.id) ?? [];

    return {
      ...checkin,
      overall_status: calculateDailyStatus(dayItems, checkin.is_rest_day, categoryIds)
    };
  });
}

export async function fetchDashboardData(supabase: Client, profileId: string) {
  const today = getLocalDateString();
  const challengeCreatorName = await fetchLatestChallengeCreatorName(supabase);
  const todayCategories = getCategoriesForDate(today, challengeCreatorName);
  const todayCategoryIds = todayCategories.map((category) => category.id);
  const { startDate: monthStart } = getMonthRange();
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange();

  const [
    { data: profiles },
    { data: monthCheckins },
    { data: weights }
  ] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase
        .from("daily_checkins")
        .select("*")
        .gte("checkin_date", monthStart)
        .lte("checkin_date", today)
        .order("checkin_date", { ascending: true }),
      supabase.from("weight_entries").select("*").order("measured_at", { ascending: false }).limit(80)
    ]);

  const rawMonthCheckins = (monthCheckins ?? []) as DailyCheckIn[];
  const signedProfiles = await signProfiles(supabase, (profiles ?? []) as Profile[]);
  const todayCheckinIds = new Set(rawMonthCheckins.filter((checkin) => checkin.checkin_date === today).map((checkin) => checkin.id));
  const checkinIds = rawMonthCheckins.map((checkin) => checkin.id);
  const { data: items } = checkinIds.length
    ? await supabase.from("checkin_items").select("*").in("checkin_id", checkinIds)
    : { data: [] };

  const signedMonthItems = await Promise.all(
    ((items ?? []) as CheckInItem[]).filter((item) => ALL_CATEGORY_IDS.includes(item.category)).map(async (item) => ({
      ...item,
      signedUrl: todayCheckinIds.has(item.checkin_id) ? await getSignedUrl(supabase, item.storage_path) : null
    }))
  );

  const effectiveMonthItems = applyGymRestDayExcuses(signedMonthItems, rawMonthCheckins, signedProfiles);
  const normalizedMonthCheckins = normalizeCheckinStatuses(rawMonthCheckins, effectiveMonthItems);
  const normalizedTodayCheckins = normalizedMonthCheckins.filter((checkin) => checkin.checkin_date === today);

  const people = signedProfiles.map((profile) => {
    const checkinsForUser = normalizedMonthCheckins.filter((item) => item.user_id === profile.id);
    const todayCheckin = normalizedTodayCheckins.find((item) => item.user_id === profile.id) ?? null;
    const virtualTodayCheckin = createVirtualCheckin(profile.id, today);
    const todayItems = todayCheckin
      ? effectiveMonthItems.filter((item) => item.checkin_id === todayCheckin.id)
      : applyGymRestDayExcuses([], [virtualTodayCheckin], [profile]);
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
      currentStreak: getCurrentStreak(checkinsForUser, today),
      todayStatus: todayCheckin?.overall_status ?? calculateDailyStatus(todayItems, false, todayCategoryIds)
    };
  });

  return {
    currentUserId: profileId,
    today,
    todayCategories,
    people,
    monthCheckins: normalizedMonthCheckins,
    monthItems: effectiveMonthItems
  };
}

export async function fetchStreakBreakNotice(supabase: Client, profileId: string): Promise<StreakBreakNotice | null> {
  const today = getLocalDateString();
  const yesterday = shiftDate(today, -1);
  const dayBeforeYesterday = shiftDate(yesterday, -1);
  const lookbackStart = shiftDate(today, -60);

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", profileId)
    .gte("checkin_date", lookbackStart)
    .lte("checkin_date", yesterday)
    .order("checkin_date", { ascending: true });

  const rawCheckins = (checkins ?? []) as DailyCheckIn[];
  const checkinIds = rawCheckins.map((checkin) => checkin.id);
  const { data: items } = checkinIds.length
    ? await supabase.from("checkin_items").select("*").in("checkin_id", checkinIds)
    : { data: [] };

  const dayItems = ((items ?? []) as CheckInItem[]).filter((item) => ALL_CATEGORY_IDS.includes(item.category));
  const { data: profile } = await supabase.from("profiles").select("id,gym_routine").eq("id", profileId).maybeSingle();
  const effectiveItems = applyGymRestDayExcuses(dayItems, rawCheckins, profile ? [profile as Pick<Profile, "id" | "gym_routine">] : []);
  const normalizedCheckins = normalizeCheckinStatuses(rawCheckins, effectiveItems);
  const priorStreak = getStreakEndingOn(
    normalizedCheckins.filter((checkin) => checkin.checkin_date < yesterday),
    dayBeforeYesterday
  );

  if (priorStreak < 1) return null;

  const yesterdayCheckin = normalizedCheckins.find((checkin) => checkin.checkin_date === yesterday) ?? null;
  const yesterdayStatus = yesterdayCheckin?.overall_status ?? "missing";
  if (isStreakStatus(yesterdayStatus)) return null;

  const requiredCategoryIds = getCategoryIdsForDate(yesterday);
  const yesterdayItems = yesterdayCheckin ? effectiveItems.filter((item) => item.checkin_id === yesterdayCheckin.id) : [];

  return {
    date: yesterday,
    completed: getCompletionCount(yesterdayItems, requiredCategoryIds),
    required: requiredCategoryIds.length,
    previousStreak: priorStreak
  };
}

export async function fetchTodayCompletionSummary(supabase: Client, profileId: string): Promise<TodayCompletionSummary> {
  const today = getLocalDateString();
  const categoryIds = getCategoryIdsForDate(today);
  const fallback = { completed: 0, required: categoryIds.length };

  const [{ data: checkin }, { data: profile }] = await Promise.all([
    supabase
    .from("daily_checkins")
    .select("id")
    .eq("user_id", profileId)
    .eq("checkin_date", today)
      .maybeSingle(),
    supabase.from("profiles").select("id,gym_routine").eq("id", profileId).maybeSingle()
  ]);

  const virtualCheckin = createVirtualCheckin(profileId, today);

  if (!checkin?.id) {
    const effectiveItems = applyGymRestDayExcuses([], [virtualCheckin], profile ? [profile as Pick<Profile, "id" | "gym_routine">] : []);
    return {
      completed: getCompletionCount(effectiveItems, categoryIds),
      required: categoryIds.length
    };
  }

  const { data: items } = await supabase
    .from("checkin_items")
    .select("status,category")
    .eq("checkin_id", String(checkin.id));

  const effectiveItems = applyGymRestDayExcuses(
    (items ?? []) as CheckInItem[],
    [{ ...virtualCheckin, id: String(checkin.id) }],
    profile ? [profile as Pick<Profile, "id" | "gym_routine">] : []
  );

  return {
    completed: getCompletionCount(effectiveItems, categoryIds),
    required: categoryIds.length
  };
}

export async function ensureTodayCheckin(supabase: Client, profileId: string) {
  const today = getLocalDateString();
  const categoryIds = getCategoryIdsForDate(today);
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
    categoryIds.map((category) =>
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
  const challengeCreatorName = await fetchLatestChallengeCreatorName(supabase);
  const categories = getCategoriesForDate(dailyCheckin.checkin_date, challengeCreatorName);
  const categoryIds = categories.map((category) => category.id);

  const [{ data: items }, { data: weightEntries }, { data: cardioEntries }] = await Promise.all([
    supabase.from("checkin_items").select("*").eq("checkin_id", dailyCheckin.id),
    supabase.from("weight_entries").select("*").eq("checkin_id", dailyCheckin.id).limit(1),
    supabase.from("cardio_entries").select("*").eq("checkin_id", dailyCheckin.id).limit(1)
  ]);

  const signedItems = await Promise.all(
    ((items ?? []) as CheckInItem[]).filter((item) => categoryIds.includes(item.category)).map(async (item) => ({
      ...item,
      signedUrl: await getSignedUrl(supabase, item.storage_path)
    }))
  );
  const effectiveItems = applyGymRestDayExcuses(signedItems, [dailyCheckin], [profile]);

  return {
    profile,
    checkin: dailyCheckin,
    items: effectiveItems,
    weightEntry: ((weightEntries ?? []) as WeightEntry[])[0] ?? null,
    cardioEntry: ((cardioEntries ?? []) as CardioEntry[])[0] ?? null,
    categories
  };
}

export async function fetchAnalyticsData(supabase: Client) {
  const today = getLocalDateString();
  const { startDate: monthStart } = getMonthRange();
  const { startDate: weekStart, endDate: weekEnd } = getWeekRange();

  const [{ data: profiles }, { data: checkins }, { data: items }, { data: weights }, { data: cardio }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase
        .from("daily_checkins")
        .select("*")
        .gte("checkin_date", monthStart)
        .lte("checkin_date", today)
        .order("checkin_date", { ascending: true }),
      supabase.from("checkin_items").select("*"),
      supabase.from("weight_entries").select("*").order("measured_at", { ascending: true }),
      supabase.from("cardio_entries").select("*")
    ]);

  const filteredItems = ((items ?? []) as CheckInItem[]).filter((item) => ALL_CATEGORY_IDS.includes(item.category));
  const signedProfiles = await signProfiles(supabase, (profiles ?? []) as Profile[]);
  const effectiveItems = applyGymRestDayExcuses(filteredItems, (checkins ?? []) as DailyCheckIn[], signedProfiles);
  const normalizedCheckins = normalizeCheckinStatuses((checkins ?? []) as DailyCheckIn[], effectiveItems);

  return {
    profiles: signedProfiles,
    checkins: normalizedCheckins,
    weekCheckins: normalizedCheckins.filter(
      (item) => item.checkin_date >= weekStart && item.checkin_date <= weekEnd
    ),
    items: effectiveItems,
    weights: (weights ?? []) as WeightEntry[],
    cardio: (cardio ?? []) as CardioEntry[]
  };
}

export async function fetchChallenges(supabase: Client) {
  const { data, error } = await supabase.from("challenges").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) return [] as Challenge[];
  return (data ?? []) as Challenge[];
}

export async function fetchRecommendations(supabase: Client, profileId?: string) {
  const [{ data: recommendations }, { data: profiles }] = await Promise.all([
    supabase.from("recommendations").select("*").gte("created_at", RECOMMENDATIONS_RESET_AT).order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("*")
  ]);
  const signedProfiles = await signProfiles(supabase, (profiles ?? []) as Profile[]);

  return Promise.all(
    ((recommendations ?? []) as Recommendation[])
      .filter((recommendation) => {
        if (!profileId) return true;
        if (recommendation.audience_type !== "specific") return true;
        if (recommendation.created_by_profile_id === profileId) return true;
        return (recommendation.target_profile_ids ?? []).includes(profileId);
      })
      .slice(0, 8)
      .map(async (recommendation) => ({
      ...recommendation,
      signedUrl: await getSignedUrl(supabase, recommendation.storage_path),
      profile: signedProfiles.find((profile) => profile.id === recommendation.created_by_profile_id) ?? null
      }))
  );
}
