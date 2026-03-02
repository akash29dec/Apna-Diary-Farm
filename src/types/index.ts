// ========================================
// Apna Diary — TypeScript Type Definitions
// ========================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
  default_milk_qty: number;
  has_custom_price: boolean;
  whatsapp_consent: boolean;
  consent_given_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceOverride {
  id: string;
  customer_id: string;
  milk_price: number | null;
  paneer_price: number | null;
  dahi_price: number | null;
  effective_from: string;
  created_at: string;
}

export interface GlobalPrice {
  id: string;
  milk_price: number;
  paneer_price: number;
  dahi_price: number;
  effective_from: string;
  created_at: string;
}

export interface DailyEntry {
  id: string;
  customer_id: string;
  entry_date: string;
  milk_qty: number;
  paneer_qty: number;
  dahi_qty: number;
  milk_price_used: number;
  paneer_price_used: number;
  dahi_price_used: number;
  total_amount: number;
  is_draft: boolean;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string | null;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  entry_id: string;
  customer_id: string;
  changed_at: string;
  changed_by: string;
  field_changed: string;
  old_value: Record<string, unknown>;
  new_value: Record<string, unknown>;
  reason: string | null;
}

export interface Payment {
  id: string;
  customer_id: string;
  payment_date: string;
  amount_paid: number;
  payment_method: 'Cash' | 'UPI' | 'Other';
  notes: string | null;
  synced: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  seller_name: string;
  seller_phone: string | null;
  timezone: string;
  whatsapp_send_time: string;
  send_only_if_purchase: boolean;
  reminder_enabled: boolean;
  reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface BackupRecord {
  id: string;
  backup_date: string;
  backup_type: 'manual_csv' | 'manual_pdf' | 'cloud_supabase';
  file_size_kb: number | null;
  status: 'success' | 'failed';
  notes: string | null;
}

export interface WhatsappSendLog {
  id: string;
  customer_id: string;
  send_date: string;
  sent_at: string | null;
  template_used: string | null;
  status: 'sent' | 'failed' | 'skipped';
  retry_count: number;
  error_message: string | null;
}

// ========================================
// Drafts & Sync Types
// ========================================

export interface EntryDraft {
  customer_id: string;
  entry_date: string;
  milk_qty: number;
  paneer_enabled: boolean;
  paneer_qty: number;
  dahi_enabled: boolean;
  dahi_qty: number;
  updated_at: string;
}

export interface SyncQueueItem {
  id: string;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  data: Record<string, unknown>;
  created_at: string;
  retries: number;
}

export interface ResolvedPrices {
  milk_price: number;
  paneer_price: number;
  dahi_price: number;
}

export type CustomerFormData = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'consent_given_at' | 'is_active'>;

// ========================================
// Phase 2 — Summary & Payment Types
// ========================================

export type DayStatus = 'complete' | 'partial' | 'none';

export interface MonthSummary {
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
}

export interface PastDueRecord {
  month: string; // YYYY-MM
  monthLabel: string; // "January 2026"
  billed: number;
  paid: number;
  due: number;
}

export interface CustomerMonthSummary {
  customer: Customer;
  totalMilkL: number;
  totalPaneerKg: number;
  totalDahiKg: number;
  billed: number;
  paid: number;
  due: number;
  pastDues: PastDueRecord[];
  totalPastDue: number;
  totalOutstanding: number; // due + totalPastDue
}

export interface PaymentFormData {
  payment_date: string;
  amount_paid: number;
  payment_method: 'Cash' | 'UPI' | 'Other';
  notes: string;
}
