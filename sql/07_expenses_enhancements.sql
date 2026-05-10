-- HostBooks KE - Expenses Enhancements
-- Run in Supabase SQL Editor after 01_core_tables.sql

-- Add gross, tax, net, and category_name columns to expenses table
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS gross  DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax    DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net    DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category_name TEXT;

-- RLS policies for expense_categories (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expense_categories' AND policyname = 'Users can view own expense categories'
  ) THEN
    CREATE POLICY "Users can view own expense categories"
      ON expense_categories FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expense_categories' AND policyname = 'Users can insert own expense categories'
  ) THEN
    CREATE POLICY "Users can insert own expense categories"
      ON expense_categories FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expense_categories' AND policyname = 'Users can delete own expense categories'
  ) THEN
    CREATE POLICY "Users can delete own expense categories"
      ON expense_categories FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS policies for expenses (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expenses' AND policyname = 'Users can view own expenses'
  ) THEN
    CREATE POLICY "Users can view own expenses"
      ON expenses FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expenses' AND policyname = 'Users can insert own expenses'
  ) THEN
    CREATE POLICY "Users can insert own expenses"
      ON expenses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'expenses' AND policyname = 'Users can delete own expenses'
  ) THEN
    CREATE POLICY "Users can delete own expenses"
      ON expenses FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
