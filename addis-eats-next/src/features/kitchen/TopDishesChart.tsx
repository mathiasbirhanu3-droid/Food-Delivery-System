'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DishPoint } from '@/lib/kitchen-analytics';

/**
 * Top dishes by units — horizontal bar (long names need width), zero-based,
 * units printed on the bars. Magnitude + number, never color alone.
 */
export default function TopDishesChart({ data }: { data: DishPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 'auto']} allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12, fill: '#8a8578' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)}
          />
          <Tooltip
            formatter={(value) => [String(value), 'Units ordered']}
            contentStyle={{ borderRadius: 12, border: '1px solid rgba(128,128,128,0.25)', background: '#fff', fontSize: 12 }}
          />
          <Bar dataKey="units" name="Units" fill="#0C7A4D" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList dataKey="units" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#8a8578' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}