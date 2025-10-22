# 📸 Media Upload Module - READY!

Media upload dengan Cloudinary integration sudah siap digunakan!

---

## ✅ What's Implemented

### **Files Created:**
```
✅ src/libs/config/cloudinary.ts       - Cloudinary SDK config
✅ src/libs/config/multer.ts           - File upload middleware
✅ src/libs/services/uploadService.ts  - Upload helper functions
✅ src/app/http/media/media.request.ts - Validation schemas
✅ src/app/http/media/media.controller.ts - Business logic
✅ src/app/http/media/media.routes.ts  - Route definitions
✅ docs/CLOUDINARY_SETUP.md            - Setup guide
✅ examples/media-upload-examples.md   - Testing examples
✅ storage/temp/uploads/               - Temp folder for Multer
```

### **Dependencies Installed:**
```
✅ multer@2.0.2          - File upload handling
✅ cloudinary@2.8.0      - Cloudinary SDK
✅ @types/multer@2.0.0   - TypeScript types
```

### **Endpoints Available:**
```
✅ POST   /media/upload  - Upload file to Cloudinary
✅ GET    /media         - List media library (with filters)
✅ GET    /media/:id     - Get single media file
✅ DELETE /media/:id     - Delete from Cloudinary + DB
```

---

## 🚀 Quick Start - Testing

### **Step 1: Setup Cloudinary** (REQUIRED!)

1. **Create FREE account:** https://cloudinary.com/users/register_free
2. **Get credentials** dari Dashboard:
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: xxxxxxxxxxxxxxxxx
   ```

3. **Update .env file:**
   ```bash
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

---

### **Step 2: Test di Postman**

**Import Updated Collection:**
- Import `postman/AI-CMS.postman_collection.json`
- Media folder sudah include!

**Test Upload:**
```
1. Login → GET token
2. POST /media/upload
   - Body Type: form-data
   - Key: file (Type: File)
   - Select image dari computer
3. Check response → save URL
4. Open URL di browser → verify image uploaded
```

---

## 📋 Testing Checklist

### Before Testing:
- [ ] Cloudinary account created
- [ ] API credentials in .env
- [ ] Server restarted
- [ ] Auth token ready

### Test Cases:
- [ ] Upload JPEG image (should work)
- [ ] Upload PNG image (should work)
- [ ] Upload with folder="posts"
- [ ] Upload with alt text & caption
- [ ] Try upload PDF (should fail - invalid type)
- [ ] Try upload >5MB file (should fail - too large)
- [ ] List media files
- [ ] Get single media detail
- [ ] Delete own media (should work)
- [ ] Try delete others' media as USER (should fail 403)
- [ ] Delete others' media as ADMIN (should work)

---

## 🎯 Expected Flow

### **Successful Upload:**
```
1. User selects image file
2. Multer validates file (type, size)
3. File saved temporarily to storage/temp/uploads/
4. Upload to Cloudinary via API
5. Save metadata to database (URL, public_id, etc)
6. Delete temporary file
7. Return Cloudinary URL to user
```

### **Upload Response:**
```json
{
  "message": "File uploaded successfully",
  "result": {
    "id": "uuid",
    "url": "https://res.cloudinary.com/your-cloud/...",
    "thumbnail_url": "https://...c_fill,h_200,w_200/...",
    "file_name": "my-image.jpg",
    "file_size": 245678,
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "uploader": {
      "name": "Administrator"
    }
  }
}
```

---

## 🔐 Authorization

### **Upload:**
- ✅ All authenticated users can upload
- 📁 Files organized by user

### **List & View:**
- ✅ All authenticated users can see all media
- 📊 Media library shared

### **Delete:**
- ✅ Uploader can delete own files
- ✅ ADMIN can delete any file
- ❌ Other users get 403 Forbidden

---

## 📸 Use with Posts

After uploading image:

```
1. POST /media/upload → Get URL
2. Copy secureUrl dari response
3. POST /posts dengan featuredImage field:
   {
     "title": "My Post",
     "content": "<p>Content...</p>",
     "featuredImage": "https://res.cloudinary.com/..."
   }
```

---

## 🎨 Cloudinary Dashboard

Setelah upload, check di Cloudinary:

1. Login to https://cloudinary.com/console
2. Go to **Media Library**
3. You'll see folder structure:
   ```
   ai-cms/
   ├── posts/
   ├── avatars/
   └── uploads/
   ```
4. Click image untuk preview & transformations

---

## 🚨 Common Issues

### **Error: "Cloudinary upload failed"**
**Solution:**
- Check .env credentials
- Verify internet connection
- Restart server after updating .env

### **Error: "Invalid file type"**
**Solution:**
- Only JPEG, PNG, GIF, WebP allowed
- Check file extension

### **Error: "File size exceeds limit"**
**Solution:**
- Max 5MB per file
- Compress image before upload
- Or update MAX_FILE_SIZE in .env

---

## 📊 Total Progress

```
✅ Week 1: Core Modules (COMPLETE!)
   - Posts, Categories, Tags
   
✅ Week 2: Media Upload (COMPLETE!)
   - Cloudinary integration
   - File upload & validation
   - Media library management
```

**Next:** Test upload, then ready for Week 3 (AI Integration)! 🚀

---

**Status:** ✅ Ready to Test!  
**Documentation:** Complete  
**Last Updated:** 22 Oktober 2025

