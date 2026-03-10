// ========================================
// Replicate Entry Utility
// ========================================

import type { DailyEntry } from '@/types';
import { resolvePrice, calculateTotal } from '@/utils/pricing';
import { getEntryByCustomerDate, saveEntry } from '@/services/localDB';
import { upsertDailyEntry, isSupabaseConfigured } from '@/services/supabase';

/**
 * Replicate an entry's quantities to multiple target dates.
 *
 * @param sourceEntry The entry whose quantities (milk, paneer, dahi) will be copied
 * @param targetDates Array of "YYYY-MM-DD" date strings to copy to
 * @param overwrite If true, existing entries on target dates will be overwritten
 * @returns The number of successfully replicated entries
 */
export async function replicateEntry(
    sourceEntry: DailyEntry,
    targetDates: string[],
    overwrite: boolean
): Promise<number> {
    let successCount = 0;
    const isOnline = navigator.onLine && isSupabaseConfigured();

    for (const date of targetDates) {
        // 1. Check existing entry
        const existingEntry = await getEntryByCustomerDate(sourceEntry.customer_id, date);

        // If we shouldn't overwrite and an entry exists (and it's not a draft), skip it
        if (!overwrite && existingEntry && !existingEntry.is_draft) {
            continue;
        }

        // 2. Resolve accurate prices for THIS specific target date
        const prices = await resolvePrice(sourceEntry.customer_id, date);

        // 3. Calculate total with the new prices for that date (milk only)
        const totalAmount = calculateTotal(
            sourceEntry.milk_qty,
            0,
            0,
            prices.milk_price,
            prices.paneer_price,
            prices.dahi_price
        );

        // 4. Construct the new entry
        const now = new Date().toISOString();
        const newEntry: DailyEntry = {
            id: existingEntry?.id || crypto.randomUUID(), // Reuse ID if overwriting
            customer_id: sourceEntry.customer_id,
            entry_date: date,
            milk_qty: sourceEntry.milk_qty,
            paneer_qty: 0,
            dahi_qty: 0,
            milk_price_used: prices.milk_price,
            paneer_price_used: prices.paneer_price,
            dahi_price_used: prices.dahi_price,
            total_amount: totalAmount,
            is_draft: false,
            whatsapp_sent: false,
            whatsapp_sent_at: null,
            synced: false,
            created_at: existingEntry ? existingEntry.created_at : now,
            updated_at: now,
        };

        // 5. Save locally (IndexedDB put works as upsert matching on ID)
        await saveEntry(newEntry);

        // 6. Try pushing to Supabase if online
        if (isOnline) {
            try {
                await upsertDailyEntry(newEntry);
                newEntry.synced = true;
                // Update local DB to mark as synced
                await saveEntry(newEntry);
            } catch (err) {
                console.error(`Failed to sync replicated entry for ${date}:`, err);
                // Will be synced by background job later
            }
        }

        successCount++;
    }

    return successCount;
}
