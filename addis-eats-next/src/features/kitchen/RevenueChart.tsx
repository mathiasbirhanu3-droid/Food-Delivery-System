'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatETB } from '@/lib/format-etb';
import type { DayPoint } from '@/lib/kitchen-analytics';

/**
 * Revenue over time — area chart. Defense (docs/CHARTS.md): time series →
 * line/area; Y starts at zero (no truncated-axis lie); every day in the
 * window is present. Fixed-height wrapper → hydration can never shift
 * layout (CLS guard, PERF.md).
 */
export default function RevenueChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.25)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8578' }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis
            domain={[0, 'auto']}
            allowDecimals={false}
            width={48}
            tick={{ fontSize: 11, fill: '#8a8578' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
          />
          <Tooltip
            formatter={(value) => [formatETB(Number(value)), 'Revenue']}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(128,128,128,0.25)',
              background: '#fff',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#0C7A4D"
            strokeWidth={2}
            fill="#0C7A4D"
            fillOpacity={0.15}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}