---
description: Multi-User, Google Auth & iOS (Last Phase)
---

SECTION 13 — MULTI-USER & GOOGLE AUTH (Phase 4 — implement last)

### Overview
In Phase 4, Apna Diary transforms from a single-seller local app into a
multi-seller cloud platform. Each seller signs in with their Google account
and sees only their own customers and data. All data is isolated per account
using Supabase Row-Level Security (RLS).

Phase 4 must NOT be started until Phases 1, 2, and 3 are fully tested.

---

### Authentication

Provider: Supabase Auth with Google OAuth 2.0
Library: @supabase/supabase-js (already installed from Phase 1)

Login Screen (new screen, shown only before first sign-in):
- App logo + tagline centered on screen
- [  Sign in with Google  ] button (full width, 56px, white with Google icon)
- Subtext: "Your data is saved securely to your account"
- No email/password option — Google only for simplicity

On successful Google sign-in:
- Supabase creates auth.users record automatically
- Create a corresponding row in a new `seller_profiles` table (see data model below)
- Redirect to Daily Entry screen (/)
- Store session token in IndexedDB for offline persistence

Session Persistence:
- If user has a valid cached session in IndexedDB, skip login screen
- If session is expired, show login screen again
- Use supabase.auth.onAuthStateChange() to listen for sign-out events

Sign Out:
- Available in Settings screen → "Sign Out" button
- On sign out: clear IndexedDB session, redirect to Login screen
- Warn user: "Signing out will remove locally cached data from this device"

---

### New Table: seller_profiles
{
  id:           UUID PRIMARY KEY (matches auth.users.id),
  display_name: TEXT,              -- from Google account name
  email:        TEXT UNIQUE,       -- from Google account
  phone:        TEXT,              -- seller's WhatsApp number (Phase 3 field)
  shop_name:    TEXT DEFAULT 'Apna Diary',
  created_at:   TIMESTAMPTZ DEFAULT NOW()
}

---

### Row-Level Security (RLS) on All Tables

Add a seller_id column (UUID, references seller_profiles.id) to:
  - customers
  - daily_entries
  - payments
  - price_overrides
  - global_prices
  - settings
  - whatsapp_send_log
  - audit_log

RLS Policy on every table:
  USING (seller_id = auth.uid())
This ensures each seller can only SELECT, INSERT, UPDATE, DELETE their own rows.

Migration strategy:
- In Phase 4, run a Supabase migration to add seller_id column to all tables.
- Backfill existing Phase 1–3 data with the first seller's auth.uid().
- Enable RLS on all tables via Supabase dashboard or migration script.

---

### Multi-Device Sync

With Supabase + RLS in place:
- Any device signed into the same Google account sees the same data.
- Use Supabase Realtime (already free) to subscribe to changes:
  supabase.channel('daily_entries').on('postgres_changes', ...).subscribe()
- On receiving a realtime change, update IndexedDB and re-render the UI.
- Conflict resolution: LAST WRITE WINS (based on updated_at timestamp).
  If two devices edit the same entry offline, the one that syncs last wins.
  Log a conflict warning in audit_log if timestamps are very close (<5 sec apart).

---

### Admin Tools (available only to the logged-in seller for their own data)

These are NOT a separate admin role — each seller is their own admin.

Features to add in Settings screen under "Advanced":
  1. Reset Today's Entries:
     - Shows a confirmation dialog: "Delete all entries for today? This cannot be undone."
     - Deletes all daily_entries WHERE entry_date = today AND seller_id = current user.
     - Logs action in audit_log.

  2. Rollback Last N Entries:
     - Shows a list of the last 10 saved entries (customer name + date + time).
     - Seller can select 1 or more and tap "Delete Selected".
     - Logs each deletion in audit_log with reason = 'manual_rollback'.

  3. View Audit Log:
     - Full list of all edit/delete events, sorted newest first.
     - Columns: Date, Customer, Field Changed, Old Value, New Value.
     - Filterable by customer name and date range.
     - NEVER shown to customers, never included in PDFs.

---

### iOS Support

In Phase 4, test and fix all PWA behaviours on iOS 16+:

Known iOS PWA issues to address:
  1. Web Push notifications are only supported on iOS 16.4+ added to home screen.
     → Add a banner prompting iOS users to "Add to Home Screen" to enable notifications.
  2. IndexedDB on iOS has storage quota limits (~50MB).
     → Add a storage usage indicator in Settings and warn if > 40MB.
  3. Safari does not support Background Sync API.
     → Fall back to: sync on every app-open + manual "Sync Now" button in Settings.
  4. PWA install prompt is not supported on Safari.
     → Show manual instructions: "Tap Share → Add to Home Screen" with screenshots.

Test matrix for iOS:
  - iPhone SE (small screen, 320px wide) — verify all touch targets still 44×44px
  - iPhone 14 (standard)
  - iPad (tablet layout — consider a two-column layout for iPad in Phase 4)

---

### Future Enhancements (Post Phase 4 — not in current scope)

These are ideas for after the app is fully live and stable:

1. SMS Fallback:
   If customer has no WhatsApp, send SMS via Twilio free trial or Fast2SMS
   (Indian SMS gateway with free tier).

2. Printing Receipts:
   Add a "Print" button on the PDF screen that triggers window.print()
   with a print-optimized CSS stylesheet. Works on Android Chrome.

3. Multi-Language Support:
   Add Hindi UI option. Use i18next library. All UI strings move to
   translation JSON files (en.json, hi.json).

4. Stock / Inventory Tracking:
   Let the seller record how much milk/paneer/dahi stock they started the day
   with, and auto-calculate remaining stock after all entries are saved.

5. Payments via UPI Deep Link:
   Add a "Request Payment" button that opens a UPI deep link
   (upi://pay?pa=...&pn=...&am=...) so customers can pay directly from the app.

6. Analytics Dashboard:
   Monthly bar chart of total sales, top customers by volume, best-selling item.
   Use Recharts library (free, React-native).

7. Multiple Shops per Account:
   Allow one Google account to manage more than one dairy shop (e.g., a chain).