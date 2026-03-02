// ========================================
// Customer Ordering Logic
// ========================================

import type { Customer, DailyEntry } from '@/types';
import { isToday } from '@/utils/dateHelpers';

/**
 * Sort customers for display on a given date.
 *
 * TODAY:
 *   - Unsaved customers sorted A–Z at the top
 *   - Saved customers at the bottom, in order of save time (created_at)
 *
 * PAST DATE:
 *   - Customers with entries sorted A–Z at the top
 *   - Customers without entries sorted A–Z below
 */
export function sortCustomersForDate(
  customers: Customer[],
  entries: DailyEntry[],
  date: string
): Customer[] {
  const entryMap = new Map<string, DailyEntry>();
  for (const entry of entries) {
    if (!entry.is_draft) {
      entryMap.set(entry.customer_id, entry);
    }
  }

  const withEntry: Customer[] = [];
  const withoutEntry: Customer[] = [];

  for (const customer of customers) {
    if (entryMap.has(customer.id)) {
      withEntry.push(customer);
    } else {
      withoutEntry.push(customer);
    }
  }

  if (isToday(date)) {
    // Today: unsaved A–Z at top, saved ordered by save time at bottom
    withoutEntry.sort((a, b) => a.name.localeCompare(b.name));
    withEntry.sort((a, b) => {
      const entryA = entryMap.get(a.id);
      const entryB = entryMap.get(b.id);
      if (!entryA || !entryB) return 0;
      return new Date(entryA.created_at).getTime() - new Date(entryB.created_at).getTime();
    });
    return [...withoutEntry, ...withEntry];
  } else {
    // Past: entries A–Z at top, no-entry A–Z below
    withEntry.sort((a, b) => a.name.localeCompare(b.name));
    withoutEntry.sort((a, b) => a.name.localeCompare(b.name));
    return [...withEntry, ...withoutEntry];
  }
}

/**
 * Check if a customer has a saved (non-draft) entry for the given date
 */
export function hasEntryForDate(
  customerId: string,
  entries: DailyEntry[]
): boolean {
  return entries.some((e) => e.customer_id === customerId && !e.is_draft);
}
