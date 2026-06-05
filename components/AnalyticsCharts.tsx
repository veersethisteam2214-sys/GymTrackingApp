"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyCheckIn, Profile, WeightEntry } from "@/lib/types";

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
          <CartesianGrid strokeDasharray="3 3" stroke="#dce8de" />
          <XAxis dataKey="name" tick={{ fill: "#15231e", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#15231e", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="Complete" fill="#2e7d55" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Partial" fill="#f5bd4f" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Excused" fill="#5c8fd8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightTrend({ profiles, weights }: { profiles: Profile[]; weights: WeightEntry[] }) {
  const data = weights.slice(-20).map((entry) => ({
    date: entry.measured_at.slice(5, 10),
    value: Number(entry.weight_value),
    person: profiles.find((profile) => profile.id === entry.user_id)?.display_name ?? "User"
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce8de" />
          <XAxis dataKey="date" tick={{ fill: "#15231e", fontSize: 12 }} />
          <YAxis tick={{ fill: "#15231e", fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2e7d55" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

