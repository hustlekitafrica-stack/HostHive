-- Migration 20: Fix host_user_id on all existing booking_requests
-- Run this in Supabase SQL Editor
-- Replace the UUID below with your actual Supabase user ID (found in Authentication > Users)

UPDATE booking_requests
SET host_user_id = '626db9cc-8f80-422a-a70b-1a68b28a833a'
WHERE host_user_id = ''
   OR host_user_id IS NULL
   OR host_user_id = '367ed242-238c-4ec2-80dd-215d963f7174';

-- Verify: should show 0 rows after running
SELECT id, guest_name, host_user_id, created_at
FROM booking_requests
WHERE host_user_id != '626db9cc-8f80-422a-a70b-1a68b28a833a'
ORDER BY created_at DESC;
