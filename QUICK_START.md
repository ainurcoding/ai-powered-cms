# 🚀 Quick Start Guide

Panduan cepat untuk memulai development dengan boilerplate ini.

## 📦 Setup Awal (5 menit)

### 1. Install Dependencies

```bash
# Pastikan sudah install pnpm
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Setup Environment

```bash
# Copy file environment
cp .env.example .env

# Edit .env, minimal yang perlu diubah:
# - APP_SECRET_KEY (gunakan string random yang kuat)
# - Database credentials PostgreSQL Anda
```

### 3. Setup Database

**Option A: Gunakan Docker (Recommended)**

```bash
# Start PostgreSQL via Docker Compose
docker-compose up -d postgres

# Database otomatis siap di:
# Host: localhost
# Port: 5432
# User: postgres (dari .env)
# Database: postgres (dari .env)
```

**Option B: Install PostgreSQL Manual**

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Atau gunakan installer untuk OS lain:
# https://www.postgresql.org/download/

# Buat database
createdb your_database_name
```

### 4. Run Migrations

```bash
# Connect ke database dan run migration
psql -U postgres -d your_database_name -f database/migrations/001_create_users_table.sql
```

### 5. Start Development Server

```bash
pnpm dev
```

Server akan berjalan di `http://localhost:8000` 🎉

## 🧪 Test API

### Health Check

```bash
curl http://localhost:8000/
```

Response:
```json
{
  "message": "Success",
  "result": {
    "APP_NAME": "rest-boilerplate-ts",
    "APP_VERSION": "1.0.0"
  }
}
```

### Login (Default User)

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Success",
  "result": {
    "user": {
      "id_user": 1,
      "nama": "Admin User",
      "username": "admin",
      "level": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Test Protected Endpoint

```bash
curl http://localhost:8000/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 Lihat Dokumentasi

Buka browser:
```
http://localhost:8000/docs
```

Swagger UI akan menampilkan semua API endpoints yang tersedia.

## 🏗️ Buat Module Pertama Anda

### 1. Buat Folder Module

```bash
mkdir -p src/app/http/products
```

### 2. Buat Controller (`products.controller.ts`)

```typescript
import { TRequestFunction } from '@/libs/core';

const getAll: TRequestFunction = async () => {
  return {
    result: [
      { id: 1, name: 'Product 1', price: 100000 },
      { id: 2, name: 'Product 2', price: 200000 }
    ]
  };
};

const getById: TRequestFunction = async (req) => {
  const id = req.params.id;
  return {
    result: {
      id,
      name: `Product ${id}`,
      price: 100000
    }
  };
};

export default { getAll, getById };
```

### 3. Buat Routes (`products.routes.ts`)

```typescript
import { Router } from 'express';
import { requestHandler } from '@/libs/core';
import controller from './products.controller';

const router = Router();

/**
 * GET /products
 * @tags Products
 * @summary Get all products
 * @return {object} 200 - Success
 */
router.get('/products', requestHandler(controller.getAll));

/**
 * GET /products/{id}
 * @tags Products
 * @summary Get product by ID
 * @param {string} id.path.required - Product ID
 * @return {object} 200 - Success
 */
router.get('/products/:id', requestHandler(controller.getById));

export default router;
```

### 4. Test!

```bash
# Restart dev server (Ctrl+C dan pnpm dev lagi)
# atau tunggu hot reload

# Test endpoint
curl http://localhost:8000/products
```

**Routes otomatis ter-load!** Tidak perlu import manual. 🎉

## 🔐 Buat User Baru

### 1. Generate Password Hash

```bash
tsx src/libs/helpers/hashPassword.ts mypassword123
```

Output:
```
Password: mypassword123
Hashed: $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Gunakan hash ini untuk field password di database
```

### 2. Insert ke Database

```sql
INSERT INTO users (nama, username, password, level) 
VALUES (
  'John Doe',
  'john',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'USER'
);
```

### 3. Test Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "mypassword123"
  }'
```

## 🐳 Run dengan Docker

### Development

```bash
# Build dan run semua services (app + postgres)
docker-compose up -d

# Lihat logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Production

```bash
# Build production image
docker build -t rest-boilerplate:latest .

# Run
docker run -d \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -e DB_HOST_POSTGRES=your-db-host \
  -e DB_NAME_POSTGRES=your-db \
  -e DB_USER_POSTGRES=your-user \
  -e DB_PASS_POSTGRES=your-pass \
  -e APP_SECRET_KEY=your-secret \
  rest-boilerplate:latest
```

## 📝 Tips & Tricks

### Hot Reload

Development server menggunakan `tsx watch`, jadi setiap perubahan file akan otomatis restart server.

### Database GUI

Gunakan tools seperti:
- **pgAdmin** (https://www.pgadmin.org/)
- **DBeaver** (https://dbeaver.io/)
- **TablePlus** (https://tableplus.com/)

Connect dengan credentials dari `.env` file.

### VSCode Extensions (Recommended)

- **ESLint** - Auto-lint code
- **Prettier** - Code formatting
- **PostgreSQL** - Database management
- **REST Client** - Test API langsung dari VSCode
- **Thunder Client** - Postman alternative

### Environment Variables

Development menggunakan `.env` file, production bisa menggunakan:
- Docker env variables
- System environment
- Secret management service (AWS Secrets, etc)

### Debugging

Tambahkan breakpoint dan run:
```bash
# Debug mode
node --inspect -r tsx/cjs src/index.ts
```

Kemudian attach debugger dari VSCode.

## 🆘 Troubleshooting

### Port 8000 sudah digunakan

Edit `.env`:
```env
APP_PORT_HTTP=3000
```

### PostgreSQL connection error

1. Pastikan PostgreSQL running
2. Check credentials di `.env`
3. Test connection manual:
   ```bash
   psql -U postgres -h localhost
   ```

### Module not found

```bash
# Clear cache dan reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### ESLint errors

```bash
# Auto-fix
pnpm lint
```

## 🎯 Next Steps

1. ✅ Setup project
2. ✅ Test API
3. 📖 Baca dokumentasi lengkap di `README.md`
4. 🏗️ Buat module sesuai kebutuhan
5. 🧪 Tulis tests
6. 🚀 Deploy!

---

**Need help?** Check:
- `README.md` - Full documentation
- `Struktur Project.md` - Project structure guide
- `/docs` endpoint - API documentation

**Happy Coding! 🚀**

