// ========================================
// Pricing Logic
// ========================================

import { getActiveGlobalPrice, getCustomerPriceOverride, getEntriesByCustomerDateRange, saveEntry, saveAuditLog } from '@/services/localDB';
import { upsertDailyEntry, insertAuditLog, isSupabaseConfigured } from '@/services/supabase';
import type { ResolvedPrices, DailyEntry, AuditLog } from '@/types';
import { getISTDateString } from '@/utils/dateHelpers';

/**
 * Resolve the effective prices for a customer on a given date.
 * Step 1: Check customer-specific price_overrides (most recent effective <= date)
 * Step 2: Fall back to global_prices for any null override fields
 * Returns snapshot prices to be stored in daily_entries.
 */
export async function resolvePrice(
  customerId: string,
  entryDate: string
): Promise<ResolvedPrices> {
  // Get global price for the date
  const globalPrice = await getActiveGlobalPrice(entryDate);
  if (!globalPrice) {
    // Fallback defaults if no global price exists
    return { milk_price: 18.0, paneer_price: 350.0, dahi_price: 60.0 };
  }

  // Check for customer-specific override
  const override = await getCustomerPriceOverride(customerId, entryDate);

  return {
    milk_price: override?.milk_price ?? globalPrice.milk_price,
    paneer_price: override?.paneer_price ?? globalPrice.paneer_price,
    dahi_price: override?.dahi_price ?? globalPrice.dahi_price,
  };
}

/**
 * Calculate total_amount from quantities and prices.
 * This replicates the Supabase generated column logic for IndexedDB.
 */
export function calculateTotal(
  milkQty: number,
  paneerQty: number,
  dahiQty: number,
  milkPrice: number,
  paneerPrice: number,
  dahiPrice: number
): number {
  const total = milkQty * milkPrice + paneerQty * paneerPrice + dahiQty * dahiPrice;
  return Math.round(total * 100) / 100;
}

/**
 * Calculate total from an entry object
 */
export function calculateEntryTotal(entry: Pick<DailyEntry, 'milk_qty' | 'paneer_qty' | 'dahi_qty' | 'milk_price_used' | 'paneer_price_used' | 'dahi_price_used'>): number {
  return calculateTotal(
    entry.milk_qty,
    entry.paneer_qty,
    entry.dahi_qty,
    entry.milk_price_used,
    entry.paneer_price_used,
    entry.dahi_price_used
  );
}

/**
 * Apply a retroactive price update for the ENTIRE current month.
 * Called after inserting a new price_override row.
 * 
 * IMPORTANT: We accept the new override prices directly instead of using
 * resolvePrice(), because resolvePrice() filters by effective_from <= entryDate,
 * and the new override has effective_from = today. For entries BEFORE today in
 * the same month, resolvePrice() would not pick up the new override.
 * 
 * Returns the count of entries that were updated.
 */
export async function applyRetroactivePriceUpdate(
  customerId: string,
  newMilkPrice: number | null,
  newPaneerPrice: number | null,
  newDahiPrice: number | null
): Promise<number> {
  const today = getISTDateString();
  const yearMonth = today.substring(0, 7);
  const monthStart = `${yearMonth}-01`;
  const parts = yearMonth.split('-');
  const y = parseInt(parts[0] ?? '2026', 10);
  const m = parseInt(parts[1] ?? '1', 10);
  const lastDay = new Date(y, m, 0).getDate();
  const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

  // Get ALL entries in the current month (1st to last day)
  const entries = await getEntriesByCustomerDateRange(customerId, monthStart, monthEnd);

  let updatedCount = 0;

  for (const entry of entries) {
    const oldPrices = {
      milk_price_used: entry.milk_price_used,
      paneer_price_used: entry.paneer_price_used,
      dahi_price_used: entry.dahi_price_used,
      total_amount: entry.total_amount,
    };

    // For each entry, resolve the effective price:
    // Use the new override price if set, otherwise fall back to the global price for that date
    const globalPrice = await getActiveGlobalPrice(entry.entry_date);
    const effectiveMilk = newMilkPrice ?? globalPrice?.milk_price ?? 18.0;
    const effectivePaneer = newPaneerPrice ?? globalPrice?.paneer_price ?? 350.0;
    const effectiveDahi = newDahiPrice ?? globalPrice?.dahi_price ?? 60.0;

    const newTotal = calculateTotal(
      entry.milk_qty,
      entry.paneer_qty,
      entry.dahi_qty,
      effectiveMilk,
      effectivePaneer,
      effectiveDahi
    );

    // Only update if prices actually changed
    if (
      entry.milk_price_used !== effectiveMilk ||
      entry.paneer_price_used !== effectivePaneer ||
      entry.dahi_price_used !== effectiveDahi
    ) {
      const updatedEntry: DailyEntry = {
        ...entry,
        milk_price_used: effectiveMilk,
        paneer_price_used: effectivePaneer,
        dahi_price_used: effectiveDahi,
        total_amount: newTotal,
        synced: false,
        updated_at: new Date().toISOString(),
      };

      // Save to IndexedDB
      await saveEntry(updatedEntry);

      // Log in audit_log
      const auditLog: AuditLog = {
        id: crypto.randomUUID(),
        entry_id: entry.id,
        customer_id: customerId,
        changed_at: new Date().toISOString(),
        changed_by: 'seller',
        field_changed: 'price_override_applied',
        old_value: oldPrices,
        new_value: {
          milk_price_used: effectiveMilk,
          paneer_price_used: effectivePaneer,
          dahi_price_used: effectiveDahi,
          total_amount: newTotal,
        },
        reason: 'price_override_applied',
      };
      await saveAuditLog(auditLog);

      // Sync to Supabase if online
      if (navigator.onLine && isSupabaseConfigured()) {
        try {
          // Exclude total_amount — it's a generated column in Supabase
          const { total_amount: _omit, ...entryForSupabase } = updatedEntry;
          void _omit;
          await upsertDailyEntry(entryForSupabase);
          await insertAuditLog({
            entry_id: auditLog.entry_id,
            customer_id: auditLog.customer_id,
            changed_by: auditLog.changed_by,
            field_changed: auditLog.field_changed,
            old_value: auditLog.old_value,
            new_value: auditLog.new_value,
            reason: auditLog.reason,
          });
        } catch (err) {
          console.error('Failed to sync retroactive price update:', err);
        }
      }

      updatedCount++;
    }
  }

  return updatedCount;
}

