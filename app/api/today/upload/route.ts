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

  let weightData: number | null = null;
  if (category === "weight_scale_photo") {
    const weightValue = String(formData.get("weight") ?? "").trim();
    const weight = Number(weightValue);

    if (!weightValue || !Number.isFinite(weight)) {
      return NextResponse.json({ error: "Enter today's weight." }, { status: 400 });
    }

    weightData = weight;
  }

  let readingData: { bookTitle: string; totalPages: number | null; page: number } | null = null;
  if (category === "reading_proof") {
    const pageValue = String(formData.get("reading_page") ?? "").trim();
    const page = Number(pageValue);

    if (!pageValue || !Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "Enter the page number you reached today." }, { status: 400 });
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("current_book_title,current_book_total_pages")
      .eq("id", context.profileId)
      .single();

    const bookTitle = String(profile?.current_book_title ?? "").trim();
    const totalPages = Number(profile?.current_book_total_pages ?? 0);

    if (!bookTitle) {
      return NextResponse.json({ error: "Add your current book in profile settings first." }, { status: 400 });
    }

    if (totalPages > 0 && page > totalPages) {
      return NextResponse.json({ error: "Page number cannot be higher than the book's total pages." }, { status: 400 });
    }

    const { data: previousLogs } = await context.supabase
      .from("reading_entries")
      .select("current_page")
      .eq("user_id", context.profileId)
      .eq("book_title", bookTitle)
      .neq("checkin_id", context.checkin.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const previousPage = Number(previousLogs?.[0]?.current_page ?? 0);

    let requiredPage = Math.max(10, previousPage + 10);
    if (totalPages > 0 && previousPage === 0 && totalPages < 10) {
      requiredPage = totalPages;
    }
    if (totalPages > 0 && previousPage > 0 && totalPages - previousPage < 10) {
      requiredPage = totalPages;
    }

    if (page < requiredPage) {
      return NextResponse.json({ error: "Reading proof needs at least 10 new pages." }, { status: 400 });
    }

    readingData = { bookTitle, totalPages: totalPages > 0 ? totalPages : null, page };
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

  if (weightData !== null) {
    await context.supabase.from("weight_entries").upsert(
      {
        user_id: context.profileId,
        checkin_id: context.checkin.id,
        source_item_id: data.id,
        weight_value: weightData,
        weight_unit: "kg",
        measured_at: new Date().toISOString()
      },
      { onConflict: "user_id,checkin_id" }
    );
  }

  if (readingData) {
    await context.supabase.from("reading_entries").upsert(
      {
        user_id: context.profileId,
        checkin_id: context.checkin.id,
        source_item_id: data.id,
        book_title: readingData.bookTitle,
        current_page: readingData.page,
        total_pages: readingData.totalPages
      },
      { onConflict: "user_id,checkin_id" }
    );

    if (readingData.totalPages && readingData.page >= readingData.totalPages) {
      await context.supabase.from("completed_books").upsert(
        {
          user_id: context.profileId,
          title: readingData.bookTitle,
          total_pages: readingData.totalPages,
          completed_at: new Date().toISOString()
        },
        { onConflict: "user_id,title" }
      );
    }
  }

  await recalculateTodayStatus(context.supabase, context.checkin.id);
  const item = await withSignedUrl(context.supabase, data as CheckInItem);
  return NextResponse.json({ item });
}
