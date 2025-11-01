# Google OAuth Setup Guide

Panduan lengkap untuk setup Google OAuth 2.0 untuk fitur registrasi/login dengan Google.

## 🚀 Quick Reference

**Lokasi Authorized Redirect URI:**
- Google Cloud Console → Hamburger Menu (☰) → **"APIs & Services"** → **"Credentials"**
- Klik nama OAuth 2.0 Client ID yang sudah ada → Tambahkan URI → **Save**

**Redirect URI yang harus ditambahkan:**
```
http://localhost:5173/auth/google/callback  (development)
https://yourdomain.com/auth/google/callback (production)
```

## 1. Setup Google Cloud Console

### Langkah 1: Buat Project Google Cloud
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" di bagian atas
3. Klik "New Project"
4. Masukkan nama project (contoh: "AI CMS OAuth")
5. Klik "Create"

### Langkah 2: Enable Google+ API
1. Di Google Cloud Console, pilih project yang baru dibuat
2. Buka menu "APIs & Services" > "Library"
3. Cari "Google+ API" atau "Google People API"
4. Klik dan enable API tersebut

### Langkah 3: Create OAuth 2.0 Credentials

**🎯 Cara akses "APIs & Services" > "Credentials":**

Dari halaman Google Cloud Console manapun:
1. Klik icon **hamburger menu (☰)** di pojok kiri atas
2. Scroll down dan cari section **"APIs & Services"**
3. Klik **"Credentials"**
4. Atau gunakan **search bar** di atas, ketik "credentials" lalu pilih "Credentials"

**Buat OAuth Client ID:**

1. Di halaman "Credentials", klik tombol **"+ Create credentials"** (tombol biru di atas)
2. Pilih **"OAuth client ID"** (bukan "API key" atau yang lain)
3. Jika muncul popup setup OAuth consent screen terlebih dahulu:
   - Pilih **"External"** user type
   - Isi informasi aplikasi (nama, email support, dll)
   - Tambahkan scopes: `profile`, `email`
   - Tambahkan test users jika perlu
   - Klik "Save and Continue" sampai selesai

4. Setelah OAuth consent screen selesai, kembali ke "Credentials"
5. Klik **"+ Create credentials"** > **"OAuth client ID"** lagi
6. Isi form:
   - **Application type**: Pilih **"Web application"**
   - **Name**: "AI CMS Frontend"
   - **Authorized redirect URIs**: Klik **"+ ADD URI"** dan tambahkan:
     ```
     http://localhost:5173/auth/google/callback
     ```
     (Untuk production, tambahkan juga: `https://yourdomain.com/auth/google/callback`)
7. Klik **"Create"**
8. **Copy** atau download **Client ID** dan **Client Secret** (Client Secret hanya muncul sekali!)

## 2. Environment Variables

Tambahkan ke file `.env`:

```bash
# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:5173/auth/google/callback
```

**⚠️ IMPORTANT**: Redirect URI sekarang mengarah ke **FRONTEND**, bukan backend!

## 3. Database Migration

Jalankan migration untuk menambahkan kolom `google_id`:

```sql
-- Add google_id column to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Add comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for social login integration';
```

Atau jalankan file migration:
```bash
# Jika menggunakan PostgreSQL
psql -h localhost -p 5432 -U postgres -d ai_cms_db -f database/migrations/009_add_google_id_to_users.sql
```

## 4. API Endpoints

### Get Google Auth URL
```http
GET /auth/google/url
```

Response:
```json
{
  "message": "Success",
  "result": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
    "message": "Gunakan URL ini untuk redirect ke Google OAuth"
  }
}
```

### Google OAuth Callback
```http
GET /auth/google/callback?code=AUTHORIZATION_CODE
```

Response:
```json
{
  "message": "Success",
  "result": {
    "user": {
      "id": "uuid",
      "username": "john.doe.123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "USER",
      "avatar": "https://lh3.googleusercontent.com/...",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": true,
    "message": "Akun berhasil dibuat dan login"
  }
}
```

### Test Configuration
```http
GET /auth/google/test-config
```

Response:
```json
{
  "message": "Success",
  "result": {
    "clientId": "Set",
    "clientSecret": "Set",
    "callbackUrl": "http://localhost:5173/auth/google/callback",
    "scopes": ["profile", "email"],
    "message": "Google OAuth configuration is valid"
  }
}
```

**Note**: `callbackUrl` sekarang menunjukkan frontend URL, bukan backend.

## 5. Frontend Integration

### Redirect ke Google OAuth
```javascript
// Get auth URL dari backend
const response = await fetch('/auth/google/url');
const data = await response.json();

// Redirect ke Google OAuth
window.location.href = data.result.authUrl;
```

### Handle Callback (di frontend)
```javascript
// URL callback dihandle di frontend, kemudian panggil backend API
// Route: /auth/google/callback?code=xxx

// Parse code dari URL
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

// Panggil backend untuk exchange code dengan token
const response = await fetch(`http://localhost:8000/auth/google/callback?code=${code}`);
const data = await response.json();

// Backend return user data dan JWT token
const { user, token, isNewUser } = data.result;

// Simpan token ke localStorage
localStorage.setItem('token', token);

// Redirect ke dashboard
window.location.href = '/dashboard';
```

## 6. Testing

### Test 1: Configuration
```bash
curl -X GET http://localhost:8000/auth/google/test-config
```

### Test 2: Get Auth URL
```bash
curl -X GET http://localhost:8000/auth/google/url
```

### Test 3: Full OAuth Flow
**⚠️ IMPORTANT**: Flow sekarang dimulai dari frontend!

1. Frontend panggil: `GET http://localhost:8000/auth/google/url`
2. Frontend redirect user ke `authUrl` dari response
3. User login dengan Google
4. Google redirect ke: `http://localhost:5173/auth/google/callback?code=xxx`
5. Frontend handle callback, ambil code
6. Frontend panggil: `GET http://localhost:8000/auth/google/callback?code=xxx`
7. Backend return user data dan JWT token
8. Frontend redirect ke dashboard

## 7. Security Considerations

1. **HTTPS in Production**: Pastikan menggunakan HTTPS di production
2. **State Parameter**: Untuk production, tambahkan state parameter untuk CSRF protection
3. **Token Validation**: JWT token sudah include user info dan role
4. **Rate Limiting**: Implement rate limiting untuk OAuth endpoints
5. **Error Handling**: Handle semua kemungkinan error dari Google OAuth

## 8. Troubleshooting

### Error: "Invalid client"
- Pastikan Client ID dan Client Secret benar
- Pastikan redirect URI sudah terdaftar di Google Console

### Error: "Redirect URI mismatch"
- Tambahkan redirect URI yang tepat di Google Console
- Pastikan URL sama persis (termasuk http/https, port, path)
- **Cara edit redirect URI yang sudah ada:**
  1. Buka Google Cloud Console
  2. Klik hamburger menu (☰) > "APIs & Services" > "Credentials"
  3. Cari dan **klik nama OAuth 2.0 Client ID** yang sudah ada (misal: "AI CMS Frontend")
  4. Di section **"Authorized redirect URIs"**, klik **"+ ADD URI"**
  5. Tambahkan: `http://localhost:5173/auth/google/callback`
  6. Klik **"SAVE"** di bawah

### Error: "Access blocked"
- Pastikan OAuth consent screen sudah dikonfigurasi
- Tambahkan domain ke authorized domains jika perlu

### Error: "Scope not authorized"
- Pastikan scopes `profile` dan `email` sudah ditambahkan di OAuth consent screen

## 9. Production Deployment

1. **Update Redirect URIs**: Tambahkan production domain di Google Console
2. **Environment Variables**: Set production values di server
3. **HTTPS**: Pastikan menggunakan HTTPS
4. **Monitoring**: Monitor OAuth success/failure rates
5. **Backup**: Backup database sebelum deploy

## 10. Features

- ✅ **Auto Registration**: User baru otomatis terdaftar
- ✅ **Account Linking**: Link Google account ke user yang sudah ada
- ✅ **Profile Sync**: Update profile dari Google data
- ✅ **JWT Token**: Generate JWT token untuk session
- ✅ **Error Handling**: Comprehensive error handling
- ✅ **Logging**: Detailed logging untuk debugging
