---
description: WhatsApp automation
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — WHATSAPP AUTOMATION  (Phase 3 — implement second-to-last)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Recommended Approach
- Primary: n8n (self-hosted on Railway.app free tier OR n8n.cloud free trial)
  + WhatsApp Business Cloud API (Meta free tier: 1000 conversations/month free)
- Seller's WhatsApp number (+91XXXXXXXXXX) is entered in Settings screen.
  The number will be provided by the user in Phase 3 — leave a placeholder in Settings.
- Country code: +91 (India). Timezone: Asia/Kolkata (IST, UTC+5:30).

### Fallback (if WhatsApp Business API not yet approved)
Use WhatsApp Web share link opened on the device:
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`)
This requires the seller to manually tap "Send" per customer.
Build this fallback as the default stub in Phase 1/2 UI, wire real API in Phase 3.

---

### Nightly Job Spec (n8n Workflow)

Trigger: Cron schedule — every day at 22:00 IST (Asia/Kolkata)
  n8n cron expression: 0 22 * * * [Asia/Kolkata timezone set in n8n settings]

Steps:
1. n8n cron fires at 22:00 IST.
2. Call Supabase REST API: fetch all daily_entries WHERE entry_date = today
   AND (milk_qty > 0 OR paneer_qty > 0 OR dahi_qty > 0)
   JOIN customers WHERE whatsapp_consent = TRUE AND is_active = TRUE.
3. For each matching customer:
   a. Select message template (logic below).
   b. Replace placeholders with real values.
   c. Send message via WhatsApp Business Cloud API to customer's phone.
   d. Log result to whatsapp_send_log table:
      { customer_id, send_date, sent_at, template_used, status, retry_count }
4. If send fails: retry up to 2 times with 5-minute delay between retries.
5. After 3 failures: mark status = 'failed', log error_message, do NOT retry again.
6. If customer has whatsapp_consent = FALSE or entry has all zero quantities:
   skip customer, log status = 'skipped'.

---

### Template Selection Logic

IF milk_qty > 0 AND (paneer_qty = 0 AND dahi_qty = 0):
  → Use Template 1 (Milk only)

IF milk_qty > 0 AND (paneer_qty > 0 OR dahi_qty > 0):
  → Use Template 2 (Itemized — Milk + Paneer/Dahi)

IF milk_qty = 0 AND (paneer_qty > 0 OR dahi_qty > 0):
  → Use Template 3 (Paneer/Dahi only)

---

### WhatsApp Message Templates

#### Template 1 — Simple & Clean (Milk only)
Namaste 🙏
Thank you for purchasing {MILK_QTY} litre milk today.
Your daily record has been updated in Apna Diary.
– Apna Diary | Fresh & Pure Daily 🥛✨

text
Placeholder: {MILK_QTY} = milk_qty value (e.g., 0.50)

#### Template 2 — Itemized & Branded (Milk + Paneer/Dahi)
Namaste 🙏
Today's purchase details:
🥛 Milk: {MILK_QTY} litre
🧀 Paneer: {PANEER_QTY} kg
🥣 Dahi: {DAHI_QTY} kg
Thank you for trusting us ❤️
– Apna Diary | Fresh & Pure Daily 🧾✨

text
Placeholders: {MILK_QTY}, {PANEER_QTY}, {DAHI_QTY}
If paneer_qty = 0, omit the paneer line entirely.
If dahi_qty = 0, omit the dahi line entirely.

#### Template 3 — Short & Polished (Only Paneer or Only Dahi)
Namaste 🙏
Thank you for purchasing:
{ITEM_NAME}: {QTY}
Your entry is safely recorded in Apna Diary.
– Apna Diary | Fresh & Pure Daily 🧾✨

text
Placeholders: {ITEM_NAME} = "Paneer" or "Dahi", {QTY} = quantity + unit (e.g., 0.25 kg)

---

### Welcome / Consent Message (sent once when customer is added with consent = YES)
Namaste 🙏
Welcome to the Apna Diary Family 🤍
We will maintain your daily dairy records carefully
and keep you updated.
Thank you for choosing us!
– Apna Diary 🥛

text
Trigger: Immediately after customer is saved with whatsapp_consent = TRUE.
This is a one-time message, not a nightly message.
Log it in whatsapp_send_log with template_used = 'welcome'.

---

### Edit/Correction Notification (sent when a past entry is edited)
Namaste 🙏
Your dairy record for {DATE} has been updated.
Please check with your seller if you have questions.
– Apna Diary 🥛

text
Placeholder: {DATE} = human-readable date (e.g., "2 February 2026")
Trigger: Any time a past daily_entry is edited by the seller.
Send immediately (not at 22:00) — use same WhatsApp API call.
Log with template_used = 'correction'.

---

### Privacy & Consent Rules
- whatsapp_consent field on Customer is default TRUE (pre-checked on Add Customer form).
- Seller must explain to customers that they will receive daily WhatsApp messages.
- Customer can opt out: seller unchecks consent in Edit Customer screen.
- Once consent = FALSE, no messages are ever sent to that customer.
- No unsubscribe link needed in messages (handled by seller directly).
- Consent timestamp (consent_given_at) is recorded for audit purposes.

---

### Settings Screen — WhatsApp Section (Phase 3 fields to wire up)
- Seller WhatsApp Number: [+91__________] (text input, stored in settings table)
- Send Time: 10:00 PM IST (fixed, shown as read-only label — not configurable by user)
- Send only if purchase exists: ON (fixed behavior, not a toggle)
- [Test WhatsApp] button: sends Template 1 with dummy values to seller's own number
- WhatsApp Status: shows last run time + success/fail count from whatsapp_send_log

---

### Supabase Table Reference (already defined in Phase 1 data model)
whatsapp_send_log:
  id, customer_id, send_date, sent_at, template_used,
  status ('sent'|'failed'|'skipped'), retry_count, error_message