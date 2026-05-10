# Phase 1 — Database Schema Complete ✅

## What Was Created

### SQL Files (Ready to Run)

**1. `sql/01_core_tables.sql`** (700+ lines)
- Creates 17 core tables
- Creates 6 extended tables
- Creates 2 aggregation tables
- Creates 25 indexes for performance
- Enables RLS on all tables

**2. `sql/02_rls_policies.sql`** (600+ lines)
- Creates 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- Scopes all access to user's own data
- Allows service_role for stats aggregation

**3. `sql/03_storage_and_seed.sql`** (400+ lines)
- Creates `seed_user_defaults()` trigger
- Creates `recalculate_unit_stats()` RPC function
- Creates auto-calculation triggers
- Creates audit log triggers

### Documentation

**`PHASE_1_SETUP.md`** — Step-by-step guide to:
1. Enable UUID extension
2. Create all tables
3. Enable RLS policies
4. Create storage bucket
5. Create functions & triggers
6. Verify everything works

---

## Database Overview

### Core Tables (17)
| Table | Purpose |
|-------|---------|
| property_groups | Organize properties into groups |
| properties | Main property listing data |
| property_photos | Photos for each property |
| property_amenities | Amenities list for properties |
| property_beds | Bed configuration per room |
| seasonal_pricing | Seasonal rate overrides |
| guests | Guest contact information |
| bookings | Booking records with amounts |
| payment_logs | Payment transaction history |
| blocked_dates | Blocked/unavailable dates |
| reminders | User reminders & tasks |
| expenses | Expense tracking |
| inquiries | Guest inquiries |
| ad_spend | Marketing spend tracking |
| alert_snoozes | Snoozed alerts |
| report_templates | Saved report templates |
| scheduled_reports | Automated report scheduling |

### Extended Tables (6)
| Table | Purpose |
|-------|---------|
| profiles | User profile & business info |
| income_categories | Customizable income categories |
| expense_categories | Customizable expense categories |
| team_members | Caretaker/staff management |
| ai_usage_logs | AI API usage tracking |
| audit_logs | Financial transaction audit trail |

### Aggregation Tables (2)
| Table | Purpose |
|-------|---------|
| unit_monthly_stats | Pre-calculated monthly metrics (occupancy, ADR, RevPAR) |
| payment_method_stats | Payment method breakdown by month |

---

## Key Features

### ✅ Row Level Security (RLS)
- All tables protected by RLS
- Users can only see their own data
- Service role can update stats

### ✅ Auto-Calculation
- Monthly stats auto-recalculate when bookings change
- Occupancy rate = (booked_nights / available_nights) * 100
- ADR = total_revenue / booked_nights
- RevPAR = total_revenue / available_nights

### ✅ Audit Logging
- All booking changes logged
- All payment changes logged
- All expense changes logged
- Tracks old_values and new_values

### ✅ Default Categories
- New users automatically get 10 income categories
- New users automatically get 18 expense categories
- Categories are pre-populated on signup

### ✅ Performance Optimized
- 25 indexes on frequently queried columns
- Aggregation tables for fast dashboard queries
- Proper foreign key relationships

---

## Occupancy Calculation Rules

```
available_nights = days_in_month - blocked_nights
occupancy_rate = (booked_nights / available_nights) * 100
adr = total_revenue / booked_nights
revpar = total_revenue / available_nights
```

**Example:**
- Month has 30 days
- 2 days blocked for maintenance
- Available nights = 28
- 20 nights booked
- Total revenue = KSH 100,000
- Occupancy = (20 / 28) * 100 = 71.4%
- ADR = 100,000 / 20 = 5,000
- RevPAR = 100,000 / 28 = 3,571

---

## How to Apply Phase 1

### Option A: Copy-Paste (Recommended for First Time)

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `sql/01_core_tables.sql`
3. Paste into SQL Editor → Run
4. Copy entire contents of `sql/02_rls_policies.sql`
5. Paste into SQL Editor → Run
6. Copy entire contents of `sql/03_storage_and_seed.sql`
7. Paste into SQL Editor → Run
8. Create storage bucket manually (see PHASE_1_SETUP.md)

### Option B: Use Supabase Migrations (Advanced)

If you're using Supabase migrations:
1. Create migration files from the SQL files
2. Run `supabase migration up`

---

## Verification Checklist

After running all SQL files, verify:

- [ ] All 25 tables exist in Supabase Dashboard
- [ ] All tables have RLS enabled
- [ ] All tables have 4 policies each
- [ ] 6 functions created (seed, recalc, triggers)
- [ ] Storage bucket "property-photos" created
- [ ] Indexes created (25 total)

---

## What's Next

**Phase 2 — Authentication** (2 sessions)
- Login page with email/password
- Register page with validation
- Forgot password flow
- Auth middleware
- Session management

---

## Files Location

```
hostbooks-ke/
├── sql/
│   ├── 01_core_tables.sql
│   ├── 02_rls_policies.sql
│   └── 03_storage_and_seed.sql
├── PHASE_1_SETUP.md
└── PHASE_1_COMPLETE.md
```

---

## Important Notes

1. **Run in order:** 01 → 02 → 03
2. **Storage bucket:** Must be created manually in Supabase Dashboard
3. **Service role key:** Needed for API routes (already in .env.local)
4. **RLS is strict:** Users can only access their own data
5. **Audit logging:** All financial changes are tracked

---

**Status:** Phase 1 complete ✅

Ready to proceed with **Phase 2 — Authentication**?
