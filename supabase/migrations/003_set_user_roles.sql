-- =============================================
-- SET USER ROLES AFTER SIGNUP
-- Run this AFTER both accounts have signed up
-- =============================================

-- Set owner role for admin account
UPDATE users 
SET role = 'owner', onboarding_completed = true
WHERE email = 'm.adibbaroudi@gmail.com';

-- Ensure participant has correct role (should already be set)
UPDATE users 
SET role = 'participant'
WHERE email = 'adib.baroudi2@gmail.com';

-- Verify the changes
SELECT email, role, onboarding_completed FROM users;
