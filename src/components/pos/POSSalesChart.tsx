'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

// --- Types --------------------------------------------------------------------

interface DailyData {
  date: string; // ISO date e.g. "2026-08-04"
  revenue: number;
  orders: number;
}

interface POSSalesChartProps {
  daily: DailyData[];
  currency: string;
  loading?: boolean;
}

/** Internal type after we add the formatted label for XAxis. */
interface ChartEntry extends DailyData {
  label: string;
}

// --- Custom Tooltip -----------------------------------------------------------

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartEntry }>;
  label?: string;
  currency: string;
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 shadow-xl text-sm min-w-[148px]">
      <p className="text-slate-300 text-xs font-medium mb-1.5">{label}</p>
      <p className="text-white font-semibold tabular-nums">
        {currency}&nbsp;{entry.value.toLocaleString()}
      </p>
      <p className="text-slate-400 text-xs mt-0.5">
        {entry.payload.orders}&nbsp;order{entry.payload.orders !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export function POSSalesChart({ daily, currency, loading = false }: POSSalesChartProps) {
  /* Loading skeleton */
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="h-[220px] bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const maxRevenue = daily.length > 0 ? Math.max(...daily.map((d) => d.revenue)) : 0;
  const showYAxis  = maxRevenue >= 1000;

  /* Pre-format XAxis labels using date-fns */
  const data: ChartEntry[] = daily.map((d) => ({
    ...d,
    label: (() => {
      try {
        return format(parseISO(d.date), 'd MMM');
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 6, right: 4, left: showYAxis ? 0 : -28, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />

          <YAxis
            hide={!showYAxis}
            tickFormatter={(v: number) =>
              `${currency} ${(v / 1000).toFixed(0)}k`
            }
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />

          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={
                  props.payload as unknown as Array<{
                    value: number;
                    payload: ChartEntry;
                  }>
                }
                label={props.label as string}
                currency={currency}
              />
            )}
            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
          />

          <Bar
            dataKey="revenue"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={52}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
