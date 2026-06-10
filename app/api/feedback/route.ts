import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createFeedbackNotification } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get("gym_profile_id")?.value;

  if (!profileId) {
    return NextResponse.json({ error: "Set up your app profile first." }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const payload = await request.json().catch(() => ({}));
  const promptId = String(payload.prompt_id ?? "").trim();
  const responseText = String(payload.response_text ?? "").trim();

  if (!promptId) {
    return NextResponse.json({ error: "Missing feedback prompt." }, { status: 400 });
  }

  if (responseText.length < 2) {
    return NextResponse.json({ error: "Write a quick suggestion first." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("app_feedback_prompts")
    .update({
      response_text: responseText,
      responded_at: new Date().toISOString()
    })
    .eq("id", promptId)
    .eq("profile_id", profileId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save feedback." }, { status: 500 });
  }

  await createFeedbackNotification(supabase, profileId, responseText);
  return NextResponse.json({ ok: true });
}
