import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

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

  if (!title) {
    return NextResponse.json({ error: "Enter a recommendation title." }, { status: 400 });
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

  const { data, error } = await supabase
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

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save recommendation." }, { status: 500 });
  }

  return NextResponse.json({ recommendation: data });
}
