# Changelog

## [1.0.0] - 2025-10-07

### 🎉 Major Rewrite

Boilerplate telah di-rebuild dari ground up dengan dependency yang lebih universal dan mudah di-maintain.

### ✨ Added

- Core utilities (logger, exceptions, response handlers) menggunakan Winston
- PostgreSQL support dengan connection pooling
- Express server dengan middleware modern (Helmet, CORS, Compression)
- Auto-routing system berdasarkan struktur folder
- Request validation dengan Valibot
- Custom exception classes untuk error handling
- BaseRepository pattern untuk database operations
- Bcrypt password hashing (menggantikan MD5)
- Docker Compose dengan PostgreSQL service
- Database migrations dengan SQL scripts
- Comprehensive README dan documentation
- .env.example untuk environment setup
- Password hashing CLI tool
- Graceful shutdown handling

### 🔄 Changed

- **Breaking**: Ganti MySQL dengan PostgreSQL
- **Breaking**: Ganti semua internal Knitto packages dengan library standard
- **Breaking**: Database schema menggunakan PostgreSQL conventions
- **Breaking**: Query syntax dari `?` (MySQL) ke `$1, $2` (PostgreSQL)
- Improve error handling dengan custom exceptions
- Improve logging dengan Winston (console + file)
- Update authentication flow dengan bcrypt
- Simplify Express server setup
- Update WebSocket path dari `/knitto-socket` ke `/socket`

### 🗑️ Removed

- **Breaking**: Hapus semua `@knittotextile/*` internal packages
- **Breaking**: Hapus RabbitMQ support (tidak diperlukan untuk boilerplate dasar)
- **Breaking**: Hapus MySQL connector
- Hapus dependency pada private NPM registry

### 🔧 Technical Details

**Dependencies yang diganti:**
- `@knittotextile/knitto-core-backend` → `winston` untuk logging
- `@knittotextile/knitto-http` → Native `express` + custom utilities
- `@knittotextile/knitto-mysql` → `pg` (PostgreSQL driver)
- `@knittotextile/knitto-rabbitmq` → Removed (tidak diperlukan)

**New Dependencies:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `winston` - Logger
- `helmet` - Security headers
- `cors` - CORS middleware
- `compression` - Response compression
- `morgan` - HTTP request logger
- `bcryptjs` - Password hashing

### 📝 Migration Guide

Jika Anda menggunakan versi sebelumnya (0.x.x), berikut perubahan penting:

#### 1. Database
```bash
# Sebelumnya: MySQL
DB_HOST_MYSQL=localhost
DB_NAME_MYSQL=db_name

# Sekarang: PostgreSQL
DB_HOST_POSTGRES=localhost
DB_NAME_POSTGRES=db_name
```

#### 2. Imports
```typescript
// ❌ Sebelumnya
import { logger } from '@knittotextile/knitto-core-backend';
import { TRequestFunction } from '@knittotextile/knitto-http';

// ✅ Sekarang
import { logger, TRequestFunction } from '@/libs/core';
```

#### 3. Database Queries
```typescript
// ❌ Sebelumnya (MySQL)
await mysqlConnection.raw('SELECT * FROM users WHERE id = ?', [id]);

// ✅ Sekarang (PostgreSQL)
await postgresConnection.query('SELECT * FROM users WHERE id = $1', [id]);
```

#### 4. Password Hashing
```typescript
// ❌ Sebelumnya (MD5 - tidak aman!)
'SELECT * FROM users WHERE password = md5(?)'

// ✅ Sekarang (Bcrypt)
const isValid = await bcrypt.compare(password, user.password);
```

### 🚀 Upgrade Steps

1. Backup data MySQL Anda
2. Install PostgreSQL
3. Run migration scripts di `database/migrations/`
4. Update `.env` dengan PostgreSQL credentials
5. Install dependencies: `pnpm install`
6. Run aplikasi: `pnpm dev`

---

## Legacy Versions

Changelog untuk versi 0.x.x (dengan Knitto packages) tersedia di git history.

### [0.7.1] - Archived
- Last version menggunakan internal Knitto packages
- Menggunakan MySQL + RabbitMQ
- Requires private NPM registry access

---

**Note**: Versi 1.0.0 adalah breaking change major yang tidak backward compatible dengan versi 0.x.x.
