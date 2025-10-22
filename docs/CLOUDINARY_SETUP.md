# ☁️ Cloudinary Setup Guide

Complete guide untuk setup Cloudinary untuk file upload di AI-CMS.

---

## 🎯 Why Cloudinary?

- ✅ **FREE 25GB** storage selamanya
- ✅ Global CDN (fast worldwide)
- ✅ Auto image optimization
- ✅ Thumbnail generation
- ✅ Image transformation (resize, crop)
- ✅ Production-ready
- ✅ Automatic backup

---

## 📝 Step-by-Step Setup

### Step 1: Create Cloudinary Account

1. Buka: https://cloudinary.com/
2. Click **Sign Up for Free**
3. Isi form:
   - Email: `your-email@gmail.com`
   - Password: (choose strong password)
   - Cloud Name: `ai-cms-{your-name}` (atau custom)
4. Verify email
5. Login to Dashboard

---

### Step 2: Get API Credentials

1. Di Cloudinary Dashboard
2. Go to: **Dashboard** (default page after login)
3. Copy credentials:
   ```
   Cloud Name: ai-cms-xxxxx
   API Key: 123456789012345
   API Secret: xxxxxxxxxxxxxxxxxxxx
   ```

**⚠️ IMPORTANT:** Jangan share API Secret ke public!

---

### Step 3: Update .env File

Buka `.env` di project, update values:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=ai-cms-xxxxx        # ← Your cloud name
CLOUDINARY_API_KEY=123456789012345        # ← Your API key
CLOUDINARY_API_SECRET=xxxxxxxxxxxxx       # ← Your API secret
CLOUDINARY_FOLDER=ai-cms                  # ← Folder name (default)

# File Upload Configuration
MAX_FILE_SIZE=5242880                     # 5MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp
```

---

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
# Start again
pnpm dev
```

---

## 🧪 Testing Upload

### Using Postman:

**1. Login First:**
```
POST http://localhost:8000/auth/login
Body: {"username":"admin","password":"password123"}
Save token!
```

**2. Upload File:**
```
POST http://localhost:8000/media/upload

Headers:
- Authorization: Bearer {{token}}

Body (form-data):
- file: [Select file from computer]
- folder: posts (optional)
- alt: "My image description" (optional)
- caption: "Image caption" (optional)
```

**3. Expected Response:**
```json
{
  "message": "File uploaded successfully",
  "result": {
    "id": "uuid",
    "fileName": "my-image.jpg",
    "fileSize": 245678,
    "fileType": "image",
    "url": "https://res.cloudinary.com/ai-cms-xxxxx/image/upload/v1234/ai-cms/posts/abc.jpg",
    "secureUrl": "https://...",
    "thumbnailUrl": "https://...c_fill,h_200,w_200/abc.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "uploader": {
      "id": "uuid",
      "name": "Administrator"
    },
    "createdAt": "2025-10-22T..."
  }
}
```

---

## 📁 Cloudinary Folder Structure

Files akan diorganize di Cloudinary:

```
ai-cms/                    ← Root folder (CLOUDINARY_FOLDER)
├── posts/                 ← Featured images untuk posts
├── avatars/               ← User profile pictures
├── media/                 ← General uploads
└── ai-generated/          ← AI-generated images (future)
```

Customize via form-data field `folder` saat upload.

---

## 🔐 Security

### File Validation:
- ✅ **File Type:** Only images (JPEG, PNG, GIF, WebP)
- ✅ **File Size:** Max 5MB (configurable)
- ✅ **Authentication:** All endpoints require login
- ✅ **Authorization:** Only uploader or ADMIN can delete

### Environment Variables:
```bash
# Never commit these to Git!
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx  ← Keep secret!
```

Already in `.gitignore`:
```
.env
```

---

## 📊 Endpoints

### **POST /media/upload** - Upload File
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Field:** `file` (required), `folder`, `alt`, `caption` (optional)

### **GET /media** - List Media Library
- **Auth:** Required
- **Query:** page, limit, type, folder, search, sortBy

### **GET /media/:id** - Get Single Media
- **Auth:** Required

### **DELETE /media/:id** - Delete Media
- **Auth:** Required (uploader or ADMIN)
- **Action:** Delete from Cloudinary + Database

---

## 🎨 Cloudinary Features

### Auto Optimization:
```
Original: https://res.cloudinary.com/.../image.jpg
Optimized: https://res.cloudinary.com/.../q_auto,f_auto/image.jpg
```

### Transformations:
```
Thumbnail: .../c_fill,w_200,h_200/image.jpg
Large: .../c_scale,w_1920/image.jpg
Crop: .../c_crop,g_face/image.jpg
```

### Formats:
```
WebP: .../f_webp/image.jpg
AVIF: .../f_avif/image.jpg
```

---

## 📚 Documentation Links

- **Cloudinary Dashboard:** https://cloudinary.com/console
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration
- **Image Transformations:** https://cloudinary.com/documentation/image_transformations

---

## ⚠️ Important Notes

### Free Tier Limits:
- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25,000/month
- **Request:** Unlimited

**Good enough untuk development & portfolio!**

### Upgrade Later:
Kalau project jadi production dan traffic tinggi, bisa upgrade ke paid plan.

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- Check CLOUDINARY_API_KEY in .env
- Verify credentials dari dashboard
- Restart server after updating .env

### Error: "Upload failed"
- Check internet connection
- Verify API Secret correct
- Check file size under 5MB
- Verify file type is allowed

### Error: "Folder not found"
- Folders auto-created by Cloudinary
- No need to manually create folders

---

## ✅ Testing Checklist

Before testing:
- [ ] Cloudinary account created
- [ ] API credentials copied to .env
- [ ] Server restarted
- [ ] Postman ready with auth token

Test scenarios:
- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Try upload non-image (should fail)
- [ ] Try upload >5MB file (should fail)
- [ ] List uploaded media
- [ ] Get single media
- [ ] Delete media (as uploader)
- [ ] Try delete others' media as USER (should fail 403)
- [ ] Delete others' media as ADMIN (should succeed)

---

**Created:** 22 Oktober 2025  
**Last Updated:** 22 Oktober 2025  
**Status:** ✅ Ready for Implementation

