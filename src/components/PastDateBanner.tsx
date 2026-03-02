// ========================================
// Past Date Banner Component
// ========================================

import { CalendarCheck } from 'lucide-react';
import { useEntryStore } from '@/stores/entryStore';
import { formatShortDate, isToday, getISTDateString } from '@/utils/dateHelpers';

export default function PastDateBanner() {
  const { selectedDate, setSelectedDate, fetchEntries, fetchDrafts } = useEntryStore();

  if (isToday(selectedDate)) return null;

  const handleGoToToday = async () => {
    const today = getISTDateString();
    setSelectedDate(today);
    await Promise.all([fetchEntries(today), fetchDrafts(today)]);
  };

  return (
    <div className="bg-primary-light border border-border rounded-xl mx-4 mt-2 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <CalendarCheck size={20} className="text-primary-blue shrink-0" />
        <p className="text-helper text-text-primary font-poppins truncate">
          📅 Viewing entries for {formatShortDate(selectedDate)}
        </p>
      </div>
      <button
        onClick={handleGoToToday}
        className="shrink-0 px-3 py-2 bg-primary-blue text-white text-helper font-semibold rounded-lg font-poppins min-h-touch flex items-center"
        aria-label="Go to today"
      >
        Today
      </button>
    </div>
  );
}
