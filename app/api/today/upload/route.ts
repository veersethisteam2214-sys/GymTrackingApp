import { NextResponse } from "next/server";
import { getTodayContext, isValidCategory, recalculateTodayStatus, withSignedUrl } from "@/app/api/today/_helpers";
import type { CheckInItem } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(request: Request) {
  const context = await getTodayContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const formData = await request.formData();
  const category = String(formData.get("category") ?? "");
  const note = String(formData.get("note") ?? "");
  const file = formData.get("file");

  if (!isValidCategory(category)) {
    return NextResponse.json({ error: "Unknown check-in category." }, { status: 400 });
  }

  if (category === "weight_scale_photo") {
    const weightValue = String(formData.get("weight") ?? "").trim();
    const weight = Number(weightValue);

    if (!weightValue || !Number.isFinite(weight)) {
      return NextResponse.json({ error: "Enter today's weight." }, { status: 400 });
    }

    const { data, error } = await context.supabase
      .from("checkin_items")
      .update({
        status: "uploaded",
        storage_path: null,
        original_filename: null,
        mime_type: null,
        file_size_bytes: null,
        uploaded_at: new Date().toISOString(),
        note,
        updated_at: new Date().toISOString()
      })
      .eq("checkin_id", context.checkin.id)
      .eq("category", category)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Could not save weight." }, { status: 500 });
    }

    await context.supabase.from("weight_entries").upsert(
      {
        user_id: context.profileId,
        checkin_id: context.checkin.id,
        source_item_id: data.id,
        weight_value: weight,
        weight_unit: "kg",
        measured_at: new Date().toISOString()
      },
      { onConflict: "user_id,checkin_id" }
    );

    await recalculateTodayStatus(context.supabase, context.checkin.id);
    const item = await withSignedUrl(context.supabase, data as CheckInItem);
    return NextResponse.json({ item });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Use an allowed image under 10 MB." }, { status: 400 });
  }

  const existing = await context.supabase
    .from("checkin_items")
    .select("*")
    .eq("checkin_id", context.checkin.id)
    .eq("category", category)
    .single();

  if (existing.data?.storage_path) {
    await context.supabase.storage
      .from("checkin-uploads")
      .remove([existing.data.storage_path.replace(/^checkin-uploads\//, "")]);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${context.profileId}/${context.checkin.checkin_date}/${category}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await context.supabase.storage.from("checkin-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await context.supabase
    .from("checkin_items")
    .update({
      status: "uploaded",
      storage_path: `checkin-uploads/${path}`,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      uploaded_at: new Date().toISOString(),
      note,
      updated_at: new Date().toISOString()
    })
    .eq("checkin_id", context.checkin.id)
    .eq("category", category)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not save upload." }, { status: 500 });
  }

  const minutesValue = String(formData.get("minutes") ?? "").trim();
  const distanceValue = String(formData.get("distance") ?? "").trim();
  const minutes = Number(minutesValue);
  const distance = Number(distanceValue);
  if (
    category === "treadmill_photo" &&
    ((minutesValue && Number.isFinite(minutes)) || (distanceValue && Number.isFinite(distance)))
  ) {
    await context.supabase.from("cardio_entries").upsert(
      {
        user_id: context.profileId,
        checkin_id: context.checkin.id,
        source_item_id: data.id,
        treadmill_minutes: minutesValue && Number.isFinite(minutes) ? minutes : null,
        treadmill_distance: distanceValue && Number.isFinite(distance) ? distance : null,
        distance_unit: "km"
      },
      { onConflict: "user_id,checkin_id" }
    );
  }

  await recalculateTodayStatus(context.supabase, context.checkin.id);
  const item = await withSignedUrl(context.supabase, data as CheckInItem);
  return NextResponse.json({ item });
}
