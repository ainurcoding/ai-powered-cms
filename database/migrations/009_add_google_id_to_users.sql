-- Add google_id column to users table for Google OAuth integration
-- Migration: 009_add_google_id_to_users.sql

-- Add google_id column
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Add comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for social login integration';
