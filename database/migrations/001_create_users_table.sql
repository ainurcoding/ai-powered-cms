-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    level VARCHAR(50) DEFAULT 'USER',
    aktif BOOLEAN DEFAULT true,
    status_login VARCHAR(50) DEFAULT 'FREE',
    hint_password VARCHAR(255),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Create index on status_login
CREATE INDEX idx_users_status_login ON users(status_login);

-- Function to update updated_at timestamp
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

-- Insert sample user (password: 'password123' hashed with bcrypt)
-- You can generate bcrypt hash using: https://bcrypt-generator.com/
INSERT INTO users (nama, username, password, level) 
VALUES (
    'Admin User',
    'admin',
    '$2a$10$rC6Q8X9c3V3vK9Y8X0Z8XuE4k4h8x0Z8XuE4k4h8x0Z8XuE4k4h8xu',
    'ADMIN'
) ON CONFLICT (username) DO NOTHING;

