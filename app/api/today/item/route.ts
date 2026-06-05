import { NextResponse } from "next/server";
import { getTodayContext, isValidCategory, recalculateTodayStatus, withSignedUrl } from "@/app/api/today/_helpers";
import type { CheckInItem } from "@/lib/types";

export async function PATCH(request: Request) {
  const context = await getTodayContext();
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const payload = await request.json();
  const category = String(payload.category ?? "");
  const action = String(payload.action ?? "");

  if (!isValidCategory(category) || !["excuse", "clear"].includes(action)) {
    return NextResponse.json({ error: "Invalid item update." }, { status: 400 });
  }

  const { data: current } = await context.supabase
    .from("checkin_items")
    .select("*")
    .eq("checkin_id", context.checkin.id)
    .eq("category", category)
    .single();

  if (action === "clear" && current?.storage_path) {
    await context.supabase.storage.from("checkin-uploads").remove([current.storage_path.replace(/^checkin-uploads\//, "")]);
  }

  if (action === "clear" && category === "weight_scale_photo") {
    await context.supabase.from("weight_entries").delete().eq("checkin_id", context.checkin.id);
  }

  if (action === "clear" && category === "reading_proof") {
    await context.supabase.from("reading_entries").delete().eq("checkin_id", context.checkin.id);
  }

  const update =
    action === "excuse"
      ? { status: "excused", updated_at: new Date().toISOString() }
      : {
          status: "missing",
          storage_path: null,
          original_filename: null,
          mime_type: null,
          file_size_bytes: null,
          uploaded_at: null,
          updated_at: new Date().toISOString()
        };

  const { data, error } = await context.supabase
    .from("checkin_items")
    .update(update)
    .eq("checkin_id", context.checkin.id)
    .eq("category", category)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not update item." }, { status: 500 });
  }

  await recalculateTodayStatus(context.supabase, context.checkin.id);
  const item = await withSignedUrl(context.supabase, data as CheckInItem);
  return NextResponse.json({ item });
}
