// ========================================
// Supabase Client & API Service
// ========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Customer,
  DailyEntry,
  GlobalPrice,
  PriceOverride,
  Settings,
  AuditLog,
  Payment,
} from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co') {
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

function getMonthDateRange(yearMonth: string): { startDate: string; endDate: string } {
  const parts = yearMonth.split('-');
  const y = parseInt(parts[0] ?? '2026', 10);
  const m = parseInt(parts[1] ?? '1', 10);
  const startDate = `${yearMonth}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

// ---- Customers ----

export async function fetchCustomers(): Promise<Customer[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('customers').insert(customer).select().single();
  if (error) throw error;
  return data;
}

export async function updateCustomerRemote(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomerRemote(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb
    .from('customers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ---- Daily Entries ----

export async function fetchDailyEntries(date: string): Promise<DailyEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('daily_entries')
    .select('*')
    .eq('entry_date', date)
    .eq('is_draft', false);
  if (error) throw error;
  return data ?? [];
}

export async function upsertDailyEntry(
  entry: Omit<DailyEntry, 'id' | 'total_amount' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<DailyEntry | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('daily_entries')
    .upsert(
      { ...entry, synced: true, updated_at: new Date().toISOString() },
      { onConflict: 'customer_id,entry_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchEntriesByMonth(yearMonth: string): Promise<DailyEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { startDate, endDate } = getMonthDateRange(yearMonth);
  const { data, error } = await sb
    .from('daily_entries')
    .select('*')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .eq('is_draft', false);
  if (error) throw error;
  return data ?? [];
}

export async function fetchEntriesByCustomerMonth(
  customerId: string,
  yearMonth: string
): Promise<DailyEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { startDate, endDate } = getMonthDateRange(yearMonth);
  const { data, error } = await sb
    .from('daily_entries')
    .select('*')
    .eq('customer_id', customerId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .eq('is_draft', false);
  if (error) throw error;
  return data ?? [];
}

// ---- Global Prices ----

export async function fetchGlobalPrices(): Promise<GlobalPrice[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('global_prices')
    .select('*')
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertGlobalPrice(
  price: Omit<GlobalPrice, 'id' | 'created_at'>
): Promise<GlobalPrice | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('global_prices').insert(price).select().single();
  if (error) throw error;
  return data;
}

// ---- Price Overrides ----

export async function fetchPriceOverrides(customerId: string): Promise<PriceOverride[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('price_overrides')
    .select('*')
    .eq('customer_id', customerId)
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPriceOverride(
  override: Omit<PriceOverride, 'id' | 'created_at'>
): Promise<PriceOverride | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('price_overrides').insert(override).select().single();
  if (error) throw error;
  return data;
}

// ---- Settings ----

export async function fetchSettings(): Promise<Settings | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('settings').select('*').limit(1).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function upsertSettings(settings: Partial<Settings>): Promise<Settings | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('settings')
    .upsert({ ...settings, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- Audit Log ----

export async function insertAuditLog(
  log: Omit<AuditLog, 'id' | 'changed_at'>
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('audit_log').insert(log);
  if (error) throw error;
}

// ---- Payments (Phase 2) ----

export async function fetchPaymentsByCustomerMonth(
  customerId: string,
  yearMonth: string
): Promise<Payment[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { startDate, endDate } = getMonthDateRange(yearMonth);
  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('customer_id', customerId)
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertPaymentRemote(
  payment: Omit<Payment, 'id' | 'created_at' | 'synced'>
): Promise<Payment | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('payments')
    .insert({ ...payment, synced: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaymentRemote(
  id: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('payments')
    .update({ ...updates, synced: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePaymentRemote(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// ---- Bulk Sync ----

export async function syncEntriesToSupabase(
  entries: DailyEntry[]
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  for (const entry of entries) {
    const { id, total_amount, ...rest } = entry;
    void total_amount; // generated column, not insertable
    await sb
      .from('daily_entries')
      .upsert(
        { ...rest, id, synced: true, updated_at: new Date().toISOString() },
        { onConflict: 'customer_id,entry_date' }
      );
  }
}

export async function syncCustomersToSupabase(
  customers: Customer[]
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  for (const customer of customers) {
    await sb
      .from('customers')
      .upsert(
        { ...customer, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  }
}

export async function syncPaymentsToSupabase(
  payments: Payment[]
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  for (const payment of payments) {
    await sb
      .from('payments')
      .upsert(
        { ...payment, synced: true },
        { onConflict: 'id' }
      );
  }
}
