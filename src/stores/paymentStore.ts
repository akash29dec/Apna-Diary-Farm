// ========================================
// Payment Store (Zustand) — Phase 2
// ========================================

import { create } from 'zustand';
import type { Payment, PaymentFormData } from '@/types';
import {
  getPaymentsByCustomerMonth,
  savePayment as savePaymentLocal,
  deletePayment as deletePaymentLocal,
} from '@/services/localDB';
import {
  insertPaymentRemote,
  updatePaymentRemote,
  deletePaymentRemote,
  isSupabaseConfigured,
} from '@/services/supabase';

interface PaymentState {
  payments: Payment[];
  loading: boolean;

  fetchPayments: (customerId: string, yearMonth: string) => Promise<void>;
  addPayment: (customerId: string, data: PaymentFormData) => Promise<void>;
  updatePayment: (id: string, data: PaymentFormData) => Promise<void>;
  removePayment: (id: string, customerId: string, yearMonth: string) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  loading: false,

  fetchPayments: async (customerId: string, yearMonth: string) => {
    set({ loading: true });
    try {
      const payments = await getPaymentsByCustomerMonth(customerId, yearMonth);
      set({ payments, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addPayment: async (customerId: string, data: PaymentFormData) => {
    const payment: Payment = {
      id: crypto.randomUUID(),
      customer_id: customerId,
      payment_date: data.payment_date,
      amount_paid: data.amount_paid,
      payment_method: data.payment_method,
      notes: data.notes || null,
      synced: false,
      created_at: new Date().toISOString(),
    };

    await savePaymentLocal(payment);

    // Sync to Supabase
    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await insertPaymentRemote({
          customer_id: payment.customer_id,
          payment_date: payment.payment_date,
          amount_paid: payment.amount_paid,
          payment_method: payment.payment_method,
          notes: payment.notes,
        });
        payment.synced = true;
        await savePaymentLocal(payment);
      } catch (err) {
        console.error('Failed to sync payment:', err);
      }
    }

    // Refresh list
    const month = data.payment_date.substring(0, 7);
    await get().fetchPayments(customerId, month);
  },

  updatePayment: async (id: string, data: PaymentFormData) => {
    const existing = get().payments.find((p) => p.id === id);
    if (!existing) return;

    const updated: Payment = {
      ...existing,
      payment_date: data.payment_date,
      amount_paid: data.amount_paid,
      payment_method: data.payment_method,
      notes: data.notes || null,
      synced: false,
    };

    await savePaymentLocal(updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await updatePaymentRemote(id, {
          payment_date: data.payment_date,
          amount_paid: data.amount_paid,
          payment_method: data.payment_method,
          notes: data.notes || null,
        });
        updated.synced = true;
        await savePaymentLocal(updated);
      } catch (err) {
        console.error('Failed to sync payment update:', err);
      }
    }

    const month = data.payment_date.substring(0, 7);
    await get().fetchPayments(existing.customer_id, month);
  },

  removePayment: async (id: string, customerId: string, yearMonth: string) => {
    await deletePaymentLocal(id);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        await deletePaymentRemote(id);
      } catch (err) {
        console.error('Failed to sync payment delete:', err);
      }
    }

    await get().fetchPayments(customerId, yearMonth);
  },
}));
