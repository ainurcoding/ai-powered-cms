-- Migration: Create media table for file management
-- Version: 007
-- Date: 2025-10-22

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Storage information (Cloudinary)
    url VARCHAR(500) NOT NULL,
    secure_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    public_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Image dimensions (if applicable)
    width INTEGER,
    height INTEGER,
    format VARCHAR(20),
    
    -- Organization
    folder VARCHAR(255) DEFAULT 'uploads',
    alt_text TEXT,
    caption TEXT,
    
    -- Relationships
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_media_file_name ON media(file_name);
CREATE INDEX idx_media_file_type ON media(file_type);
CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_created_at ON media(created_at);
CREATE INDEX idx_media_public_id ON media(public_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_media_updated_at 
    BEFORE UPDATE ON media 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Sample data will be added after Cloudinary integration
-- For now, table structure is ready for Week 2

-- Display media table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'media'
ORDER BY ordinal_position;

