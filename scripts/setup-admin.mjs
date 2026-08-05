/**
 * Seed the first admin PIN (non-interactive).
 * Usage:  node scripts/setup-admin.mjs <PIN>
 * Example: node scripts/setup-admin.mjs 123456
 *
 * Run sql/30_admin_pins.sql in Supabase SQL Editor first if you haven't already.
 */
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = join(__dirname, '..', '.env.local');
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
} catch {
  console.error('Could not read .env.local');
  process.exit(1);
}

const SUPABASE_URL     = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ── PIN from args ────────────────────────────────────────────────────────────
let pin = process.argv[2];
if (!pin) {
  pin = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`No PIN provided — auto-generated: ${pin}`);
}
pin = pin.trim();
if (pin.length < 4 || pin.length > 8) {
  console.error('PIN must be 4–8 characters');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('\n  Kogelo Suites — Admin PIN Setup\n');

  // 1) List auth users
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr || !users?.length) {
    console.error('✗ No Supabase auth users found:', listErr?.message || 'empty list');
    console.error('  Make sure you have a registered account in Supabase.');
    process.exit(1);
  }

  // Pick the first user (or the one matching ADMIN_EMAIL env var if set)
  const adminEmail = env['ADMIN_EMAIL'];
  const targetUser = adminEmail
    ? (users.find((u) => u.email === adminEmail) || users[0])
    : users[0];

  console.log(`  Admin user : ${targetUser.email}`);
  console.log(`  PIN        : ${'*'.repeat(pin.length)}`);

  // 2) Hash the PIN
  const pinHash = bcrypt.hashSync(pin, 10);

  // 3) Update the Supabase auth password to the PIN.
  //    Supabase requires ≥6 chars, so short PINs get a fixed suffix (__ks__).
  //    The login API applies the same suffix, so users just type their PIN.
  const authPassword = pin.length < 6 ? pin + '__ks__' : pin;
  const { error: pwErr } = await adminClient.auth.admin.updateUserById(targetUser.id, {
    password: authPassword,
  });
  if (pwErr) {
    console.error('\n✗ Failed to update auth password:', pwErr.message);
    process.exit(1);
  }
  console.log('\n  ✓ Supabase auth password set to PIN');

  // 4) Upsert team_members record
  const { data: existing } = await adminClient
    .from('team_members')
    .select('id')
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await adminClient
      .from('team_members')
      .update({ pin_hash: pinHash, is_active: true })
      .eq('user_id', targetUser.id);
    if (updErr) {
      console.error('\n✗ Failed to update team_members:', updErr.message);
      process.exit(1);
    }
    console.log('  ✓ Existing team_members record updated with new PIN hash');
  } else {
    const { error: insErr } = await adminClient.from('team_members').insert({
      user_id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.user_metadata?.full_name || 'Owner',
      role: 'owner',
      access_level: 'admin',
      pin_hash: pinHash,
      invitation_accepted: true,
      is_active: true,
    });
    if (insErr) {
      console.error('\n✗ Failed to insert into team_members:', insErr.message);
      console.error('  Did you run the migration SQL in Supabase first?');
      console.error('  See sql/30_admin_pins.sql');
      process.exit(1);
    }
    console.log('  ✓ team_members record created');
  }

  // 5) Done
  console.log('\n  ╔══════════════════════════════════════════╗');
  console.log(`  ║  YOUR ADMIN PIN:  ${pin.padEnd(24)}║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('\n  Go to /auth/login and enter this PIN.\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
