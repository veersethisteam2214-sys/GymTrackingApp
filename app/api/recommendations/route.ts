import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRecommendationNotification } from "@/lib/notifications";
import { createAdminSupabase } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function isMissingRecommendationAudienceColumn(error?: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("audience_type") || message.includes("target_profile_ids");
}

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

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const photo = formData.get("photo");
  const audienceType = String(formData.get("audience_type") ?? "everyone") === "specific" ? "specific" : "everyone";
  const requestedTargetIds = formData
    .getAll("target_profile_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!title) {
    return NextResponse.json({ error: "Enter a recommendation title." }, { status: 400 });
  }

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  const profileIds = new Set((profiles ?? []).map((profile) => String(profile.id)));
  const targetProfileIds = Array.from(new Set(requestedTargetIds.filter((id) => profileIds.has(id))));

  if (audienceType === "specific" && targetProfileIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one user or send it to everyone." }, { status: 400 });
  }

  let storagePath: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    if (!ACCEPTED_TYPES.includes(photo.type) || photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Photo must be an allowed image under 10 MB." }, { status: 400 });
    }

    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `recommendations/${profileId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("checkin-uploads").upload(path, photo, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    storagePath = `checkin-uploads/${path}`;
  }

  const recommendationPayload = {
    created_by_profile_id: profileId,
    title,
    category: category || null,
    note: note || null,
    link_url: linkUrl || null,
    storage_path: storagePath,
    audience_type: audienceType,
    target_profile_ids: audienceType === "specific" ? targetProfileIds : []
  };

  let { data, error } = await supabase
    .from("recommendations")
    .insert(recommendationPayload)
    .select("*")
    .single();

  if (error && isMissingRecommendationAudienceColumn(error)) {
    const fallback = await supabase
      .from("recommendations")
      .insert({
        created_by_profile_id: profileId,
        title,
        category: category || null,
        note: note || null,
        link_url: linkUrl || null,
        storage_path: storagePath
      })
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save recommendation." }, { status: 500 });
  }

  await createRecommendationNotification(supabase, profileId, title, audienceType === "specific" ? targetProfileIds : null);
  return NextResponse.json({
    recommendation: {
      ...data,
      audience_type: audienceType,
      target_profile_ids: audienceType === "specific" ? targetProfileIds : []
    }
  });
}
