// ========================================
// Supabase Edge Function: whatsapp-send
// Handles all WhatsApp message types via Meta Cloud API
// ========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for PWA calls
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---------- Types ----------

interface RequestBody {
  type: 'daily_receipt' | 'welcome' | 'correction' | 'pdf_statement';
  customer_phone: string;
  customer_name: string;
  customer_id: string;
  // daily_receipt fields
  entry_date?: string;
  milk_qty?: number;
  paneer_qty?: number;
  dahi_qty?: number;
  total_amount?: number;
  // correction fields
  corrected_date?: string;
  // pdf_statement fields
  month_label?: string;
  total_billed?: number;
  total_paid?: number;
  balance?: number;
  pdf_url?: string;
}

interface TemplateComponent {
  type: string;
  parameters: { type: string; text: string }[];
}

interface WhatsAppPayload {
  messaging_product: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: { code: string };
    components: TemplateComponent[];
  };
}

// ---------- Template builders ----------

function selectDailyReceiptTemplate(
  milkQty: number,
  paneerQty: number,
  dahiQty: number
): { templateName: string; components: TemplateComponent[] } {
  // Milk only
  if (milkQty > 0 && paneerQty === 0 && dahiQty === 0) {
    return {
      templateName: 'apna_diary_milk_only',
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: milkQty.toString() }],
        },
      ],
    };
  }

  // Milk + at least one other item → itemized
  if (milkQty > 0 && (paneerQty > 0 || dahiQty > 0)) {
    return {
      templateName: 'apna_diary_itemized',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: milkQty.toString() },
            { type: 'text', text: paneerQty.toString() },
            { type: 'text', text: dahiQty.toString() },
          ],
        },
      ],
    };
  }

  // No milk, but paneer and/or dahi
  if (milkQty === 0 && (paneerQty > 0 || dahiQty > 0)) {
    const itemName = paneerQty > 0 ? 'Paneer' : 'Dahi';
    const qty = paneerQty > 0 ? `${paneerQty} kg` : `${dahiQty} kg`;
    return {
      templateName: 'apna_diary_paneer_dahi_only',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: itemName },
            { type: 'text', text: qty },
          ],
        },
      ],
    };
  }

  // Fallback — should not reach here since we check for > 0 quantities before calling
  return {
    templateName: 'apna_diary_milk_only',
    components: [
      {
        type: 'body',
        parameters: [{ type: 'text', text: '0' }],
      },
    ],
  };
}

function buildTemplatePayload(body: RequestBody): {
  templateName: string;
  components: TemplateComponent[];
} {
  switch (body.type) {
    case 'daily_receipt':
      return selectDailyReceiptTemplate(
        body.milk_qty ?? 0,
        body.paneer_qty ?? 0,
        body.dahi_qty ?? 0
      );

    case 'welcome':
      return {
        templateName: 'apna_diary_welcome',
        components: [],
      };

    case 'correction':
      return {
        templateName: 'apna_diary_correction',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: body.corrected_date ?? 'unknown date' },
            ],
          },
        ],
      };

    case 'pdf_statement':
      return {
        templateName: 'apna_diary_pdf_statement',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: body.month_label ?? '' },
              { type: 'text', text: String(body.total_billed ?? 0) },
              { type: 'text', text: String(body.total_paid ?? 0) },
              { type: 'text', text: String(body.balance ?? 0) },
            ],
          },
        ],
      };

    default:
      throw new Error(`Unknown message type: ${body.type}`);
  }
}

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse and validate body
    const body: RequestBody = await req.json();

    if (!body.type || !body.customer_phone || !body.customer_name || !body.customer_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: type, customer_phone, customer_name, customer_id' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Read secrets from environment
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ success: false, error: 'WhatsApp API credentials not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Build template payload
    const { templateName, components } = buildTemplatePayload(body);

    const whatsappPayload: WhatsAppPayload = {
      messaging_product: 'whatsapp',
      to: body.customer_phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: components.length > 0 ? components : [],
      },
    };

    // 4. Call Meta WhatsApp API
    const metaUrl = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappPayload),
    });

    const metaResult = await metaResponse.json();

    // 5. Determine success/failure
    const success = metaResponse.ok && metaResult?.messages?.[0]?.id;
    const messageId = metaResult?.messages?.[0]?.id ?? null;
    const errorMsg = success
      ? null
      : metaResult?.error?.message ?? JSON.stringify(metaResult);

    // 6. Log result to whatsapp_send_log
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logEntry = {
      customer_id: body.customer_id,
      send_date: new Date().toISOString().split('T')[0],
      sent_at: success ? new Date().toISOString() : null,
      template_used: templateName,
      status: success ? 'sent' : 'failed',
      retry_count: 0,
      error_message: errorMsg,
      message_type: body.type,
    };

    await supabase.from('whatsapp_send_log').insert(logEntry);

    // 7. Return result
    const responseBody = success
      ? { success: true, message_id: messageId }
      : { success: false, error: errorMsg };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
