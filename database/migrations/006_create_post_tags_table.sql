-- Migration: Create post_tags junction table for many-to-many relationship
-- Version: 006
-- Date: 2025-10-22

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- Insert sample post-tag relationships
-- Post: "Getting Started with TypeScript"
INSERT INTO post_tags (post_id, tag_id) VALUES
    (
        (SELECT id FROM posts WHERE slug = 'getting-started-with-typescript'),
        (SELECT id FROM tags WHERE slug = 'typescript')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'getting-started-with-typescript'),
        (SELECT id FROM tags WHERE slug = 'tutorial')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'getting-started-with-typescript'),
        (SELECT id FROM tags WHERE slug = 'web-development')
    );

-- Post: "Building REST APIs with Express"
INSERT INTO post_tags (post_id, tag_id) VALUES
    (
        (SELECT id FROM posts WHERE slug = 'building-rest-apis-with-express'),
        (SELECT id FROM tags WHERE slug = 'nodejs')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'building-rest-apis-with-express'),
        (SELECT id FROM tags WHERE slug = 'express')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'building-rest-apis-with-express'),
        (SELECT id FROM tags WHERE slug = 'api')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'building-rest-apis-with-express'),
        (SELECT id FROM tags WHERE slug = 'backend')
    );

-- Post: "AI-Powered Content Generation"
INSERT INTO post_tags (post_id, tag_id) VALUES
    (
        (SELECT id FROM posts WHERE slug = 'ai-powered-content-generation'),
        (SELECT id FROM tags WHERE slug = 'ai')
    ),
    (
        (SELECT id FROM posts WHERE slug = 'ai-powered-content-generation'),
        (SELECT id FROM tags WHERE slug = 'machine-learning')
    );

-- Display post-tag relationships
SELECT 
    p.title as post_title,
    t.name as tag_name
FROM post_tags pt
JOIN posts p ON pt.post_id = p.id
JOIN tags t ON pt.tag_id = t.id
ORDER BY p.title, t.name;

