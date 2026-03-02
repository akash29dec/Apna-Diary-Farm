// ========================================
// Summary Store (Zustand) — Phase 2
// ========================================

import { create } from 'zustand';
import type {
  Customer,
  DayStatus,
  CustomerMonthSummary,
  MonthSummary,
} from '@/types';
import { getEntriesByMonth, getPaymentsByCustomerMonth } from '@/services/localDB';
import { getAllCustomers } from '@/services/localDB';
import {
  buildCustomerMonthSummary,
  buildCalendarDayStatuses,
  buildMonthTotals,
} from '@/utils/summaryUtils';
import { getISTDateString } from '@/utils/dateHelpers';

interface SummaryState {
  selectedMonth: string; // YYYY-MM
  monthSummary: MonthSummary | null;
  customerSummaries: CustomerMonthSummary[];
  calendarDayStatuses: Map<string, DayStatus>;
  loading: boolean;

  setMonth: (yearMonth: string) => void;
  fetchMonthData: () => Promise<void>;
}

export const useSummaryStore = create<SummaryState>((set, get) => ({
  selectedMonth: getISTDateString().substring(0, 7), // current month
  monthSummary: null,
  customerSummaries: [],
  calendarDayStatuses: new Map(),
  loading: false,

  setMonth: (yearMonth: string) => {
    set({ selectedMonth: yearMonth });
  },

  fetchMonthData: async () => {
    const { selectedMonth } = get();
    set({ loading: true });

    try {
      // Load all entries for the month
      const monthEntries = await getEntriesByMonth(selectedMonth);

      // Load all active customers
      const customers: Customer[] = await getAllCustomers();

      // Build calendar day statuses
      const calendarDayStatuses = buildCalendarDayStatuses(
        monthEntries,
        customers,
        selectedMonth
      );

      // Build per-customer summaries
      const customerSummaries: CustomerMonthSummary[] = [];
      for (const customer of customers) {
        const customerEntries = monthEntries.filter(
          (e) => e.customer_id === customer.id
        );
        const customerPayments = await getPaymentsByCustomerMonth(
          customer.id,
          selectedMonth
        );
        const summary = await buildCustomerMonthSummary(
          customer,
          customerEntries,
          customerPayments,
          selectedMonth
        );
        customerSummaries.push(summary);
      }

      // Sort by name A-Z
      customerSummaries.sort((a, b) =>
        a.customer.name.localeCompare(b.customer.name)
      );

      // Build month totals
      const monthSummary = buildMonthTotals(customerSummaries);

      set({
        customerSummaries,
        monthSummary,
        calendarDayStatuses,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch month data:', err);
      set({ loading: false });
    }
  },
}));
