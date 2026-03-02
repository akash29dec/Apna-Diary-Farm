---
description: Data model + logic
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — DATA MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All tables are created in Supabase (PostgreSQL). Mirrored in IndexedDB locally.

-- TABLE: customers
{
  id:                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name:              TEXT NOT NULL,                 -- "Ramesh Gupta"
  phone:             TEXT NOT NULL UNIQUE,          -- "+919876543210"
  address:           TEXT,                          -- optional
  notes:             TEXT,                          -- optional
  default_milk_qty:  DECIMAL(5,2) DEFAULT 0.50,     -- pre-fill in EntryForm
  has_custom_price:  BOOLEAN DEFAULT FALSE,
  whatsapp_consent:  BOOLEAN DEFAULT TRUE,
  consent_given_at:  TIMESTAMPTZ,
  is_active:         BOOLEAN DEFAULT TRUE,          -- soft delete
  created_at:        TIMESTAMPTZ DEFAULT NOW(),
  updated_at:        TIMESTAMPTZ DEFAULT NOW()
}

-- TABLE: price_overrides  (per-customer price overrides)
{
  id:               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id:      UUID REFERENCES customers(id) ON DELETE CASCADE,
  milk_price:       DECIMAL(8,2),    -- null = use global price
  paneer_price:     DECIMAL(8,2),    -- null = use global price
  dahi_price:       DECIMAL(8,2),    -- null = use global price
  effective_from:   DATE NOT NULL,   -- set to TODAY on creation
  created_at:       TIMESTAMPTZ DEFAULT NOW()
}
NOTE: Only the LATEST price_override record with effective_from <= entry_date
is applied. Past entries use the price that was active on that entry date.
Per-customer overrides apply from effective_from date forward (not retroactive).

-- TABLE: global_prices
{
  id:             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_price:     DECIMAL(8,2) NOT NULL,
  paneer_price:   DECIMAL(8,2) NOT NULL,
  dahi_price:     DECIMAL(8,2) NOT NULL,
  effective_from: DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at:     TIMESTAMPTZ DEFAULT NOW()
}
NOTE: Always seed one initial record on first app launch.
When user changes global prices, INSERT a new record (never UPDATE old ones).
To get active price for a given date: SELECT * FROM global_prices
  WHERE effective_from <= :date ORDER BY effective_from DESC LIMIT 1;

-- TABLE: daily_entries
{
  id:                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id:       UUID REFERENCES customers(id) ON DELETE CASCADE,
  entry_date:        DATE NOT NULL,
  milk_qty:          DECIMAL(5,2) DEFAULT 0.00,    -- litres
  paneer_qty:        DECIMAL(5,2) DEFAULT 0.00,    -- kg
  dahi_qty:          DECIMAL(5,2) DEFAULT 0.00,    -- kg
  milk_price_used:   DECIMAL(8,2) NOT NULL,        -- snapshot at entry time
  paneer_price_used: DECIMAL(8,2) NOT NULL,        -- snapshot at entry time
  dahi_price_used:   DECIMAL(8,2) NOT NULL,        -- snapshot at entry time
  total_amount:      DECIMAL(10,2) GENERATED ALWAYS AS
                     (milk_qty * milk_price_used +
                      paneer_qty * paneer_price_used +
                      dahi_qty * dahi_price_used) STORED,
  is_draft:          BOOLEAN DEFAULT FALSE,
  whatsapp_sent:     BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at:  TIMESTAMPTZ,
  synced:            BOOLEAN DEFAULT FALSE,        -- IndexedDB sync flag
  created_at:        TIMESTAMPTZ DEFAULT NOW(),
  updated_at:        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, entry_date)
}

-- TABLE: audit_log  (edit history — never shown to customers)
{
  id:            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id:      UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  customer_id:   UUID REFERENCES customers(id),
  changed_at:    TIMESTAMPTZ DEFAULT NOW(),
  changed_by:    TEXT DEFAULT 'seller',           -- Phase 4: user email
  field_changed: TEXT,                             -- "milk_qty"
  old_value:     JSONB,                            -- { milk_qty: 0.5 }
  new_value:     JSONB,                            -- { milk_qty: 1.0 }
  reason:        TEXT                              -- optional
}

-- TABLE: payments
{
  id:             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id:    UUID REFERENCES customers(id) ON DELETE CASCADE,
  payment_date:   DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_paid:    DECIMAL(10,2) NOT NULL,
  payment_method: TEXT DEFAULT 'Cash',   -- 'Cash' | 'UPI' | 'Other'
  notes:          TEXT,
  synced:         BOOLEAN DEFAULT FALSE,
  created_at:     TIMESTAMPTZ DEFAULT NOW()
}

-- TABLE: settings  (single row per installation)
{
  id:                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name:           TEXT DEFAULT 'Apna Diary',
  seller_phone:          TEXT,                         -- Phase 3
  timezone:              TEXT DEFAULT 'Asia/Kolkata',
  whatsapp_send_time:    TEXT DEFAULT '22:00',
  send_only_if_purchase: BOOLEAN DEFAULT TRUE,
  reminder_enabled:      BOOLEAN DEFAULT TRUE,
  reminder_time:         TEXT DEFAULT '08:00',
  created_at:            TIMESTAMPTZ DEFAULT NOW(),
  updated_at:            TIMESTAMPTZ DEFAULT NOW()
}

-- TABLE: backup_records
{
  id:           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date:  TIMESTAMPTZ DEFAULT NOW(),
  backup_type:  TEXT,    -- 'manual_csv' | 'manual_pdf' | 'cloud_supabase'
  file_size_kb: INTEGER,
  status:       TEXT,    -- 'success' | 'failed'
  notes:        TEXT
}

-- TABLE: whatsapp_send_log  (Phase 3)
{
  id:             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id:    UUID REFERENCES customers(id),
  send_date:      DATE NOT NULL,
  sent_at:        TIMESTAMPTZ,
  template_used:  TEXT,   -- 'template_1' | 'template_2' | 'template_3'
  status:         TEXT,   -- 'sent' | 'failed' | 'skipped'
  retry_count:    INTEGER DEFAULT 0,
  error_message:  TEXT
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — BUSINESS LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9.1 ALPHABETICAL ORDERING + "MOVE TO END AFTER SAVE"

  Rule:
  - On app open for a given date, if ZERO entries exist for that date,
    show ALL active customers sorted A–Z.
  - Once an entry is saved for customer X:
    → Customer X moves to the BOTTOM of the customer list.
    → Remaining unsaved customers stay sorted A–Z at the top.
  - Order = [unsaved, A–Z] followed by [saved today, in order of save time].
  - If the user navigates to a PAST date:
    → All customers who HAVE an entry for that date appear at the top
       (sorted A–Z, since the day is done).
    → Customers with NO entry for that date appear below (sorted A–Z).
    → The "+ Add entry" button is shown for customers with no past entry.

  Implementation (IndexedDB-first):
  - Maintain a local array: savedTodayQueue (ordered by save timestamp)
  - On each screen render for today: filter(not in savedTodayQueue) → sort A–Z
    → concat savedTodayQueue
  - This array persists in IndexedDB per date and syncs to Supabase.

  Edge Cases:
  - Customer added AFTER today's session started → appears at top of A–Z list.
  - Customer deleted mid-day → removed from list immediately.
  - App refresh → reconstruct order from IndexedDB (timestamps preserved).

9.2 PRICING LOGIC

  For any given DailyEntry, the price used is determined at SAVE TIME:
  Step 1: Check price_overrides for this customer with
          effective_from <= entry_date. Take the most recent one.
  Step 2: If no override exists (or override field is NULL for that item),
          fall back to global_prices where effective_from <= entry_date,
          most recent record.
  Step 3: Snapshot the resolved prices into milk_price_used, paneer_price_used,
          dahi_price_used at the moment of saving. These snapshots are
          IMMUTABLE — changing global prices later does NOT affect past entries.

  This means:
  - Global price changes apply ONLY to new entries going forward. ✅
  - Per-customer overrides are effective from effective_from date onward. ✅
  - Retroactive recalculation: NEVER. Past entries are locked by snapshot. ✅

9.3 EDIT RULES AND AUDIT LOG

  Who can edit: Only the seller (currently single user).
  What can be edited: Any field of any past DailyEntry (milk_qty, paneer_qty,
    dahi_qty). Prices used (milk_price_used etc.) are NOT editable — they are
    locked to the original snapshot.
  total_amount recalculates automatically (it's a generated column).

  On edit:
  Step 1: Read current values from daily_entries.
  Step 2: Write old values + new values to audit_log.
  Step 3: Update the daily_entries record.
  Step 4: Show toast: "✅ Entry updated for 2 Feb 2026"
  Step 5: (Phase 3) Trigger WhatsApp correction message to customer.

  Audit log is visible ONLY in Settings > Data & Backup > View Audit Log.
  It is NEVER included in customer-facing PDFs.

9.4 DUE / EXTRA PAID CALCULATION

  For a given customer and month:
    total_billed   = SUM(daily_entries.total_amount WHERE month = X)
    total_paid     = SUM(payments.amount_paid WHERE month = X)
    month_balance  = total_billed - total_paid
      → positive = dues (customer owes seller)
      → negative = extra paid / advance (seller owes customer)

  Past dues are carried forward:
    cumulative_balance = SUM of month_balance for all months up to current month
    This is the "Total Outstanding" shown in the Summary screen.

  "Amount Paid" in PDF = payments for that specific month only.
  "Carried Forward Dues" = balance from all previous months.
  "Total Outstanding" = current month dues + carried forward dues.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — DATE NAVIGATION & HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- "←" arrow navigates to previousDay; "→" arrow navigates to nextDay.
- "→" is disabled (grayed, non-tappable) when currentDate = today.
- Tapping the date text opens a calendar date-picker modal (shadcn-style, full
  month view, mark days with entries as green dots).
- Selecting a future date is BLOCKED in the date picker (no future entries).
- When viewing a past date, a banner appears:
  "📅 Viewing entries for 14 Jan 2026 — Tap today's date to return"
  with a [Go to Today] quick-action button.
- Day roll-over: "today" is determined by device clock in Asia/Kolkata timezone
  using date-fns-tz. At midnight IST, the app automatically transitions to
  the new day (if open, show a toast: "🌙 New day started — 3 March 2026").
- Drafts from yesterday that were NOT saved are highlighted with a red banner
  on app open: "⚠️ You have 2 unsaved drafts from yesterday. Review them?"
  → Tap to navigate to yesterday's date.
