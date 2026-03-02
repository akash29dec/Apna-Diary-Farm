-- ============================================
-- Apna Diary — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- TABLE: customers
CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL UNIQUE,
  address           TEXT,
  notes             TEXT,
  default_milk_qty  DECIMAL(5,2) DEFAULT 0.50,
  has_custom_price  BOOLEAN DEFAULT FALSE,
  whatsapp_consent  BOOLEAN DEFAULT TRUE,
  consent_given_at  TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: price_overrides (per-customer price overrides)
CREATE TABLE IF NOT EXISTS price_overrides (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID REFERENCES customers(id) ON DELETE CASCADE,
  milk_price       DECIMAL(8,2),
  paneer_price     DECIMAL(8,2),
  dahi_price       DECIMAL(8,2),
  effective_from   DATE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_overrides_customer
  ON price_overrides(customer_id, effective_from DESC);

-- TABLE: global_prices
CREATE TABLE IF NOT EXISTS global_prices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milk_price     DECIMAL(8,2) NOT NULL,
  paneer_price   DECIMAL(8,2) NOT NULL,
  dahi_price     DECIMAL(8,2) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_prices_effective
  ON global_prices(effective_from DESC);

-- TABLE: daily_entries
CREATE TABLE IF NOT EXISTS daily_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID REFERENCES customers(id) ON DELETE CASCADE,
  entry_date        DATE NOT NULL,
  milk_qty          DECIMAL(5,2) DEFAULT 0.00,
  paneer_qty        DECIMAL(5,2) DEFAULT 0.00,
  dahi_qty          DECIMAL(5,2) DEFAULT 0.00,
  milk_price_used   DECIMAL(8,2) NOT NULL,
  paneer_price_used DECIMAL(8,2) NOT NULL,
  dahi_price_used   DECIMAL(8,2) NOT NULL,
  total_amount      DECIMAL(10,2) GENERATED ALWAYS AS (
    milk_qty * milk_price_used +
    paneer_qty * paneer_price_used +
    dahi_qty * dahi_price_used
  ) STORED,
  is_draft          BOOLEAN DEFAULT FALSE,
  whatsapp_sent     BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at  TIMESTAMPTZ,
  synced            BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_entries_date
  ON daily_entries(entry_date, customer_id);

-- TABLE: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id),
  changed_at    TIMESTAMPTZ DEFAULT NOW(),
  changed_by    TEXT DEFAULT 'seller',
  field_changed TEXT,
  old_value     JSONB,
  new_value     JSONB,
  reason        TEXT
);

-- TABLE: payments
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID REFERENCES customers(id) ON DELETE CASCADE,
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_paid    DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  notes          TEXT,
  synced         BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: settings (single row per installation)
CREATE TABLE IF NOT EXISTS settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name           TEXT DEFAULT 'Apna Diary',
  seller_phone          TEXT,
  timezone              TEXT DEFAULT 'Asia/Kolkata',
  whatsapp_send_time    TEXT DEFAULT '22:00',
  send_only_if_purchase BOOLEAN DEFAULT TRUE,
  reminder_enabled      BOOLEAN DEFAULT TRUE,
  reminder_time         TEXT DEFAULT '08:00',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: backup_records
CREATE TABLE IF NOT EXISTS backup_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date  TIMESTAMPTZ DEFAULT NOW(),
  backup_type  TEXT,
  file_size_kb INTEGER,
  status       TEXT,
  notes        TEXT
);

-- TABLE: whatsapp_send_log (Phase 3)
CREATE TABLE IF NOT EXISTS whatsapp_send_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID REFERENCES customers(id),
  send_date      DATE NOT NULL,
  sent_at        TIMESTAMPTZ,
  template_used  TEXT,
  status         TEXT,
  retry_count    INTEGER DEFAULT 0,
  error_message  TEXT
);

-- ============================================
-- SEED DATA
-- ============================================

-- Default global prices
INSERT INTO global_prices (milk_price, paneer_price, dahi_price, effective_from)
VALUES (18.00, 350.00, 60.00, CURRENT_DATE);

-- Default settings
INSERT INTO settings (seller_name, timezone, reminder_enabled, reminder_time)
VALUES ('Apna Diary', 'Asia/Kolkata', TRUE, '08:00');
