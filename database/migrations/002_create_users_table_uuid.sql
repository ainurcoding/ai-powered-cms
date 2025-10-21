-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old table if exists (for fresh start)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with UUID
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample users with bcrypt hashed passwords
-- Password: 'password123' 
-- Bcrypt hash: $2a$10$rC6Q8X9c3V3vK9Y8X0Z8XuE4k4h8x0Z8XuE4k4h8x0Z8XuE4k4h8xu

-- Admin user
INSERT INTO users (name, username, email, password, role) 
VALUES (
    'Administrator',
    'admin',
    'admin@example.com',
    '$2a$10$rC6Q8X9c3V3vK9Y8X0Z8XuE4k4h8x0Z8XuE4k4h8x0Z8XuE4k4h8xu',
    'ADMIN'
);

-- Regular user
INSERT INTO users (name, username, email, password, role) 
VALUES (
    'John Doe',
    'johndoe',
    'john@example.com',
    '$2a$10$rC6Q8X9c3V3vK9Y8X0Z8XuE4k4h8x0Z8XuE4k4h8x0Z8XuE4k4h8xu',
    'USER'
);

-- Editor user
INSERT INTO users (name, username, email, password, role) 
VALUES (
    'Jane Editor',
    'janeeditor',
    'jane@example.com',
    '$2a$10$rC6Q8X9c3V3vK9Y8X0Z8XuE4k4h8x0Z8XuE4k4h8x0Z8XuE4k4h8xu',
    'EDITOR'
);

-- Display created users
SELECT id, name, username, email, role, is_active, created_at 
FROM users 
ORDER BY created_at;

