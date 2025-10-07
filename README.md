# REST API Boilerplate - TypeScript + Express + PostgreSQL

> Boilerplate modern untuk membangun REST API dengan TypeScript, Express.js, dan PostgreSQL.

## 🚀 Tech Stack

- **Runtime**: Node.js v20+
- **Language**: TypeScript 5.5+
- **Framework**: Express.js 4
- **Database**: PostgreSQL 16
- **Validation**: Valibot
- **Authentication**: JWT + Bcrypt
- **WebSocket**: Socket.IO v4
- **Logger**: Winston
- **Documentation**: Swagger (express-jsdoc-swagger)
- **Package Manager**: pnpm

## 📋 Features

- ✅ **TypeScript** dengan strict mode
- ✅ **Express.js** dengan middleware modern (Helmet, CORS, Compression)
- ✅ **PostgreSQL** connection pooling
- ✅ **JWT Authentication** dengan bcrypt password hashing
- ✅ **Auto-routing** berdasarkan struktur folder
- ✅ **Request Validation** menggunakan Valibot
- ✅ **API Documentation** otomatis dengan Swagger
- ✅ **WebSocket** support dengan Socket.IO
- ✅ **Logging** dengan Winston (console + file)
- ✅ **Error Handling** centralized
- ✅ **Docker** ready dengan multi-stage build
- ✅ **Module Aliases** (@, @http, @libs, dll)
- ✅ **ESLint** untuk code quality
- ✅ **Jest** untuk testing

## 📁 Struktur Project

```
src/
├── app/
│   ├── http/                   # REST API Layer
│   │   ├── auth/              # Authentication module
│   │   ├── home/              # Home/Health check module
│   │   └── index.ts           # HTTP server configuration
│   └── ws/                    # WebSocket Layer
├── libs/
│   ├── core/                  # Core utilities
│   │   ├── logger.ts         # Winston logger
│   │   ├── exceptions.ts     # Custom exceptions
│   │   ├── response.ts       # Response helpers
│   │   ├── requestHandler.ts # Request wrapper
│   │   └── ExpressServer.ts  # Express server class
│   ├── config/               # Configuration
│   │   ├── index.ts          # Environment variables
│   │   ├── postgresConnection.ts  # PostgreSQL setup
│   │   └── guestPathHttp.ts  # Public routes config
│   ├── helpers/              # Helper functions
│   │   └── BaseRepository.ts # Database base class
│   ├── middlewares/          # Express middlewares
│   │   └── authorization.middleware.ts
│   └── types/                # TypeScript definitions
└── index.ts                  # Application entry point
```

## 🛠️ Installation

### Prerequisites

- Node.js v20.11.1 atau lebih tinggi
- pnpm (`npm install -g pnpm`)
- PostgreSQL 14+ (atau gunakan Docker)

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd rest-boilerplate-ts
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env sesuai konfigurasi Anda
   ```

4. **Setup database**
   ```bash
   # Buat database PostgreSQL
   createdb your_database_name
   
   # Run migrations
   psql -U postgres -d your_database_name -f database/migrations/001_create_users_table.sql
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

Server akan berjalan di `http://localhost:8000`

## 🐳 Docker Setup

### Development dengan Docker Compose

```bash
# Build dan run
pnpm start:docker

# Stop
pnpm stop:docker
```

Docker compose akan menjalankan:
- Application server (port 8000)
- PostgreSQL database (port 5432)

## 📝 Available Scripts

```bash
pnpm dev           # Development mode dengan hot reload
pnpm build         # Build untuk production
pnpm start         # Run production build
pnpm test          # Run tests dengan Jest
pnpm lint          # Lint dan auto-fix dengan ESLint
pnpm start:docker  # Start dengan Docker
pnpm stop:docker   # Stop Docker containers
```

## 🔐 Authentication

### Public Endpoints (No Auth Required)

- `GET /` - Health check
- `POST /auth/login` - Login

### Protected Endpoints

Semua endpoint lainnya memerlukan JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

Untuk menambahkan endpoint public baru, edit `src/libs/config/guestPathHttp.ts`

## 📚 API Documentation

Setelah aplikasi berjalan, akses Swagger documentation di:

```
http://localhost:8000/docs
```

## 🏗️ Cara Membuat Module Baru

1. **Buat folder module** di `src/app/http/`
   ```bash
   mkdir src/app/http/products
   ```

2. **Buat file-file module**
   ```
   src/app/http/products/
   ├── products.controller.ts  # Business logic
   ├── products.request.ts     # Validation schemas
   ├── products.routes.ts      # Route definitions
   └── products.spec.ts        # Unit tests (optional)
   ```

3. **Example Controller** (`products.controller.ts`)
   ```typescript
   import { TRequestFunction } from '@/libs/core';
   
   const getAll: TRequestFunction = async (req, res) => {
     // Your logic here
     return {
       result: []
     };
   };
   
   export default { getAll };
   ```

4. **Example Routes** (`products.routes.ts`)
   ```typescript
   import { Router } from 'express';
   import { requestHandler } from '@/libs/core';
   import controller from './products.controller';
   
   const router = Router();
   
   router.get('/products', requestHandler(controller.getAll));
   
   export default router;
   ```

Routes akan **otomatis ter-load** tanpa perlu import manual! 🎉

## 🔧 Environment Variables

```env
# Application
NODE_ENV=development
APP_SECRET_KEY=your-secret-key
APP_PORT_HTTP=8000
APP_EXPOSE_DOCS=true

# PostgreSQL
DB_HOST_POSTGRES=localhost
DB_NAME_POSTGRES=your_db
DB_USER_POSTGRES=postgres
DB_PASS_POSTGRES=your_password
DB_PORT_POSTGRES=5432
```

## 🗃️ Database

### Connection

PostgreSQL connection menggunakan **connection pooling** untuk performa optimal.

### Base Repository

Gunakan `BaseRepository` untuk operasi database:

```typescript
import BaseRepository from '@/libs/helpers/BaseRepository';

class ProductRepository extends BaseRepository {
  async findAll() {
    return await this.query('SELECT * FROM products');
  }
  
  async findById(id: number) {
    return await this.queryOne(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
  }
}
```

### Transactions

```typescript
await this.transaction(async (client) => {
  await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [100, userId]);
  await client.query('INSERT INTO transactions (user_id, amount) VALUES ($1, $2)', [userId, 100]);
});
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

## 📦 Production Build

```bash
# Build
pnpm build

# Run production
pnpm start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Commit Convention

Gunakan **Conventional Commits**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

## 📄 License

MIT License - bebas digunakan untuk project pribadi maupun komersial.

## 🙏 Credits

Diadaptasi dari Knitto Backend Boilerplate dengan dependency yang lebih universal dan mudah di-maintain.

---

**Happy Coding! 🚀**
