import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureTodayCheckin, getSignedUrl } from "@/lib/data";
import {
  finalizeExpiredExcuseRequests,
  getExcuseCategoryLabel,
  getExcuseDeadline,
  SICK_DAY_EXCUSE_CATEGORIES
} from "@/lib/excuses";
import { createExcuseRequestNotification } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getCategoryIdsForDate } from "@/lib/categories";
import type { CheckInCategory, ExcuseRequest, Profile } from "@/lib/types";

async function getContext() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;
  if (!profileId) return { error: "Set up your app profile first.", status: 401 as const };

  const supabase = createAdminSupabase();
  if (!supabase) return { error: "Supabase is not configured.", status: 500 as const };

  return { supabase, profileId };
}

function isMissingExcuseTable(error?: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("excuse_requests");
}

export async function GET() {
  const context = await getContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  await finalizeExpiredExcuseRequests(context.supabase);

  const { data: voted } = await context.supabase
    .from("excuse_votes")
    .select("request_id")
    .eq("voter_profile_id", context.profileId);
  const votedIds = new Set((voted ?? []).map((vote) => String(vote.request_id)));

  const { data, error } = await context.supabase
    .from("excuse_requests")
    .select("*")
    .eq("status", "pending")
    .neq("requester_profile_id", context.profileId)
    .gt("deadline_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(12);

  if (error) {
    if (isMissingExcuseTable(error)) return NextResponse.json({ requests: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requests = ((data ?? []) as ExcuseRequest[]).filter((request) => !votedIds.has(request.id));
  const requesterIds = Array.from(new Set(requests.map((request) => request.requester_profile_id)));
  const { data: profiles } = requesterIds.length
    ? await context.supabase.from("profiles").select("id,display_name,avatar_url").in("id", requesterIds)
    : { data: [] };
  const profileEntries = await Promise.all(
    ((profiles ?? []) as Profile[]).map(async (profile): Promise<[string, Pick<Profile, "display_name" | "avatarSignedUrl">]> => [
      profile.id,
      {
        display_name: profile.display_name,
        avatarSignedUrl: await getSignedUrl(context.supabase, profile.avatar_url)
      }
    ])
  );
  const profileMap = new Map(profileEntries);

  return NextResponse.json({
    requests: requests.map((request) => ({
      ...request,
      requester: profileMap.get(request.requester_profile_id) ?? null,
      label: getExcuseCategoryLabel(request)
    }))
  });
}

export async function POST(request: Request) {
  const context = await getContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  await finalizeExpiredExcuseRequests(context.supabase);

  const payload = await request.json().catch(() => ({}));
  const requestType = String(payload.request_type ?? "benchmark");
  const category = String(payload.category ?? "") as CheckInCategory;
  const reason = String(payload.reason ?? "").trim();

  if (!["benchmark", "sick_day"].includes(requestType)) {
    return NextResponse.json({ error: "Invalid excuse type." }, { status: 400 });
  }

  if (reason.length < 3) {
    return NextResponse.json({ error: "Add a reason for the excuse request." }, { status: 400 });
  }

  const checkin = await ensureTodayCheckin(context.supabase, context.profileId);
  const activeCategoryIds = getCategoryIdsForDate(checkin.checkin_date);

  if (requestType === "benchmark" && (!activeCategoryIds.includes(category) || !category)) {
    return NextResponse.json({ error: "Choose a valid benchmark." }, { status: 400 });
  }

  if (requestType === "sick_day") {
    const hasSickDayCategories = SICK_DAY_EXCUSE_CATEGORIES.every((item) => activeCategoryIds.includes(item));
    if (!hasSickDayCategories) {
      return NextResponse.json({ error: "Sick day excuses are only for gym and cardio days." }, { status: 400 });
    }
  }

  const duplicateQuery = context.supabase
    .from("excuse_requests")
    .select("id")
    .eq("requester_profile_id", context.profileId)
    .eq("checkin_id", checkin.id)
    .eq("status", "pending")
    .eq("request_type", requestType);

  const { data: duplicate, error: duplicateError } =
    requestType === "benchmark"
      ? await duplicateQuery.eq("category", category).limit(1)
      : await duplicateQuery.is("category", null).limit(1);

  if (duplicateError && isMissingExcuseTable(duplicateError)) {
    return NextResponse.json(
      { error: "Excuse voting table is missing. Run supabase/migrations/0020_excuse_voting.sql in Supabase SQL Editor." },
      { status: 500 }
    );
  }

  if ((duplicate ?? []).length > 0) {
    return NextResponse.json({ error: "You already have a pending excuse request for this." }, { status: 409 });
  }

  const { data, error } = await context.supabase
    .from("excuse_requests")
    .insert({
      requester_profile_id: context.profileId,
      checkin_id: checkin.id,
      checkin_date: checkin.checkin_date,
      request_type: requestType,
      category: requestType === "benchmark" ? category : null,
      reason,
      deadline_at: getExcuseDeadline(checkin.checkin_date)
    })
    .select("*")
    .single();

  if (error || !data) {
    if (isMissingExcuseTable(error)) {
      return NextResponse.json(
        { error: "Excuse voting table is missing. Run supabase/migrations/0020_excuse_voting.sql in Supabase SQL Editor." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error?.message ?? "Could not create excuse request." }, { status: 500 });
  }

  await createExcuseRequestNotification(context.supabase, context.profileId, data as ExcuseRequest);
  return NextResponse.json({ request: data });
}

export async function PATCH(request: Request) {
  const context = await getContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  await finalizeExpiredExcuseRequests(context.supabase);

  const payload = await request.json().catch(() => ({}));
  const requestId = String(payload.request_id ?? "").trim();
  const vote = String(payload.vote ?? "");

  if (!requestId || !["allow", "deny"].includes(vote)) {
    return NextResponse.json({ error: "Choose allow or deny." }, { status: 400 });
  }

  const { data: excuseRequest, error: requestError } = await context.supabase
    .from("excuse_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    if (isMissingExcuseTable(requestError)) return NextResponse.json({ error: "Excuse voting table is missing." }, { status: 500 });
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  if (!excuseRequest || excuseRequest.status !== "pending") {
    return NextResponse.json({ error: "This excuse request is no longer open." }, { status: 400 });
  }

  if (String(excuseRequest.requester_profile_id) === context.profileId) {
    return NextResponse.json({ error: "You cannot vote on your own excuse." }, { status: 400 });
  }

  if (new Date(String(excuseRequest.deadline_at)).getTime() <= Date.now()) {
    await finalizeExpiredExcuseRequests(context.supabase);
    return NextResponse.json({ error: "Voting closed at 3am Thai time." }, { status: 400 });
  }

  const { error } = await context.supabase.from("excuse_votes").upsert(
    {
      request_id: requestId,
      voter_profile_id: context.profileId,
      vote
    },
    { onConflict: "request_id,voter_profile_id" }
  );

  if (error) {
    if (isMissingExcuseTable(error)) return NextResponse.json({ error: "Excuse voting table is missing." }, { status: 500 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
