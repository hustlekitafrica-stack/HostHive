# Phase 1 — Database Schema Setup Guide

## Overview

Phase 1 creates the complete database schema with:
- **17 core tables** (properties, bookings, guests, payments, etc.)
- **6 extended tables** (profiles, categories, team, audit)
- **2 aggregation tables** (monthly stats, payment stats)
- **Row Level Security (RLS)** on all tables
- **Indexes** for performance
- **Triggers** for auto-calculation and audit logging
- **RPC functions** for complex operations

---

## Step-by-Step Setup

### Step 1.1 — Enable UUID Extension

Go to Supabase Dashboard → SQL Editor and run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 1.2 — Create All Tables

Copy the entire contents of `sql/01_core_tables.sql` and paste into Supabase SQL Editor.

**What this does:**
- Creates all 25 tables (17 core + 6 extended + 2 aggregation)
- Creates indexes for performance
- Enables RLS on all tables

**Expected output:** No errors, all tables created.

### Step 1.3 — Enable RLS Policies

Copy the entire contents of `sql/02_rls_policies.sql` and paste into Supabase SQL Editor.

**What this does:**
- Creates 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- Scopes all access to `auth.uid()` (user's own data only)
- Allows service_role for stats aggregation

**Expected output:** No errors, all policies created.

### Step 1.4 — Create Storage Bucket

Go to Supabase Dashboard → Storage:

1. Click **New Bucket**
2. Name: `property-photos`
3. Check **Public bucket**
4. Click **Create bucket**

Then add this policy in the bucket's **Policies** tab:

```sql
CREATE POLICY "Allow authenticated users to upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');
```

### Step 1.5 — Create Functions & Triggers

Copy the entire contents of `sql/03_storage_and_seed.sql` and paste into Supabase SQL Editor.

**What this does:**
- Creates `seed_user_defaults()` trigger (auto-creates default categories for new users)
- Creates `recalculate_unit_stats()` RPC function (calculates monthly stats)
- Creates triggers to auto-recalculate stats when bookings change
- Creates audit log triggers for bookings, payments, expenses

**Expected output:** No errors, all functions and triggers created.

---

## Verification

### Check Tables Created

Go to Supabase Dashboard → Database → Tables. You should see:

**Core Tables (17):**
- property_groups
- properties
- property_photos
- property_amenities
- property_beds
- seasonal_pricing
- guests
- bookings
- payment_logs
- blocked_dates
- reminders
- expenses
- inquiries
- ad_spend
- alert_snoozes
- report_templates
- scheduled_reports

**Extended Tables (6):**
- profiles
- income_categories
- expense_categories
- team_members
- ai_usage_logs
- audit_logs

**Aggregation Tables (2):**
- unit_monthly_stats
- payment_method_stats

### Check RLS Enabled

For any table, click it and go to **Authentication** tab. You should see:
- ✅ RLS enabled
- ✅ 4 policies listed (SELECT, INSERT, UPDATE, DELETE)

### Check Functions Created

Go to Supabase Dashboard → Database → Functions. You should see:
- `seed_user_defaults()`
- `recalculate_unit_stats()`
- `trigger_recalculate_stats()`
- `trigger_audit_booking()`
- `trigger_audit_payment()`
- `trigger_audit_expense()`

### Check Storage Bucket

Go to Supabase Dashboard → Storage. You should see:
- ✅ `property-photos` bucket (public)

---

## What Happens Next

Once Phase 1 is complete:

1. **New users automatically get default categories** when they sign up (via `seed_user_defaults()` trigger)
2. **Monthly stats auto-calculate** when bookings are created/updated (via `trigger_recalculate_stats()`)
3. **All transactions are logged** for audit trail (via audit triggers)
4. **All data is protected by RLS** — users can only see their own data

---

## Troubleshooting

### Error: "relation already exists"
- You've already run this SQL. That's fine. You can run it again safely.

### Error: "permission denied for schema public"
- Make sure you're logged in as the project owner in Supabase.

### Error: "function seed_user_defaults() does not exist"
- Make sure you ran `03_storage_and_seed.sql` after `02_rls_policies.sql`.

### Tables created but RLS not working
- Go to each table → Authentication tab → toggle RLS ON if it's off.

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTH.USERS (Supabase)                    │
│                                                                   │
│  id (UUID) | email | created_at | ...                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
         ┌──────────────┐ ┌────────┐ ┌──────────────┐
         │   PROFILES   │ │PROPERTY│ │    GUESTS    │
         │              │ │ GROUPS │ │              │
         └──────────────┘ └────────┘ └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ PROPERTIES   │
                         │              │
                         │ - name       │
                         │ - type       │
                         │ - location   │
                         │ - rates      │
                         └──────────────┘
                         │    │    │
            ┌────────────┼────┼────┼────────────┐
            │            │    │    │            │
            ▼            ▼    ▼    ▼            ▼
      ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐
      │ PHOTOS  │  │AMENITIES │  │  BEDS  │  │SEASONAL  │
      │         │  │          │  │        │  │PRICING   │
      └─────────┘  └──────────┘  └────────┘  └──────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  BOOKINGS    │
                         │              │
                         │ - check_in   │
                         │ - check_out  │
                         │ - amount     │
                         │ - status     │
                         └──────────────┘
                         │    │    │
            ┌────────────┼────┼────┼────────────┐
            │            │    │    │            │
            ▼            ▼    ▼    ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
      │ PAYMENTS │ │ BLOCKED  │ │INQUIRIES│ │REMINDERS │
      │          │ │  DATES   │ │        │ │          │
      └──────────┘ └──────────┘ └────────┘ └──────────┘

AGGREGATION TABLES:
┌──────────────────────┐  ┌──────────────────────┐
│ UNIT_MONTHLY_STATS   │  │PAYMENT_METHOD_STATS  │
│                      │  │                      │
│ - occupancy_rate     │  │ - payment_method     │
│ - adr                │  │ - total_amount       │
│ - revpar             │  │ - transaction_count  │
│ - total_revenue      │  │                      │
└──────────────────────┘  └──────────────────────┘

AUDIT & SETTINGS:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AUDIT_LOGS   │ │ AI_USAGE_LOG │ │ TEAM_MEMBERS │
│              │ │              │ │              │
│ - action     │ │ - feature    │ │ - role       │
│ - old_values │ │ - tokens     │ │ - access     │
│ - new_values │ │ - cost       │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

CATEGORIES:
┌──────────────────────┐  ┌──────────────────────┐
│ INCOME_CATEGORIES    │  │ EXPENSE_CATEGORIES   │
│                      │  │                      │
│ - name               │  │ - name               │
│ - is_default         │  │ - is_default         │
│ - icon               │  │ - icon               │
│ - color              │  │ - color              │
└──────────────────────┘  └──────────────────────┘
```

---

## Next Steps

Once Phase 1 is complete, proceed to **Phase 2 — Authentication** where you'll create:
- Login page
- Register page
- Forgot password page
- Auth middleware
- Session management

**Status:** Phase 1 complete ✅
