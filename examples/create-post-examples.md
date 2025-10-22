# 📝 Create Post - Examples & Guide

Complete guide untuk testing Create Post endpoint.

---

## 🔑 Step 1: Login (Get Token)

**Endpoint:** `POST http://localhost:8000/auth/login`

**Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

**PowerShell:**
```powershell
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
$token = $loginResponse.result.token
Write-Host "Token: $token"
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "user": {
      "id": "uuid",
      "name": "Administrator",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token!** Kamu butuh ini untuk create post.

---

## 📝 Step 2: Create Post

**Endpoint:** `POST http://localhost:8000/posts`  
**Authorization:** `Bearer <your_token>`

---

### Example 1: Simple Post (Minimal Fields)

**Body:**
```json
{
  "title": "My First Blog Post",
  "content": "<p>This is my first blog post. I'm learning how to use this AI-CMS system.</p><p>It's actually quite easy and fun!</p>"
}
```

**Features:**
- ✅ `slug` auto-generated from title → `my-first-blog-post`
- ✅ `excerpt` auto-generated from content
- ✅ `status` default to `draft`
- ✅ `author_id` from logged-in user

---

### Example 2: Complete Post with All Fields

**Body:**
```json
{
  "title": "Getting Started with Node.js in 2025",
  "content": "<h1>Introduction to Node.js</h1><p>Node.js is a powerful JavaScript runtime built on Chrome's V8 engine. In this comprehensive guide, we'll explore everything you need to know to get started with Node.js development in 2025.</p><h2>What is Node.js?</h2><p>Node.js allows you to run JavaScript on the server side, opening up a world of possibilities for full-stack JavaScript development.</p><h2>Why Learn Node.js?</h2><ul><li>Fast and scalable</li><li>Large ecosystem (npm)</li><li>Great for real-time applications</li><li>Perfect for APIs</li></ul><h2>Getting Started</h2><p>To get started with Node.js, you'll need to install it from nodejs.org...</p>",
  "excerpt": "A comprehensive guide to getting started with Node.js development in 2025. Learn the basics, best practices, and why Node.js is perfect for modern web development.",
  "status": "published",
  "featuredImage": "https://images.unsplash.com/photo-1627398242454-45a1465c2479",
  "categoryId": "7ec594cb-49f6-4b09-9f96-b95d2e70a6e1",
  "tagIds": [
    "2806c5fb-6424-4424-b804-c49d09db12b8",
    "a17f2878-d189-4aac-bba0-a62804f837b6",
    "c7f40f4e-9baa-4053-b767-8ffe0159b61f"
  ],
  "metaTitle": "Getting Started with Node.js in 2025 - Complete Guide",
  "metaDescription": "Learn Node.js from scratch with this comprehensive 2025 guide. Covers installation, basics, best practices, and real-world examples.",
  "metaKeywords": "nodejs, javascript, backend, server-side, tutorial, 2025"
}
```

**Note:**
- Get `categoryId` from: `GET /posts` → check existing post's category ID
- Get `tagIds` from: Check existing posts → they have tags with IDs
- Or query database directly

---

### Example 3: Draft Post (Work in Progress)

**Body:**
```json
{
  "title": "Understanding TypeScript Generics",
  "content": "<h1>TypeScript Generics</h1><p>Generics are one of the most powerful features in TypeScript. They allow you to create reusable components that work with multiple types.</p><p><strong>Work in progress:</strong> More content coming soon...</p>",
  "excerpt": "Learn about TypeScript generics and how they make your code more flexible and type-safe.",
  "status": "draft",
  "categoryId": "6fe2da96-c6ff-4abe-8252-a5f159d461ab",
  "tagIds": ["5b49c221-5220-452e-9bac-61f3d19dfbaa"]
}
```

---

### Example 4: Post with AI Tracking (untuk AI-generated content nanti)

**Body:**
```json
{
  "title": "The Future of Artificial Intelligence in Healthcare",
  "content": "<h1>AI in Healthcare: A Revolution</h1><p>Artificial intelligence is transforming the healthcare industry in unprecedented ways. From diagnostic tools to personalized treatment plans, AI is making healthcare more efficient and accessible.</p><h2>Key Applications</h2><p>AI is being used for disease detection, drug discovery, patient monitoring, and much more...</p>",
  "excerpt": "Discover how artificial intelligence is revolutionizing healthcare with innovative applications in diagnostics, treatment, and patient care.",
  "status": "published",
  "categoryId": "cc20079e-3521-4816-b94c-e1e61781908d",
  "tagIds": [
    "f77dc4d5-a291-448c-b01c-7774020fe7a2",
    "f6cd11bd-6833-451e-8e83-15647705ce0e"
  ],
  "metaTitle": "The Future of AI in Healthcare - Complete Analysis",
  "metaDescription": "Explore how AI is transforming healthcare with breakthrough applications in diagnostics, treatment planning, and patient care systems.",
  "metaKeywords": "artificial intelligence, healthcare, medical AI, machine learning, diagnostics"
}
```

---

## 🚀 Testing Commands

### Using cURL:

```bash
# Save token first
TOKEN="your_token_here"

# Create post
curl -X POST http://localhost:8000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Test Post",
    "content": "<p>This is a test post created via cURL.</p>"
  }'
```

### Using PowerShell:

```powershell
# Login and save token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"password123"}'
$token = $loginResponse.result.token

# Create post
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    title = "My PowerShell Post"
    content = "<p>This post was created using PowerShell!</p><p>Pretty cool, right?</p>"
    status = "published"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/posts" -Method POST -Headers $headers -Body $body
$response | ConvertTo-Json -Depth 5
```

### Using Postman:

1. **Authorization Tab:**
   - Type: `Bearer Token`
   - Token: `{{token}}` (auto-filled if you ran Login first)

2. **Headers:**
   - `Content-Type: application/json`

3. **Body (raw JSON):**
   ```json
   {
     "title": "Your Post Title",
     "content": "<p>Your content here...</p>"
   }
   ```

---

## 📊 Available Category & Tag IDs (from sample data)

### Categories:
```json
{
  "Programming": "7ec594cb-49f6-4b09-9f96-b95d2e70a6e1",
  "Technology": "cc20079e-3521-4816-b94c-e1e61781908d",
  "TypeScript": "6fe2da96-c6ff-4abe-8252-a5f159d461ab",
  "JavaScript": "fcb2a537-dc83-499f-86b7-545429531361",
  "Design": "f4a59c07-d3d8-4847-ad45-79dd91c7defb",
  "Business": "9d28036d-635b-40f9-9d01-7a93932c69c1"
}
```

### Popular Tags:
```json
{
  "JavaScript": "a17f2878-d189-4aac-bba0-a62804f837b6",
  "TypeScript": "5b49c221-5220-452e-9bac-61f3d19dfbaa",
  "Node.js": "2806c5fb-6424-4424-b804-c49d09db12b8",
  "React": "709f1094-2bd7-4289-b411-2b70bdbfbb50",
  "Express": "1de40ae3-3027-477e-8f80-f07bcc2b79f6",
  "API": "15999b6c-8186-471f-9567-fb302cfe76e0",
  "Tutorial": "c7f40f4e-9baa-4053-b767-8ffe0159b61f",
  "AI": "f77dc4d5-a291-448c-b01c-7774020fe7a2",
  "Backend": "f9a097dc-6841-4609-9c19-d7f39241730b"
}
```

**To get fresh IDs**, query:
```bash
# Get all categories
curl http://localhost:8000/posts | jq '.result[0].category.id'

# Get all tags  
curl http://localhost:8000/posts | jq '.result[0].tags'
```

---

## ✅ Expected Response

```json
{
  "message": "Post created successfully",
  "result": {
    "id": "new-uuid-here",
    "title": "Your Post Title",
    "slug": "your-post-title",
    "excerpt": "Auto-generated or your excerpt",
    "content": "<p>Your content...</p>",
    "status": "draft",
    "featuredImage": null,
    "metaTitle": "Your Post Title",
    "metaDescription": "Auto-generated or your description",
    "metaKeywords": null,
    "author": {
      "id": "uuid",
      "name": "Administrator",
      "email": "admin@example.com",
      "avatar": "https://ui-avatars.com/api/..."
    },
    "category": {
      "id": "uuid",
      "name": "Programming",
      "slug": "programming",
      "description": "..."
    },
    "tags": [
      {
        "id": "uuid",
        "name": "JavaScript",
        "slug": "javascript"
      }
    ],
    "viewCount": 0,
    "publishedAt": null,
    "createdAt": "2025-10-22T...",
    "updatedAt": "2025-10-22T..."
  }
}
```

---

## ⚠️ Common Errors

### 401 Unauthorized
```json
{
  "message": "Token tidak valid atau sudah kadaluarsa"
}
```
**Solution:** Login again to get fresh token

### 400 Validation Error
```json
{
  "message": "Title must be at least 3 characters"
}
```
**Solution:** Check your input against validation rules

### 400 Content Too Short
```json
{
  "message": "Content must be at least 10 characters"
}
```
**Solution:** Add more content (minimum 10 characters)

---

## 🎯 Validation Rules

- **title**: Required, 3-255 characters
- **content**: Required, minimum 10 characters
- **excerpt**: Optional, max 500 characters (auto-generated if empty)
- **status**: Optional, must be: `draft`, `published`, or `archived` (default: `draft`)
- **featuredImage**: Optional, URL string
- **categoryId**: Optional, must be valid UUID from categories table
- **tagIds**: Optional, array of valid UUIDs from tags table
- **metaTitle**: Optional, max 255 characters
- **metaDescription**: Optional, max 500 characters
- **metaKeywords**: Optional, string

---

## 💡 Pro Tips

1. **Auto-generated fields:**
   - `slug` → generated from title
   - `excerpt` → generated from content if not provided
   - `metaTitle` → defaults to title if not provided
   - `metaDescription` → defaults to excerpt if not provided

2. **HTML Content:**
   - Use proper HTML tags in content
   - Include headings (`<h1>`, `<h2>`)
   - Use paragraphs (`<p>`)
   - Lists (`<ul>`, `<ol>`, `<li>`)

3. **SEO Best Practices:**
   - Always provide metaTitle (60 chars ideal)
   - Always provide metaDescription (160 chars ideal)
   - Use relevant keywords in metaKeywords

4. **Status Workflow:**
   - Create as `draft` first
   - Review & edit
   - Change to `published` when ready
   - Use `archived` for old content

---

**Happy Testing!** 🚀

