// ========================================
// Summary Utility Functions (Phase 2)
// ========================================

import type {
  Customer,
  DailyEntry,
  Payment,
  DayStatus,
  CustomerMonthSummary,
  MonthSummary,
  PastDueRecord,
} from '@/types';
import {
  getAllEntriesForCustomer,
  getAllPaymentsByCustomer,
} from '@/services/localDB';
import { format, getDaysInMonth, parse } from 'date-fns';

/**
 * Sum total_amount for entries in a given list
 */
export function calculateMonthBilled(entries: DailyEntry[]): number {
  return entries.reduce((sum, e) => sum + e.total_amount, 0);
}

/**
 * Sum amount_paid for payments in a given list
 */
export function calculateMonthPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amount_paid, 0);
}

/**
 * Get unique months from entries (YYYY-MM strings), sorted ascending
 */
function getUniqueMonths(entries: DailyEntry[], payments: Payment[]): string[] {
  const monthSet = new Set<string>();
  for (const e of entries) {
    monthSet.add(e.entry_date.substring(0, 7));
  }
  for (const p of payments) {
    monthSet.add(p.payment_date.substring(0, 7));
  }
  return Array.from(monthSet).sort();
}

/**
 * Calculate past dues for a customer before a given month.
 * Iterates all prior months, computing billed - paid per month.
 */
export async function calculatePastDues(
  customerId: string,
  beforeMonth: string
): Promise<PastDueRecord[]> {
  const allEntries = await getAllEntriesForCustomer(customerId);
  const allPayments = await getAllPaymentsByCustomer(customerId);

  const months = getUniqueMonths(allEntries, allPayments).filter(
    (m) => m < beforeMonth
  );

  const pastDues: PastDueRecord[] = [];
  for (const month of months) {
    const monthEntries = allEntries.filter(
      (e) => e.entry_date.startsWith(month) && e.total_amount > 0
    );
    const monthPayments = allPayments.filter((p) =>
      p.payment_date.startsWith(month)
    );
    const billed = calculateMonthBilled(monthEntries);
    const paid = calculateMonthPaid(monthPayments);
    const due = billed - paid;

    if (billed > 0 || paid > 0) {
      const d = parse(month, 'yyyy-MM', new Date());
      pastDues.push({
        month,
        monthLabel: format(d, 'MMMM yyyy'),
        billed,
        paid,
        due,
      });
    }
  }

  return pastDues;
}

/**
 * Build a complete CustomerMonthSummary for display
 */
export async function buildCustomerMonthSummary(
  customer: Customer,
  entries: DailyEntry[],
  payments: Payment[],
  month: string
): Promise<CustomerMonthSummary> {
  const positiveEntries = entries.filter((e) => e.total_amount > 0);
  const totalMilkL = positiveEntries.reduce((sum, e) => sum + e.milk_qty, 0);
  const totalPaneerKg = positiveEntries.reduce((sum, e) => sum + e.paneer_qty, 0);
  const totalDahiKg = positiveEntries.reduce((sum, e) => sum + e.dahi_qty, 0);
  const billed = calculateMonthBilled(positiveEntries);
  const paid = calculateMonthPaid(payments);
  const due = billed - paid;

  const pastDues = await calculatePastDues(customer.id, month);
  const totalPastDue = pastDues.reduce((sum, r) => sum + Math.max(0, r.due), 0);
  const totalOutstanding = due + totalPastDue;

  return {
    customer,
    totalMilkL,
    totalPaneerKg,
    totalDahiKg,
    billed,
    paid,
    due,
    pastDues,
    totalPastDue,
    totalOutstanding,
  };
}

/**
 * Build calendar day status map for a given month.
 * Returns a Map<dateString, DayStatus> where dateString is 'YYYY-MM-DD'.
 */
export function buildCalendarDayStatuses(
  entries: DailyEntry[],
  customers: Customer[],
  yearMonth: string
): Map<string, DayStatus> {
  const statusMap = new Map<string, DayStatus>();
  const parts = yearMonth.split('-');
  const y = parseInt(parts[0] ?? '2026', 10);
  const m = parseInt(parts[1] ?? '1', 10) - 1; // 0-indexed for Date
  const daysInMonth = getDaysInMonth(new Date(y, m));
  const activeCustomerCount = customers.length;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
    const today = new Date();
    const dayDate = new Date(y, m, d);

    if (dayDate > today) {
      statusMap.set(dateStr, 'none');
      continue;
    }

    const dayEntries = entries.filter(
      (e) => e.entry_date === dateStr && e.total_amount >= 0
    );

    if (dayEntries.length === 0) {
      statusMap.set(dateStr, 'none');
    } else if (dayEntries.length >= activeCustomerCount && activeCustomerCount > 0) {
      statusMap.set(dateStr, 'complete');
    } else {
      statusMap.set(dateStr, 'partial');
    }
  }

  return statusMap;
}

/**
 * Aggregate month totals across all customer summaries
 */
export function buildMonthTotals(
  customerSummaries: CustomerMonthSummary[]
): MonthSummary {
  return {
    totalBilled: customerSummaries.reduce((sum, cs) => sum + cs.billed, 0),
    totalPaid: customerSummaries.reduce((sum, cs) => sum + cs.paid, 0),
    totalDue: customerSummaries.reduce(
      (sum, cs) => sum + cs.totalOutstanding,
      0
    ),
  };
}

/**
 * Format a month string "YYYY-MM" → "February 2026"
 */
export function formatMonthLabel(yearMonth: string): string {
  const d = parse(yearMonth, 'yyyy-MM', new Date());
  return format(d, 'MMMM yyyy');
}

/**
 * Get previous/next month as YYYY-MM string
 */
export function getAdjacentMonth(yearMonth: string, direction: -1 | 1): string {
  const parts = yearMonth.split('-');
  const y = parseInt(parts[0] ?? '2026', 10);
  const m = parseInt(parts[1] ?? '1', 10) - 1;
  const d = new Date(y, m + direction, 1);
  return format(d, 'yyyy-MM');
}
