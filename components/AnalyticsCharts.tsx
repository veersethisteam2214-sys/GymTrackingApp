"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyCheckIn, Profile, WeightEntry } from "@/lib/types";

const palette = ["#7db7ff", "#8ee6ff", "#ffb020", "#ff6a4f", "#b9a7ff", "#5ff0c5", "#ff8ad8", "#9fd86b", "#77a8ff", "#d5e7ff", "#f6c453", "#6ee7b7", "#f0abfc"];

export function getProfileChartColor(profileId: string) {
  let hash = 0;
  for (let index = 0; index < profileId.length; index += 1) {
    hash = (hash * 31 + profileId.charCodeAt(index)) % palette.length;
  }
  return palette[Math.abs(hash) % palette.length];
}

export function CompletionBars({ profiles, checkins }: { profiles: Profile[]; checkins: DailyCheckIn[] }) {
  const data = profiles.map((profile) => {
    const mine = checkins.filter((checkin) => checkin.user_id === profile.id);
    return {
      name: profile.display_name,
      Complete: mine.filter((item) => item.overall_status === "complete").length,
      Partial: mine.filter((item) => item.overall_status === "partial").length,
      Excused: mine.filter((item) => item.overall_status === "excused").length
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,183,255,.18)" />
          <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="Complete" fill="#7db7ff" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Partial" fill="#ffb020" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Excused" fill="#8ee6ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightTrend({ profiles, weights }: { profiles: Profile[]; weights: WeightEntry[] }) {
  const selectedIds = new Set(profiles.map((profile) => profile.id));
  const selectedWeights = weights.filter((entry) => selectedIds.has(entry.user_id)).slice(-80);
  const dates = Array.from(new Set(selectedWeights.map((entry) => entry.measured_at.slice(5, 10))));
  const data = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    profiles.forEach((profile) => {
      const match = selectedWeights
        .filter((entry) => entry.user_id === profile.id && entry.measured_at.slice(5, 10) === date)
        .at(-1);
      row[profile.display_name] = match ? Number(match.weight_value) : null;
    });
    return row;
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,183,255,.18)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <Tooltip />
          {profiles.map((profile) => {
            const color = getProfileChartColor(profile.id);
            return (
            <Line
              key={profile.id}
              type="monotone"
              dataKey={profile.display_name}
              stroke={color}
              strokeWidth={3}
              connectNulls
              dot={{ r: 4, fill: color, stroke: "var(--surface-strong)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color, stroke: "var(--text)", strokeWidth: 2 }}
            />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
