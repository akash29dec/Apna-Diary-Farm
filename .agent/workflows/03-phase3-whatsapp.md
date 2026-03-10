---
description: Phase 3 — Official WhatsApp Business Cloud API, instant send on save/edit/delete, PDF share via WhatsApp, Supabase Edge Functions.
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — WHATSAPP AUTOMATION  (Phase 3 — implement second-to-last)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Architecture Overview

NO n8n. NO third-party automation tools.
All WhatsApp messages are sent via a Supabase Edge Function (server-side,
free to run, HTTPS endpoint) that calls the official Meta WhatsApp
Business Cloud API directly.

The PWA frontend calls the Edge Function. The Edge Function sends the
WhatsApp message and logs the result to whatsapp_send_log in Supabase.

Flow:
  PWA (React) → POST → Supabase Edge Function → Meta WhatsApp API → Customer

Why Edge Function (not direct from frontend):
  - WhatsApp API requires a server-side call (API token must never be
    exposed in frontend/client-side code)
  - Supabase Edge Functions are free (500,000 invocations/month free tier)
  - No separate backend server needed — Supabase handles it all
  - HTTPS endpoint auto-provided by Supabase

---

### WhatsApp Business API Setup (Manual steps for Deepanshu)

These are one-time setup steps done in Meta Developer Console — NOT coded:

1. Go to developers.facebook.com → Create App → Business type
2. Add "WhatsApp" product to the app
3. Create or connect a Meta Business Account
4. Register a phone number as the WhatsApp sender number
   (this will be Deepanshu's father's number or a dedicated business number)
5. Get the following credentials and store them in Supabase Vault secrets:
   - WHATSAPP_ACCESS_TOKEN   (permanent token from Meta Business Manager)
   - WHATSAPP_PHONE_NUMBER_ID (the sender phone number ID from Meta dashboard)
   - WHATSAPP_BUSINESS_ACCOUNT_ID
6. Message Templates: Register the 3 templates + welcome + correction templates
   in Meta Business Manager under "Message Templates" and get them APPROVED
   before going live (approval takes 1–24 hours).
   Template names to register:
     - apna_diary_milk_only
     - apna_diary_itemized
     - apna_diary_paneer_dahi_only
     - apna_diary_welcome
     - apna_diary_correction
     - apna_diary_pdf_statement

Pricing: Meta charges per conversation.
  Utility messages (receipts, statements): ₹0.35–₹0.70 per conversation.
  Budget: ₹1500/month supports ~2000–4000 messages/month comfortably.
  Free tier: First 1000 service conversations/month are free.

---

### Supabase Edge Function: whatsapp-send

File: supabase/functions/whatsapp-send/index.ts

This single Edge Function handles ALL WhatsApp message types.
It accepts a POST request with a JSON body and sends the appropriate
WhatsApp template message.

Request body schema:
{
  type: 'daily_receipt' | 'welcome' | 'correction' | 'pdf_statement',
  customer_phone: string,       // "+919876543210"
  customer_name: string,
  customer_id: string,
  // For daily_receipt:
  entry_date?: string,          // "2026-03-10"
  milk_qty?: number,
  paneer_qty?: number,
  dahi_qty?: number,
  total_amount?: number,
  // For correction:
  corrected_date?: string,
  // For pdf_statement:
  month_label?: string,         // "March 2026"
  total_billed?: number,
  total_paid?: number,
  balance?: number,
  pdf_url?: string              // optional: Supabase Storage URL of PDF
}

Edge Function logic:
1. Validate the request body
2. Read WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID from env secrets
3. Select the correct template name + build template components based on type
4. Call Meta WhatsApp API:
   POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
   Headers: { Authorization: Bearer {ACCESS_TOKEN}, Content-Type: application/json }
   Body: {
     messaging_product: "whatsapp",
     to: customer_phone,
     type: "template",
     template: {
       name: "apna_diary_milk_only",  // or whichever template
       language: { code: "en" },
       components: [{ type: "body", parameters: [...] }]
     }
   }
5. On success: return { success: true, message_id: "..." }
6. On failure: return { success: false, error: "..." } with HTTP 200
   (so the frontend can handle it gracefully)
7. Log result to whatsapp_send_log via Supabase client inside Edge Function

Environment secrets (set in Supabase Dashboard → Edge Functions → Secrets):
  WHATSAPP_ACCESS_TOKEN
  WHATSAPP_PHONE_NUMBER_ID
  SUPABASE_URL              (auto-available in Edge Functions)
  SUPABASE_SERVICE_ROLE_KEY (auto-available in Edge Functions)

---

### Frontend Service: whatsappService.ts

File: src/services/whatsappService.ts

This service is called by the PWA whenever a WhatsApp message needs
to be sent. It calls the Supabase Edge Function.

Functions to implement:

sendDailyReceipt(entry, customer):
  Called immediately when seller taps "SAVE ENTRY" on Daily Entry screen.
  Only sends if:
    - customer.whatsapp_consent = TRUE
    - entry has at least one non-zero quantity (milk > 0 OR paneer > 0 OR dahi > 0)
  Calls Edge Function with type: 'daily_receipt'
  Does NOT block the UI — fire and forget (async, non-blocking)
  Shows a small WhatsApp icon with a green tick on the customer card
  after successful send, or a grey icon if skipped/failed.

sendWelcomeMessage(customer):
  Called immediately when a new customer is saved with whatsapp_consent = TRUE.
  Calls Edge Function with type: 'welcome'
  One-time only — check whatsapp_send_log before sending to avoid duplicates.

sendCorrectionNotification(entry, customer):
  Called immediately when any past daily_entry is edited by the seller.
  Calls Edge Function with type: 'correction'
  Sends regardless of whether quantities are zero (it is a correction notice).

sendPDFStatement(customer, monthSummary, pdfUrl?):
  Called when seller taps "Send via WhatsApp" on Customer Monthly Detail screen.
  Calls Edge Function with type: 'pdf_statement'
  Sends month total summary as a WhatsApp message.
  If pdfUrl is provided (PDF uploaded to Supabase Storage), include it.

All functions:
  - Are async, non-blocking (do not await in UI — use .then().catch())
  - Log result to whatsapp_send_log via the Edge Function
  - Show a toast only on failure: "⚠️ WhatsApp message could not be sent"
  - On success: no intrusive toast (only the card icon update)

---

### Template Selection Logic (for daily_receipt)

IF milk_qty > 0 AND paneer_qty = 0 AND dahi_qty = 0:
  → template: apna_diary_milk_only

IF milk_qty > 0 AND (paneer_qty > 0 OR dahi_qty > 0):
  → template: apna_diary_itemized

IF milk_qty = 0 AND (paneer_qty > 0 OR dahi_qty > 0):
  → template: apna_diary_paneer_dahi_only

---

### WhatsApp Message Templates (register these in Meta Business Manager)

Template: apna_diary_milk_only
  Body: "Namaste 🙏\nThank you for purchasing {{1}} litre milk today.\nYour daily record has been updated in Apna Diary.\n– Apna Diary | Fresh & Pure Daily 🥛✨"
  Parameter {{1}}: milk_qty (e.g., "2.50")

Template: apna_diary_itemized
  Body: "Namaste 🙏\nToday's purchase details:\n🥛 Milk: {{1}} litre\n🧀 Paneer: {{2}} kg\n🥣 Dahi: {{3}} kg\nThank you for trusting us ❤️\n– Apna Diary | Fresh & Pure Daily 🧾✨"
  Parameters: {{1}} milk_qty, {{2}} paneer_qty, {{3}} dahi_qty
  Note: If paneer_qty = 0, use template apna_diary_milk_only instead.

Template: apna_diary_paneer_dahi_only
  Body: "Namaste 🙏\nThank you for purchasing:\n{{1}}: {{2}}\nYour entry is safely recorded in Apna Diary.\n– Apna Diary | Fresh & Pure Daily 🧾✨"
  Parameters: {{1}} item name ("Paneer" or "Dahi"), {{2}} quantity ("0.25 kg")

Template: apna_diary_welcome
  Body: "Namaste 🙏\nWelcome to the Apna Diary Family 🤍\nWe will maintain your daily dairy records carefully and keep you updated.\nThank you for choosing us!\n– Apna Diary 🥛"
  No parameters.

Template: apna_diary_correction
  Body: "Namaste 🙏\nYour dairy record for {{1}} has been updated.\nPlease check with your seller if you have any questions.\n– Apna Diary 🥛"
  Parameter {{1}}: corrected_date (e.g., "2 March 2026")

Template: apna_diary_pdf_statement
  Body: "Namaste 🙏\nYour dairy statement for {{1}} is ready.\n📊 Total Billed: ₹{{2}}\n💰 Total Paid: ₹{{3}}\n📋 Balance: ₹{{4}}\nThank you for your trust!\n– Apna Diary 🥛✨"
  Parameters: {{1}} month ("March 2026"), {{2}} billed, {{3}} paid, {{4}} balance

---

### UI Changes Required

A) Daily Entry Screen — CustomerCard.tsx:
   After SAVE ENTRY:
   - If whatsapp_consent = TRUE and quantities > 0:
     Show small WhatsApp icon (green, 20px) on the saved card row
     indicating message was sent. Icon is non-tappable, purely informational.
   - If send fails silently: show grey WhatsApp icon with a small "!" indicator

B) Add Customer Screen:
   - whatsapp_consent checkbox already exists (built in Phase 1/2)
   - On save with consent = TRUE: call sendWelcomeMessage() automatically
   - No extra UI needed

C) Edit Customer Screen:
   - No extra UI needed for WhatsApp
   - If phone number is changed: do NOT automatically resend welcome message

D) Customer Monthly Detail Screen — new "Send via WhatsApp" button:
   Add a third action button below "Generate PDF" and "Export CSV":
   [  📱 SEND VIA WHATSAPP  ]  (green button, full width, 56px)

   Tapping it:
   1. Shows a confirmation bottom sheet:
      "Send March 2026 statement to Ramesh Gupta?
       📱 +91XXXXXXXXXX
       This will send a WhatsApp message with their monthly summary."
      [Cancel]  [Send]
   2. On confirm: call sendPDFStatement(customer, monthSummary)
   3. Shows toast: "✅ Statement sent to Ramesh via WhatsApp"
   4. On failure: "⚠️ Could not send WhatsApp message. Check connection."

E) Settings Screen — WhatsApp Section:
   - Sender Phone Number ID: [__________] (stored in settings, used for display)
   - API Status: shows green "Connected" or red "Not configured"
     (checks if WHATSAPP_PHONE_NUMBER_ID is set in edge function secrets)
   - [Test Connection] button: sends apna_diary_welcome template to seller's
     own number as a test
   - WhatsApp Send Log: shows last 10 send events (date, customer, status)

---

### Privacy & Consent Rules
- whatsapp_consent default = TRUE on Add Customer form (pre-checked)
- Seller must verbally inform customers they will receive WhatsApp messages
- Customer can opt out: seller unchecks consent in Edit Customer screen
- Once consent = FALSE: no messages sent, ever
- consent_given_at timestamp recorded for audit
- No automated opt-out/unsubscribe needed (managed manually by seller)

---

### Supabase Table: whatsapp_send_log (already created in Phase 1)
id, customer_id, send_date, sent_at, template_used,
status ('sent'|'failed'|'skipped'), retry_count, error_message

Add one new column via migration:
  message_type: TEXT  -- 'daily_receipt'|'welcome'|'correction'|'pdf_statement'
