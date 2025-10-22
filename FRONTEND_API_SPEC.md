# 🎨 Frontend-Ready API Specification

**Project**: AI-CMS Backend  
**Purpose**: Ensure all Phase 1 APIs are frontend-friendly  
**Last Updated**: 22 Oktober 2025

---

## 🎯 Design Principles

### Frontend-First Approach:
- ✅ **Consistent Response Format** - Semua endpoint return format yang sama
- ✅ **Detailed Error Messages** - Frontend bisa display error dengan jelas
- ✅ **Rich Data** - Include relationships (author, category, tags) dalam response
- ✅ **Pagination Ready** - Support infinite scroll & page navigation
- ✅ **Search & Filter** - Query params yang flexible
- ✅ **CORS Enabled** - Frontend development di port berbeda
- ✅ **File Upload Support** - Multipart form data handling

---

## 📦 Standard Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* actual data */ },
  "meta": { /* pagination, counts, etc */ }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message for user",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "title": "Title is required",
      "content": "Content must be at least 10 characters"
    }
  }
}
```

### Pagination Meta:
```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🔐 Authentication

### Headers Required:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Login Response (Already Exists):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "avatar": "https://..."
    }
  }
}
```

---

## 📝 Posts API (Week 1)

### 1. GET `/posts` - List Posts with Pagination

**Query Parameters:**
```
?page=1              // Page number (default: 1)
&limit=10            // Items per page (default: 10, max: 100)
&status=published    // Filter: draft | published | archived
&category=uuid       // Filter by category ID
&tag=uuid            // Filter by tag ID
&author=uuid         // Filter by author ID
&search=keyword      // Search in title, content, excerpt
&sortBy=created_at   // Sort field (created_at, updated_at, title)
&sortOrder=desc      // Sort order (asc, desc)
```

**Response:**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "My First Blog Post",
      "slug": "my-first-blog-post",
      "excerpt": "This is a short description...",
      "content": "Full HTML content here...",
      "status": "published",
      "featuredImage": "https://cloudinary.com/image.jpg",
      "author": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://..."
      },
      "category": {
        "id": "uuid",
        "name": "Technology",
        "slug": "technology"
      },
      "tags": [
        {
          "id": "uuid",
          "name": "JavaScript",
          "slug": "javascript"
        },
        {
          "id": "uuid",
          "name": "TypeScript",
          "slug": "typescript"
        }
      ],
      "viewCount": 0,
      "createdAt": "2025-10-22T10:30:00Z",
      "updatedAt": "2025-10-22T10:30:00Z"
    }
  ],
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

### 2. GET `/posts/:id` - Get Single Post

**Response:**
```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "excerpt": "This is a short description...",
    "content": "Full HTML content here...",
    "status": "published",
    "featuredImage": "https://cloudinary.com/image.jpg",
    "author": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://..."
    },
    "category": {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology",
      "description": "Tech related posts"
    },
    "tags": [
      {
        "id": "uuid",
        "name": "JavaScript",
        "slug": "javascript"
      }
    ],
    "viewCount": 123,
    "createdAt": "2025-10-22T10:30:00Z",
    "updatedAt": "2025-10-22T10:30:00Z"
  }
}
```

---

### 3. POST `/posts` - Create New Post

**Request Body:**
```json
{
  "title": "My New Blog Post",
  "content": "<p>HTML content here...</p>",
  "excerpt": "Short description (optional)",
  "status": "draft",  // draft | published | archived
  "featuredImage": "https://cloudinary.com/image.jpg",
  "categoryId": "uuid",
  "tagIds": ["uuid1", "uuid2"]
}
```

**Validation Rules:**
- `title`: Required, min 3 chars, max 255 chars
- `content`: Required, min 10 chars
- `excerpt`: Optional, max 500 chars (auto-generate from content if empty)
- `status`: Optional, default "draft"
- `slug`: Auto-generated from title if not provided
- `categoryId`: Optional UUID
- `tagIds`: Optional array of UUIDs

**Response:** Same as GET single post

---

### 4. PUT `/posts/:id` - Update Post

**Request Body:** Same as POST, all fields optional

**Response:** Same as GET single post

---

### 5. DELETE `/posts/:id` - Delete Post

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully",
  "data": null
}
```

---

### 6. PATCH `/posts/:id/status` - Update Post Status

**Request Body:**
```json
{
  "status": "published"  // draft | published | archived
}
```

**Use Case:** Quick publish/unpublish without full update

---

## 📂 Categories API (Week 2)

### 1. GET `/categories` - List All Categories

**Query Parameters:**
```
?page=1
&limit=50
&parent=uuid         // Filter by parent category
&includeCount=true   // Include post count per category
```

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology",
      "description": "All about tech",
      "parent": null,
      "postCount": 45,  // If includeCount=true
      "children": [     // Nested subcategories
        {
          "id": "uuid",
          "name": "JavaScript",
          "slug": "javascript",
          "parent": "technology-uuid",
          "postCount": 23
        }
      ],
      "createdAt": "2025-10-22T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### 2. GET `/categories/:id` - Get Single Category

**Query Parameters:**
```
?includePosts=true   // Include recent posts in this category
&postsLimit=5        // How many posts to include (default: 5)
```

**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Technology",
    "slug": "technology",
    "description": "All about tech",
    "parent": null,
    "postCount": 45,
    "recentPosts": [  // If includePosts=true
      {
        "id": "uuid",
        "title": "Post title",
        "slug": "post-slug",
        "excerpt": "...",
        "createdAt": "..."
      }
    ],
    "createdAt": "2025-10-22T10:30:00Z"
  }
}
```

---

### 3. POST `/categories` - Create Category

**Request Body:**
```json
{
  "name": "JavaScript",
  "description": "All about JavaScript",
  "parentId": "uuid"  // Optional, for subcategories
}
```

**Validation:**
- `name`: Required, unique, min 2 chars, max 100 chars
- `slug`: Auto-generated from name
- `parentId`: Optional, must exist in DB

---

### 4. PUT `/categories/:id` - Update Category

**Request Body:** Same as POST, all fields optional

---

### 5. DELETE `/categories/:id` - Delete Category

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

**Note:** Consider what happens to posts in this category:
- Option A: Set category_id to NULL
- Option B: Prevent deletion if posts exist
- **Recommendation:** Return error if category has posts

---

## 🏷️ Tags API (Week 2)

### 1. GET `/tags` - List All Tags

**Query Parameters:**
```
?page=1
&limit=50
&search=keyword
&sortBy=name         // name | postCount
&includeCount=true   // Include post count per tag
```

**Response:**
```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "JavaScript",
      "slug": "javascript",
      "postCount": 34,  // If includeCount=true
      "createdAt": "2025-10-22T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 78,
    "totalPages": 2
  }
}
```

---

### 2. POST `/tags` - Create Tag

**Request Body:**
```json
{
  "name": "TypeScript"
}
```

**Validation:**
- `name`: Required, unique, min 2 chars, max 50 chars
- `slug`: Auto-generated from name

---

### 3. GET `/tags/suggestions` - Auto-suggest Tags

**Query Parameters:**
```
?q=java    // Search query
&limit=5   // Max suggestions
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "JavaScript", "slug": "javascript" },
    { "id": "uuid", "name": "Java", "slug": "java" }
  ]
}
```

**Use Case:** Autocomplete saat user typing tag

---

## 📸 Media API (Week 3)

### 1. POST `/media/upload` - Upload File

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file` or `files` (multiple)

**Request Body (Multipart):**
```
file: [binary]
folder: "posts"         // Optional, organize by folder
alt: "Image description" // Optional, for accessibility
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "url": "https://res.cloudinary.com/xxx/image/upload/v1234/abc.jpg",
    "secureUrl": "https://...",
    "thumbnailUrl": "https://.../_thumb.jpg",
    "fileName": "my-image.jpg",
    "fileSize": 245678,  // bytes
    "fileType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "folder": "posts",
    "alt": "Image description",
    "uploadedBy": {
      "id": "uuid",
      "name": "John Doe"
    },
    "createdAt": "2025-10-22T10:30:00Z"
  }
}
```

---

### 2. GET `/media` - List Media Library

**Query Parameters:**
```
?page=1
&limit=20
&type=image          // image | video | document
&folder=posts        // Filter by folder
&search=keyword      // Search in filename, alt
&sortBy=created_at   // created_at | file_size | file_name
&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Media retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "fileName": "image.jpg",
      "fileSize": 245678,
      "fileType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "alt": "Description",
      "createdAt": "2025-10-22T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 234,
    "totalPages": 12
  }
}
```

---

### 3. DELETE `/media/:id` - Delete Media

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully",
  "data": null
}
```

**Note:** Delete from Cloudinary + database

---

## 👥 User Management API (Week 4)

### 1. GET `/users/me` - Get Current User Profile

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "avatar": "https://...",
    "bio": "Content creator",
    "createdAt": "2025-01-01T00:00:00Z",
    "stats": {
      "totalPosts": 45,
      "publishedPosts": 32,
      "draftPosts": 13
    }
  }
}
```

---

### 2. PUT `/users/me` - Update Profile

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "New bio text",
  "avatar": "https://cloudinary.com/new-avatar.jpg"
}
```

---

### 3. GET `/users/:id` - Get User Profile (Public)

**Response:** Similar to `/users/me` but limited fields

---

## 📊 Dashboard Stats API (Week 4)

### GET `/dashboard/stats` - Overview Statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": {
      "total": 156,
      "published": 120,
      "draft": 30,
      "archived": 6
    },
    "categories": {
      "total": 12
    },
    "tags": {
      "total": 78
    },
    "media": {
      "total": 234,
      "totalSize": 1024000000  // bytes
    },
    "recentPosts": [
      {
        "id": "uuid",
        "title": "Recent Post",
        "status": "published",
        "createdAt": "..."
      }
    ],
    "popularPosts": [
      {
        "id": "uuid",
        "title": "Popular Post",
        "viewCount": 1234
      }
    ]
  }
}
```

---

## 🔍 Search API

### GET `/search` - Global Search

**Query Parameters:**
```
?q=keyword           // Search query
&type=all            // all | posts | categories | tags
&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      { "id": "uuid", "title": "...", "excerpt": "..." }
    ],
    "categories": [
      { "id": "uuid", "name": "...", "postCount": 12 }
    ],
    "tags": [
      { "id": "uuid", "name": "..." }
    ]
  }
}
```

---

## ⚠️ Error Codes

Frontend dapat handle error berdasarkan code:

```typescript
enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  
  // Conflict (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  SLUG_TAKEN = 'SLUG_TAKEN',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED'
}
```

---

## 🌐 CORS Configuration

```typescript
// Backend CORS setup
app.use(cors({
  origin: [
    'http://localhost:3000',  // Next.js dev
    'http://localhost:5173',  // Vite dev
    'https://your-frontend-domain.com'
  ],
  credentials: true
}));
```

---

## 📤 File Upload Specs

### Supported File Types:
**Images:**
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

**Max File Size:** 5MB

### Validation Response:
```json
{
  "success": false,
  "message": "File validation failed",
  "error": {
    "code": "INVALID_FILE",
    "details": "File size exceeds 5MB limit"
  }
}
```

---

## 🎨 Frontend Implementation Checklist

### React/Next.js Components yang Dibutuhkan:

#### Posts:
- [ ] PostList (with pagination)
- [ ] PostCard component
- [ ] PostForm (create/edit)
- [ ] RichTextEditor integration
- [ ] PostPreview
- [ ] PostFilters (status, category, search)

#### Categories & Tags:
- [ ] CategoryList
- [ ] CategoryForm
- [ ] TagInput with autocomplete
- [ ] TagCloud

#### Media:
- [ ] MediaUploader (drag & drop)
- [ ] MediaLibrary (grid view)
- [ ] MediaPicker modal
- [ ] ImagePreview

#### Dashboard:
- [ ] StatsCards
- [ ] RecentPostsList
- [ ] ActivityChart

#### Common:
- [ ] Pagination component
- [ ] SearchBar
- [ ] Loading states
- [ ] Error boundaries
- [ ] Toast notifications

---

## 🔧 Frontend Utils Needed

### API Client:
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data);
  }
);

export default api;
```

### Type Definitions:
```typescript
// types/post.ts
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  author: User;
  category?: Category;
  tags: Tag[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

// ... more types
```

---

## 🎯 Frontend Features Checklist

### Authentication:
- [ ] Login form
- [ ] Logout functionality
- [ ] Protected routes
- [ ] Token refresh handling
- [ ] Persist login state

### Post Management:
- [ ] Create post form
- [ ] Edit post form
- [ ] Delete confirmation
- [ ] Draft auto-save
- [ ] Rich text editor (TipTap/Slate/Quill)
- [ ] Image upload in editor
- [ ] SEO fields (meta title, description)
- [ ] Category selector
- [ ] Tag input with autocomplete
- [ ] Preview mode
- [ ] Publish/unpublish toggle

### Content Organization:
- [ ] Filter by status
- [ ] Filter by category
- [ ] Filter by tag
- [ ] Search posts
- [ ] Sort options
- [ ] Bulk actions

### Media Library:
- [ ] Drag & drop upload
- [ ] Multi-file upload
- [ ] Image preview
- [ ] Image selection modal
- [ ] Delete media
- [ ] Filter by type
- [ ] Search media

### Dashboard:
- [ ] Stats overview
- [ ] Recent posts
- [ ] Quick actions
- [ ] Activity log

---

## 🚀 Next Steps

### Backend Development (NOW):
1. ✅ Implement all endpoints with consistent response format
2. ✅ Add proper validation & error handling
3. ✅ Include relationships in queries (JOIN)
4. ✅ Setup CORS properly
5. ✅ Test all endpoints with Postman
6. ✅ Generate Postman collection for frontend team

### Frontend Development (LATER):
1. ⏳ Setup Next.js project
2. ⏳ Implement API client
3. ⏳ Create type definitions
4. ⏳ Build components
5. ⏳ Integrate with backend
6. ⏳ Testing & polish

---

## 📚 Documentation

### For Frontend Developers:
- ✅ This API specification
- ✅ Postman collection with examples
- ✅ TypeScript type definitions
- ✅ Authentication flow diagram
- ✅ Error handling guide

---

**Status**: ✅ Ready for Backend Development  
**Approved By**: Team  
**Last Review**: 22 Oktober 2025

---

## 💡 Notes

- All timestamps in ISO 8601 format (UTC)
- All IDs using UUID v4
- Pagination default: page=1, limit=10
- All list endpoints support search & filter
- All responses include `success` boolean
- Error responses always include `code` for frontend handling
- File uploads use Cloudinary (CDN ready)
- Rich text content in HTML format
- Slugs auto-generated but can be customized

**🎯 Goal**: Backend siap untuk frontend development tanpa perlu rework!

