# 📮 Postman Collection - AI-CMS Backend

Complete API testing collection untuk AI-CMS Backend project.

---

## 📦 Files

1. **AI-CMS.postman_collection.json** - Main collection dengan semua endpoints
2. **AI-CMS.postman_environment.json** - Environment variables (Local development)

---

## 🚀 Quick Start

### 1. Import Collection ke Postman

**Method 1: Import via File**
1. Buka Postman
2. Click **Import** button (top left)
3. Drag & drop file `AI-CMS.postman_collection.json`
4. Click **Import**

**Method 2: Import from Folder**
1. Buka Postman
2. Click **Import**
3. Select **Folder** tab
4. Browse ke folder `postman/`
5. Click **Import**

### 2. Import Environment

1. Click **Import** button
2. Drag & drop file `AI-CMS.postman_environment.json`
3. Click **Import**
4. Select **AI-CMS Local** environment dari dropdown (top right)

---

## 🔑 Authentication Flow

### Step 1: Login

1. Buka folder **Authentication**
2. Run request **Login** dengan credentials:
   ```json
   {
     "username": "admin",
     "password": "password123"
   }
   ```

3. Token akan **automatically saved** ke environment variable `{{token}}`

**Default Users:**
- **Admin**: `admin / password123` (Role: ADMIN)
- **User**: `johndoe / password123` (Role: USER)
- **Editor**: `janeeditor / password123` (Role: EDITOR)

### Step 2: Use Protected Endpoints

Setelah login, semua protected endpoints akan otomatis menggunakan token dari environment variable.

---

## 📋 Collection Structure

### ✅ Authentication (Ready to Test)
- ✅ POST /auth/login - Login dan get token
- ✅ GET /auth/logout - Logout dan blacklist token
- ✅ GET /auth/check-token - Validate token status

### ✅ Posts (Ready to Test)
- ✅ GET /posts - List posts (Public, dengan pagination & filters)
- ✅ GET /posts/:id - Get single post (Public)
- ✅ POST /posts - Create post (Protected)
- ✅ PUT /posts/:id - Update post (Protected)
- ✅ DELETE /posts/:id - Delete post (Protected)
- ✅ PATCH /posts/:id/status - Quick status update (Protected)
- ✅ GET /posts?search=keyword - Search posts (Public)
- ✅ GET /posts?status=published - Filter by status (Public)

### ✅ Categories (Ready to Test!)
- ✅ GET /categories - List categories with hierarchy
- ✅ GET /categories/:id - Get single category
- ✅ POST /categories - Create category (ADMIN only)
- ✅ PUT /categories/:id - Update category (ADMIN only)
- ✅ DELETE /categories/:id - Delete category (ADMIN only)

### ✅ Tags (Ready to Test!)
- ✅ GET /tags - List tags with search
- ✅ GET /tags/suggestions - Autocomplete search
- ✅ GET /tags/:id - Get single tag
- ✅ POST /tags - Create tag (ADMIN/EDITOR)
- ✅ PUT /tags/:id - Update tag (ADMIN/EDITOR)
- ✅ DELETE /tags/:id - Delete tag (ADMIN only)

### ✅ Media (Ready to Test!) ⭐
- ✅ POST /media/upload - Upload to Cloudinary (multipart/form-data)
- ✅ GET /media - List media library (Protected)
- ✅ GET /media/:id - Get media details (Protected)
- ✅ DELETE /media/:id - Delete from Cloudinary (Uploader/ADMIN)

### ✅ Health Check (Ready)
- ✅ GET /health - System health check

---

## 🧪 Testing Workflow

### Basic Flow:
```
1. Login (save token automatically)
2. List Posts (public, no auth needed)
3. Get Single Post
4. Create Post (requires auth)
5. Update Post
6. Update Status (draft → published)
7. Delete Post
```

### Advanced Flow:
```
1. Login
2. Search Posts (?search=typescript)
3. Filter Posts (?status=published)
4. Filter by Category (?category=uuid)
5. Filter by Tag (?tag=uuid)
6. Sort Posts (?sortBy=created_at&sortOrder=desc)
7. Pagination (?page=2&limit=5)
```

---

## 📊 Query Parameters Reference

### Posts List Endpoint

**Pagination:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Filters:**
- `status` - Filter by status: `draft`, `published`, `archived`
- `category` - Filter by category ID (UUID)
- `tag` - Filter by tag ID (UUID)
- `author` - Filter by author ID (UUID)
- `search` - Search in title, content, excerpt

**Sorting:**
- `sortBy` - Sort field: `created_at`, `updated_at`, `title`, `published_at`
- `sortOrder` - Sort direction: `asc`, `desc`

**Example:**
```
GET /posts?page=1&limit=10&status=published&search=typescript&sortBy=created_at&sortOrder=desc
```

---

## 🎯 Testing Scenarios

### Scenario 1: Public User (No Auth)
✅ Can list all published posts  
✅ Can view single post details  
✅ Can search posts  
✅ Can filter posts  
❌ Cannot create/update/delete posts

### Scenario 2: Authenticated User
✅ Can do everything public user can  
✅ Can create new posts  
✅ Can update own posts  
✅ Can delete own posts  
✅ Can change post status

### Scenario 3: Admin User
✅ Can do everything  
✅ Can manage all posts (any user)  
✅ Can manage categories & tags  
✅ Full access to all endpoints

---

## 📝 Sample Data (From Migrations)

### Users:
```
admin@example.com / password123 (ADMIN)
john@example.com / password123 (USER)
jane@example.com / password123 (EDITOR)
```

### Categories:
```
- Technology
- Programming
  - JavaScript
  - TypeScript
- Design
  - UI Design
  - UX Design
- Business
```

### Tags (20 tags):
```
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL,
AI, Machine Learning, Tutorial, Guide, Best Practices,
Tips & Tricks, Web Development, Backend, Frontend, Full Stack,
API, REST, GraphQL, DevOps
```

### Sample Posts (3 posts):
1. **Getting Started with TypeScript** (Published)
2. **Building REST APIs with Express** (Published)
3. **AI-Powered Content Generation** (Draft)

---

## 🔧 Environment Variables

### Collection Variables:
- `baseUrl` - API base URL (default: http://localhost:8000)
- `token` - JWT token (auto-saved after login)

### Usage dalam Requests:
- URL: `{{baseUrl}}/posts`
- Authorization: `Bearer {{token}}`

---

## ✅ Pre-request Scripts

### Auto Token Management:
Login request memiliki **Test Script** yang automatically save token:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('token', response.result.token);
    console.log('Token saved:', response.result.token);
}
```

---

## 🎨 Response Format

All endpoints follow consistent response structure:

**Success Response:**
```json
{
  "message": "Operation successful",
  "result": { /* data */ },
  "meta": { /* pagination, if applicable */ }
}
```

**Error Response:**
```json
{
  "message": "Error message",
  "result": null
}
```

**Pagination Meta:**
```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🚀 Next Steps

1. ✅ **Import collection ke Postman**
2. ✅ **Start dev server**: `pnpm dev`
3. ✅ **Test Authentication**: Login dan verify token saved
4. ✅ **Test Posts CRUD**: Create, Read, Update, Delete
5. ✅ **Test Filters**: Search, status filter, pagination
6. ⏳ **Wait for Categories & Tags**: Coming soon!

---

## 📚 Documentation

- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **JSON API Docs**: http://localhost:8000/json-api-docs
- **Frontend API Spec**: `FRONTEND_API_SPEC.md`

---

## 🐛 Troubleshooting

### Token not saved after login?
- Check **Console** in Postman (View → Show Postman Console)
- Verify Test Script is executed
- Manually copy token from response to environment variable

### 401 Unauthorized on protected endpoints?
- Make sure you're logged in (run Login request first)
- Verify token exists in environment variables
- Check token is not expired (default: 7 days)

### Cannot find endpoint?
- Verify dev server is running: `pnpm dev`
- Check baseUrl in environment: `http://localhost:8000`
- Ensure no typos in endpoint path

---

**Created:** 22 Oktober 2025  
**Last Updated:** 22 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Posts Module Ready, ⏳ Categories & Tags Coming Next

