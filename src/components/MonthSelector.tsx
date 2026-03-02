// ========================================
// Month Selector Component (Phase 2)
// ========================================

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthLabel, getAdjacentMonth } from '@/utils/summaryUtils';

interface MonthSelectorProps {
  selectedMonth: string; // YYYY-MM
  onMonthChange: (yearMonth: string) => void;
}

export default function MonthSelector({
  selectedMonth,
  onMonthChange,
}: MonthSelectorProps) {
  const handlePrev = () => onMonthChange(getAdjacentMonth(selectedMonth, -1));
  const handleNext = () => onMonthChange(getAdjacentMonth(selectedMonth, 1));

  return (
    <div className="flex items-center justify-between bg-surface rounded-2xl px-4 py-3 shadow-sm border border-border">
      <button
        onClick={handlePrev}
        className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-primary-light transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-6 h-6 text-primary-blue" />
      </button>

      <span className="text-body font-semibold text-text-primary font-poppins">
        {formatMonthLabel(selectedMonth)}
      </span>

      <button
        onClick={handleNext}
        className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-primary-light transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-6 h-6 text-primary-blue" />
      </button>
    </div>
  );
}
