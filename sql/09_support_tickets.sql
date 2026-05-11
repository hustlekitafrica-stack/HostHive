-- Support / Help Center tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email  TEXT,
  subject     TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'general',
  description TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','in_progress','resolved','closed')),
  priority    TEXT        NOT NULL DEFAULT 'normal'
                          CHECK (priority IN ('low','normal','high','urgent')),
  admin_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read and insert only their own tickets
CREATE POLICY "Users: read own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users: insert own tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_support_ticket_updated
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_support_ticket_timestamp();
