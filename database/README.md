# Database Migrations

Folder ini berisi migration scripts untuk PostgreSQL database AI-CMS project.

---

## 📋 Available Migrations

Database migrations harus dijalankan secara berurutan:

1. **002_create_users_table_uuid.sql** - ✅ Users table dengan UUID, roles, bcrypt password
2. **003_create_categories_table.sql** - ✅ Categories dengan hierarchical support (parent-child)
3. **004_create_tags_table.sql** - ✅ Tags untuk content tagging
4. **005_create_posts_table.sql** - ✅ Posts dengan SEO fields, AI tracking, full-text search
5. **006_create_post_tags_table.sql** - ✅ Post-Tag relationships (many-to-many)
6. **007_create_media_table.sql** - ✅ Media library untuk Cloudinary integration

**Note:** Migration 001 adalah legacy, gunakan migration 002 untuk fresh start.

---

## 🚀 Cara Menjalankan Migrations

### Option 1: Menggunakan Migration Script (RECOMMENDED)

**Windows (PowerShell):**
```powershell
# Pastikan .env sudah dikonfigurasi
.\database\run-migrations.ps1
```

**Linux/Mac (Bash):**
```bash
# Make executable
chmod +x database/run-migrations.sh

# Run migrations
./database/run-migrations.sh
```

### Option 2: Menggunakan psql langsung

```bash
# Setup environment
export PGPASSWORD=your_password

# Database info
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_cms_db
DB_USER=postgres

# Run migrations in order
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/002_create_users_table_uuid.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/003_create_categories_table.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/004_create_tags_table.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/005_create_posts_table.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/006_create_post_tags_table.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/007_create_media_table.sql
```

### Option 3: Menggunakan Docker Compose

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for postgres to be ready
sleep 5

# Run migrations using docker exec
docker-compose exec postgres psql -U postgres -d ai_cms_db -f /path/to/migrations/file.sql
```

---

## 📦 Database Schema Overview

### Tables Created:

**1. users** (from migration 002)
- User authentication & authorization
- Roles: ADMIN, EDITOR, USER
- Bcrypt password hashing
- Sample users included

**2. categories** (from migration 003)
- Hierarchical categories (parent-child)
- Unique slugs for URLs
- Sample categories: Technology, Programming, Design, Business

**3. tags** (from migration 004)
- Simple tagging system
- Unique slugs
- 20+ sample tags included

**4. posts** (from migration 005)
- Content management with rich text
- Status: draft, published, archived
- SEO fields (meta_title, meta_description, meta_keywords)
- AI tracking (is_ai_generated, ai_prompt)
- Full-text search indexes
- Sample posts included

**5. post_tags** (from migration 006)
- Many-to-many relationship between posts and tags
- Junction table with composite primary key

**6. media** (from migration 007)
- Media library untuk file uploads
- Cloudinary integration ready
- Image metadata (width, height, format)
- File organization dengan folders

---

## 🔧 Setup PostgreSQL

### Local Installation:

**Windows:**
- Download PostgreSQL dari https://www.postgresql.org/download/windows/
- Install dan set password untuk user `postgres`
- Create database: `ai_cms_db`

**Linux:**
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb ai_cms_db
```

**Mac:**
```bash
# Install via Homebrew
brew install postgresql

# Start service
brew services start postgresql

# Create database
createdb ai_cms_db
```

### Using Docker (RECOMMENDED):

```bash
# Start PostgreSQL via docker-compose
docker-compose up -d postgres

# Check if running
docker-compose ps

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d ai_cms_db
```

---

## 🔑 Default Users (After Migration)

Setelah menjalankan migration 002, database akan memiliki 3 sample users:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@example.com | password123 | ADMIN |
| johndoe | john@example.com | password123 | USER |
| janeeditor | jane@example.com | password123 | EDITOR |

**⚠️ IMPORTANT:** Ganti password ini di production!

---

## ✅ Verify Migrations

Setelah menjalankan migrations, verify dengan:

```sql
-- Check all tables
\dt

-- Check users
SELECT id, name, email, role FROM users;

-- Check categories
SELECT id, name, slug, parent_id FROM categories;

-- Check tags
SELECT id, name, slug FROM tags LIMIT 10;

-- Check posts with relationships
SELECT 
    p.title,
    p.status,
    u.name as author,
    c.name as category
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Check post-tags
SELECT 
    p.title,
    string_agg(t.name, ', ') as tags
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
GROUP BY p.id, p.title;
```

---

## 🎯 Database Features

### 1. Auto-updated Timestamps
Semua table utama memiliki trigger untuk auto-update `updated_at`:
- users
- categories
- posts
- media

### 2. Full-Text Search
Posts table memiliki GIN indexes untuk full-text search:
```sql
-- Search in title
SELECT * FROM posts 
WHERE to_tsvector('english', title) @@ to_tsquery('typescript');

-- Search in content
SELECT * FROM posts 
WHERE to_tsvector('english', content) @@ to_tsquery('javascript & tutorial');
```

### 3. Cascading Deletes
- Delete user → posts & media terhapus
- Delete post → post_tags terhapus
- Delete category → posts.category_id set to NULL
- Delete parent category → child categories.parent_id set to NULL

### 4. Status Validation
Posts hanya bisa memiliki status: `draft`, `published`, `archived`

### 5. Auto-publish Timestamp
Ketika post status berubah ke `published`, field `published_at` otomatis diset.

---

## 📝 Struktur Penamaan

Format: `{nomor}_{deskripsi}.sql`

Contoh:
- `002_create_users_table_uuid.sql`
- `003_create_categories_table.sql`
- `004_create_tags_table.sql`

---

## ⚠️ Best Practices

1. ✅ Selalu gunakan `IF NOT EXISTS` untuk CREATE TABLE
2. ✅ Selalu gunakan UUID untuk primary keys
3. ✅ Buat indexes untuk foreign keys dan search columns
4. ✅ Gunakan `ON DELETE CASCADE` atau `SET NULL` sesuai kebutuhan
5. ✅ Jalankan migrations secara berurutan sesuai nomor
6. ✅ Jangan edit migration yang sudah dijalankan di production
7. ✅ Backup database sebelum run migrations di production

---

## 🔄 Rollback Migrations

Jika perlu rollback, gunakan DROP statements:

```sql
-- Rollback dalam urutan terbalik
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp";
```

---

## 📚 References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- UUID Extension: https://www.postgresql.org/docs/current/uuid-ossp.html
- Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html

---

**Created:** 2025-10-22  
**Last Updated:** 2025-10-22  
**Project:** AI-CMS Backend
