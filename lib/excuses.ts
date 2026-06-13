import { getCategoryById, getCategoryIdsForDate } from "@/lib/categories";
import { applyGymRestDayExcuses } from "@/lib/rest-days";
import { calculateDailyStatus } from "@/lib/status";
import type { CheckInCategory, CheckInItem, DailyCheckIn, ExcuseRequest, ExcuseVote, Profile } from "@/lib/types";

type SupabaseLike = any;

export const SICK_DAY_EXCUSE_CATEGORIES: CheckInCategory[] = ["progress_photo", "treadmill_photo"];

export function getExcuseDeadline(checkinDate: string) {
  return new Date(`${checkinDate}T20:00:00.000Z`).toISOString();
}

export function getExcuseCategoryLabel(request: Pick<ExcuseRequest, "request_type" | "category">) {
  if (request.request_type === "sick_day") return "Sick day: gym + cardio";
  return request.category ? (getCategoryById(request.category)?.shortLabel ?? "Benchmark") : "Benchmark";
}

async function recalculateCheckinStatus(supabase: SupabaseLike, checkinId: string) {
  const [{ data: checkin }, { data: items }] = await Promise.all([
    supabase.from("daily_checkins").select("*").eq("id", checkinId).maybeSingle(),
    supabase.from("checkin_items").select("*").eq("checkin_id", checkinId)
  ]);

  if (!checkin) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,gym_routine")
    .eq("id", String(checkin.user_id))
    .maybeSingle();
  const effectiveItems = applyGymRestDayExcuses(
    (items ?? []) as CheckInItem[],
    [checkin as DailyCheckIn],
    profile ? [profile as Pick<Profile, "id" | "gym_routine">] : []
  );
  const overallStatus = calculateDailyStatus(
    effectiveItems,
    Boolean(checkin.is_rest_day),
    getCategoryIdsForDate(String(checkin.checkin_date))
  );

  await supabase
    .from("daily_checkins")
    .update({ overall_status: overallStatus, updated_at: new Date().toISOString() })
    .eq("id", checkinId);
}

async function approveRequest(supabase: SupabaseLike, request: ExcuseRequest) {
  const categories = request.request_type === "sick_day" ? SICK_DAY_EXCUSE_CATEGORIES : request.category ? [request.category] : [];
  const note = `Excuse approved: ${request.reason}`;

  for (const category of categories) {
    await supabase.from("checkin_items").upsert(
      {
        checkin_id: request.checkin_id,
        user_id: request.requester_profile_id,
        category,
        status: "excused",
        note,
        storage_path: null,
        original_filename: null,
        mime_type: null,
        file_size_bytes: null,
        uploaded_at: null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "checkin_id,category" }
    );
  }
}

export async function finalizeExpiredExcuseRequests(supabase: SupabaseLike) {
  const now = new Date().toISOString();
  const { data: requests, error } = await supabase
    .from("excuse_requests")
    .select("*")
    .eq("status", "pending")
    .lte("deadline_at", now)
    .limit(100);

  if (error || !requests?.length) return;

  const typedRequests = requests as ExcuseRequest[];
  const requestIds = typedRequests.map((request) => request.id);
  const { data: votes } = await supabase.from("excuse_votes").select("*").in("request_id", requestIds);
  const votesByRequest = new Map<string, ExcuseVote[]>();

  for (const vote of (votes ?? []) as ExcuseVote[]) {
    const current = votesByRequest.get(vote.request_id);
    if (current) current.push(vote);
    else votesByRequest.set(vote.request_id, [vote]);
  }

  const affectedCheckins = new Set<string>();
  for (const request of typedRequests) {
    const requestVotes = votesByRequest.get(request.id) ?? [];
    const allowVotes = requestVotes.filter((vote) => vote.vote === "allow").length;
    const denyVotes = requestVotes.filter((vote) => vote.vote === "deny").length;
    const status: ExcuseRequest["status"] = allowVotes > denyVotes ? "approved" : "denied";

    if (status === "approved") {
      await approveRequest(supabase, request);
      affectedCheckins.add(request.checkin_id);
    }

    await supabase
      .from("excuse_requests")
      .update({
        status,
        allow_votes: allowVotes,
        deny_votes: denyVotes,
        decided_at: now,
        updated_at: now
      })
      .eq("id", request.id);
  }

  for (const checkinId of Array.from(affectedCheckins)) {
    await recalculateCheckinStatus(supabase, checkinId);
  }
}
