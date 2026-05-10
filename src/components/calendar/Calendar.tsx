'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

interface CalendarEvent {
  date: string;
  type: 'booked' | 'blocked' | 'available';
  title?: string;
  guestName?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onBlockDate?: (startDate: string, endDate: string) => void;
}

export function Calendar({ events = [], onDateClick, onBlockDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const days = [];
  const totalDays = daysInMonth(currentDate);
  const firstDay = firstDayOfMonth(currentDate);

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getEventForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.find((e) => e.date === dateStr);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'booked':
        return 'bg-primary-600 text-white';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'available':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-surface-100 text-surface-800';
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateClick?.(dateStr);
  };

  const handleDateRangeClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr);

    if (!selectedRange.start) {
      setSelectedRange({ start: date, end: null });
    } else if (!selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
      // Call onBlockDate with the range
      const startStr = selectedRange.start.toISOString().split('T')[0];
      const endStr = date.toISOString().split('T')[0];
      onBlockDate?.(startStr, endStr);
      setSelectedRange({ start: null, end: null });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-900">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
              )
            }
            className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50"
          >
            ← Previous
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50"
          >
            Today
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
              )
            }
            className="px-4 py-2 border border-surface-300 rounded-lg hover:bg-surface-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span className="text-sm text-surface-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-surface-600">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-surface-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-surface-100 border border-surface-300 rounded"></div>
          <span className="text-sm text-surface-600">Empty</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-surface-600 py-2"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const event = getEventForDate(day);
          const isInRange =
            selectedRange.start &&
            selectedRange.end &&
            new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            ) >= selectedRange.start &&
            new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            ) <= selectedRange.end;

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`aspect-square p-2 rounded-lg border-2 transition-colors text-sm font-medium ${
                event
                  ? getEventColor(event.type)
                  : isInRange
                  ? 'bg-primary-100 border-primary-300'
                  : 'bg-surface-50 border-surface-200 hover:bg-surface-100'
              }`}
            >
              <div className="font-bold">{day}</div>
              {event && (
                <div className="text-xs mt-1 truncate">
                  {event.type === 'booked' ? '🔒' : '🚫'} {event.title}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 Click on dates to view details. Select a date range to block dates for maintenance.
        </p>
      </div>
    </div>
  );
}
