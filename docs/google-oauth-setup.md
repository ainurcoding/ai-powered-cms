# Google OAuth Setup Guide

Panduan lengkap untuk setup Google OAuth 2.0 untuk fitur registrasi/login dengan Google.

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
1. Buka "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "OAuth 2.0 Client IDs"
3. Jika belum ada, setup OAuth consent screen terlebih dahulu:
   - Pilih "External" user type
   - Isi informasi aplikasi (nama, email, dll)
   - Tambahkan scopes: `profile`, `email`
   - Tambahkan test users jika perlu

4. Buat OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "AI CMS Backend"
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)

5. Download JSON credentials atau copy Client ID dan Client Secret

## 2. Environment Variables

Tambahkan ke file `.env`:

```bash
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:8000/auth/google/callback
```

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
    "callbackUrl": "http://localhost:8000/auth/google/callback",
    "scopes": ["profile", "email"],
    "message": "Google OAuth configuration is valid"
  }
}
```

## 5. Frontend Integration

### Redirect ke Google OAuth
```javascript
// Get auth URL dari backend
const response = await fetch('/auth/google/url');
const data = await response.json();

// Redirect ke Google OAuth
window.location.href = data.result.authUrl;
```

### Handle Callback (jika di frontend)
```javascript
// URL callback akan otomatis di-handle oleh backend
// Backend akan return user data dan JWT token
// Frontend tinggal redirect ke dashboard atau simpan token
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
1. Buka browser dan akses: `http://localhost:8000/auth/google/url`
2. Copy `authUrl` dari response
3. Buka URL tersebut di browser
4. Login dengan Google
5. Akan redirect ke callback URL dengan user data

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
