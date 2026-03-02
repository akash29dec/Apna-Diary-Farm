// ========================================
// Price Store (Zustand)
// ========================================

import { create } from 'zustand';
import type { GlobalPrice, PriceOverride } from '@/types';
import {
  getAllGlobalPrices,
  saveGlobalPrice as saveGlobalPriceLocal,
  savePriceOverride as savePriceOverrideLocal,
  getPriceOverridesByCustomer,
} from '@/services/localDB';
import {
  insertGlobalPrice as insertGlobalPriceRemote,
  insertPriceOverride as insertPriceOverrideRemote,
  isSupabaseConfigured,
} from '@/services/supabase';
import { getISTDateString } from '@/utils/dateHelpers';

interface PriceState {
  globalPrices: GlobalPrice[];
  loading: boolean;
  fetchGlobalPrices: () => Promise<void>;
  saveNewGlobalPrices: (milkPrice: number, paneerPrice: number, dahiPrice: number) => Promise<void>;
  savePriceOverride: (
    customerId: string,
    milkPrice: number | null,
    paneerPrice: number | null,
    dahiPrice: number | null
  ) => Promise<void>;
  getOverridesForCustomer: (customerId: string) => Promise<PriceOverride[]>;
}

export const usePriceStore = create<PriceState>((set, get) => ({
  globalPrices: [],
  loading: false,

  fetchGlobalPrices: async () => {
    set({ loading: true });
    try {
      const prices = await getAllGlobalPrices();
      set({ globalPrices: prices, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveNewGlobalPrices: async (milkPrice, paneerPrice, dahiPrice) => {
    const newPrice: GlobalPrice = {
      id: crypto.randomUUID(),
      milk_price: milkPrice,
      paneer_price: paneerPrice,
      dahi_price: dahiPrice,
      effective_from: getISTDateString(),
      created_at: new Date().toISOString(),
    };

    await saveGlobalPriceLocal(newPrice);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await insertGlobalPriceRemote({
          milk_price: milkPrice,
          paneer_price: paneerPrice,
          dahi_price: dahiPrice,
          effective_from: getISTDateString(),
        });
      } catch (err) {
        console.error('Failed to sync global prices:', err);
      }
    }

    await get().fetchGlobalPrices();
  },

  savePriceOverride: async (customerId, milkPrice, paneerPrice, dahiPrice) => {
    const override: PriceOverride = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      milk_price: milkPrice,
      paneer_price: paneerPrice,
      dahi_price: dahiPrice,
      effective_from: getISTDateString(),
      created_at: new Date().toISOString(),
    };

    await savePriceOverrideLocal(override);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await insertPriceOverrideRemote({
          customer_id: customerId,
          milk_price: milkPrice,
          paneer_price: paneerPrice,
          dahi_price: dahiPrice,
          effective_from: getISTDateString(),
        });
      } catch (err) {
        console.error('Failed to sync price override:', err);
      }
    }
  },

  getOverridesForCustomer: async (customerId: string) => {
    return getPriceOverridesByCustomer(customerId);
  },
}));
