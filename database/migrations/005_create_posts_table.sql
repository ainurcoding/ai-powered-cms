-- Migration: Create posts table for content management
-- Version: 005
-- Date: 2025-10-22

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured_image VARCHAR(500),
    
    -- SEO fields
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    meta_keywords VARCHAR(500),
    
    -- Author & Category relationships
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Statistics
    view_count INTEGER DEFAULT 0,
    
    -- AI tracking
    is_ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_is_ai_generated ON posts(is_ai_generated);

-- Full-text search index
CREATE INDEX idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

-- Trigger to automatically update updated_at
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_published_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

-- Insert sample posts
INSERT INTO posts (
    title, 
    slug, 
    excerpt, 
    content, 
    status, 
    author_id, 
    category_id,
    meta_title,
    meta_description
) VALUES 
(
    'Getting Started with TypeScript',
    'getting-started-with-typescript',
    'Learn the basics of TypeScript and why it matters for modern web development.',
    '<h1>Getting Started with TypeScript</h1><p>TypeScript is a powerful superset of JavaScript that adds static typing...</p><h2>Why TypeScript?</h2><p>TypeScript helps catch errors early in development...</p>',
    'published',
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'typescript'),
    'Getting Started with TypeScript - Complete Guide',
    'Learn TypeScript from scratch with this comprehensive guide covering basics to advanced topics.'
),
(
    'Building REST APIs with Express',
    'building-rest-apis-with-express',
    'A comprehensive guide to building RESTful APIs using Express.js and TypeScript.',
    '<h1>Building REST APIs with Express</h1><p>Express.js is a minimal and flexible Node.js web application framework...</p>',
    'published',
    (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'programming'),
    'Building REST APIs with Express.js - Tutorial',
    'Step-by-step tutorial on creating RESTful APIs with Express.js, TypeScript, and PostgreSQL.'
),
(
    'AI-Powered Content Generation',
    'ai-powered-content-generation',
    'Explore how AI is revolutionizing content creation and management systems.',
    '<h1>AI-Powered Content Generation</h1><p>Artificial Intelligence is transforming how we create and manage content...</p>',
    'draft',
    (SELECT id FROM users WHERE role = 'EDITOR' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'technology'),
    'AI-Powered Content Generation - The Future',
    'Discover how AI technology is changing content creation with automated generation and optimization.'
);

-- Display created posts
SELECT 
    p.id,
    p.title,
    p.slug,
    p.status,
    u.name as author_name,
    c.name as category_name,
    p.created_at
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC;

