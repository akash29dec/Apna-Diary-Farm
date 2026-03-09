// ========================================
// Entry Store (Zustand)
// ========================================

import { create } from 'zustand';
import type { DailyEntry, EntryDraft } from '@/types';
import {
  getEntriesByDate,
  getEntryByCustomerDate,
  saveEntry as saveEntryLocal,
  saveDraft as saveDraftLocal,
  getDraft as getDraftLocal,
  deleteDraft as deleteDraftLocal,
  getDraftsByDate,
} from '@/services/localDB';
import { upsertDailyEntry, isSupabaseConfigured } from '@/services/supabase';
import { getISTDateString } from '@/utils/dateHelpers';
import { resolvePrice } from '@/utils/pricing';
import { calculateTotal } from '@/utils/pricing';

interface EntryState {
  entries: DailyEntry[];
  drafts: Map<string, EntryDraft>;
  selectedDate: string;
  loading: boolean;
  expandedCustomerId: string | null;

  setSelectedDate: (date: string) => void;
  fetchEntries: (date?: string) => Promise<void>;
  fetchDrafts: (date?: string) => Promise<void>;
  saveEntry: (data: {
    customerId: string;
    milkQty: number;
    paneerQty: number;
    dahiQty: number;
    existingEntryId?: string;
  }) => Promise<DailyEntry>;
  markNoPurchase: (customerId: string) => Promise<void>;
  saveDraft: (draft: EntryDraft) => Promise<void>;
  getDraft: (customerId: string) => Promise<EntryDraft | undefined>;
  clearDraft: (customerId: string) => Promise<void>;
  setExpandedCustomerId: (id: string | null) => void;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  drafts: new Map(),
  selectedDate: getISTDateString(),
  loading: false,
  expandedCustomerId: null,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date, expandedCustomerId: null });
  },

  fetchEntries: async (date?: string) => {
    const targetDate = date ?? get().selectedDate;
    set({ loading: true });
    try {
      const entries = await getEntriesByDate(targetDate);
      set({ entries, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchDrafts: async (date?: string) => {
    const targetDate = date ?? get().selectedDate;
    try {
      const draftList = await getDraftsByDate(targetDate);
      const draftMap = new Map<string, EntryDraft>();
      for (const draft of draftList) {
        draftMap.set(draft.customer_id, draft);
      }
      set({ drafts: draftMap });
    } catch {
      // Ignore draft fetch errors
    }
  },

  saveEntry: async ({ customerId, milkQty, paneerQty, dahiQty, existingEntryId }) => {
    const { selectedDate } = get();

    // Resolve prices at save time
    const prices = await resolvePrice(customerId, selectedDate);
    const totalAmount = calculateTotal(
      milkQty,
      paneerQty,
      dahiQty,
      prices.milk_price,
      prices.paneer_price,
      prices.dahi_price
    );

    const now = new Date().toISOString();
    const entry: DailyEntry = {
      id: existingEntryId ?? crypto.randomUUID(),
      customer_id: customerId,
      entry_date: selectedDate,
      milk_qty: milkQty,
      paneer_qty: paneerQty,
      dahi_qty: dahiQty,
      milk_price_used: prices.milk_price,
      paneer_price_used: prices.paneer_price,
      dahi_price_used: prices.dahi_price,
      total_amount: totalAmount,
      is_draft: false,
      whatsapp_sent: false,
      whatsapp_sent_at: null,
      synced: false,
      created_at: existingEntryId ? now : now,
      updated_at: now,
    };

    // Save locally
    await saveEntryLocal(entry);

    // Clear draft
    await deleteDraftLocal(customerId, selectedDate);

    // Try sync to Supabase
    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await upsertDailyEntry(entry);
        entry.synced = true;
        await saveEntryLocal(entry);
      } catch (err) {
        console.error('Failed to sync entry:', err);
      }
    }

    // Refresh
    await get().fetchEntries();
    await get().fetchDrafts();
    set({ expandedCustomerId: null });

    return entry;
  },

  markNoPurchase: async (customerId: string) => {
    const { selectedDate } = get();
    // Find existing entry to overwrite (prevents unique constraint violation)
    const existingEntry = await getEntryByCustomerDate(customerId, selectedDate);
    await get().saveEntry({
      customerId,
      milkQty: 0,
      paneerQty: 0,
      dahiQty: 0,
      existingEntryId: existingEntry?.id,
    });
  },

  saveDraft: async (draft: EntryDraft) => {
    await saveDraftLocal(draft);
    const newDrafts = new Map(get().drafts);
    newDrafts.set(draft.customer_id, draft);
    set({ drafts: newDrafts });
  },

  getDraft: async (customerId: string) => {
    const { selectedDate } = get();
    return getDraftLocal(customerId, selectedDate);
  },

  clearDraft: async (customerId: string) => {
    const { selectedDate } = get();
    await deleteDraftLocal(customerId, selectedDate);
    const newDrafts = new Map(get().drafts);
    newDrafts.delete(customerId);
    set({ drafts: newDrafts });
  },

  setExpandedCustomerId: (id: string | null) => {
    set({ expandedCustomerId: id });
  },
}));
