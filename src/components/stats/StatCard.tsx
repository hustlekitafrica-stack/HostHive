'use client';

import { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  percent: number;
  color: 'red' | 'green' | 'blue' | 'amber';
}

const colorMap = {
  red: {
    text: 'text-red-600',
    bar: 'bg-red-500',
    bg: 'bg-red-50',
  },
  green: {
    text: 'text-green-600',
    bar: 'bg-green-500',
    bg: 'bg-green-50',
  },
  blue: {
    text: 'text-blue-600',
    bar: 'bg-blue-500',
    bg: 'bg-blue-50',
  },
  amber: {
    text: 'text-amber-600',
    bar: 'bg-amber-500',
    bg: 'bg-amber-50',
  },
};

export function StatCard({ label, value, percent, color }: StatCardProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    // Animate bar on mount
    const timer = setTimeout(() => {
      setAnimatedPercent(percent);
    }, 100);

    return () => clearTimeout(timer);
  }, [percent]);

  const colors = colorMap[color];

  return (
    <div className={`${colors.bg} rounded-xl p-4 border border-gray-200 flex flex-col gap-3 min-w-fit`}>
      {/* Label */}
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </p>

      {/* Value */}
      <p className={`text-2xl font-bold ${colors.text}`}>
        {value}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-300 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${colors.bar} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${animatedPercent}%` }}
        ></div>
      </div>
    </div>
  );
}
