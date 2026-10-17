'use client';

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { StatusPoint } from '@/lib/kitchen-analytics';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  delivering: 'Delivering',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Status distribution — horizontal bar, zero-based, every status row present
 * (a zero row is information). Pie/donut rejected: five categories read
 * poorly as angles (docs/CHARTS.md, lie #4). Counts printed on the bars.
 */
export default function StatusChart({ data }: { data: StatusPoint[] }) {
  const rows = data.map((d) => ({ ...d, name: STATUS_LABEL[d.status] ?? d.status }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, 'auto']} allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 12, fill: '#8a8578' }}
            tickLine={false}
            axisLine={false}
          />
          <Bar dataKey="count" name="Orders" fill="#E9B44C" radius={[0, 6, 6, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#8a8578' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}