-- Migration: Create tags table for content tagging
-- Version: 004
-- Date: 2025-10-22

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_created_at ON tags(created_at);

-- Insert sample tags
INSERT INTO tags (name, slug) VALUES
    ('JavaScript', 'javascript'),
    ('TypeScript', 'typescript'),
    ('React', 'react'),
    ('Node.js', 'nodejs'),
    ('Express', 'express'),
    ('PostgreSQL', 'postgresql'),
    ('AI', 'ai'),
    ('Machine Learning', 'machine-learning'),
    ('Tutorial', 'tutorial'),
    ('Guide', 'guide'),
    ('Best Practices', 'best-practices'),
    ('Tips & Tricks', 'tips-tricks'),
    ('Web Development', 'web-development'),
    ('Backend', 'backend'),
    ('Frontend', 'frontend'),
    ('Full Stack', 'full-stack'),
    ('API', 'api'),
    ('REST', 'rest'),
    ('GraphQL', 'graphql'),
    ('DevOps', 'devops');

-- Display created tags
SELECT id, name, slug, created_at 
FROM tags 
ORDER BY name;

