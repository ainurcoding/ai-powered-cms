-- Migration: Create categories table for hierarchical content organization
-- Version: 003
-- Date: 2025-10-22

-- Create categories table with hierarchical support
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, slug, description, parent_id) VALUES
    ('Technology', 'technology', 'All about technology and innovation', NULL),
    ('Programming', 'programming', 'Programming tutorials and guides', NULL),
    ('Design', 'design', 'Design principles and resources', NULL),
    ('Business', 'business', 'Business insights and strategies', NULL);

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id) VALUES
    ('JavaScript', 'javascript', 'JavaScript tutorials', 
        (SELECT id FROM categories WHERE slug = 'programming')),
    ('TypeScript', 'typescript', 'TypeScript guides', 
        (SELECT id FROM categories WHERE slug = 'programming')),
    ('UI Design', 'ui-design', 'User interface design', 
        (SELECT id FROM categories WHERE slug = 'design')),
    ('UX Design', 'ux-design', 'User experience design', 
        (SELECT id FROM categories WHERE slug = 'design'));

-- Display created categories with hierarchy
SELECT 
    c.id,
    c.name,
    c.slug,
    c.parent_id,
    p.name as parent_name,
    c.created_at
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY c.parent_id NULLS FIRST, c.name;

