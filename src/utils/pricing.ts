// ========================================
// Pricing Logic
// ========================================

import { getActiveGlobalPrice, getCustomerPriceOverride } from '@/services/localDB';
import type { ResolvedPrices, DailyEntry } from '@/types';

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
