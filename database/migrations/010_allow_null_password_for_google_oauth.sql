-- Allow NULL password for Google OAuth users
-- Migration: 010_allow_null_password_for_google_oauth.sql

-- Remove NOT NULL constraint from password column
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN users.password IS 'Password hash for regular login. NULL for Google OAuth users.';
