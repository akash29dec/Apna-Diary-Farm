// ========================================
// Date Navigator Component
// ========================================

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useEntryStore } from '@/stores/entryStore';
import { formatDisplayDate, getNextDay, getPrevDay, isToday, isFutureDate } from '@/utils/dateHelpers';
import { useState } from 'react';
import DatePickerModal from '@/components/DatePickerModal';

export default function DateNavigator() {
  const { selectedDate, setSelectedDate, fetchEntries, fetchDrafts } = useEntryStore();
  const [showPicker, setShowPicker] = useState(false);

  const isNextDisabled = isToday(selectedDate) || isFutureDate(selectedDate);

  const handlePrev = async () => {
    const prev = getPrevDay(selectedDate);
    setSelectedDate(prev);
    await Promise.all([fetchEntries(prev), fetchDrafts(prev)]);
  };

  const handleNext = async () => {
    if (isNextDisabled) return;
    const next = getNextDay(selectedDate);
    setSelectedDate(next);
    await Promise.all([fetchEntries(next), fetchDrafts(next)]);
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setShowPicker(false);
    await Promise.all([fetchEntries(date), fetchDrafts(date)]);
  };

  return (
    <>
      <div className="sticky top-14 z-40 flex items-center justify-between bg-surface px-2 py-2 shadow-sm border-b border-border">
        <button
          onClick={handlePrev}
          className="flex items-center justify-center min-w-touch min-h-touch rounded-lg hover:bg-primary-light transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={28} className="text-primary-blue" />
        </button>

        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary-light transition-colors"
          aria-label="Open date picker"
        >
          <span className="text-h2 font-semibold text-text-primary font-poppins">
            {formatDisplayDate(selectedDate)}
          </span>
          <Calendar size={20} className="text-primary-blue" />
        </button>

        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`flex items-center justify-center min-w-touch min-h-touch rounded-lg transition-colors ${
            isNextDisabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-primary-light'
          }`}
          aria-label="Next day"
        >
          <ChevronRight
            size={28}
            className={isNextDisabled ? 'text-text-secondary' : 'text-primary-blue'}
          />
        </button>
      </div>

      {showPicker && (
        <DatePickerModal
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
