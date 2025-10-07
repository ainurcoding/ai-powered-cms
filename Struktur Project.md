# Struktur Project - REST API Boilerplate

Boilerplate ini dirancang untuk membangun REST API modern dengan TypeScript, Express.js, dan PostgreSQL.

## Struktur Directory

**`Keterangan`**
- Penamaan file atau folder ketika ada spasi menggunakan `camelCase`.
- Masukkan ke dalam folder bila terdapat file lain yang berelasi (testing, validation, dll).

----------

```
/ root directory
├─ database/                    # Database migrations
│  ├─ migrations/              # SQL migration files
│  └─ README.md                # Migration guide
├─ src/                        # Source code
│  ├─ app/                     # Application layer
│  │  ├─ http/                 # REST API layer
│  │  │  ├─ [module-name]/    # Module folder
│  │  │  │  ├─ [module].controller.ts   # Business logic
│  │  │  │  ├─ [module].request.ts      # Request validation
│  │  │  │  ├─ [module].routes.ts       # Route definitions
│  │  │  │  └─ [module].spec.ts         # Unit tests (optional)
│  │  │  └─ index.ts          # HTTP server configuration
│  │  └─ ws/                   # WebSocket layer
│  │     └─ index.ts           # WebSocket configuration
│  ├─ libs/                    # Shared libraries
│  │  ├─ core/                 # Core utilities
│  │  │  ├─ logger.ts          # Winston logger
│  │  │  ├─ exceptions.ts      # Custom exceptions
│  │  │  ├─ response.ts        # Response helpers
│  │  │  ├─ requestHandler.ts  # Request wrapper
│  │  │  ├─ requestValidator.ts # Validation middleware
│  │  │  ├─ ExpressServer.ts   # Express server class
│  │  │  └─ index.ts           # Core exports
│  │  ├─ config/               # Configuration
│  │  │  ├─ index.ts           # Environment variables
│  │  │  ├─ postgresConnection.ts  # PostgreSQL setup
│  │  │  ├─ guestPathHttp.ts   # Public routes config
│  │  │  └─ errorMessage.ts    # Validation messages
│  │  ├─ helpers/              # Helper functions
│  │  │  ├─ BaseRepository.ts  # Database base class
│  │  │  ├─ hashPassword.ts    # Password hashing utility
│  │  │  ├─ formatDate.ts      # Date formatting
│  │  │  ├─ randomString.ts    # Random string generator
│  │  │  └─ initModuleAlias.ts # Module alias setup
│  │  ├─ middlewares/          # Express middlewares
│  │  │  ├─ authorization.middleware.ts  # JWT auth
│  │  │  └─ basicPaginate.request.ts    # Pagination helper
│  │  └─ types/                # TypeScript definitions
│  │     ├─ Entities.d.ts      # Database entities
│  │     ├─ express.d.ts       # Express augmentations
│  │     └─ README.md          # Type documentation
│  ├─ shared/                  # Shared business logic
│  │  └─ README.md             # Shared code guide
│  └─ index.ts                 # Application entry point
├─ storage/                    # File storage
│  ├─ logs/                    # Application logs
│  └─ static/                  # Static files
│     ├─ private/              # Private files (not accessible via URL)
│     └─ public/               # Public files (accessible via /static)
├─ tests/                      # Test files
├─ .env.example                # Environment variables template
├─ docker-compose.yml          # Docker compose configuration
├─ Dockerfile                  # Docker build configuration
├─ package.json                # Dependencies & scripts
├─ tsconfig.json               # TypeScript configuration
└─ eslint.config.js            # ESLint configuration
```

## Module Structure

Setiap module di `src/app/http/` harus mengikuti struktur berikut:

```
[module-name]/
├─ [module].controller.ts      # Business logic & database queries
├─ [module].request.ts         # Request validation schemas (Valibot)
├─ [module].routes.ts          # Express route definitions
└─ [module].spec.ts            # Unit tests (Jest)
```

### Example Module: `products`

```typescript
// products.controller.ts
import { TRequestFunction } from '@/libs/core';
import postgresConnection from '@/libs/config/postgresConnection';

const getAll: TRequestFunction = async (req, res) => {
  const products = await postgresConnection.query('SELECT * FROM products');
  return { result: products };
};

export default { getAll };
```

```typescript
// products.request.ts
import { object, string, number } from 'valibot';

export const createProductSchema = object({
  name: string('Name harus berupa string'),
  price: number('Price harus berupa number')
});
```

```typescript
// products.routes.ts
import { Router } from 'express';
import { requestHandler, requestValidator } from '@/libs/core';
import controller from './products.controller';
import request from './products.request';

const router = Router();

/**
 * GET /products
 * @tags Products
 * @summary Get all products
 */
router.get('/products', requestHandler(controller.getAll));

/**
 * POST /products
 * @tags Products
 * @summary Create product
 */
router.post(
  '/products',
  requestValidator({ requestType: 'body', type: request.createProductSchema }),
  requestHandler(controller.create)
);

export default router;
```

## Path Aliases

Project ini menggunakan module aliases untuk import yang lebih bersih:

```typescript
// ❌ Jangan seperti ini
import logger from '../../../libs/core/logger';

// ✅ Gunakan alias
import { logger } from '@/libs/core';
```

**Available Aliases:**
- `@/*` → `./src/*`
- `@http/*` → `./src/app/http/*`
- `@libs/*` → `./src/libs/*`

## Auto-Loading Routes

Routes akan **otomatis ter-load** berdasarkan struktur folder. 

Setiap file dengan pattern `*.routes.ts` di folder `src/app/http/` akan otomatis di-register ke Express app.

**Tidak perlu manual import!** 🎉

## Database Layer

### Connection

PostgreSQL connection menggunakan **connection pooling** untuk performa optimal.

```typescript
import postgresConnection from '@/libs/config/postgresConnection';

// Simple query
const users = await postgresConnection.query('SELECT * FROM users');

// Query with parameters (PostgreSQL style: $1, $2, ...)
const user = await postgresConnection.queryOne(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### Using BaseRepository

Extend `BaseRepository` untuk operasi database yang lebih terstruktur:

```typescript
import BaseRepository from '@/libs/helpers/BaseRepository';

class UserRepository extends BaseRepository {
  async findByUsername(username: string) {
    return await this.queryOne<Entity.IUser>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
  }
  
  async create(data: CreateUserDTO) {
    const placeholders = this.generatePlaceholders(3);
    return await this.queryOne(
      `INSERT INTO users (nama, username, password) 
       VALUES (${placeholders}) RETURNING *`,
      [data.nama, data.username, data.password]
    );
  }
}
```

### Transactions

```typescript
const result = await postgresConnection.transaction(async (client) => {
  await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
  await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
  return { success: true };
});
```

## Authentication

### JWT Middleware

Semua endpoints **default protected** dengan JWT authentication.

Untuk membuat endpoint public, tambahkan ke `src/libs/config/guestPathHttp.ts`:

```typescript
const guestPath: IGuestPathCfg[] = [
  {
    path: '/auth/login',
    method: ['post']
  },
  {
    path: '/products',
    method: ['get']  // GET /products public, POST tetap protected
  }
];
```

### Akses User Data di Controller

User data otomatis tersedia di request object:

```typescript
const myController: TRequestFunction = async (req) => {
  const userId = req.userId;          // number
  const userData = req.userData;      // { id_user, nama, username, level }
  
  // Your logic here...
};
```

## Error Handling

Gunakan custom exceptions untuk error handling:

```typescript
import { 
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InvalidParameterException 
} from '@/libs/core';

const getUser: TRequestFunction = async (req) => {
  const user = await userRepo.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundException('User tidak ditemukan');
  }
  
  return { result: user };
};
```

## Logging

```typescript
import { logger } from '@/libs/core';

logger.info('User logged in', { userId: 123 });
logger.error('Database error', { error: err });
logger.debug('Debug info', { data: someData });
logger.warn('Warning message');
```

Log files disimpan di `storage/logs/`:
- `combined.log` - Semua logs
- `error.log` - Error logs only

## Best Practices

1. **Satu file, satu tanggung jawab** - Pisahkan controller, routes, dan validation
2. **Gunakan TypeScript types** - Manfaatkan type safety
3. **Validation di request layer** - Gunakan Valibot schemas
4. **Business logic di controller** - Jangan taruh logic di routes
5. **Database queries di repository** - Untuk reusability
6. **Consistent naming** - camelCase untuk file/folder, PascalCase untuk class
7. **JSDoc comments** - Untuk auto-generate Swagger documentation
8. **Error handling** - Gunakan custom exceptions
9. **Security first** - Validasi semua input, gunakan bcrypt untuk password

## Development Workflow

1. Buat module baru di `src/app/http/[module-name]/`
2. Tulis validation schema di `[module].request.ts`
3. Tulis business logic di `[module].controller.ts`
4. Definisikan routes di `[module].routes.ts` dengan JSDoc untuk Swagger
5. Routes otomatis ter-load, langsung test di browser/Postman
6. Lihat dokumentasi auto-generated di `/docs`

---

**Happy Coding! 🚀**
