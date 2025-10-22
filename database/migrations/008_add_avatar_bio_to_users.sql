-- Migration: Add avatar and bio columns to users table
-- Version: 008
-- Date: 2025-10-22

-- Add avatar column (URL to profile picture)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL;

-- Add bio column (user biography/description)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- Update sample users with default avatars
UPDATE users 
SET avatar = 'https://ui-avatars.com/api/?name=' || REPLACE(name, ' ', '+') || '&background=random&size=200'
WHERE avatar IS NULL;

-- Display updated users
SELECT id, name, username, email, role, avatar, bio
FROM users
ORDER BY created_at;

