# 🎯 Panduan Update Google Cloud Console - OAuth 2.0

## 📍 **Lokasi yang Benar**

Dari screenshot, kamu sudah berada di halaman yang **BENAR**: **"Credentials"** di bawah **"APIs & Services"**.

## ⚠️ **PENTING: Perbedaan JavaScript Origins dan Redirect URIs**

**🔴 Error yang muncul: "Invalid Origin: URIs must not contain a path or end with '/'."**

**Solusi:**
1. **Hapus URI yang salah** di "Authorized JavaScript origins":
   - Klik icon **trash can (🗑️)** di samping `http://localhost:8000/auth/google/callback/`
   - Atau kosongkan field tersebut

2. **Isi "Authorized JavaScript origins" dengan benar** (OPSIONAL):
   - Hanya domain + port (TANPA path):
     ```
     http://localhost:8000
     ```
   - **JANGAN** tambahkan path seperti `/auth/google/callback`
   - **JANGAN** tambahkan trailing slash (`/`)

3. **Isi "Authorized redirect URIs" dengan benar** (WAJIB):
   - Scroll down ke section **"Authorized redirect URIs"** (section yang berbeda!)
   - Klik **"+ ADD URI"**
   - Tambahkan URI lengkap dengan path:
     ```
     http://localhost:8000/auth/google/callback
     ```
   - **INI** yang digunakan untuk OAuth callback
   - **JANGAN** tambahkan trailing slash (`/`) di akhir

**Perbedaan:**
- **JavaScript origins**: Hanya domain (`http://localhost:8000`) - OPSIONAL
- **Redirect URIs**: Lengkap dengan path (`http://localhost:8000/auth/google/callback`) - WAJIB

## 🚀 **Langkah-langkah Membuat OAuth Client ID**

### **Step 1: Buat OAuth Client ID Baru**

1. Di halaman **"Credentials"** (yang sedang kamu buka):
   - Klik tombol **"+ Create credentials"** (tombol biru di atas)
   - Pilih **"OAuth client ID"** dari dropdown menu

2. **Jika muncul popup "Configure OAuth consent screen":**
   - Klik tombol **"Configure consent screen"** (ada di warning banner kuning)
   - Atau klik **"Configure consent screen"** di sidebar kiri
   - Pilih **"External"** user type
   - Klik **"Create"**
   - Isi informasi aplikasi:
     - **App name**: "AI CMS" (atau nama aplikasi kamu)
     - **User support email**: Email kamu
     - **Developer contact information**: Email kamu
   - Klik **"Save and Continue"**
   - Di halaman **"Scopes"**, klik **"Save and Continue"** (optional, bisa skip)
   - Di halaman **"Test users"**, klik **"Save and Continue"** (optional, bisa skip)
   - Di halaman **"Summary"**, klik **"Back to Dashboard"**

3. **Kembali ke halaman "Credentials":**
   - Klik **"+ Create credentials"** lagi
   - Pilih **"OAuth client ID"**

### **Step 2: Konfigurasi OAuth Client ID**

1. Di form **"Create OAuth client ID"**:
   - **Application type**: Pilih **"Web application"**
   - **Name**: "AI CMS Backend" (atau nama yang kamu inginkan)

2. **Authorized JavaScript origins** (OPSIONAL):
   - Jika muncul section ini, klik **"+ ADD URI"**
   - Tambahkan hanya domain (TANPA path):
     ```
     http://localhost:8000
     ```
   - **⚠️ IMPORTANT**: 
     - Jangan tambahkan path (`/auth/google/callback`)
     - Jangan tambahkan trailing slash (`/`)
     - Hanya domain + port: `http://localhost:8000`

3. **Authorized redirect URIs** (WAJIB):
   - Scroll down ke section **"Authorized redirect URIs"**
   - Klik **"+ ADD URI"**
   - Tambahkan URI lengkap dengan path:
     ```
     http://localhost:8000/auth/google/callback
     ```
   - **⚠️ IMPORTANT**: 
     - Ini berbeda dengan JavaScript origins!
     - Redirect URI harus lengkap dengan path
     - Pastikan URL sama persis (termasuk http, localhost, port 8000, dan path `/auth/google/callback`)
     - Jangan tambahkan trailing slash (`/`) di akhir

3. **Untuk Production (opsional):**
   - Klik **"+ ADD URI"** lagi
   - Tambahkan URI production:
     ```
     https://api.yourdomain.com/auth/google/callback
     ```
   - Ganti `yourdomain.com` dengan domain kamu

4. Klik **"Create"**

### **Step 3: Copy Client ID dan Client Secret**

1. Setelah OAuth Client ID dibuat, akan muncul popup **"OAuth client created"**:
   - **Client ID**: Copy ini (klik icon copy di samping Client ID)
   - **Client Secret**: Copy ini (klik icon copy di samping Client Secret)
   - **⚠️ IMPORTANT**: Client Secret hanya muncul sekali! Pastikan sudah di-copy sebelum menutup dialog

2. **Simpan ke file `.env`**:
   ```bash
   GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id_here.apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret_here
   ```
   ⚠️ **PENTING**: Ganti dengan Client ID dan Client Secret yang kamu dapatkan dari Google Cloud Console!

3. **Jika perlu download JSON**:
   - Klik tombol **"Download JSON"** untuk menyimpan credentials dalam format JSON
   - Simpan file JSON di tempat yang aman

4. Klik **"OK"** untuk menutup popup

5. **Setelah menutup popup, edit OAuth Client ID untuk menambahkan Redirect URI:**
   - Di halaman **"Credentials"**, cari OAuth Client ID yang baru dibuat
   - Klik **nama OAuth Client ID** (misal: "AI CMS Backend")
   - Scroll down ke section **"Authorized redirect URIs"**
   - Klik **"+ ADD URI"**
   - Tambahkan: `http://localhost:8000/auth/google/callback`
   - Klik **"SAVE"** di bawah

### **Step 4: Edit OAuth Client ID (Jika Sudah Ada)**

Jika kamu sudah punya OAuth Client ID tapi belum ada redirect URI:

1. Di halaman **"Credentials"**, cari section **"OAuth 2.0 Client IDs"**
2. Klik **nama OAuth Client ID** yang ada (misal: "AI CMS Backend")
3. Scroll down ke section **"Authorized redirect URIs"**
4. Klik **"+ ADD URI"**
5. Tambahkan: `http://localhost:8000/auth/google/callback`
6. Klik **"SAVE"** di bawah

## 🔍 **Cara Menemukan OAuth Client ID yang Sudah Ada**

Jika OAuth Client ID sudah dibuat tapi tidak terlihat:

1. Di halaman **"Credentials"**, scroll down ke section **"OAuth 2.0 Client IDs"**
2. Jika ada OAuth Client ID, akan muncul di tabel dengan kolom:
   - **Name**: Nama OAuth Client ID
   - **Creation date**: Tanggal dibuat
   - **Type**: "Web application"
   - **Client ID**: ID client (bisa diklik untuk copy)
   - **Actions**: Tombol untuk edit/delete

3. Klik **nama OAuth Client ID** untuk edit

## ⚠️ **Troubleshooting**

### **Problem: "No OAuth clients to display"**

**Solusi**: Buat OAuth Client ID baru dengan langkah di atas.

### **Problem: Tidak bisa klik "+ Create credentials"**

**Solusi**: 
- Pastikan OAuth consent screen sudah dikonfigurasi
- Klik **"Configure consent screen"** di sidebar kiri atau warning banner
- Setelah selesai, kembali ke "Credentials"

### **Problem: "Invalid Origin: URIs must not contain a path or end with '/'."**

**Solusi**:
- Error ini muncul jika kamu memasukkan path di **"Authorized JavaScript origins"**
- **JavaScript origins** hanya boleh domain + port (TANPA path):
  ```
  http://localhost:8000
  ```
- **JANGAN** masukkan path seperti `/auth/google/callback`
- **Redirect URI** harus dimasukkan di section **"Authorized redirect URIs"** yang berbeda:
  ```
  http://localhost:8000/auth/google/callback
  ```

### **Problem: Redirect URI mismatch**

**Solusi**:
- Pastikan redirect URI di Google Cloud Console sama persis dengan di `.env`
- Pastikan tidak ada spasi atau karakter tambahan
- Pastikan menggunakan `http://localhost:8000` (bukan `http://localhost:5173`)
- Pastikan redirect URI ada di section **"Authorized redirect URIs"**, bukan di **"Authorized JavaScript origins"**

### **Problem: Client Secret hilang**

**Solusi**:
- Client Secret hanya muncul sekali saat pertama kali dibuat
- Jika hilang, buat OAuth Client ID baru atau reset Client Secret di Google Cloud Console

## 📝 **Checklist**

- [ ] OAuth consent screen sudah dikonfigurasi
- [ ] OAuth Client ID sudah dibuat
- [ ] Authorized redirect URI sudah ditambahkan: `http://localhost:8000/auth/google/callback`
- [ ] Client ID sudah disimpan ke `.env`
- [ ] Client Secret sudah disimpan ke `.env`
- [ ] Backend sudah di-restart setelah update `.env`

## 🎯 **Ringkasan**

1. **Klik "+ Create credentials"** → Pilih **"OAuth client ID"**
2. **Configure OAuth consent screen** (jika belum)
3. **Isi form**: Application type = "Web application", Name = "AI CMS Backend"
4. **Tambahkan redirect URI**: `http://localhost:8000/auth/google/callback`
5. **Copy Client ID dan Client Secret** → Simpan ke `.env`
6. **Restart backend** setelah update `.env`

---

**Jika masih bingung, ikuti langkah-langkah di atas satu per satu!** 🚀

