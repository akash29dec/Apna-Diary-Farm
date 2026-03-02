// ========================================
// Date Picker Modal Component
// ========================================

import { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  startOfDay,
} from 'date-fns';
import { getISTNow } from '@/utils/dateHelpers';

interface DatePickerModalProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export default function DatePickerModal({
  selectedDate,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const selected = new Date(selectedDate + 'T00:00:00');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selected));
  const today = startOfDay(getISTNow());

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows: Date[][] = [];
    let day = calStart;
    let week: Date[] = [];

    while (day <= calEnd) {
      week.push(day);
      if (week.length === 7) {
        rows.push(week);
        week = [];
      }
      day = addDays(day, 1);
    }

    return rows;
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    if (isAfter(startOfDay(day), today)) return;
    onSelect(format(day, 'yyyy-MM-dd'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary-blue p-4">
          <h2 className="text-lg font-bold text-white font-poppins">Select Date</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-touch min-h-touch"
            aria-label="Close date picker"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="flex items-center justify-center min-w-touch min-h-touch rounded-lg hover:bg-primary-light"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} className="text-primary-blue" />
          </button>
          <span className="text-body font-semibold text-text-primary font-poppins">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="flex items-center justify-center min-w-touch min-h-touch rounded-lg hover:bg-primary-light"
            aria-label="Next month"
          >
            <ChevronRight size={24} className="text-primary-blue" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className="text-center text-helper font-medium text-text-secondary py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="px-2 pb-4">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const isFuture = isAfter(startOfDay(day), today);
                const isSelected = isSameDay(day, selected);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isSameDay(day, today);

                return (
                  <button
                    key={di}
                    onClick={() => handleDayClick(day)}
                    disabled={isFuture}
                    className={`flex items-center justify-center h-10 w-full rounded-lg text-label font-poppins transition-colors ${
                      !isCurrentMonth
                        ? 'text-text-secondary/40'
                        : isFuture
                        ? 'text-text-secondary/30 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary-blue text-white font-bold'
                        : isTodayDate
                        ? 'bg-primary-light text-primary-blue font-bold'
                        : 'text-text-primary hover:bg-primary-light'
                    }`}
                    aria-label={`Select ${format(day, 'd MMMM yyyy')}`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Go to Today button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => onSelect(format(today, 'yyyy-MM-dd'))}
            className="w-full py-3 bg-primary-light text-primary-blue font-semibold rounded-xl text-body font-poppins hover:bg-border transition-colors min-h-touch"
            aria-label="Go to today"
          >
            Go to Today
          </button>
        </div>
      </div>
    </div>
  );
}
