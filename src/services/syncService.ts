// ========================================
// Background Sync Service
// ========================================

import {
  isSupabaseConfigured,
  fetchCustomers as fetchRemoteCustomers,
  fetchDailyEntries as fetchRemoteEntries,
  fetchGlobalPrices as fetchRemotePrices,
  syncEntriesToSupabase,
  syncCustomersToSupabase,
} from '@/services/supabase';
import {
  getAllCustomers,
  getUnsyncedEntries,
  bulkSaveCustomers,
  bulkSaveEntries,
  bulkSaveGlobalPrices,
  getAllGlobalPrices,
  markEntrySynced,
} from '@/services/localDB';
import { getISTDateString } from '@/utils/dateHelpers';

export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Push unsynced local data to Supabase
 */
export async function pushToCloud(): Promise<{ synced: number; errors: number }> {
  if (!isOnline() || !isSupabaseConfigured()) {
    return { synced: 0, errors: 0 };
  }

  let synced = 0;
  let errors = 0;

  try {
    // Push unsynced entries
    const unsyncedEntries = await getUnsyncedEntries();
    if (unsyncedEntries.length > 0) {
      try {
        await syncEntriesToSupabase(unsyncedEntries);
        for (const entry of unsyncedEntries) {
          await markEntrySynced(entry.id);
        }
        synced += unsyncedEntries.length;
      } catch {
        errors += unsyncedEntries.length;
      }
    }

    // Push customers
    const localCustomers = await getAllCustomers();
    if (localCustomers.length > 0) {
      try {
        await syncCustomersToSupabase(localCustomers);
      } catch {
        errors++;
      }
    }
  } catch {
    errors++;
  }

  return { synced, errors };
}

/**
 * Pull latest data from Supabase into IndexedDB
 */
export async function pullFromCloud(): Promise<void> {
  if (!isOnline() || !isSupabaseConfigured()) return;

  try {
    // Pull customers
    const remoteCustomers = await fetchRemoteCustomers();
    if (remoteCustomers.length > 0) {
      await bulkSaveCustomers(remoteCustomers);
    }

    // Pull today's entries
    const today = getISTDateString();
    const remoteEntries = await fetchRemoteEntries(today);
    if (remoteEntries.length > 0) {
      await bulkSaveEntries(remoteEntries);
    }

    // Pull global prices
    const remotePrices = await fetchRemotePrices();
    if (remotePrices.length > 0) {
      await bulkSaveGlobalPrices(remotePrices);
    }
  } catch (err) {
    console.error('Pull from cloud failed:', err);
  }
}

/**
 * Full sync: push first, then pull
 */
export async function fullSync(): Promise<{ synced: number; errors: number }> {
  const pushResult = await pushToCloud();
  await pullFromCloud();
  return pushResult;
}

/**
 * Initialize seed data in IndexedDB if empty
 */
export async function initializeSeedData(): Promise<void> {
  const globalPrices = await getAllGlobalPrices();
  if (globalPrices.length === 0) {
    const { saveGlobalPrice } = await import('@/services/localDB');
    await saveGlobalPrice({
      id: crypto.randomUUID(),
      milk_price: 18.0,
      paneer_price: 350.0,
      dahi_price: 60.0,
      effective_from: getISTDateString(),
      created_at: new Date().toISOString(),
    });
  }

  const { getSettings, saveSettings } = await import('@/services/localDB');
  const settings = await getSettings();
  if (!settings) {
    await saveSettings({
      id: crypto.randomUUID(),
      seller_name: 'Apna Diary',
      seller_phone: null,
      timezone: 'Asia/Kolkata',
      whatsapp_send_time: '22:00',
      send_only_if_purchase: true,
      reminder_enabled: true,
      reminder_time: '08:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Register online/offline event listeners for auto-sync
 */
export function registerSyncListeners(onSyncComplete?: (result: { synced: number; errors: number }) => void): () => void {
  const handleOnline = async () => {
    const result = await pushToCloud();
    onSyncComplete?.(result);
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
