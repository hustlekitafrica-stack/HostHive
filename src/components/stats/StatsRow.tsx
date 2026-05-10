'use client';

import { StatCard } from './StatCard';

interface StatsRowProps {
  rate?: number;
  occupied?: number;
  available?: number;
  blocked?: number;
}

export function StatsRow({
  rate = 10,
  occupied = 1,
  available = 1,
  blocked = 0,
}: StatsRowProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <StatCard
        label="Rate"
        value={`${rate}%`}
        percent={rate}
        color="red"
      />
      <StatCard
        label="Occupied"
        value={occupied}
        percent={Math.min(occupied * 40, 100)}
        color="green"
      />
      <StatCard
        label="Available"
        value={available}
        percent={Math.min(available * 30, 100)}
        color="blue"
      />
      <StatCard
        label="Blocked"
        value={blocked}
        percent={Math.min(blocked * 50, 100)}
        color="amber"
      />
    </div>
  );
}
