// ========================================
// Customer Store (Zustand)
// ========================================

import { create } from 'zustand';
import type { Customer } from '@/types';
import {
  getAllCustomers,
  saveCustomer as saveCustomerLocal,
  softDeleteCustomer as softDeleteLocal,
  getCustomerById,
} from '@/services/localDB';
import {
  insertCustomer as insertRemote,
  updateCustomerRemote,
  deleteCustomerRemote,
  isSupabaseConfigured,
} from '@/services/supabase';
import { formatPhone } from '@/utils/validation';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (data: {
    name: string;
    phone: string;
    address: string;
    notes: string;
    default_milk_qty: number;
    has_custom_price: boolean;
    whatsapp_consent: boolean;
  }) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Promise<Customer | undefined>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const customers = await getAllCustomers();
      set({ customers, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers';
      set({ error: message, loading: false });
    }
  },

  addCustomer: async (data) => {
    const now = new Date().toISOString();
    const customer: Customer = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      phone: formatPhone(data.phone),
      address: data.address.trim() || null,
      notes: data.notes.trim() || null,
      default_milk_qty: data.default_milk_qty,
      has_custom_price: data.has_custom_price,
      whatsapp_consent: data.whatsapp_consent,
      consent_given_at: data.whatsapp_consent ? now : null,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // Save locally first
    await saveCustomerLocal(customer);

    // Try to sync to Supabase
    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await insertRemote({
          ...customer,
        });
      } catch (err) {
        console.error('Failed to sync customer to cloud:', err);
      }
    }

    // Refresh store
    await get().fetchCustomers();
    return customer;
  },

  updateCustomer: async (id, data) => {
    const existing = await getCustomerById(id);
    if (!existing) return;

    const updated: Customer = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await saveCustomerLocal(updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await updateCustomerRemote(id, data);
      } catch (err) {
        console.error('Failed to sync customer update:', err);
      }
    }

    await get().fetchCustomers();
  },

  deleteCustomer: async (id) => {
    await softDeleteLocal(id);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await deleteCustomerRemote(id);
      } catch (err) {
        console.error('Failed to sync customer delete:', err);
      }
    }

    await get().fetchCustomers();
  },

  getCustomer: async (id) => {
    return getCustomerById(id);
  },
}));
