-- HostBooks KE - Phase 1 RLS Policies
-- Run this after 01_core_tables.sql

-- ============================================================================
-- PROPERTY_GROUPS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own property groups"
  ON property_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property groups"
  ON property_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property groups"
  ON property_groups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property groups"
  ON property_groups FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROPERTIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROPERTY_PHOTOS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own property photos"
  ON property_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property photos"
  ON property_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property photos"
  ON property_photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property photos"
  ON property_photos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROPERTY_AMENITIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own property amenities"
  ON property_amenities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property amenities"
  ON property_amenities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property amenities"
  ON property_amenities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property amenities"
  ON property_amenities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROPERTY_BEDS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own property beds"
  ON property_beds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property beds"
  ON property_beds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property beds"
  ON property_beds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property beds"
  ON property_beds FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEASONAL_PRICING POLICIES
-- ============================================================================

CREATE POLICY "Users can view own seasonal pricing"
  ON seasonal_pricing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seasonal pricing"
  ON seasonal_pricing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seasonal pricing"
  ON seasonal_pricing FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own seasonal pricing"
  ON seasonal_pricing FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- GUESTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own guests"
  ON guests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guests"
  ON guests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guests"
  ON guests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guests"
  ON guests FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BOOKINGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PAYMENT_LOGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own payment logs"
  ON payment_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment logs"
  ON payment_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment logs"
  ON payment_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BLOCKED_DATES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own blocked dates"
  ON blocked_dates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocked dates"
  ON blocked_dates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blocked dates"
  ON blocked_dates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocked dates"
  ON blocked_dates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- REMINDERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INQUIRIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inquiries"
  ON inquiries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inquiries"
  ON inquiries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AD_SPEND POLICIES
-- ============================================================================

CREATE POLICY "Users can view own ad spend"
  ON ad_spend FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad spend"
  ON ad_spend FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad spend"
  ON ad_spend FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ad spend"
  ON ad_spend FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ALERT_SNOOZES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own alert snoozes"
  ON alert_snoozes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert snoozes"
  ON alert_snoozes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert snoozes"
  ON alert_snoozes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert snoozes"
  ON alert_snoozes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- REPORT_TEMPLATES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own report templates"
  ON report_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report templates"
  ON report_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own report templates"
  ON report_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own report templates"
  ON report_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SCHEDULED_REPORTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own scheduled reports"
  ON scheduled_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled reports"
  ON scheduled_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled reports"
  ON scheduled_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled reports"
  ON scheduled_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- INCOME_CATEGORIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own income categories"
  ON income_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income categories"
  ON income_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income categories"
  ON income_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income categories"
  ON income_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXPENSE_CATEGORIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own expense categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TEAM_MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "Only owner can view team members"
  ON team_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only owner can invite team members"
  ON team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only owner can update team members"
  ON team_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only owner can delete team members"
  ON team_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI_USAGE_LOGS POLICIES (READ-ONLY)
-- ============================================================================

CREATE POLICY "Users can view own AI usage logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT_LOGS POLICIES (READ-ONLY)
-- ============================================================================

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- UNIT_MONTHLY_STATS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own unit monthly stats"
  ON unit_monthly_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert unit monthly stats"
  ON unit_monthly_stats FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update unit monthly stats"
  ON unit_monthly_stats FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- PAYMENT_METHOD_STATS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own payment method stats"
  ON payment_method_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payment method stats"
  ON payment_method_stats FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update payment method stats"
  ON payment_method_stats FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
