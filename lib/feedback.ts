import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackPrompt } from "@/lib/types";

type Client = SupabaseClient<any>;

const FEEDBACK_INTERVAL_DAYS = 14;
const FEEDBACK_PROMPT_TEXT =
  "Is there anything you want changed in LOCKED IN? Any features to add, bugs to fix, or new benchmarks you want for the group?";

function isMissingFeedbackTable(error?: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("app_feedback_prompts");
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function getFeedbackPromptForProfile(supabase: Client, profileId: string): Promise<FeedbackPrompt | null> {
  const cutoff = daysAgo(FEEDBACK_INTERVAL_DAYS);
  const { data: recent, error: recentError } = await supabase
    .from("app_feedback_prompts")
    .select("*")
    .eq("profile_id", profileId)
    .gte("prompted_at", cutoff)
    .order("prompted_at", { ascending: false })
    .limit(1);

  if (recentError) {
    if (!isMissingFeedbackTable(recentError)) console.error("Could not check feedback prompts:", recentError.message);
    return null;
  }

  if ((recent ?? []).length > 0) return null;

  const { data, error } = await supabase
    .from("app_feedback_prompts")
    .insert({
      profile_id: profileId,
      prompt_text: FEEDBACK_PROMPT_TEXT
    })
    .select("*")
    .single();

  if (error || !data) {
    if (!isMissingFeedbackTable(error)) console.error("Could not create feedback prompt:", error?.message);
    return null;
  }

  return data as FeedbackPrompt;
}
