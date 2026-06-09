"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BicepsFlexed,
  BookOpen,
  Check,
  ChevronDown,
  Dna,
  Footprints,
  Gauge,
  Flame,
  ImageIcon,
  Scale,
  Trophy,
  X
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getRankBadge, rankPeople, type LeaderboardPerson } from "@/lib/leaderboard";
import { getCompletionCount } from "@/lib/status";
import type {
  CheckInCategory,
  CheckInItem,
  CompletedBook,
  DailyCheckIn,
  DailyStatus,
  Profile,
  ReadingEntry,
  WeightEntry
} from "@/lib/types";

type Person = {
  profile: Profile;
  todayCheckin: DailyCheckIn | null;
  todayItems: CheckInItem[];
  latestWeight?: WeightEntry | null;
  latestReading?: ReadingEntry | null;
  completedBooks: CompletedBook[];
  monthStats: Record<string, number>;
  weekStats: Record<string, number>;
  currentStreak: number;
  todayStatus: DailyStatus;
};

type DataPoint = {
  id: string;
  label: string;
  helper: string;
  complete: boolean;
  icon: React.ReactNode;
  text?: string | null;
  item?: CheckInItem;
  imageUrl?: string | null;
};

const categoryIcons: Record<CheckInCategory, React.ReactNode> = {
  progress_photo: <BicepsFlexed className="size-4" />,
  treadmill_photo: <Footprints className="size-4" />,
  weight_scale_photo: <Gauge className="size-4" />,
  protein_shake_photo: <Dna className="size-4" />,
  reading_proof: <BookOpen className="size-4" />
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DashboardCards({
  people,
  currentUserId,
  today,
  monthCheckins,
  monthItems
}: {
  people: Person[];
  currentUserId: string;
  today: string;
  monthCheckins: DailyCheckIn[];
  monthItems: CheckInItem[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openPoint, setOpenPoint] = useState<{ person: Person; point: DataPoint } | null>(null);
  const selectedPerson = people.find((person) => person.profile.id === selectedId) ?? null;
  const totalCompleted = people.reduce((sum, person) => sum + getCompletionCount(person.todayItems), 0);
  const totalPossible = Math.max(people.length * CATEGORIES.length, 1);
  const todayDate = new Date(`${today}T00:00:00`);
  const weekday = weekdayNames[todayDate.getDay()] ?? "Today";
  const rankedPeople = rankPeople(people, monthCheckins, monthItems);

  if (people.length === 0) {
    return (
      <section className="app-surface rounded-[2rem] p-5">
        <h2 className="display-font text-4xl font-extrabold text-app">No profiles yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Create a profile to start tracking with the group.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="reveal-in overflow-hidden rounded-[2rem] border" style={{ borderColor: "var(--faint)", background: "var(--surface-strong)", boxShadow: "var(--shadow)" }}>
        <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_.85fr] lg:p-6">
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.28em]" style={{ color: "var(--brand)" }}>
              Live command center
            </p>
            <h2 className="display-font mt-2 text-6xl font-extrabold leading-none text-app sm:text-7xl">
              {totalCompleted}/{totalPossible}
            </h2>
            <MiniLeaderboard rankedPeople={rankedPeople} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TodaySplit people={people} weekday={weekday} />
            <LeaderboardEntry />
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[2rem] p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
              Users
            </p>
            <h2 className="display-font text-5xl font-extrabold leading-none text-app">See your friends Today uploads!</h2>
          </div>
          <p className="text-sm font-bold text-muted">Tap a username to open their data and proof images.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {people.map((person, index) => {
            const userLabel = getUserLabel(person.profile);
            return (
              <button
                key={person.profile.id}
                onClick={() => setSelectedId(person.profile.id)}
                className="app-button group reveal-in relative overflow-hidden rounded-[2rem] p-4 text-left hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4"
                style={{
                  animationDelay: `${index * 70}ms`,
                  border: selectedId === person.profile.id ? "1px solid var(--brand)" : "1px solid var(--faint)",
                  background: selectedId === person.profile.id ? "color-mix(in srgb, var(--brand) 13%, var(--surface-strong))" : "var(--surface)",
                  boxShadow: selectedId === person.profile.id ? "0 22px 70px color-mix(in srgb, var(--brand) 22%, transparent)" : "var(--shadow)"
                }}
                title={`Click to see ${userLabel}'s image`}
              >
                <span
                  className="pointer-events-none absolute inset-x-3 top-3 z-10 translate-y-[-120%] rounded-2xl px-3 py-2 text-center text-xs font-extrabold opacity-0 shadow-soft transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  style={{ background: "var(--text)", color: "var(--bg)" }}
                >
                  Click to see {userLabel}&apos;s image
                </span>
                <ProfileCard person={person} isMe={person.profile.id === currentUserId} />
              </button>
            );
          })}
        </div>
      </section>

      {selectedPerson ? (
        <PersonDataDialog
          person={selectedPerson}
          onClose={() => setSelectedId(null)}
          onOpenPoint={(point) => setOpenPoint({ person: selectedPerson, point })}
        />
      ) : null}

      {openPoint ? <DataPointDialog detail={openPoint} onClose={() => setOpenPoint(null)} /> : null}
    </div>
  );
}

function ProfileCard({ person, isMe }: { person: Person; isMe: boolean }) {
  const count = getCompletionCount(person.todayItems);
  const percent = Math.round((count / CATEGORIES.length) * 100);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <Avatar profile={person.profile} size="lg" />
        <div className="completion-ring grid size-16 place-items-center rounded-full" style={{ "--ring-value": `${percent}%` } as React.CSSProperties}>
          <span className="display-font text-xl font-extrabold text-app">{count}/{CATEGORIES.length}</span>
        </div>
      </div>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
        {isMe ? "You" : person.profile.goal_mode}
      </p>
      <h3 className="mt-1 truncate text-2xl font-extrabold text-app">{person.profile.display_name}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat icon={<Flame className="size-4" />} label="Streak" value={`${person.currentStreak}d`} />
        <MiniStat icon={<Scale className="size-4" />} label="Weight" value={person.latestWeight ? `${person.latestWeight.weight_value}kg` : "--"} />
        <MiniStat icon={<BookOpen className="size-4" />} label="Page" value={person.latestReading ? `${person.latestReading.current_page}` : "--"} />
      </div>
    </>
  );
}

function PersonDataDialog({
  person,
  onClose,
  onOpenPoint
}: {
  person: Person;
  onClose: () => void;
  onOpenPoint: (point: DataPoint) => void;
}) {
  const points = useMemo(() => buildDataPoints(person), [person]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="reveal-in max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] p-5" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar profile={person.profile} size="xl" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
                Today uploads
              </p>
              <h2 className="display-font truncate text-5xl font-extrabold text-app">{person.profile.display_name}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/user/${person.profile.id}`}
              className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold"
              style={{ background: "var(--surface-soft)", color: "var(--text)" }}
            >
              Full profile
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <button
              onClick={onClose}
              className="app-button grid size-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: "var(--surface-soft)", color: "var(--text)" }}
              aria-label="Close profile data"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {points.map((point) => (
            <button
              key={point.id}
              onClick={() => onOpenPoint(point)}
              className="app-button group rounded-3xl p-4 text-left hover:-translate-y-0.5"
              style={{
                border: point.complete ? "1px solid color-mix(in srgb, var(--brand) 42%, transparent)" : "1px solid var(--faint)",
                background: point.complete ? "color-mix(in srgb, var(--brand) 12%, var(--surface))" : "var(--surface-soft)"
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: point.complete ? "var(--brand)" : "var(--surface-soft)", color: point.complete ? "var(--bg)" : "var(--muted)" }}>
                    {point.complete ? <Check className="size-5" /> : point.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-app">{point.label}</p>
                    <p className="truncate text-xs text-muted">{point.helper}</p>
                  </div>
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted transition group-hover:translate-y-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function DataPointDialog({
  detail,
  onClose
}: {
  detail: { person: Person; point: DataPoint };
  onClose: () => void;
}) {
  const { person, point } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="reveal-in max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[2rem] p-5" style={{ background: "var(--surface-strong)", border: "1px solid var(--faint)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
              {person.profile.display_name}
            </p>
            <h2 className="display-font text-4xl font-extrabold text-app">{point.label}</h2>
          </div>
          <button onClick={onClose} className="app-button grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--surface-soft)", color: "var(--text)" }}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {point.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-3xl" style={{ background: "var(--surface-soft)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={point.imageUrl} alt="" className="max-h-[55vh] w-full object-cover" />
          </div>
        ) : (
          <div className="mt-4 grid min-h-48 place-items-center rounded-3xl" style={{ background: "var(--surface-soft)" }}>
            <ImageIcon className="size-10 text-muted" aria-hidden />
          </div>
        )}
        <div className="mt-4 rounded-3xl p-4" style={{ background: "var(--surface-soft)" }}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-app">{point.text || "No extra detail saved yet."}</p>
        </div>
      </section>
    </div>
  );
}

function TodaySplit({ people, weekday }: { people: Person[]; weekday: string }) {
  return (
    <section className="rounded-3xl p-4" style={{ background: "var(--surface-soft)", border: "1px solid var(--faint)" }}>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
        Today ({weekday})
      </p>
      <div className="mt-3 space-y-2">
        {people.slice(0, 13).map((person) => (
          <div key={person.profile.id} className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-bold text-app">{person.profile.display_name}</span>
            <span className="truncate text-xs font-extrabold text-muted">{getRoutineForDay(person.profile.gym_routine, weekday)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LeaderboardEntry() {
  return (
    <Link
      href="/leaderboard"
      className="app-button group relative flex min-h-36 items-center justify-between gap-4 overflow-hidden rounded-3xl p-5 hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
        border: "1px solid color-mix(in srgb, var(--brand) 72%, transparent)",
        boxShadow: "0 24px 70px color-mix(in srgb, var(--brand) 28%, transparent)"
      }}
    >
      <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/16" />
      <div className="min-w-0">
        <p className="display-font text-5xl font-extrabold uppercase leading-none text-black sm:text-6xl">
          Leaderboard
        </p>
        <p className="display-font text-4xl font-extrabold uppercase leading-none text-black/80 sm:text-5xl">
          Rankings
        </p>
      </div>
      <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-black/14 text-black shadow-sm">
        <Trophy className="size-8" aria-hidden />
      </span>
    </Link>
  );
}

function MiniLeaderboard({ rankedPeople }: { rankedPeople: LeaderboardPerson<Person>[] }) {
  return (
    <div className="mt-4 max-w-xl rounded-3xl p-3" style={{ background: "var(--surface-soft)", border: "1px solid var(--faint)" }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
          Rankings
        </p>
        <Link href="/leaderboard" className="app-button rounded-2xl px-3 py-2 text-xs font-extrabold" style={{ background: "var(--surface-soft)", color: "var(--text)" }}>
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {rankedPeople.slice(0, 3).map((person, index) => {
          const badge = getRankBadge(index);
          return (
            <div key={person.profile.id} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2" style={{ background: "var(--surface-soft)" }}>
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black" style={{ background: badge.color, color: "#101010" }}>
                  {index < 3 ? <Trophy className="size-4" aria-hidden /> : badge.symbol}
                </span>
                <span className="truncate text-sm font-extrabold text-app">{person.profile.display_name}</span>
              </span>
              <span className="display-font text-xl font-extrabold" style={{ color: "var(--brand)" }}>{person.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildDataPoints(person: Person): DataPoint[] {
  const latestWeight = person.latestWeight?.weight_value ?? person.profile.starting_weight;
  return CATEGORIES.map((category) => {
    const item = person.todayItems.find((entry) => entry.category === category.id);
    const complete = item?.status === "uploaded";
    const text =
      category.id === "weight_scale_photo"
        ? `Weight: ${complete && latestWeight ? `${latestWeight}kg` : "Not entered today"}`
        : category.id === "reading_proof"
          ? `${person.profile.current_book_title ?? "No book set"}\n${person.latestReading ? `Page ${person.latestReading.current_page}${person.latestReading.total_pages ? `/${person.latestReading.total_pages}` : ""}` : "No page logged"}`
          : item?.note;
    return {
      id: category.id,
      label: category.label,
      helper: complete ? "Complete today" : "Missing today",
      complete,
      icon: categoryIcons[category.id],
      text,
      item,
      imageUrl: item?.signedUrl ?? null
    };
  });
}

function getRoutineForDay(routine: string | null, weekday: string) {
  if (!routine) return "No routine";
  const line = routine
    .split(/\r?\n/)
    .find((entry) => entry.trim().toLowerCase().startsWith(weekday.toLowerCase()));
  const value = line?.split("-").slice(1).join("-").trim();
  return value || "Rest";
}

function getUserLabel(profile: Profile) {
  return profile.username || profile.display_name;
}

function Avatar({ profile, size }: { profile: Profile; size: "sm" | "lg" | "xl" }) {
  const sizes = {
    sm: "size-10 rounded-2xl text-sm",
    lg: "size-16 rounded-3xl text-2xl",
    xl: "size-20 rounded-[1.75rem] text-3xl"
  };

  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden brand-gradient font-black text-black ${sizes[size]}`}>
      {profile.avatarSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        profile.display_name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-2" style={{ background: "var(--surface-soft)" }}>
      <span className="grid size-7 place-items-center rounded-xl" style={{ color: "var(--brand)" }}>{icon}</span>
      <p className="mt-1 text-[10px] font-extrabold uppercase text-muted">{label}</p>
      <p className="truncate text-xs font-extrabold text-app">{value}</p>
    </div>
  );
}
