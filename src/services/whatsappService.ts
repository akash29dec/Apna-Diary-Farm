// ========================================
// WhatsApp Service — Frontend
// Calls Supabase Edge Function for all WhatsApp sends
// ========================================

import type { DailyEntry, Customer, CustomerMonthSummary } from '@/types';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ---------- Types ----------

interface WhatsAppResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

// ---------- Internal helper ----------

async function invokeWhatsAppFunction(body: Record<string, unknown>): Promise<WhatsAppResponse> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase.functions.invoke('whatsapp-send', {
    body,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as WhatsAppResponse;
}

function handleFailure(error: string): void {
  console.warn('WhatsApp send failed:', error);
  toast('⚠️ WhatsApp message could not be sent', { icon: '⚠️' });
}

// ---------- Public API ----------

/**
 * Send daily receipt after a daily entry is saved.
 * Fire-and-forget — never blocks the save flow.
 */
export function sendDailyReceipt(entry: DailyEntry, customer: Customer): void {
  if (!customer.whatsapp_consent) return;
  if (entry.milk_qty <= 0 && entry.paneer_qty <= 0 && entry.dahi_qty <= 0) return;

  invokeWhatsAppFunction({
    type: 'daily_receipt',
    customer_phone: customer.phone,
    customer_name: customer.name,
    customer_id: customer.id,
    entry_date: entry.entry_date,
    milk_qty: entry.milk_qty,
    paneer_qty: entry.paneer_qty,
    dahi_qty: entry.dahi_qty,
    total_amount: entry.total_amount,
  })
    .then((result) => {
      if (!result.success) {
        handleFailure(result.error ?? 'Unknown error');
      }
    })
    .catch((err) => {
      console.error('WhatsApp daily receipt error:', err);
    });
}

/**
 * Send welcome message when a new customer is added with whatsapp_consent = true.
 * Checks whatsapp_send_log for duplicates before sending.
 * Fire-and-forget.
 */
export function sendWelcomeMessage(customer: Customer): void {
  if (!customer.whatsapp_consent) return;

  const doSend = async () => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    try {
      // Check for duplicate welcome messages
      const { data: existingLogs } = await supabase
        .from('whatsapp_send_log')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('message_type', 'welcome')
        .eq('status', 'sent')
        .limit(1);

      if (existingLogs && existingLogs.length > 0) {
        console.log('Welcome message already sent for customer:', customer.id);
        return;
      }

      const result = await invokeWhatsAppFunction({
        type: 'welcome',
        customer_phone: customer.phone,
        customer_name: customer.name,
        customer_id: customer.id,
      });

      if (!result.success) {
        handleFailure(result.error ?? 'Unknown error');
      }
    } catch (err) {
      console.error('WhatsApp welcome error:', err);
    }
  };

  doSend();
}

/**
 * Send correction notification when a past daily entry is edited.
 * Fire-and-forget.
 */
export function sendCorrectionNotification(entry: DailyEntry, customer: Customer): void {
  if (!customer.whatsapp_consent) return;

  // Format the corrected date nicely: "2 March 2026"
  let correctedDate: string;
  try {
    correctedDate = format(new Date(entry.entry_date + 'T00:00:00'), 'd MMMM yyyy');
  } catch {
    correctedDate = entry.entry_date;
  }

  invokeWhatsAppFunction({
    type: 'correction',
    customer_phone: customer.phone,
    customer_name: customer.name,
    customer_id: customer.id,
    corrected_date: correctedDate,
  })
    .then((result) => {
      if (!result.success) {
        handleFailure(result.error ?? 'Unknown error');
      }
    })
    .catch((err) => {
      console.error('WhatsApp correction error:', err);
    });
}

/**
 * Send monthly PDF statement summary via WhatsApp.
 * Called from Customer Monthly Detail screen.
 * Returns promise so caller can show success/failure toast.
 */
export async function sendPDFStatement(
  customer: Customer,
  monthSummary: CustomerMonthSummary,
  yearMonth: string
): Promise<WhatsAppResponse> {
  if (!customer.whatsapp_consent) {
    return { success: false, error: 'Customer has not consented to WhatsApp messages' };
  }

  try {
    const monthLabel = formatMonthForWhatsApp(yearMonth);

    const result = await invokeWhatsAppFunction({
      type: 'pdf_statement',
      customer_phone: customer.phone,
      customer_name: customer.name,
      customer_id: customer.id,
      month_label: monthLabel,
      total_billed: monthSummary.billed,
      total_paid: monthSummary.paid,
      balance: monthSummary.due,
    });

    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error };
  }
}

/**
 * Format a YYYY-MM string into a readable label like "March 2026"
 */
export function formatMonthForWhatsApp(yearMonth: string): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const parts = yearMonth.split('-');
  const monthIndex = parseInt(parts[1] ?? '1', 10) - 1;
  const year = parts[0] ?? '';
  return `${monthNames[monthIndex] ?? 'January'} ${year}`;
}

/**
 * Test the WhatsApp connection by sending a welcome template to the seller's own number.
 */
export async function testWhatsAppConnection(sellerPhone: string): Promise<WhatsAppResponse> {
  return invokeWhatsAppFunction({
    type: 'welcome',
    customer_phone: sellerPhone,
    customer_name: 'Test',
    customer_id: 'test-connection',
  });
}

/**
 * Fetch the last N send log entries from Supabase.
 */
export async function fetchWhatsAppSendLog(
  limit: number = 10
): Promise<{ logs: WhatsAppSendLogEntry[]; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return { logs: [], error: 'Supabase not configured' };
  }

  const { data, error } = await supabase
    .from('whatsapp_send_log')
    .select(`
      id,
      customer_id,
      send_date,
      sent_at,
      template_used,
      status,
      message_type,
      error_message,
      customers!inner(name)
    `)
    .order('send_date', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: query without join if customers relationship fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('whatsapp_send_log')
      .select('*')
      .order('send_date', { ascending: false })
      .limit(limit);

    if (fallbackError) {
      return { logs: [], error: fallbackError.message };
    }

    return {
      logs: (fallbackData ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        send_date: row.send_date as string,
        customer_name: 'Unknown',
        template_used: row.template_used as string | null,
        status: row.status as string,
        message_type: row.message_type as string,
      })),
      error: null,
    };
  }

  return {
    logs: (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      send_date: row.send_date as string,
      customer_name: (row.customers as Record<string, unknown>)?.name as string ?? 'Unknown',
      template_used: row.template_used as string | null,
      status: row.status as string,
      message_type: row.message_type as string,
    })),
    error: null,
  };
}

export interface WhatsAppSendLogEntry {
  id: string;
  send_date: string;
  customer_name: string;
  template_used: string | null;
  status: string;
  message_type: string;
}
