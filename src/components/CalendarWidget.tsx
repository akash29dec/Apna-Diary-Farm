// ========================================
// Calendar Widget Component (Phase 2)
// ========================================

import { useNavigate } from 'react-router-dom';
import type { DayStatus } from '@/types';
import { getDaysInMonth, getDay } from 'date-fns';

interface CalendarWidgetProps {
  selectedMonth: string; // YYYY-MM
  dayStatuses: Map<string, DayStatus>;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarWidget({
  selectedMonth,
  dayStatuses,
}: CalendarWidgetProps) {
  const navigate = useNavigate();

  const parts = selectedMonth.split('-');
  const year = parseInt(parts[0] ?? '2026', 10);
  const month = parseInt(parts[1] ?? '1', 10) - 1; // 0-indexed
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDayOfWeek = getDay(new Date(year, month, 1)); // 0=Sun

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleDayClick = (dateStr: string) => {
    const dayDate = new Date(dateStr + 'T00:00:00');
    if (dayDate > today) return;
    navigate(`/?date=${dateStr}`);
  };

  const getDotColor = (status: DayStatus): string => {
    switch (status) {
      case 'complete':
        return 'bg-accent-green';
      case 'partial':
        return 'bg-amber-400';
      case 'none':
      default:
        return 'bg-gray-300';
    }
  };

  // Build cells: leading blanks + day cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="bg-surface rounded-2xl p-3 shadow-sm border border-border">
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-helper text-text-secondary font-poppins font-medium"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="h-10" />;
          }

          const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
          const status = dayStatuses.get(dateStr) ?? 'none';
          const isToday = dateStr === todayStr;
          const isFuture = new Date(dateStr + 'T00:00:00') > today;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              disabled={isFuture}
              className={`flex flex-col items-center justify-center h-10 rounded-lg transition-colors
                ${isToday ? 'bg-primary-light ring-2 ring-primary-blue' : ''}
                ${isFuture ? 'opacity-40 cursor-default' : 'hover:bg-primary-light cursor-pointer'}
              `}
              aria-label={`${day} ${selectedMonth} — ${status}`}
            >
              <span
                className={`text-sm font-poppins ${
                  isToday ? 'font-bold text-primary-blue' : 'text-text-primary'
                }`}
              >
                {day}
              </span>
              {!isFuture && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${getDotColor(status)}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
