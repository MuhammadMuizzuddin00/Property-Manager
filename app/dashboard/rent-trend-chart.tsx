"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type MonthlyPoint = { month: string; collected: number };

export default function RentTrendChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f6b52" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3f6b52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `RM${v >= 1000 ? `${v / 1000}k` : v}`}
        />
        <Tooltip
          formatter={(value: number) => [`RM${value.toLocaleString()}`, "Collected"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="collected"
          stroke="#3f6b52"
          strokeWidth={2}
          fill="url(#collectedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
