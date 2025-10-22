# AI Integration Documentation

## 🤖 Overview

AI-Powered CMS integrates Google Gemini AI to provide intelligent content management features including content generation, SEO optimization, image generation, and auto-tagging.

## 🚀 Features

### 1. **Content Generation**
- Generate blog posts, articles, tutorials, news, and reviews
- Multiple content types and tones
- Support for Indonesian and English
- Configurable content length

### 2. **SEO Optimization**
- Auto-generate SEO-friendly titles
- Create meta descriptions
- Keyword suggestions
- SEO score analysis

### 3. **Image Generation**
- AI-generated images for posts
- Multiple styles and sizes
- Configurable aspect ratios
- High-quality output

### 4. **Auto-Tagging**
- Smart tag suggestions
- Content analysis
- Confidence scoring
- Reasoning explanations

## 🛠️ Setup

### 1. **Get Google Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. **Configure Environment Variables**

Add to your `.env` file:

```bash
# AI Configuration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.7
AI_IMAGE_MODEL=gemini-1.5-flash
AI_IMAGE_QUALITY=standard
AI_IMAGE_STYLE=photographic
AI_RATE_LIMIT=60
AI_RATE_LIMIT_HOUR=1000
```

### 3. **Install Dependencies**

```bash
pnpm add @google/generative-ai
```

## 📚 API Endpoints

### **Content Generation**

```http
POST /ai/generate-content
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "How to Build a CMS",
  "topic": "Web Development",
  "keywords": ["cms", "web development", "tutorial"],
  "contentType": "tutorial",
  "tone": "professional",
  "length": "medium",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content generated successfully",
  "data": {
    "title": "How to Build a Modern CMS: A Complete Guide",
    "content": "Building a Content Management System (CMS) is a complex but rewarding project...",
    "excerpt": "Learn how to build a modern CMS from scratch with this comprehensive guide...",
    "metaDescription": "Complete guide to building a modern CMS with AI integration, SEO optimization, and user management.",
    "suggestedTags": ["cms", "web development", "tutorial", "javascript", "nodejs"],
    "suggestedCategory": "Technology",
    "seoScore": 85,
    "estimatedReadTime": 8
  }
}
```

### **SEO Optimization**

```http
POST /ai/optimize-seo
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Blog Post",
  "content": "This is my blog post content...",
  "targetKeywords": ["blog", "seo", "optimization"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "SEO optimization completed",
  "data": {
    "optimizedTitle": "Ultimate Blog SEO Guide: Boost Your Rankings in 2024",
    "metaDescription": "Master blog SEO with our comprehensive guide. Learn proven strategies to boost your rankings and drive organic traffic.",
    "suggestedKeywords": ["blog seo", "seo optimization", "content marketing", "organic traffic"],
    "seoScore": 92,
    "improvements": [
      "Add more relevant keywords",
      "Improve meta description length",
      "Include internal links"
    ]
  }
}
```

### **Image Generation**

```http
POST /ai/generate-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Modern office workspace with laptop and coffee",
  "style": "photographic",
  "size": "medium",
  "aspectRatio": "16:9"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "imageUrl": "https://generated-image-url.com/image.jpg",
    "prompt": "Modern office workspace with laptop and coffee",
    "style": "photographic",
    "dimensions": {
      "width": 1024,
      "height": 576
    }
  }
}
```

### **Auto-Tagging**

```http
POST /ai/auto-tagging
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "React Hooks Tutorial",
  "content": "React Hooks are a powerful feature that allows you to use state and other React features...",
  "existingTags": ["react", "javascript"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-tagging completed",
  "data": {
    "suggestedTags": ["react", "javascript", "hooks", "frontend", "tutorial", "web development"],
    "confidence": 88,
    "reasoning": "Tags selected based on content analysis focusing on React concepts, JavaScript programming, and tutorial format."
  }
}
```

### **Content Suggestions**

```http
GET /ai/content-suggestions?topic=AI&contentType=blog&language=en
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Content suggestions generated",
  "data": {
    "suggestedTitle": "The Future of AI: Transforming Industries in 2024",
    "suggestedExcerpt": "Explore how artificial intelligence is revolutionizing various industries and shaping the future of technology.",
    "suggestedTags": ["artificial intelligence", "technology", "future", "innovation", "automation"],
    "suggestedCategory": "Technology",
    "estimatedReadTime": 6,
    "seoScore": 82
  }
}
```

## 🔧 Configuration Options

### **Content Types**
- `blog` - Blog posts
- `article` - Articles
- `tutorial` - Tutorials
- `news` - News articles
- `review` - Product reviews

### **Tones**
- `professional` - Professional tone
- `casual` - Casual tone
- `friendly` - Friendly tone
- `technical` - Technical tone
- `creative` - Creative tone

### **Lengths**
- `short` - 300-500 words
- `medium` - 800-1200 words
- `long` - 1500-2500 words

### **Languages**
- `id` - Indonesian
- `en` - English

### **Image Styles**
- `photographic` - Realistic photos
- `artistic` - Artistic style
- `minimalist` - Minimalist design
- `vintage` - Vintage style

### **Image Sizes**
- `small` - 512x512
- `medium` - 1024x1024
- `large` - 2048x2048

### **Aspect Ratios**
- `1:1` - Square
- `16:9` - Widescreen
- `4:3` - Standard
- `3:2` - Photo

## 🚨 Error Handling

### **Common Errors**

1. **Missing API Key**
   ```json
   {
     "success": false,
     "message": "GEMINI_API_KEY is required for AI features"
   }
   ```

2. **Rate Limit Exceeded**
   ```json
   {
     "success": false,
     "message": "Rate limit exceeded. Please try again later."
   }
   ```

3. **Invalid Request**
   ```json
   {
     "success": false,
     "message": "Invalid request parameters"
   }
   ```

## 📊 Rate Limiting

- **Per Minute:** 60 requests
- **Per Hour:** 1000 requests
- **Configurable** via environment variables

## 🔒 Security

- All AI endpoints require authentication
- API keys are stored securely
- Rate limiting prevents abuse
- Input validation on all requests

## 🧪 Testing

### **Test AI Status**
```bash
curl -X GET "http://localhost:8000/ai/status" \
  -H "Authorization: Bearer <your-token>"
```

### **Test Content Generation**
```bash
curl -X POST "http://localhost:8000/ai/generate-content" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in Web Development",
    "contentType": "blog",
    "tone": "professional",
    "language": "en"
  }'
```

## 📈 Performance

- **Response Time:** 2-5 seconds for content generation
- **Image Generation:** 5-10 seconds
- **SEO Optimization:** 1-3 seconds
- **Auto-tagging:** 1-2 seconds

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Custom AI models
- [ ] Batch processing
- [ ] AI-powered search
- [ ] Content analytics
- [ ] A/B testing for AI-generated content

## 📞 Support

For issues or questions about AI integration:

1. Check the logs for detailed error messages
2. Verify your API key is correct
3. Ensure you have sufficient API quota
4. Check rate limiting settings

---

**Happy AI-powered content creation!** 🚀
