# 📖 Panduan Membaca Kode Project AI CMS Backend

> Panduan ini membantu Anda memahami flow aplikasi dan struktur codebase secara sistematis.

## 🎯 **Tujuan Panduan**

Setelah membaca panduan ini, Anda akan memahami:
1. **Flow aplikasi** dari awal sampai akhir
2. **Arsitektur** dan struktur layer-layer aplikasi
3. **Cara kerja** setiap komponen utama
4. **Pola yang digunakan** dalam project ini

---

## 📚 **Urutan Membaca Kode (Recommended)**

### **Phase 1: Entry Point & Initialization** ⭐ START HERE

Mulai dari sini untuk memahami bagaimana aplikasi dimulai:

1. **`src/index.ts`** (Entry Point)
   - File pertama yang dieksekusi
   - Inisialisasi database connection
   - Start HTTP server
   - Graceful shutdown handling

2. **`src/libs/config/index.ts`** (Configuration)
   - Environment variables
   - Application constants
   - Database configuration

3. **`src/libs/config/postgresConnection.ts`** (Database)
   - PostgreSQL connection setup
   - Connection pooling
   - Database initialization

**💡 Key Insight:**
```
Application Start → Load Config → Connect Database → Start HTTP Server
```

---

### **Phase 2: HTTP Server Setup**

Memahami bagaimana HTTP server di-setup:

4. **`src/app/http/index.ts`** (HTTP Server Configuration)
   - Server initialization
   - Swagger documentation setup
   - Socket.IO initialization
   - Global middleware setup (authentication)
   - Static file serving

5. **`src/libs/core/ExpressServer.ts`** (Express Server Class)
   - Express app creation
   - Middleware setup (Helmet, CORS, Compression)
   - Auto-routing mechanism
   - Server lifecycle management

**💡 Key Insight:**
```
ExpressServer → Setup Middlewares → Auto-load Routes → Start Listening
```

---

### **Phase 3: Request Flow - Contoh Module Authentication**

Memahami flow request dari HTTP sampai ke database:

6. **`src/app/http/auth/auth.routes.ts`** (Routes Definition)
   - Route definitions dengan Swagger docs
   - Request validation setup
   - Route handlers mapping

7. **`src/app/http/auth/auth.request.ts`** (Request Validation)
   - Valibot validation schemas
   - Input validation rules

8. **`src/app/http/auth/auth.controller.ts`** (Business Logic)
   - Controller functions
   - Business logic implementation
   - Direct database queries (atau panggil repository)

9. **`src/repositories/userRepository.ts`** (Data Access Layer)
   - Database operations
   - SQL queries
   - Data transformation

**💡 Key Insight:**
```
HTTP Request → Routes → Validation → Controller → Repository → Database
```

---

### **Phase 4: Core Utilities & Helpers**

Memahami komponen-komponen pendukung:

10. **`src/libs/core/requestHandler.ts`** (Request Wrapper)
    - Request/Response wrapper
    - Error handling
    - Response formatting

11. **`src/libs/core/requestValidator.ts`** (Validation Middleware)
    - Valibot integration
    - Validation error handling

12. **`src/libs/core/exceptions.ts`** (Custom Exceptions)
    - Custom error classes
    - Error types

13. **`src/libs/core/logger.ts`** (Logging)
    - Winston logger setup
    - Log levels

14. **`src/libs/middlewares/authorization.middleware.ts`** (Auth Middleware)
    - JWT token verification
    - User authentication
    - Token blacklist checking

**💡 Key Insight:**
```
Request Handler → Validation → Auth Middleware → Controller → Response
```

---

### **Phase 5: Service Layer & Advanced Features**

Memahami service layer dan fitur-fitur advanced:

15. **`src/libs/services/googleOAuthService.ts`** (Google OAuth Service)
    - OAuth flow handling
    - User creation/update
    - JWT token generation

16. **`src/libs/services/aiService.ts`** (AI Service)
    - AI model integration
    - Content generation
    - Image generation

17. **`src/libs/services/uploadService.ts`** (Upload Service)
    - File upload handling
    - Cloudinary integration

**💡 Key Insight:**
```
Controller → Service Layer → External APIs / Processing → Database
```

---

### **Phase 6: Module Examples**

Memahami berbagai module yang ada:

18. **`src/app/http/posts/`** (Posts Module)
    - CRUD operations
    - Full module structure

19. **`src/app/http/categories/`** (Categories Module)
    - Category management

20. **`src/app/http/media/`** (Media Module)
    - Media upload & management

21. **`src/app/http/ai/`** (AI Module)
    - AI-powered features

**💡 Key Insight:**
```
Semua module mengikuti pattern yang sama:
routes.ts → request.ts → controller.ts → (service/repository) → database
```

---

## 🏗️ **Arsitektur Aplikasi**

### **Layer Architecture**

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Express)            │
│  Routes → Validation → Auth Middleware  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Controller Layer                │
│     Business Logic & Orchestration      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer (Optional)        │
│   External APIs, Complex Operations     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Repository Layer                │
│        Database Operations              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
└─────────────────────────────────────────┘
```

### **Request Flow Detail**

```
1. Client Request
   ↓
2. Express Server (ExpressServer.ts)
   ├─ Helmet (Security)
   ├─ CORS
   ├─ Compression
   ├─ Body Parser
   └─ Morgan (Logging)
   ↓
3. Authorization Middleware
   ├─ Extract JWT Token
   ├─ Verify Token
   ├─ Check Blacklist
   └─ Attach User to Request
   ↓
4. Route Handler (auth.routes.ts)
   ├─ Route Matching
   └─ Request Validation Middleware
   ↓
5. Request Validator
   ├─ Validate Input (Valibot)
   └─ Throw Error if Invalid
   ↓
6. Request Handler Wrapper
   ├─ Error Handling
   └─ Response Formatting
   ↓
7. Controller (auth.controller.ts)
   ├─ Business Logic
   └─ Call Service/Repository
   ↓
8. Service (Optional)
   ├─ External API Calls
   └─ Complex Operations
   ↓
9. Repository (userRepository.ts)
   ├─ SQL Queries
   └─ Data Transformation
   ↓
10. Database (PostgreSQL)
    └─ Execute Query
    ↓
11. Response
    └─ JSON Response to Client
```

---

## 🔍 **File-File Penting & Fungsinya**

### **Core Files**

| File | Fungsi |
|------|--------|
| `src/index.ts` | Entry point aplikasi |
| `src/app/http/index.ts` | HTTP server configuration |
| `src/libs/core/ExpressServer.ts` | Express server class dengan auto-routing |
| `src/libs/core/requestHandler.ts` | Request wrapper & error handler |
| `src/libs/core/exceptions.ts` | Custom exception classes |

### **Configuration Files**

| File | Fungsi |
|------|--------|
| `src/libs/config/index.ts` | Environment variables |
| `src/libs/config/postgresConnection.ts` | Database connection |
| `src/libs/config/guestPathHttp.ts` | Public routes (bypass auth) |
| `src/libs/config/googleOAuth.ts` | Google OAuth config |
| `src/libs/config/ai.ts` | AI service configuration |

### **Module Structure**

Setiap module di `src/app/http/[module-name]/` memiliki:

| File | Fungsi |
|------|--------|
| `[module].routes.ts` | Route definitions + Swagger docs |
| `[module].request.ts` | Validation schemas (Valibot) |
| `[module].controller.ts` | Business logic |

### **Layer Files**

| File | Fungsi |
|------|--------|
| `src/repositories/*.ts` | Database operations (Data Access Layer) |
| `src/libs/services/*.ts` | Business services (Service Layer) |
| `src/libs/middlewares/*.ts` | Express middlewares |

---

## 🎓 **Konsep-Konsep Penting**

### **1. Auto-Routing**

ExpressServer secara otomatis memuat semua route dari `src/app/http/`:
- Setiap folder = module
- File `*.routes.ts` = route definitions
- Tidak perlu import manual!

```typescript
// File: src/app/http/posts/posts.routes.ts
router.get('/posts', requestHandler(controller.getAll));
// Otomatis tersedia di: GET /posts
```

### **2. Request Validation dengan Valibot**

Semua input divalidasi menggunakan Valibot:

```typescript
// auth.request.ts
export const loginValidation = object({
  username: string(),
  password: string()
});

// auth.routes.ts
router.post(
  '/auth/login',
  requestValidator({ requestType: 'body', type: loginValidation }),
  requestHandler(controller.login)
);
```

### **3. Authentication Middleware**

Semua route **defaultnya protected**, kecuali yang ada di `guestPathHttp.ts`:

```typescript
// src/app/http/index.ts
server.pushGlobalMiddleware(authorizeMiddleware);

// src/libs/config/guestPathHttp.ts
export const guestPathHttp = [
  '/',
  '/auth/login',
  '/auth/google/url',
  '/auth/google/callback'
];
```

### **4. Error Handling**

Semua error di-handle secara terpusat:

```typescript
// Controller throw exception
throw new InvalidParameterException('Username salah');

// requestHandler.ts catch & format response
{
  "message": "Username salah",
  "result": null
}
```

### **5. Response Format**

Semua response menggunakan format konsisten:

```typescript
// Controller return
return {
  result: {
    user: {...},
    token: "..."
  }
};

// Response ke client
{
  "message": "Success",
  "result": {
    user: {...},
    token: "..."
  }
}
```

---

## 🚀 **Quick Start Reading**

### **Untuk Pemula:**

1. Baca `src/index.ts` → pahami entry point
2. Baca `src/app/http/index.ts` → pahami server setup
3. Baca `src/app/http/auth/auth.routes.ts` → pahami route structure
4. Baca `src/app/http/auth/auth.controller.ts` → pahami controller
5. Baca `src/repositories/userRepository.ts` → pahami data access

### **Untuk Developer Berpengalaman:**

1. Baca `src/libs/core/ExpressServer.ts` → pahami auto-routing mechanism
2. Baca `src/libs/core/requestHandler.ts` → pahami error handling
3. Baca `src/libs/middlewares/authorization.middleware.ts` → pahami auth flow
4. Pilih 1 module lengkap (misal: `posts/`) → trace full flow
5. Baca `src/libs/services/aiService.ts` → pahami service layer pattern

---

## 📝 **Tips Membaca Kode**

1. **Mulai dari entry point** (`src/index.ts`)
2. **Ikuti flow request** dari route → controller → service/repository
3. **Gunakan IDE "Go to Definition"** untuk jump ke implementasi
4. **Baca Swagger docs** di `http://localhost:8000/docs` untuk API overview
5. **Cek `package.json`** untuk memahami dependencies
6. **Baca README.md** untuk setup & configuration

---

## 🔗 **File Terkait**

- **Entry Point**: `src/index.ts`
- **Server Config**: `src/app/http/index.ts`
- **Express Server**: `src/libs/core/ExpressServer.ts`
- **Example Module**: `src/app/http/auth/`
- **Database**: `src/libs/config/postgresConnection.ts`
- **Auth**: `src/libs/middlewares/authorization.middleware.ts`

---

## ✅ **Checklist Pemahaman**

Setelah membaca kode, pastikan Anda memahami:

- [ ] Bagaimana aplikasi dimulai (`src/index.ts`)
- [ ] Bagaimana HTTP server di-setup (`src/app/http/index.ts`)
- [ ] Bagaimana auto-routing bekerja (`ExpressServer.ts`)
- [ ] Flow request dari route sampai database
- [ ] Bagaimana authentication bekerja
- [ ] Bagaimana validation bekerja
- [ ] Bagaimana error handling bekerja
- [ ] Struktur module (routes → request → controller)
- [ ] Perbedaan repository vs service layer

---

**Selamat belajar! 🎉**

Jika ada pertanyaan, cek dokumentasi lain di folder `docs/` atau trace kode menggunakan IDE.

