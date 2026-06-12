"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BicepsFlexed,
  Camera,
  Check,
  ChevronDown,
  Dna,
  Footprints,
  Gauge,
  Flame,
  ImageIcon,
  X
} from "lucide-react";
import { LeaderboardPodium } from "@/components/LeaderboardPodium";
import { getDenseRank, rankPeople } from "@/lib/leaderboard";
import { REST_DAY_AUTO_CREDIT_NOTE, getRestDayAutoCreditLabel } from "@/lib/rest-days";
import { getCompletionCount } from "@/lib/status";
import type {
  CategoryMeta,
  CheckInCategory,
  CheckInItem,
  DailyCheckIn,
  DailyStatus,
  Profile,
  WeightEntry
} from "@/lib/types";

type Person = {
  profile: Profile;
  todayCheckin: DailyCheckIn | null;
  todayItems: CheckInItem[];
  latestWeight?: WeightEntry | null;
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
  weekly_progress_photo: <Camera className="size-4" />
};

function formatBlockDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

export function DashboardCards({
  people,
  currentUserId,
  today,
  monthCheckins,
  monthItems,
  todayCategories
}: {
  people: Person[];
  currentUserId: string;
  today: string;
  monthCheckins: DailyCheckIn[];
  monthItems: CheckInItem[];
  todayCategories: CategoryMeta[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openPoint, setOpenPoint] = useState<{ person: Person; point: DataPoint } | null>(null);
  const selectedPerson = people.find((person) => person.profile.id === selectedId) ?? null;
  const todayCategoryIds = todayCategories.map((category) => category.id);
  const totalCompleted = people.reduce((sum, person) => sum + getCompletionCount(person.todayItems, todayCategoryIds), 0);
  const totalPossible = Math.max(people.length * todayCategories.length, 1);
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

  const myPerson = people.find((person) => person.profile.id === currentUserId) ?? null;
  const myDone = myPerson ? getCompletionCount(myPerson.todayItems, todayCategoryIds) : 0;
  const pct = Math.round((totalCompleted / totalPossible) * 100);
  const fullyIn = people.filter(
    (person) => getCompletionCount(person.todayItems, todayCategoryIds) >= todayCategories.length
  ).length;

  return (
    <div className="space-y-4">
      <div className="a-up">
        <h2 className="display-font text-5xl leading-none text-app">Roll call</h2>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--muted)" }}>
          {formatBlockDate(today)}
        </p>
      </div>

      {/* your day */}
      {myPerson ? (
        <section className="a-up app-surface rounded-[20px] p-[18px]" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--muted)" }}>
              Your day
            </p>
            <p className="display-font text-base italic" style={{ color: myDone >= todayCategories.length ? "var(--brand)" : "var(--text)" }}>
              {myDone}
              <span style={{ color: "var(--muted)" }}> / {todayCategories.length}</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {todayCategories.map((category) => {
              const item = myPerson.todayItems.find((entry) => entry.category === category.id);
              const on = item?.status === "uploaded" || item?.status === "excused";
              const rested = item?.status === "excused";
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-2.5 rounded-[13px] px-3 py-[11px]"
                  style={{
                    background: on ? "var(--accent-dim)" : "transparent",
                    border: `1px solid ${on ? "var(--accent-edge)" : "var(--faint)"}`
                  }}
                  title={rested ? REST_DAY_AUTO_CREDIT_NOTE : undefined}
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-[7px]"
                    style={{
                      background: on ? "var(--accent)" : "transparent",
                      border: `1px solid ${on ? "var(--accent)" : "var(--line-2)"}`
                    }}
                  >
                    {on ? <Check className="size-3.5" style={{ color: "var(--bg)" }} strokeWidth={2.6} aria-hidden /> : null}
                  </span>
                  <span className="truncate text-[13px] font-semibold" style={{ color: on ? "var(--text)" : "var(--muted)" }}>
                    {category.shortLabel}
                    {rested ? <span style={{ color: "var(--muted)" }}> · rest</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/today"
            className="a-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-[13px] px-3 py-3 text-[13.5px] font-bold tracking-[0.02em] text-app"
            style={{ border: "1px solid var(--line-2)" }}
          >
            Upload today&apos;s proof <ArrowRight className="size-4" style={{ color: "var(--brand)" }} aria-hidden />
          </Link>
        </section>
      ) : null}

      {/* the room, today */}
      <section className="a-up app-surface relative overflow-hidden rounded-[22px] p-[22px]" style={{ animationDelay: "120ms" }}>
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-36"
          style={{ background: "radial-gradient(60% 80% at 100% 0%, var(--accent-dim), transparent 70%)" }}
          aria-hidden
        />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--muted)" }}>
          The room, today
        </p>
        <div className="relative mt-1 flex items-end justify-between">
          <p className="display-font text-7xl leading-[0.82] tracking-[-0.02em] text-app">
            {pct}
            <span className="text-3xl" style={{ color: "var(--brand)" }}>
              %
            </span>
          </p>
          <div className="text-right">
            <p className="text-[22px] font-extrabold tabular-nums text-app">
              {totalCompleted}
              <span className="font-semibold" style={{ color: "var(--muted)" }}>
                /{totalPossible}
              </span>
            </p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              proofs in
            </p>
            <p className="mt-2.5 text-[22px] font-extrabold tabular-nums" style={{ color: "var(--brand)" }}>
              {fullyIn}
              <span className="font-semibold" style={{ color: "var(--muted)" }}>
                /{people.length}
              </span>
            </p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              fully in
            </p>
          </div>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full" style={{ background: "var(--faint)" }}>
          <div
            className="a-meter h-full rounded-full"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--brand))" }}
          />
        </div>
      </section>

      {/* the podium */}
      {rankedPeople.length >= 3 ? (
        <section className="a-up app-surface overflow-hidden rounded-[22px] px-4 pb-5 pt-2" style={{ animationDelay: "180ms" }}>
          <LeaderboardPodium
            entries={rankedPeople.slice(0, 3).map((person, index) => ({
              id: person.profile.id,
              name: person.profile.display_name,
              avatarUrl: person.profile.avatarSignedUrl,
              score: person.score,
              rank: getDenseRank(rankedPeople, index),
              streak: person.currentStreak
            }))}
          />
        </section>
      ) : null}

      {/* the roster */}
      <div className="a-up pt-2" style={{ animationDelay: "220ms" }}>
        <div className="atelier-rule">
          <span className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: "var(--muted)" }}>
            The thirteen
          </span>
          <span className="atelier-tick" />
        </div>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
        {people.map((person, index) => {
          const count = getCompletionCount(person.todayItems, todayCategoryIds);
          const percent = Math.round((count / Math.max(todayCategories.length, 1)) * 100);
          const isMe = person.profile.id === currentUserId;
          const hotStreak = person.currentStreak >= 7;
          return (
            <button
              key={person.profile.id}
              onClick={() => setSelectedId(person.profile.id)}
              className="a-card app-button flex w-full items-center gap-3.5 rounded-[16px] px-4 py-[13px] text-left"
              style={{
                animationDelay: `${260 + index * 52}ms`,
                border: "1px solid transparent",
                background: isMe
                  ? "linear-gradient(120deg, var(--accent-dim), var(--surface)) padding-box, var(--card-edge) border-box"
                  : "linear-gradient(var(--surface), var(--surface)) padding-box, var(--card-edge) border-box",
                boxShadow: "var(--shadow)"
              }}
              title={`See ${getUserLabel(person.profile)}'s proof for today`}
            >
              <div
                className="completion-ring relative grid size-12 shrink-0 place-items-center rounded-full"
                data-full={count >= todayCategories.length}
                style={{ "--ring-value": `${percent}%` } as React.CSSProperties}
              >
                <div
                  className="absolute inset-[5px] overflow-hidden rounded-full"
                  style={{ background: "linear-gradient(150deg, var(--surface-strong), var(--bg-2))", border: "1px solid var(--faint)" }}
                >
                  {person.profile.avatarSignedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={person.profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="display-font absolute inset-0 grid place-items-center text-sm italic text-app">
                      {person.profile.display_name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="display-font truncate text-lg text-app">{person.profile.display_name}</span>
                  {isMe ? (
                    <span
                      className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.12em]"
                      style={{ color: "var(--accent)", border: "1px solid var(--accent-edge)" }}
                    >
                      YOU
                    </span>
                  ) : null}
                </div>
                <p className="mt-px truncate text-xs" style={{ color: "var(--muted)" }}>
                  {person.profile.goal_mode} · {count}/{todayCategories.length} proofs
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {hotStreak ? (
                  <span className="a-flick" aria-hidden>
                    <Flame className="size-3.5" style={{ color: "var(--brand)", fill: "var(--brand)" }} />
                  </span>
                ) : null}
                <span className="display-font text-[22px] italic" style={{ color: hotStreak ? "var(--brand)" : "var(--text)" }}>
                  {person.currentStreak}
                </span>
                <span className="text-[8.5px] font-bold uppercase leading-[1.05] tracking-[0.1em]" style={{ color: "var(--muted)" }}>
                  day
                  <br />
                  streak
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedPerson ? (
        <PersonDataDialog
          person={selectedPerson}
          categories={todayCategories}
          onClose={() => setSelectedId(null)}
          onOpenPoint={(point) => setOpenPoint({ person: selectedPerson, point })}
        />
      ) : null}

      {openPoint ? <DataPointDialog detail={openPoint} onClose={() => setOpenPoint(null)} /> : null}
    </div>
  );
}

function PersonDataDialog({
  person,
  categories,
  onClose,
  onOpenPoint
}: {
  person: Person;
  categories: CategoryMeta[];
  onClose: () => void;
  onOpenPoint: (point: DataPoint) => void;
}) {
  const points = useMemo(() => buildDataPoints(person, categories), [person, categories]);

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

function buildDataPoints(person: Person, categories: CategoryMeta[]): DataPoint[] {
  const latestWeight = person.latestWeight?.weight_value ?? person.profile.starting_weight;
  return categories.map((category) => {
    const item = person.todayItems.find((entry) => entry.category === category.id);
    const complete = item?.status === "uploaded" || item?.status === "excused";
    const restDayText = getRestDayAutoCreditLabel(category.id, item);
    const text =
      restDayText
        ? REST_DAY_AUTO_CREDIT_NOTE
        : category.id === "weight_scale_photo"
        ? `Weight: ${complete && latestWeight ? `${latestWeight}kg` : "Not entered today"}`
        : item?.note;
    return {
      id: category.id,
      label: category.label,
      helper: item?.status === "excused" ? "Rest day - photo optional" : complete ? "Complete today" : "Missing today",
      complete,
      icon: categoryIcons[category.id],
      text,
      item,
      imageUrl: item?.signedUrl ?? null
    };
  });
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

