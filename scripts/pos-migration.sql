-- ============================================================
-- POS System Migration
-- Run this entire script in Supabase SQL Editor (once)
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. pos_tables — restaurant / bar tables
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_tables (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  section         text        DEFAULT 'main' CHECK (section IN ('main','bar','outdoor')),
  capacity        integer     DEFAULT 4,
  status          text        DEFAULT 'available' CHECK (status IN ('available','occupied','reserved')),
  current_order_id uuid,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE pos_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_tables_owner" ON pos_tables
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 2. pos_staff — POS staff members
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_staff (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  pin_hash     text        NOT NULL,
  role         text        DEFAULT 'cashier'
                           CHECK (role IN ('manager','cashier','waiter','barman','stock_manager')),
  active       boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE pos_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_staff_owner" ON pos_staff
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 3. pos_shifts — shift open / close records
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_shifts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id              uuid        REFERENCES pos_staff(id),
  staff_name            text        DEFAULT '',
  opened_at             timestamptz DEFAULT now(),
  closed_at             timestamptz,
  opening_float         numeric(10,2) DEFAULT 0,
  closing_cash_counted  numeric(10,2),
  total_cash_sales      numeric(10,2) DEFAULT 0,
  total_mpesa_sales     numeric(10,2) DEFAULT 0,
  total_card_sales      numeric(10,2) DEFAULT 0,
  total_sales           numeric(10,2) DEFAULT 0,
  total_orders          integer       DEFAULT 0,
  total_voids           integer       DEFAULT 0,
  expected_cash         numeric(10,2) DEFAULT 0,
  cash_variance         numeric(10,2) DEFAULT 0,
  notes                 text          DEFAULT '',
  status                text          DEFAULT 'open' CHECK (status IN ('open','closed'))
);

ALTER TABLE pos_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_shifts_owner" ON pos_shifts
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 4. pos_orders — POS orders
-- ──────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS pos_order_number_seq;

CREATE TABLE IF NOT EXISTS pos_orders (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id          uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number          text          UNIQUE,
  table_id              uuid          REFERENCES pos_tables(id),
  table_name            text          DEFAULT '',
  shift_id              uuid          REFERENCES pos_shifts(id),
  staff_id              uuid          REFERENCES pos_staff(id),
  staff_name            text          DEFAULT '',
  order_type            text          DEFAULT 'dine_in'
                                      CHECK (order_type IN ('dine_in','takeaway','bar')),
  status                text          DEFAULT 'open'
                                      CHECK (status IN ('open','sent_to_kitchen','ready','paid','void')),
  items                 jsonb         NOT NULL DEFAULT '[]',
  customer_name         text          DEFAULT '',
  customer_phone        text          DEFAULT '',
  subtotal              numeric(10,2) DEFAULT 0,
  discount_type         text,
  discount_value        numeric(10,2) DEFAULT 0,
  discount_amount       numeric(10,2) DEFAULT 0,
  tax_amount            numeric(10,2) DEFAULT 0,
  total                 numeric(10,2) DEFAULT 0,
  payment_method        text,
  payment_reference     text          DEFAULT '',
  amount_tendered       numeric(10,2),
  change_given          numeric(10,2),
  void_reason           text          DEFAULT '',
  void_authorised_by    uuid          REFERENCES pos_staff(id),
  notes                 text          DEFAULT '',
  created_at            timestamptz   DEFAULT now(),
  updated_at            timestamptz   DEFAULT now(),
  paid_at               timestamptz,
  kitchen_sent_at       timestamptz
);

ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_orders_owner" ON pos_orders
  USING (host_user_id = auth.uid());

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_pos_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'POS-' || LPAD(nextval('pos_order_number_seq')::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pos_order_number ON pos_orders;
CREATE TRIGGER set_pos_order_number
  BEFORE INSERT ON pos_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_pos_order_number();

-- ──────────────────────────────────────────────
-- 5. pos_inventory — stock levels
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_inventory (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id      uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id      uuid,
  item_name         text          NOT NULL,
  category          text          DEFAULT 'food' CHECK (category IN ('food','bar')),
  unit              text          DEFAULT 'unit',
  quantity_in_stock numeric(10,2) DEFAULT 0,
  reorder_level     numeric(10,2) DEFAULT 5,
  cost_price        numeric(10,2) DEFAULT 0,
  track_stock       boolean       DEFAULT true,
  created_at        timestamptz   DEFAULT now(),
  updated_at        timestamptz   DEFAULT now()
);

ALTER TABLE pos_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_inventory_owner" ON pos_inventory
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 6. pos_inventory_movements — audit trail
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_inventory_movements (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id        uuid          REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id        uuid          REFERENCES pos_inventory(id) ON DELETE CASCADE,
  movement_type       text          CHECK (movement_type IN ('sale','restock','adjustment','waste')),
  quantity_change     numeric(10,2) NOT NULL,
  reference_order_id  uuid,
  notes               text          DEFAULT '',
  created_at          timestamptz   DEFAULT now()
);

ALTER TABLE pos_inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_inventory_movements_owner" ON pos_inventory_movements
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 7. pos_settings — per-host configuration
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_settings (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id         uuid          REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  kitchen_printer_ip   text          DEFAULT '',
  bar_printer_ip       text          DEFAULT '',
  printer_port         integer       DEFAULT 9100,
  receipt_header       text          DEFAULT 'BAR & RESTAURANT',
  receipt_footer       text          DEFAULT 'Thank you, see you again!',
  tax_label            text          DEFAULT 'VAT',
  tax_rate             numeric(5,2)  DEFAULT 0,
  currency             text          DEFAULT 'KSh',
  created_at           timestamptz   DEFAULT now(),
  updated_at           timestamptz   DEFAULT now()
);

ALTER TABLE pos_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_settings_owner" ON pos_settings
  USING (host_user_id = auth.uid());

-- ──────────────────────────────────────────────
-- Done! Verify with:
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE 'pos_%';
-- ──────────────────────────────────────────────
