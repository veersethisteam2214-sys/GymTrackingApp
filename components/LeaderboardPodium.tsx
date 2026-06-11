import { Crown, Flame } from "lucide-react";

export type PodiumEntry = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  score: number;
  rank: number;
};

const podiumSlots = [
  { position: 1, column: "podium-silver", height: "h-24 sm:h-28", rise: 220, pop: 520 },
  { position: 0, column: "podium-gold shine-sweep", height: "h-32 sm:h-40", rise: 440, pop: 760 },
  { position: 2, column: "podium-bronze", height: "h-20 sm:h-24", rise: 0, pop: 300 }
];

export function LeaderboardPodium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length < 3) return null;

  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {podiumSlots.map((slot) => {
        const entry = entries[slot.position];
        const isFirst = slot.position === 0;
        return (
          <div key={entry.id} className="flex min-w-0 flex-col items-center gap-2">
            <div className="podium-topper relative flex w-full min-w-0 flex-col items-center" style={{ animationDelay: `${slot.pop}ms` }}>
              {isFirst ? (
                <Crown className="crown-float absolute -top-6 left-1/2 size-6 -translate-x-1/2" style={{ color: "#f6c453" }} aria-hidden />
              ) : null}
              <PodiumAvatar name={entry.name} src={entry.avatarUrl} large={isFirst} />
              <p className="mt-2 w-full truncate text-center text-xs font-extrabold text-app">{entry.name}</p>
              <p className="display-font text-2xl font-extrabold leading-none" style={{ color: "var(--brand)" }}>
                {entry.score}
              </p>
            </div>
            <div className={`podium-col relative w-full rounded-t-2xl ${slot.height} ${slot.column}`} style={{ animationDelay: `${slot.rise}ms` }}>
              <span className="display-font absolute inset-x-0 bottom-2 text-center text-3xl font-extrabold" style={{ color: "rgba(16, 16, 16, 0.72)" }}>
                {entry.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PodiumAvatar({ name, src, large }: { name: string; src?: string | null; large: boolean }) {
  return (
    <div
      className={`brand-gradient relative grid shrink-0 place-items-center overflow-hidden rounded-3xl font-black text-black ${
        large ? "size-16 text-2xl" : "size-14 text-xl"
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

export function StreakFlame({ streak }: { streak: number }) {
  if (streak < 3) return null;
  const hot = streak >= 7;
  return (
    <span className={hot ? "flame-glow" : undefined} title={hot ? "On fire" : "Heating up"}>
      <Flame
        className={`size-5 ${hot ? "flame-flicker" : ""}`}
        style={{ color: hot ? "#ff7a38" : "#ffb020", fill: hot ? "rgba(255, 122, 56, 0.4)" : "transparent" }}
        aria-hidden
      />
    </span>
  );
}
