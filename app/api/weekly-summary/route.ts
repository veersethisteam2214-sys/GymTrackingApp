import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { createAdminSupabase } from "@/lib/supabase/server";
import type { CardioEntry, CheckInItem, CompletedBook, DailyCheckIn, Profile, ReadingEntry, WeightEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

type WeeklyPerson = {
  profile: Profile;
  completedDays: number;
  partialDays: number;
  excusedDays: number;
  taskCount: number;
  possibleTasks: number;
  latestWeight: WeightEntry | null;
  latestCardio: CardioEntry | null;
  latestReading: ReadingEntry | null;
  completedBooks: CompletedBook[];
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getLastSevenDaysRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return {
    startDate: isoDate(start),
    endDate: isoDate(end)
  };
}

function latestByUser<T extends { user_id: string }>(items: T[], userId: string) {
  return items.find((item) => item.user_id === userId) ?? null;
}

function buildRows(
  profiles: Profile[],
  checkins: DailyCheckIn[],
  items: CheckInItem[],
  weights: WeightEntry[],
  cardio: CardioEntry[],
  reading: ReadingEntry[],
  books: CompletedBook[]
): WeeklyPerson[] {
  return profiles.map((profile) => {
    const userCheckins = checkins.filter((checkin) => checkin.user_id === profile.id);
    const userCheckinIds = new Set(userCheckins.map((checkin) => checkin.id));
    const userItems = items.filter((item) => userCheckinIds.has(item.checkin_id));

    return {
      profile,
      completedDays: userCheckins.filter((checkin) => checkin.overall_status === "complete").length,
      partialDays: userCheckins.filter((checkin) => checkin.overall_status === "partial").length,
      excusedDays: userCheckins.filter((checkin) => checkin.overall_status === "excused").length,
      taskCount: userItems.filter((item) => item.status === "uploaded" || item.status === "excused").length,
      possibleTasks: userCheckins.length * CATEGORIES.length,
      latestWeight: latestByUser(weights, profile.id),
      latestCardio: latestByUser(cardio, profile.id),
      latestReading: latestByUser(reading, profile.id),
      completedBooks: books.filter((book) => book.user_id === profile.id)
    };
  });
}

function buildText(rows: WeeklyPerson[], startDate: string, endDate: string) {
  return [
    `Weekly Discipline Tracker overview (${startDate} to ${endDate})`,
    "",
    ...rows.map((row) => {
      const weight = row.latestWeight ? `${row.latestWeight.weight_value}${row.latestWeight.weight_unit}` : "No weight logged";
      const cardio = row.latestCardio?.treadmill_minutes ? `${row.latestCardio.treadmill_minutes} min cardio` : "No cardio logged";
      const reading = row.latestReading
        ? `${row.latestReading.book_title}, page ${row.latestReading.current_page}${row.latestReading.total_pages ? `/${row.latestReading.total_pages}` : ""}`
        : "No reading logged";

      return `${row.profile.display_name}: ${row.completedDays} complete days, ${row.partialDays} partial, ${row.excusedDays} excused, ${row.taskCount}/${row.possibleTasks || 0} tasks. ${weight}. ${cardio}. ${reading}.`;
    })
  ].join("\n");
}

function buildHtml(rows: WeeklyPerson[], startDate: string, endDate: string) {
  const totalComplete = rows.reduce((sum, row) => sum + row.completedDays, 0);
  const totalTasks = rows.reduce((sum, row) => sum + row.taskCount, 0);
  const possibleTasks = rows.reduce((sum, row) => sum + row.possibleTasks, 0);

  const rowHtml = rows
    .map((row) => {
      const taskPercent = row.possibleTasks ? Math.round((row.taskCount / row.possibleTasks) * 100) : 0;
      const weight = row.latestWeight ? `${row.latestWeight.weight_value}${row.latestWeight.weight_unit}` : "--";
      const cardio = row.latestCardio?.treadmill_minutes ? `${row.latestCardio.treadmill_minutes} min` : "--";
      const reading = row.latestReading
        ? `${escapeHtml(row.latestReading.book_title)}<br><span style="color:#64748b">Page ${row.latestReading.current_page}${row.latestReading.total_pages ? `/${row.latestReading.total_pages}` : ""}</span>`
        : "--";
      const books = row.completedBooks.length ? row.completedBooks.map((book) => escapeHtml(book.title)).join(", ") : "--";

      return `
        <tr>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;font-weight:800;color:#0f172a">${escapeHtml(row.profile.display_name)}</td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${row.completedDays} complete<br><span style="color:#64748b">${row.partialDays} partial / ${row.excusedDays} excused</span></td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${row.taskCount}/${row.possibleTasks || 0}<br><span style="color:#2563eb;font-weight:800">${taskPercent}%</span></td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${escapeHtml(weight)}</td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${escapeHtml(cardio)}</td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${reading}</td>
          <td style="padding:14px 10px;border-bottom:1px solid #dbeafe;color:#0f172a">${books}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin:0;background:#eff6ff;padding:24px;font-family:Inter,Arial,sans-serif;color:#0f172a">
      <div style="max-width:980px;margin:0 auto;background:#ffffff;border:1px solid #dbeafe;border-radius:24px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1d4ed8,#0f766e);padding:28px;color:#ffffff">
          <p style="margin:0 0 6px;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">Discipline Tracker</p>
          <h1 style="margin:0;font-size:32px;line-height:1.05">Weekly group overview</h1>
          <p style="margin:10px 0 0;color:#dbeafe">${escapeHtml(startDate)} to ${escapeHtml(endDate)}</p>
        </div>
        <div style="padding:22px;display:block">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
            <div style="background:#eff6ff;border-radius:18px;padding:16px"><div style="font-size:28px;font-weight:900">${rows.length}</div><div style="color:#64748b;font-size:13px;font-weight:700">Profiles</div></div>
            <div style="background:#eff6ff;border-radius:18px;padding:16px"><div style="font-size:28px;font-weight:900">${totalComplete}</div><div style="color:#64748b;font-size:13px;font-weight:700">Complete days</div></div>
            <div style="background:#eff6ff;border-radius:18px;padding:16px"><div style="font-size:28px;font-weight:900">${totalTasks}/${possibleTasks || 0}</div><div style="color:#64748b;font-size:13px;font-weight:700">Tasks done</div></div>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">User</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Days</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Tasks</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Weight</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Cardio</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Reading</th>
                  <th align="left" style="padding:10px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.12em">Books</th>
                </tr>
              </thead>
              <tbody>${rowHtml}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.WEEKLY_SUMMARY_FROM,
      to,
      subject,
      html,
      text
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload?.message === "string" ? payload.message : "Resend email send failed.");
  }

  return payload;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.WEEKLY_SUMMARY_FROM) {
    return NextResponse.json({ error: "Add RESEND_API_KEY and WEEKLY_SUMMARY_FROM before weekly emails can send." }, { status: 500 });
  }

  const supabase = createAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { startDate, endDate } = getLastSevenDaysRange();
  const [
    { data: profiles, error: profilesError },
    { data: checkins, error: checkinsError },
    { data: weights, error: weightsError },
    { data: cardio, error: cardioError },
    { data: reading, error: readingError },
    { data: books, error: booksError }
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase
      .from("daily_checkins")
      .select("*")
      .gte("checkin_date", startDate)
      .lte("checkin_date", endDate)
      .order("checkin_date", { ascending: true }),
    supabase.from("weight_entries").select("*").order("measured_at", { ascending: false }).limit(200),
    supabase.from("cardio_entries").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("reading_entries").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("completed_books").select("*").order("completed_at", { ascending: false }).limit(200)
  ]);

  const firstError = profilesError ?? checkinsError ?? weightsError ?? cardioError ?? readingError ?? booksError;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const weeklyCheckins = (checkins ?? []) as DailyCheckIn[];
  const checkinIds = weeklyCheckins.map((checkin) => checkin.id);
  const { data: items, error: itemsError } = checkinIds.length
    ? await supabase.from("checkin_items").select("*").in("checkin_id", checkinIds)
    : { data: [], error: null };

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const signedUpProfiles = (profiles ?? []) as Profile[];
  const recipients = signedUpProfiles
    .map((profile) => profile.email?.trim())
    .filter((email): email is string => Boolean(email));

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, recipients: 0, message: "No profile emails saved yet." });
  }

  const rows = buildRows(
    signedUpProfiles,
    weeklyCheckins,
    (items ?? []) as CheckInItem[],
    (weights ?? []) as WeightEntry[],
    (cardio ?? []) as CardioEntry[],
    (reading ?? []) as ReadingEntry[],
    (books ?? []) as CompletedBook[]
  );
  const subject = `Weekly Discipline Tracker overview: ${startDate} to ${endDate}`;
  const html = buildHtml(rows, startDate, endDate);
  const text = buildText(rows, startDate, endDate);
  const uniqueRecipients = Array.from(new Set(recipients));

  try {
    await Promise.all(uniqueRecipients.map((email) => sendEmail(email, subject, html, text)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Weekly email failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recipients: uniqueRecipients.length, range: { startDate, endDate } });
}
