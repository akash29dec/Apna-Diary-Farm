// ========================================
// Summary Screen — Monthly Summary (Route: /summary)
// ========================================

import { useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import MonthSelector from '@/components/MonthSelector';
import CalendarWidget from '@/components/CalendarWidget';
import MonthSummaryCards from '@/components/MonthSummaryCards';
import CustomerSummaryCard from '@/components/CustomerSummaryCard';
import { useSummaryStore } from '@/stores/summaryStore';
import { Loader2 } from 'lucide-react';

export default function SummaryScreen() {
  const {
    selectedMonth,
    setMonth,
    fetchMonthData,
    monthSummary,
    customerSummaries,
    calendarDayStatuses,
    loading,
  } = useSummaryStore();

  useEffect(() => {
    fetchMonthData();
  }, [selectedMonth, fetchMonthData]);

  const handleMonthChange = (yearMonth: string) => {
    setMonth(yearMonth);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <AppHeader />
      <div className="h-14" />

      <div className="flex-1 px-4 pb-24 space-y-4 pt-4">
        {/* Month Selector */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Calendar Widget */}
        <CalendarWidget
          selectedMonth={selectedMonth}
          dayStatuses={calendarDayStatuses}
        />

        {/* Summary Cards */}
        <MonthSummaryCards summary={monthSummary} />

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
          </div>
        ) : customerSummaries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-text-secondary font-poppins">
              No customers found. Add customers from the Daily Entry screen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-label font-semibold text-text-primary font-poppins">
              Customers ({customerSummaries.length})
            </h3>
            {customerSummaries.map((summary) => (
              <CustomerSummaryCard
                key={summary.customer.id}
                summary={summary}
                selectedMonth={selectedMonth}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
