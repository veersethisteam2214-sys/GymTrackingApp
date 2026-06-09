"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  GlassWater,
  ImageIcon,
  Scale,
  Target,
  Trophy,
  X
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
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
  progress_photo: <Dumbbell className="size-4" />,
  treadmill_photo: <Activity className="size-4" />,
  weight_scale_photo: <Scale className="size-4" />,
  protein_shake_photo: <GlassWater className="size-4" />,
  reading_proof: <BookOpen className="size-4" />
};

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DashboardCards({
  people,
  currentUserId,
  today
}: {
  people: Person[];
  currentUserId: string;
  today: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<string | null>(null);
  const [openPoint, setOpenPoint] = useState<{ person: Person; point: DataPoint } | null>(null);
  const selectedPerson = people.find((person) => person.profile.id === selectedId) ?? null;
  const totalCompleted = people.reduce((sum, person) => sum + getCompletionCount(person.todayItems), 0);
  const totalPossible = Math.max(people.length * CATEGORIES.length, 1);
  const todayDate = new Date(`${today}T00:00:00`);
  const weekday = weekdayNames[todayDate.getDay()] ?? "Today";

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
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Tap a profile to reveal their routines, proof, reading, and today task status. Photos stay hidden until a data point is opened.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <TodaySplit people={people} weekday={weekday} />
            <LeaderboardEntry />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {people.map((person, index) => (
          <button
            key={person.profile.id}
            onClick={() => setSelectedId(person.profile.id === selectedId ? null : person.profile.id)}
            className="app-button reveal-in rounded-[2rem] p-4 text-left hover:-translate-y-1"
            style={{
              animationDelay: `${index * 70}ms`,
              border: selectedId === person.profile.id ? "1px solid var(--brand)" : "1px solid var(--faint)",
              background: selectedId === person.profile.id ? "color-mix(in srgb, var(--brand) 13%, var(--surface-strong))" : "var(--surface)",
              boxShadow: selectedId === person.profile.id ? "0 22px 70px color-mix(in srgb, var(--brand) 22%, transparent)" : "var(--shadow)"
            }}
          >
            <ProfileCard person={person} isMe={person.profile.id === currentUserId} />
          </button>
        ))}
      </section>

      <TaskCompletionOverview
        people={people}
        expandedTasks={expandedTasks}
        onToggle={(id) => setExpandedTasks(expandedTasks === id ? null : id)}
      />

      {selectedPerson ? (
        <PersonDataPanel
          person={selectedPerson}
          isMe={selectedPerson.profile.id === currentUserId}
          onOpenPoint={(point) => setOpenPoint({ person: selectedPerson, point })}
        />
      ) : (
        <section className="app-surface rounded-[2rem] p-5 text-center">
          <p className="display-font text-3xl font-extrabold text-app">Choose a profile</p>
          <p className="mt-1 text-sm text-muted">Their full data opens here only after you tap them.</p>
        </section>
      )}

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

function PersonDataPanel({
  person,
  isMe,
  onOpenPoint
}: {
  person: Person;
  isMe: boolean;
  onOpenPoint: (point: DataPoint) => void;
}) {
  const points = useMemo(() => buildDataPoints(person), [person]);

  return (
    <section className="reveal-in app-surface-strong rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar profile={person.profile} size="xl" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>
              {isMe ? "Your revealed data" : "Friend data"}
            </p>
            <h2 className="display-font truncate text-5xl font-extrabold text-app">{person.profile.display_name}</h2>
          </div>
        </div>
        <Link
          href={`/user/${person.profile.id}`}
          className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold"
          style={{ background: "var(--surface-soft)", color: "var(--text)" }}
        >
          Full profile
          <ArrowRight className="size-4" aria-hidden />
        </Link>
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
  );
}

function TaskCompletionOverview({
  people,
  expandedTasks,
  onToggle
}: {
  people: Person[];
  expandedTasks: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="app-surface rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="display-font text-sm font-extrabold uppercase tracking-[0.24em]" style={{ color: "var(--brand)" }}>
            Task completion
          </p>
          <h2 className="text-2xl font-extrabold text-app">Everyone today</h2>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {people.map((person) => {
          const count = getCompletionCount(person.todayItems);
          return (
            <article key={person.profile.id} className="rounded-3xl p-3" style={{ background: "var(--surface-soft)" }}>
              <button onClick={() => onToggle(person.profile.id)} className="app-button flex w-full items-center gap-3 text-left">
                <Avatar profile={person.profile} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-app">{person.profile.display_name}</p>
                    <p className="display-font text-2xl font-extrabold" style={{ color: "var(--brand)" }}>
                      {count}/{CATEGORIES.length}
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                    <div className="h-full rounded-full brand-gradient" style={{ width: `${(count / CATEGORIES.length) * 100}%` }} />
                  </div>
                </div>
                <ChevronDown className={`size-4 text-muted transition ${expandedTasks === person.profile.id ? "rotate-180" : ""}`} />
              </button>
              {expandedTasks === person.profile.id ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {CATEGORIES.map((category) => {
                    const item = person.todayItems.find((entry) => entry.category === category.id);
                    const done = item?.status === "uploaded" || item?.status === "excused";
                    return (
                      <div key={category.id} className="rounded-2xl p-2 text-center" style={{ background: done ? "color-mix(in srgb, var(--brand) 14%, transparent)" : "var(--surface-soft)" }}>
                        <span className="mx-auto grid size-8 place-items-center rounded-xl" style={{ background: done ? "var(--brand)" : "var(--surface-soft)", color: done ? "var(--bg)" : "var(--muted)" }}>
                          {done ? <Check className="size-4" /> : categoryIcons[category.id]}
                        </span>
                        <p className="mt-1 truncate text-[11px] font-extrabold text-app">{category.shortLabel}</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
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
      className="app-button group flex items-center justify-between gap-4 rounded-3xl p-4 hover:-translate-y-0.5"
      style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--brand) 18%, var(--surface)), var(--surface-soft))", border: "1px solid var(--faint)" }}
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: "var(--brand)" }}>Leaderboard</p>
        <p className="mt-1 text-sm font-bold text-app">Open rankings and discipline scores</p>
      </div>
      <span className="grid size-12 place-items-center rounded-2xl brand-gradient text-black">
        <Trophy className="size-5" aria-hidden />
      </span>
    </Link>
  );
}

function buildDataPoints(person: Person): DataPoint[] {
  const latestWeight = person.latestWeight?.weight_value ?? person.profile.starting_weight;
  const points: DataPoint[] = [
    {
      id: "gym",
      label: "Gym routine",
      helper: person.profile.gym_routine ? "Routine filled" : "Missing routine",
      complete: Boolean(person.profile.gym_routine),
      icon: <Dumbbell className="size-4" />,
      text: person.profile.gym_routine
    },
    {
      id: "cardio",
      label: "Cardio routine",
      helper: person.profile.cardio_routine ? "Routine filled" : "Missing routine",
      complete: Boolean(person.profile.cardio_routine),
      icon: <Activity className="size-4" />,
      text: person.profile.cardio_routine
    },
    {
      id: "goal",
      label: "Body goal",
      helper: `${person.profile.goal_mode} / ${person.profile.target_weight ?? "--"}kg`,
      complete: Boolean(person.profile.target_weight && person.profile.target_date),
      icon: <Target className="size-4" />,
      text: `${person.profile.goal_mode}\nCurrent: ${latestWeight ?? "--"}kg\nTarget: ${person.profile.target_weight ?? "--"}kg\nDate: ${person.profile.target_date ?? "--"}`
    }
  ];

  CATEGORIES.forEach((category) => {
    const item = person.todayItems.find((entry) => entry.category === category.id);
    const complete = item?.status === "uploaded" || item?.status === "excused";
    const text =
      category.id === "weight_scale_photo"
        ? `Weight: ${latestWeight ? `${latestWeight}kg` : "Not entered"}`
        : category.id === "reading_proof"
          ? `${person.profile.current_book_title ?? "No book set"}\n${person.latestReading ? `Page ${person.latestReading.current_page}${person.latestReading.total_pages ? `/${person.latestReading.total_pages}` : ""}` : "No page logged"}`
          : item?.note;
    points.push({
      id: category.id,
      label: category.label,
      helper: complete ? "Complete today" : "Missing today",
      complete,
      icon: categoryIcons[category.id],
      text,
      item,
      imageUrl: item?.signedUrl ?? null
    });
  });

  return points;
}

function getRoutineForDay(routine: string | null, weekday: string) {
  if (!routine) return "No routine";
  const line = routine
    .split(/\r?\n/)
    .find((entry) => entry.trim().toLowerCase().startsWith(weekday.toLowerCase()));
  const value = line?.split("-").slice(1).join("-").trim();
  return value || "Rest";
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
