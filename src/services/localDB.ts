// ========================================
// IndexedDB Service via `idb` library
// ========================================

import { openDB, type IDBPDatabase } from 'idb';
import type {
  Customer,
  DailyEntry,
  GlobalPrice,
  PriceOverride,
  Settings,
  EntryDraft,
  SyncQueueItem,
  Payment,
  AuditLog,
} from '@/types';

const DB_NAME = 'apna-diary-db';
const DB_VERSION = 2;

interface ApnaDiaryDB {
  customers: {
    key: string;
    value: Customer;
    indexes: {
      'by-name': string;
      'by-phone': string;
    };
  };
  daily_entries: {
    key: string;
    value: DailyEntry;
    indexes: {
      'by-date': string;
      'by-customer-date': [string, string];
    };
  };
  global_prices: {
    key: string;
    value: GlobalPrice;
    indexes: {
      'by-effective': string;
    };
  };
  price_overrides: {
    key: string;
    value: PriceOverride;
    indexes: {
      'by-customer': string;
    };
  };
  settings: {
    key: string;
    value: Settings;
  };
  drafts: {
    key: string;
    value: EntryDraft;
    indexes: {
      'by-date': string;
    };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
  };
  payments: {
    key: string;
    value: Payment;
    indexes: {
      'by-customer': string;
      'by-customer-month': [string, string];
    };
  };
  audit_log: {
    key: string;
    value: AuditLog;
    indexes: {
      'by-entry': string;
    };
  };
}

let dbInstance: IDBPDatabase<ApnaDiaryDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ApnaDiaryDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ApnaDiaryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Customers store
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('by-name', 'name');
        customerStore.createIndex('by-phone', 'phone', { unique: true });
      }

      // Daily entries store
      if (!db.objectStoreNames.contains('daily_entries')) {
        const entryStore = db.createObjectStore('daily_entries', { keyPath: 'id' });
        entryStore.createIndex('by-date', 'entry_date');
        entryStore.createIndex('by-customer-date', ['customer_id', 'entry_date'], { unique: true });
      }

      // Global prices store
      if (!db.objectStoreNames.contains('global_prices')) {
        const priceStore = db.createObjectStore('global_prices', { keyPath: 'id' });
        priceStore.createIndex('by-effective', 'effective_from');
      }

      // Price overrides store
      if (!db.objectStoreNames.contains('price_overrides')) {
        const overrideStore = db.createObjectStore('price_overrides', { keyPath: 'id' });
        overrideStore.createIndex('by-customer', 'customer_id');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      // Drafts store
      if (!db.objectStoreNames.contains('drafts')) {
        const draftStore = db.createObjectStore('drafts', {
          keyPath: ['customer_id', 'entry_date'],
        });
        draftStore.createIndex('by-date', 'entry_date');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }

      // Payments store (Phase 2)
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
        paymentStore.createIndex('by-customer', 'customer_id');
        // We'll use manual filtering for month since compound index with substring isn't practical
      }

      // Audit log store (Phase 2)
      if (!db.objectStoreNames.contains('audit_log')) {
        const auditStore = db.createObjectStore('audit_log', { keyPath: 'id' });
        auditStore.createIndex('by-entry', 'entry_id');
      }
    },
  });

  return dbInstance;
}

// ---- Customers ----

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDB();
  const all = await db.getAll('customers');
  return all.filter((c) => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const db = await getDB();
  return db.get('customers', id);
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const db = await getDB();
  await db.put('customers', customer);
}

export async function softDeleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  const customer = await db.get('customers', id);
  if (customer) {
    customer.is_active = false;
    customer.updated_at = new Date().toISOString();
    await db.put('customers', customer);
  }
}

// ---- Daily Entries ----

export async function getEntriesByDate(date: string): Promise<DailyEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('daily_entries', 'by-date', date);
}

export async function getEntryByCustomerDate(
  customerId: string,
  date: string
): Promise<DailyEntry | undefined> {
  const db = await getDB();
  return db.getFromIndex('daily_entries', 'by-customer-date', [customerId, date]);
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const db = await getDB();
  await db.put('daily_entries', entry);
}

export async function getUnsyncedEntries(): Promise<DailyEntry[]> {
  const db = await getDB();
  const all = await db.getAll('daily_entries');
  return all.filter((e) => !e.synced && !e.is_draft);
}

export async function markEntrySynced(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('daily_entries', id);
  if (entry) {
    entry.synced = true;
    await db.put('daily_entries', entry);
  }
}

// ---- Global Prices ----

export async function getAllGlobalPrices(): Promise<GlobalPrice[]> {
  const db = await getDB();
  const all = await db.getAll('global_prices');
  return all.sort(
    (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  );
}

export async function getActiveGlobalPrice(date: string): Promise<GlobalPrice | undefined> {
  const db = await getDB();
  const all = await db.getAll('global_prices');
  const sorted = all
    .filter((p) => p.effective_from <= date)
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime());
  return sorted[0];
}

export async function saveGlobalPrice(price: GlobalPrice): Promise<void> {
  const db = await getDB();
  await db.put('global_prices', price);
}

// ---- Price Overrides ----

export async function getCustomerPriceOverride(
  customerId: string,
  date: string
): Promise<PriceOverride | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('price_overrides', 'by-customer', customerId);
  const sorted = all
    .filter((p) => p.effective_from <= date)
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime());
  return sorted[0];
}

export async function savePriceOverride(override: PriceOverride): Promise<void> {
  const db = await getDB();
  await db.put('price_overrides', override);
}

export async function getPriceOverridesByCustomer(customerId: string): Promise<PriceOverride[]> {
  const db = await getDB();
  return db.getAllFromIndex('price_overrides', 'by-customer', customerId);
}

// ---- Settings ----

export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  const all = await db.getAll('settings');
  return all[0];
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// ---- Drafts ----

export async function saveDraft(draft: EntryDraft): Promise<void> {
  const db = await getDB();
  await db.put('drafts', draft);
}

export async function getDraft(
  customerId: string,
  date: string
): Promise<EntryDraft | undefined> {
  const db = await getDB();
  return db.get('drafts', [customerId, date]);
}

export async function deleteDraft(
  customerId: string,
  date: string
): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', [customerId, date]);
}

export async function getDraftsByDate(date: string): Promise<EntryDraft[]> {
  const db = await getDB();
  return db.getAllFromIndex('drafts', 'by-date', date);
}

// ---- Sync Queue ----

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll('sync_queue');
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

// ---- Bulk Operations ----

export async function bulkSaveCustomers(customers: Customer[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('customers', 'readwrite');
  for (const customer of customers) {
    await tx.store.put(customer);
  }
  await tx.done;
}

export async function bulkSaveEntries(entries: DailyEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('daily_entries', 'readwrite');
  for (const entry of entries) {
    await tx.store.put(entry);
  }
  await tx.done;
}

export async function bulkSaveGlobalPrices(prices: GlobalPrice[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('global_prices', 'readwrite');
  for (const price of prices) {
    await tx.store.put(price);
  }
  await tx.done;
}

export async function bulkSavePriceOverrides(overrides: PriceOverride[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('price_overrides', 'readwrite');
  for (const override of overrides) {
    await tx.store.put(override);
  }
  await tx.done;
}

// ---- Payments (Phase 2) ----

export async function getPaymentsByCustomerMonth(
  customerId: string,
  yearMonth: string
): Promise<Payment[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('payments', 'by-customer', customerId);
  return all
    .filter((p) => p.payment_date.startsWith(yearMonth))
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));
}

export async function getAllPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  const db = await getDB();
  return db.getAllFromIndex('payments', 'by-customer', customerId);
}

export async function savePayment(payment: Payment): Promise<void> {
  const db = await getDB();
  await db.put('payments', payment);
}

export async function deletePayment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('payments', id);
}

// ---- Monthly Entry Queries (Phase 2) ----

export async function getEntriesByCustomerMonth(
  customerId: string,
  yearMonth: string
): Promise<DailyEntry[]> {
  const db = await getDB();
  const all = await db.getAll('daily_entries');
  return all
    .filter(
      (e) =>
        e.customer_id === customerId &&
        e.entry_date.startsWith(yearMonth) &&
        !e.is_draft
    )
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

export async function getEntriesByMonth(yearMonth: string): Promise<DailyEntry[]> {
  const db = await getDB();
  const all = await db.getAll('daily_entries');
  return all
    .filter((e) => e.entry_date.startsWith(yearMonth) && !e.is_draft)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

export async function getAllEntriesForCustomer(customerId: string): Promise<DailyEntry[]> {
  const db = await getDB();
  const all = await db.getAll('daily_entries');
  return all
    .filter((e) => e.customer_id === customerId && !e.is_draft)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}

// ---- Audit Log (Phase 2) ----

export async function saveAuditLog(log: AuditLog): Promise<void> {
  const db = await getDB();
  await db.put('audit_log', log);
}

export async function getAuditLogsByEntry(entryId: string): Promise<AuditLog[]> {
  const db = await getDB();
  return db.getAllFromIndex('audit_log', 'by-entry', entryId);
}

// ---- Bulk Payments ----

export async function bulkSavePayments(payments: Payment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('payments', 'readwrite');
  for (const payment of payments) {
    await tx.store.put(payment);
  }
  await tx.done;
}
