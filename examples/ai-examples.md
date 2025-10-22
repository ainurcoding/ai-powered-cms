# AI Integration Examples

## 🤖 AI Content Generation Examples

### **1. Blog Post Generation**

```bash
curl -X POST "http://localhost:8000/ai/generate-content" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with React Hooks",
    "keywords": ["react", "hooks", "javascript", "frontend"],
    "contentType": "tutorial",
    "tone": "friendly",
    "length": "medium",
    "language": "en"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Content generated successfully",
  "data": {
    "title": "Getting Started with React Hooks: A Beginner's Guide",
    "content": "# Getting Started with React Hooks: A Beginner's Guide\n\nReact Hooks revolutionized the way we write React components...",
    "excerpt": "Learn the fundamentals of React Hooks with this comprehensive beginner's guide. Master useState, useEffect, and custom hooks.",
    "metaDescription": "Complete beginner's guide to React Hooks. Learn useState, useEffect, and custom hooks with practical examples.",
    "suggestedTags": ["react", "hooks", "javascript", "frontend", "tutorial", "web development"],
    "suggestedCategory": "Technology",
    "seoScore": 87,
    "estimatedReadTime": 7
  }
}
```

### **2. Indonesian Article Generation**

```bash
curl -X POST "http://localhost:8000/ai/generate-content" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Panduan Memulai Bisnis Online",
    "keywords": ["bisnis online", "e-commerce", "startup", "entrepreneur"],
    "contentType": "article",
    "tone": "professional",
    "length": "long",
    "language": "id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Content generated successfully",
  "data": {
    "title": "Panduan Lengkap Memulai Bisnis Online di Era Digital",
    "content": "# Panduan Lengkap Memulai Bisnis Online di Era Digital\n\nBisnis online telah menjadi pilihan utama bagi banyak entrepreneur...",
    "excerpt": "Pelajari langkah-langkah praktis untuk memulai bisnis online yang sukses di era digital dengan panduan komprehensif ini.",
    "metaDescription": "Panduan lengkap memulai bisnis online sukses. Tips praktis untuk entrepreneur pemula di era digital.",
    "suggestedTags": ["bisnis online", "e-commerce", "startup", "entrepreneur", "digital marketing", "bisnis"],
    "suggestedCategory": "Business",
    "seoScore": 89,
    "estimatedReadTime": 12
  }
}
```

## 🔍 SEO Optimization Examples

### **1. SEO Optimization for Blog Post**

```bash
curl -X POST "http://localhost:8000/ai/optimize-seo" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Blog Post About AI",
    "content": "Artificial intelligence is transforming the world. In this article, we will explore how AI is changing various industries and what the future holds for this technology.",
    "targetKeywords": ["artificial intelligence", "AI technology", "machine learning"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SEO optimization completed",
  "data": {
    "optimizedTitle": "How Artificial Intelligence is Transforming Industries in 2024",
    "metaDescription": "Discover how AI technology is revolutionizing industries worldwide. Learn about machine learning applications and future AI trends.",
    "suggestedKeywords": ["artificial intelligence", "AI technology", "machine learning", "AI applications", "future of AI"],
    "seoScore": 91,
    "improvements": [
      "Include more specific keywords in title",
      "Add internal links to related content",
      "Optimize meta description length",
      "Include FAQ section for better SEO"
    ]
  }
}
```

## 🎨 Image Generation Examples

### **1. Professional Office Image**

```bash
curl -X POST "http://localhost:8000/ai/generate-image" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Modern office workspace with laptop, coffee, and plants",
    "style": "photographic",
    "size": "medium",
    "aspectRatio": "16:9"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai-generated/office-workspace.jpg",
    "prompt": "Modern office workspace with laptop, coffee, and plants",
    "style": "photographic",
    "dimensions": {
      "width": 1024,
      "height": 576
    }
  }
}
```

### **2. Artistic Blog Header**

```bash
curl -X POST "http://localhost:8000/ai/generate-image" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Abstract technology background with circuit patterns",
    "style": "artistic",
    "size": "large",
    "aspectRatio": "1:1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/ai-generated/tech-background.jpg",
    "prompt": "Abstract technology background with circuit patterns",
    "style": "artistic",
    "dimensions": {
      "width": 2048,
      "height": 2048
    }
  }
}
```

## 🏷️ Auto-Tagging Examples

### **1. Technology Article Tagging**

```bash
curl -X POST "http://localhost:8000/ai/auto-tagging" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Building Scalable Web Applications with Node.js",
    "content": "Node.js has become the go-to platform for building scalable web applications. In this comprehensive guide, we will explore best practices for creating high-performance applications using Node.js, Express.js, and modern JavaScript frameworks.",
    "existingTags": ["nodejs", "javascript"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Auto-tagging completed",
  "data": {
    "suggestedTags": ["nodejs", "javascript", "web development", "express.js", "scalability", "backend", "server-side", "performance"],
    "confidence": 92,
    "reasoning": "Tags selected based on content analysis focusing on Node.js development, web application architecture, and performance optimization."
  }
}
```

### **2. Business Article Tagging**

```bash
curl -X POST "http://localhost:8000/ai/auto-tagging" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Digital Marketing Strategies for Small Businesses",
    "content": "Small businesses need effective digital marketing strategies to compete in today's market. This article covers social media marketing, email campaigns, SEO, and content marketing tactics that work for small businesses.",
    "existingTags": ["marketing", "business"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Auto-tagging completed",
  "data": {
    "suggestedTags": ["marketing", "business", "digital marketing", "small business", "social media", "email marketing", "SEO", "content marketing", "strategy"],
    "confidence": 88,
    "reasoning": "Tags selected based on content analysis focusing on digital marketing strategies, small business growth, and online marketing tactics."
  }
}
```

## 💡 Content Suggestions Examples

### **1. Technology Topic Suggestions**

```bash
curl -X GET "http://localhost:8000/ai/content-suggestions?topic=AI&contentType=blog&language=en" \
  -H "Authorization: Bearer <your-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Content suggestions generated",
  "data": {
    "suggestedTitle": "The Future of AI: How Machine Learning is Transforming Industries",
    "suggestedExcerpt": "Explore the revolutionary impact of artificial intelligence across various industries and discover what the future holds for AI technology.",
    "suggestedTags": ["artificial intelligence", "machine learning", "technology", "future", "innovation", "automation"],
    "suggestedCategory": "Technology",
    "estimatedReadTime": 8,
    "seoScore": 85
  }
}
```

### **2. Indonesian Business Topic Suggestions**

```bash
curl -X GET "http://localhost:8000/ai/content-suggestions?topic=Startup&contentType=article&language=id" \
  -H "Authorization: Bearer <your-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Content suggestions generated",
  "data": {
    "suggestedTitle": "Panduan Lengkap Membangun Startup yang Sukses di Indonesia",
    "suggestedExcerpt": "Pelajari strategi dan tips praktis untuk membangun startup yang sukses di pasar Indonesia dengan panduan komprehensif ini.",
    "suggestedTags": ["startup", "entrepreneur", "bisnis", "indonesia", "inovasi", "teknologi"],
    "suggestedCategory": "Business",
    "estimatedReadTime": 10,
    "seoScore": 87
  }
}
```

## 🔧 AI Status Check

### **Check AI Service Status**

```bash
curl -X GET "http://localhost:8000/ai/status" \
  -H "Authorization: Bearer <your-token>"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "AI service status",
  "data": {
    "service": "AI Service",
    "status": "active",
    "features": [
      "Content Generation",
      "SEO Optimization",
      "Image Generation",
      "Auto-tagging"
    ],
    "models": {
      "text": "gemini-1.5-flash",
      "image": "gemini-1.5-flash"
    },
    "timestamp": "2024-10-22T15:30:00.000Z"
  }
}
```

## 🚨 Error Examples

### **1. Missing API Key**

```json
{
  "success": false,
  "message": "GEMINI_API_KEY is required for AI features"
}
```

### **2. Invalid Request Parameters**

```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

### **3. Rate Limit Exceeded**

```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

## 📊 Postman Collection

Import the AI endpoints into your Postman collection:

1. **AI Status** - `GET /ai/status`
2. **Generate Content** - `POST /ai/generate-content`
3. **Optimize SEO** - `POST /ai/optimize-seo`
4. **Generate Image** - `POST /ai/generate-image`
5. **Auto-tagging** - `POST /ai/auto-tagging`
6. **Content Suggestions** - `GET /ai/content-suggestions`

## 🎯 Best Practices

### **Content Generation**
- Use specific, descriptive titles
- Include relevant keywords
- Choose appropriate tone for your audience
- Select content length based on topic complexity

### **SEO Optimization**
- Provide clear, descriptive content
- Include target keywords
- Use the suggested improvements
- Monitor SEO scores

### **Image Generation**
- Write detailed, specific prompts
- Choose appropriate styles
- Consider aspect ratios for different use cases
- Use high-quality settings for important images

### **Auto-tagging**
- Provide complete content for better analysis
- Include existing tags for context
- Review confidence scores
- Use reasoning explanations

---

**Happy AI-powered content creation!** 🚀
