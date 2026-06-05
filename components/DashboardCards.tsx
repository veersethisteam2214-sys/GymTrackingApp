import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Camera,
  Dumbbell,
  Flame,
  GlassWater,
  Scale,
  Target,
  Zap
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

const statusCopy: Record<DailyStatus, string> = {
  complete: "Locked in",
  partial: "In progress",
  missing: "Open",
  excused: "Rest day"
};

const categoryIcons: Record<CheckInCategory, React.ReactNode> = {
  progress_photo: <Dumbbell className="size-4" />,
  treadmill_photo: <Activity className="size-4" />,
  weight_scale_photo: <Scale className="size-4" />,
  protein_shake_photo: <GlassWater className="size-4" />,
  reading_proof: <BookOpen className="size-4" />
};

export function DashboardCards({ people, currentUserId }: { people: Person[]; currentUserId: string }) {
  if (people.length === 0) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">No profiles yet</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Enter the shared app password, then save a profile to start tracking.
        </p>
      </section>
    );
  }

  const totalCompleted = people.reduce((sum, person) => sum + getCompletionCount(person.todayItems), 0);
  const totalPossible = Math.max(people.length * CATEGORIES.length, 1);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-ink text-white shadow-soft">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-mint/75">Live discipline feed</p>
              <h2 className="mt-2 text-3xl font-semibold">Today command center</h2>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
              <p className="text-xs text-white/55">Total</p>
              <p className="text-xl font-semibold">
                {totalCompleted}/{totalPossible}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-mint" style={{ width: `${(totalCompleted / totalPossible) * 100}%` }} />
          </div>
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-5">
          {people.map((person) => (
            <PersonOverview key={person.profile.id} person={person} isMe={person.profile.id === currentUserId} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PersonOverview({ person, isMe }: { person: Person; isMe: boolean }) {
  const count = getCompletionCount(person.todayItems);
  const latestWeight = person.latestWeight?.weight_value ?? person.profile.starting_weight;
  const goalDelta =
    latestWeight && person.profile.target_weight ? Number(latestWeight) - Number(person.profile.target_weight) : null;
  const proofItems = CATEGORIES.map((category) => ({
    category,
    item: person.todayItems.find((entry) => entry.category === category.id)
  }));

  return (
    <section className="bg-ink p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            {isMe ? "Your station" : "Group station"}
          </p>
          <h3 className="mt-1 truncate text-2xl font-semibold text-white">{person.profile.display_name}</h3>
          <p className="mt-1 text-sm text-white/48">
            {statusCopy[person.todayStatus]} / {count}/{CATEGORIES.length} today
          </p>
        </div>
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white text-ink">
          {person.profile.avatarSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.profile.avatarSignedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-black">{person.profile.display_name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Signal icon={<Flame className="size-4" />} label="Streak" value={`${person.currentStreak}d`} />
        <Signal icon={<Scale className="size-4" />} label="Weight" value={latestWeight ? `${latestWeight}kg` : "--"} />
        <Signal icon={<Zap className="size-4" />} label="Mode" value={person.profile.goal_mode} />
      </div>

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/7 p-3">
        <div className="flex items-center gap-2 text-mint">
          <Target className="size-4" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">Goal</p>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-sm font-bold text-white">
            {person.profile.target_weight ? `${person.profile.target_weight}kg` : "No goal set"}
          </p>
          <p className="text-xs font-semibold text-white/45">
            {person.profile.target_date ? person.profile.target_date : "No date"}
          </p>
        </div>
        {goalDelta !== null ? (
          <p className="mt-1 text-xs font-semibold text-white/55">{Math.abs(goalDelta).toFixed(1)}kg from target</p>
        ) : null}
      </div>

      <div className="mt-2 rounded-2xl border border-white/10 bg-white/7 p-3">
        <div className="flex items-center gap-2 text-violet-300">
          <BookOpen className="size-4" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">Reading</p>
        </div>
        <p className="mt-2 truncate text-sm font-bold text-white">
          {person.profile.current_book_title ?? "No book set"}
        </p>
        <p className="mt-1 text-xs font-semibold text-white/50">
          {person.latestReading
            ? `Page ${person.latestReading.current_page}${person.latestReading.total_pages ? `/${person.latestReading.total_pages}` : ""}`
            : person.completedBooks[0]
              ? `Finished ${person.completedBooks[0].title}`
              : "10 pages/day"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {proofItems.map(({ category, item }) => (
          <ProofTile
            key={category.id}
            categoryId={category.id}
            label={category.shortLabel}
            item={item}
            weightValue={category.id === "weight_scale_photo" ? latestWeight : null}
          />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {isMe ? (
          <Link
            href="/today"
            className="app-button flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-mint px-4 text-sm font-bold text-ink hover:bg-white"
          >
            <Camera className="size-4" aria-hidden />
            Upload
          </Link>
        ) : null}
        <Link
          href={`/user/${person.profile.id}`}
          className="app-button flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 text-sm font-bold text-white hover:bg-white hover:text-ink"
        >
          Overview
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function ProofTile({
  categoryId,
  label,
  item,
  weightValue
}: {
  categoryId: CheckInCategory;
  label: string;
  item?: CheckInItem;
  weightValue?: number | null;
}) {
  const isWeight = categoryId === "weight_scale_photo";

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/7">
      {isWeight && item?.status === "uploaded" ? (
        <div className="flex h-full flex-col items-center justify-center text-white">
          <Scale className="size-5 text-mint" aria-hidden />
          <span className="mt-1 text-xs font-black">{weightValue ? `${weightValue}kg` : "Saved"}</span>
        </div>
      ) : item?.signedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.signedUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-white/40">
          {categoryIcons[categoryId]}
          <span className="text-[10px] font-bold">{label}</span>
        </div>
      )}
      {item?.signedUrl ? (
        <div className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 text-[10px] font-bold text-white">{label}</div>
      ) : null}
    </div>
  );
}

function Signal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-3">
      <div className="text-mint">{icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
