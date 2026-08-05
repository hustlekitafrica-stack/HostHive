-- Add PIN support to team_members for admin/staff login

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_pin_hash_idx
  ON team_members(pin_hash)
  WHERE pin_hash IS NOT NULL;

COMMENT ON COLUMN team_members.pin_hash IS 'Bcrypt hash of the user''s login PIN';

-- One-time seed for the first admin/owner.
-- Replace the owner email and the bcrypt hash of the desired PIN below,
-- then uncomment and run the INSERT. To generate the hash, use bcrypt on the PIN.
-- INSERT INTO team_members (user_id, email, full_name, role, access_level, pin_hash, invitation_accepted, is_active)
-- SELECT id, email, 'Owner', 'owner', 'admin', '$2a$10$...', TRUE, TRUE
-- FROM auth.users
-- WHERE email = 'owner@example.com';
