"use client";

import { useMemo, useState } from "react";
import { Bot, Send } from "lucide-react";
import { getAllCategories, getCategoriesForDate } from "@/lib/categories";
import { getCurrentStreak, getStats } from "@/lib/status";
import type { CheckInItem, DailyCheckIn, Profile } from "@/lib/types";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];

const categoryAliases = new Map(
  [
    ...getAllCategories().flatMap((category) => {
    const aliases = [category.shortLabel.toLowerCase(), category.label.toLowerCase()];
    if (category.id === "progress_photo") aliases.push("gym attendance", "attendance", "gym");
    if (category.id === "treadmill_photo") aliases.push("cardio", "run", "running", "treadmill");
    if (category.id === "weight_scale_photo") aliases.push("weight", "scale");
    if (category.id === "protein_shake_photo") aliases.push("protein", "shake");
    if (category.id === "weekly_progress_photo") aliases.push("progress", "progress picture", "weekly progress", "body picture");
    return aliases.map((alias) => [alias, category.id] as const);
    }),
    ["group challenge", "group_challenge_ab_photo"] as const,
    ["ab", "group_challenge_ab_photo"] as const,
    ["challenge", "group_challenge_ab_photo"] as const
  ]
);

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function findProfile(question: string, profiles: Profile[]) {
  const clean = normalize(question);
  return profiles.find((profile) => {
    const name = normalize(profile.display_name);
    const username = normalize(profile.username ?? "");
    return clean.includes(name) || Boolean(username && clean.includes(username));
  });
}

function findDate(question: string, checkins: DailyCheckIn[]) {
  const clean = normalize(question);
  const explicitIso = clean.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (explicitIso) return explicitIso;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (clean.includes("today")) return toIsoDate(today);
  if (clean.includes("yesterday")) {
    const date = new Date(today);
    date.setDate(date.getDate() - 1);
    return toIsoDate(date);
  }

  for (const month of monthNames) {
    const match = clean.match(new RegExp(`\\b${month.slice(0, 3)}(?:${month.slice(3)})?\\s+(\\d{1,2})\\b`));
    if (match) {
      const date = new Date(today.getFullYear(), monthNames.indexOf(month), Number(match[1]));
      return toIsoDate(date);
    }
  }

  const weekdayIndex = weekdayNames.findIndex((day) => clean.includes(day));
  if (weekdayIndex >= 0) {
    const date = new Date(today);
    const offset = (date.getDay() - weekdayIndex + 7) % 7;
    date.setDate(date.getDate() - offset);
    return toIsoDate(date);
  }

  return checkins.map((checkin) => checkin.checkin_date).sort().at(-1) ?? toIsoDate(today);
}

function findCategory(question: string) {
  const clean = normalize(question);
  for (const [alias, categoryId] of Array.from(categoryAliases)) {
    if (clean.includes(alias)) return categoryId;
  }
  return null;
}

function answerQuestion(question: string, profiles: Profile[], checkins: DailyCheckIn[], items: CheckInItem[]) {
  const clean = normalize(question);
  const profile = findProfile(question, profiles);

  if (!profile) {
    return `I could not find that user. Try using the exact profile name, like: "How many out of 4 did Arnav do on Monday?"`;
  }

  const userCheckins = checkins.filter((checkin) => checkin.user_id === profile.id);

  if (clean.includes("streak")) {
    return `${profile.display_name}'s current streak is ${getCurrentStreak(userCheckins)} day(s).`;
  }

  if (clean.includes("month") || clean.includes("summary") || clean.includes("overall")) {
    const stats = getStats(userCheckins);
    return `${profile.display_name}'s month summary: ${stats.complete} complete, ${stats.partial} partial, ${stats.missing} missing, and ${stats.excused} excused day(s).`;
  }

  const date = findDate(question, checkins);
  const checkin = userCheckins.find((entry) => entry.checkin_date === date);
  const categoryId = findCategory(question);

  if (!checkin) {
    const categories = getCategoriesForDate(date);
    if (categoryId) {
      const label = categories.find((category) => category.id === categoryId)?.shortLabel ?? "that task";
      return `${profile.display_name} has no check-in saved for ${formatDate(date)}, so ${label} is missing.`;
    }
    return `${profile.display_name} has no check-in saved for ${formatDate(date)}, so that counts as 0/${categories.length}. Missing: ${categories.map((category) => category.shortLabel).join(", ")}.`;
  }

  const categories = getCategoriesForDate(date);
  const dayItems = items.filter((item) => item.checkin_id === checkin.id);
  const covered = categories.filter((category) => {
    const item = dayItems.find((entry) => entry.category === category.id);
    return item?.status === "uploaded";
  });
  const missed = categories.filter((category) => !covered.some((done) => done.id === category.id));

  if (categoryId) {
    const category = categories.find((entry) => entry.id === categoryId);
    const item = dayItems.find((entry) => entry.category === categoryId);
    const status = item?.status ?? "missing";
    return `${profile.display_name}'s ${category?.shortLabel ?? "task"} on ${formatDate(date)} is ${status}.`;
  }

  const missedText = missed.length ? missed.map((category) => category.shortLabel).join(", ") : "nothing";
  const coveredText = covered.length ? covered.map((category) => category.shortLabel).join(", ") : "nothing";
  return `${profile.display_name} completed ${covered.length}/${categories.length} on ${formatDate(date)}. Completed: ${coveredText}. Missed: ${missedText}. Overall status: ${checkin.overall_status}.`;
}

export function StatsDataChat({
  profiles,
  checkins,
  items
}: {
  profiles: Profile[];
  checkins: DailyCheckIn[];
  items: CheckInItem[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask me about user data by day. Example: How many out of 4 did Arnav do on Monday?"
    }
  ]);
  const [question, setQuestion] = useState("");
  const sortedCheckins = useMemo(() => [...checkins].sort((a, b) => a.checkin_date.localeCompare(b.checkin_date)), [checkins]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const answer = answerQuestion(trimmed, profiles, sortedCheckins, items);
    setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: answer }]);
    setQuestion("");
  }

  return (
    <section className="app-surface rounded-[2rem] p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="brand-gradient grid size-11 shrink-0 place-items-center rounded-2xl text-black">
          <Bot className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-app">Data chatbot</h2>
          <p className="text-sm font-bold text-muted">Only ask user data questions of the days, dont ask random questions.</p>
        </div>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-3xl p-3" style={{ background: "var(--surface-soft)" }}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto max-w-[86%]" : "mr-auto max-w-[92%]"}`}
            style={{
              background: message.role === "user" ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "var(--surface-strong)",
              color: message.role === "user" ? "var(--bg)" : "var(--text)",
              border: message.role === "user" ? "1px solid transparent" : "1px solid var(--faint)"
            }}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask: How many out of 4 did Arnav do on Monday?"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border px-4 text-sm text-app outline-none focus:ring-4"
          style={{ borderColor: "var(--faint)", background: "var(--surface-soft)" }}
        />
        <button className="app-button brand-gradient grid min-h-12 w-12 shrink-0 place-items-center rounded-2xl text-black" aria-label="Ask chatbot">
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
