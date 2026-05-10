'use client';

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors = [
    '#0f766e', // primary
    '#f59e0b', // accent
    '#10b981', // green
    '#3b82f6', // blue
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-surface-900 mb-4">{title}</h3>}
      <div style={{ height: `${height}px` }} className="flex items-flex-end gap-4">
        {data.map((item, index) => (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-flex-end justify-center">
              <div
                className="w-full rounded-t-lg transition-all hover:opacity-80"
                style={{
                  height: `${(item.value / maxValue) * height}px`,
                  backgroundColor: item.color || colors[index % colors.length],
                }}
              />
            </div>
            <span className="text-xs text-surface-600 text-center truncate w-full">
              {item.label}
            </span>
            <span className="text-sm font-bold text-surface-900">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
