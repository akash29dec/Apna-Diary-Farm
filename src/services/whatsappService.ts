// ========================================
// WhatsApp Service (Phase 3)
// ========================================

import type { WhatsappSendLog } from '@/types';
import { saveWhatsAppLog } from '@/services/localDB';
import {
  insertWhatsAppLog,
  isSupabaseConfigured,
} from '@/services/supabase';

// ---- Types ----

export interface WhatsAppSendResult {
  success: boolean;
  method: 'api' | 'fallback';
  error?: string;
}

type TemplateKey = 'template1' | 'template2' | 'template3';

// ---- Environment helpers ----

function getWhatsAppToken(): string {
  return (import.meta.env.VITE_WHATSAPP_TOKEN as string) ?? '';
}

function getWhatsAppPhoneNumberId(): string {
  return (import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID as string) ?? '';
}

export function isWhatsAppApiConfigured(): boolean {
  return getWhatsAppToken().length > 0 && getWhatsAppPhoneNumberId().length > 0;
}

// ---- Send Message ----

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<WhatsAppSendResult> {
  const token = getWhatsAppToken();
  const phoneNumberId = getWhatsAppPhoneNumberId();

  // Try API first if configured
  if (token && phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      if (response.ok) {
        return { success: true, method: 'api' };
      }

      const errorBody = await response.text();
      // Fall through to fallback
      console.error('WhatsApp API error:', errorBody);
    } catch (err) {
      console.error('WhatsApp API request failed:', err);
      // Fall through to fallback
    }
  }

  // Fallback: open wa.me share link
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    return { success: true, method: 'fallback' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Fallback failed';
    return { success: false, method: 'fallback', error: errorMsg };
  }
}

// ---- Message Templates ----

export function buildTemplate1(milkQty: number): string {
  return (
    `Namaste 🙏\n` +
    `Thank you for purchasing ${milkQty} litre milk today.\n` +
    `Your daily record has been updated in Apna Diary.\n` +
    `– Apna Diary | Fresh & Pure Daily 🥛✨`
  );
}

export function buildTemplate2(
  milkQty: number,
  paneerQty: number,
  dahiQty: number
): string {
  let msg =
    `Namaste 🙏\n` +
    `Today's purchase details:\n` +
    `🥛 Milk: ${milkQty} litre\n`;

  if (paneerQty > 0) {
    msg += `🧀 Paneer: ${paneerQty} kg\n`;
  }
  if (dahiQty > 0) {
    msg += `🥣 Dahi: ${dahiQty} kg\n`;
  }

  msg +=
    `Thank you for trusting us ❤️\n` +
    `– Apna Diary | Fresh & Pure Daily 🧾✨`;

  return msg;
}

export function buildTemplate3(itemName: string, qty: number): string {
  return (
    `Namaste 🙏\n` +
    `Thank you for purchasing:\n` +
    `${itemName}: ${qty} kg\n` +
    `Your entry is safely recorded in Apna Diary.\n` +
    `– Apna Diary | Fresh & Pure Daily 🧾✨`
  );
}

export function buildWelcomeMessage(): string {
  return (
    `Namaste 🙏\n` +
    `Welcome to the Apna Diary Family 🤍\n` +
    `We will maintain your daily dairy records carefully\n` +
    `and keep you updated.\n` +
    `Thank you for choosing us!\n` +
    `– Apna Diary 🥛`
  );
}

export function buildCorrectionMessage(date: string): string {
  return (
    `Namaste 🙏\n` +
    `Your dairy record for ${date} has been updated.\n` +
    `Please check with your seller if you have questions.\n` +
    `– Apna Diary 🥛`
  );
}

// ---- Template Selection ----

export function selectTemplate(
  milkQty: number,
  paneerQty: number,
  dahiQty: number
): TemplateKey | null {
  if (milkQty > 0 && paneerQty === 0 && dahiQty === 0) return 'template1';
  if (milkQty > 0 && (paneerQty > 0 || dahiQty > 0)) return 'template2';
  if (milkQty === 0 && (paneerQty > 0 || dahiQty > 0)) return 'template3';
  return null; // all zero — do not send
}

// ---- Logging ----

export async function logWhatsAppSend(
  customerId: string,
  sendDate: string,
  templateUsed: string,
  status: 'sent' | 'failed' | 'skipped',
  retryCount: number,
  errorMessage?: string
): Promise<void> {
  const log: WhatsappSendLog = {
    id: crypto.randomUUID(),
    customer_id: customerId,
    send_date: sendDate,
    sent_at: new Date().toISOString(),
    template_used: templateUsed,
    status,
    retry_count: retryCount,
    error_message: errorMessage ?? null,
  };

  // Always save locally
  try {
    await saveWhatsAppLog(log);
  } catch (err) {
    console.error('Failed to save WhatsApp log to IndexedDB:', err);
  }

  // Best-effort sync to Supabase
  if (navigator.onLine && isSupabaseConfigured()) {
    try {
      await insertWhatsAppLog(log);
    } catch (err) {
      console.error('Failed to sync WhatsApp log to Supabase:', err);
    }
  }
}
