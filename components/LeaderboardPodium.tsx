"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

export type PodiumEntry = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  score: number;
  rank: number;
  streak: number;
};

const SPARKS: Array<[number, number]> = [
  [-28, -22],
  [26, -28],
  [-36, 0],
  [36, -8],
  [-14, -36],
  [16, -38]
];

/* waits `delay` ms after mount, then eases 0 → target over `duration` */
function useDelayedCount(target: number, delay: number, duration: number) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (ts: number) => {
      const t = ts - t0 - delay;
      if (t >= duration) {
        setVal(target);
        return;
      }
      if (t > 0) setVal(target * (1 - Math.pow(1 - t / duration, 3)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // rAF pauses in hidden tabs — make sure the final value always lands
    const settle = window.setTimeout(() => setVal(target), delay + duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [target, delay, duration]);
  return val;
}

export function LeaderboardPodium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length < 3) return null;

  // visual order: silver · gold · bronze, columns spring up in rank-reveal order
  const cols = [
    { entry: entries[1], height: 92, delay: 380, column: "linear-gradient(180deg, #eef1f6, #b8c0cc 58%, #8794a4)", label: "#2a2f38" },
    { entry: entries[0], height: 136, delay: 700, column: "linear-gradient(180deg, var(--brand-soft), var(--brand) 52%, var(--brand-2))", label: "#2a230f", first: true },
    { entry: entries[2], height: 64, delay: 540, column: "linear-gradient(180deg, #e8c9a4, #c2855a 58%, #9a6536)", label: "#2a1c10" }
  ];

  return (
    <div className="relative pt-8">
      {/* spotlight bloom */}
      <div
        className="a-spot pointer-events-none absolute left-1/2 top-[-12px] h-[250px] w-[240px]"
        style={{ background: "radial-gradient(50% 58% at 50% 0%, color-mix(in srgb, var(--brand) 27%, transparent), transparent 70%)" }}
        aria-hidden
      />
      <div className="relative flex items-end justify-center gap-3">
        {cols.map((col) => (
          <PodiumColumn key={col.entry.id} {...col} />
        ))}
      </div>
    </div>
  );
}

function PodiumColumn({
  entry,
  height,
  delay,
  column,
  label,
  first
}: {
  entry: PodiumEntry;
  height: number;
  delay: number;
  column: string;
  label: string;
  first?: boolean;
}) {
  const score = Math.round(useDelayedCount(entry.score, delay + 250, 950));
  const rank = first ? 1 : height > 80 ? 2 : 3;
  const hotStreak = entry.streak >= 7;

  return (
    <div className="flex w-[94px] flex-col items-center sm:w-[110px]">
      {/* avatar drops in after its column lands */}
      <div className="a-pod-ava relative" style={{ animationDelay: `${delay + 160}ms` }}>
        {first ? (
          <>
            <svg
              width="30"
              height="23"
              viewBox="0 0 24 18"
              className="a-crown absolute -top-[25px] left-1/2 z-[2] -ml-[15px]"
              style={{ animationDelay: "1300ms", filter: "drop-shadow(0 4px 6px color-mix(in srgb, var(--brand-2) 65%, transparent))", fill: "var(--brand)" }}
              aria-hidden
            >
              <path d="M2 5l4 4 6-7 6 7 4-4-2 11H4L2 5z" />
            </svg>
            {SPARKS.map(([dx, dy], i) => (
              <span
                key={i}
                className="a-spark left-1/2 top-[-16px]"
                style={{ background: "var(--brand)", "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${1380 + i * 40}ms` } as React.CSSProperties}
                aria-hidden
              />
            ))}
          </>
        ) : null}
        <PodiumAvatar name={entry.name} src={entry.avatarUrl} size={first ? 62 : 50} gold={!!first} />
      </div>
      <p className="display-font mt-2 max-w-full truncate text-[15px] italic text-app">{entry.name}</p>
      <p
        className="a-pop text-[17px] font-extrabold tabular-nums"
        style={{ color: first ? "var(--brand)" : "var(--text)", animationDelay: `${delay + 920}ms` }}
      >
        {score}
      </p>
      <div className="mt-px flex items-center gap-1">
        {hotStreak ? (
          <span className="a-flick" aria-hidden>
            <Flame className="size-3" style={{ color: "var(--brand)", fill: "var(--brand)" }} />
          </span>
        ) : null}
        <span className="text-[10.5px] font-extrabold tracking-[0.04em]" style={{ color: hotStreak ? "var(--brand)" : "var(--muted)" }}>
          {entry.streak}d
        </span>
      </div>
      {/* column springs up with overshoot */}
      <div
        className="a-podium-col relative mt-2 flex w-full justify-center overflow-hidden rounded-t-[10px] pt-2"
        style={{
          height,
          background: column,
          animationDelay: `${delay}ms`,
          boxShadow: first ? "0 14px 40px -10px color-mix(in srgb, var(--brand) 55%, transparent)" : "none"
        }}
      >
        <span className="display-font text-[26px]" style={{ color: label, fontWeight: 700 }}>
          {rank}
        </span>
        {first ? <span className="a-shine" style={{ animationDelay: "1500ms" }} aria-hidden /> : null}
      </div>
    </div>
  );
}

function PodiumAvatar({ name, src, size, gold }: { name: string; src?: string | null; size: number; gold: boolean }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(150deg, var(--surface-strong), var(--bg-2))",
        border: "1px solid var(--line-2)",
        boxShadow: gold
          ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 2px color-mix(in srgb, var(--brand) 55%, transparent), 0 0 14px color-mix(in srgb, var(--brand) 30%, transparent)"
          : "inset 0 1px 0 rgba(255,255,255,0.06)"
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="display-font italic text-app" style={{ fontSize: size * 0.34 }}>
          {name.slice(0, 1).toUpperCase()}
        </span>
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
        className={`size-4 ${hot ? "flame-flicker" : ""}`}
        style={{ color: "var(--brand)", fill: hot ? "var(--brand)" : "transparent" }}
        aria-hidden
      />
    </span>
  );
}
