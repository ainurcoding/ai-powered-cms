# 🔌 API Endpoints Reference

## 📋 Overview

Complete list of all available API endpoints with examples and responses.

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "user": {
      "id": "26f75795-5dc3-497b-b643-2e9a05d5beaa",
      "name": "Administrator",
      "username": "admin",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout
```http
GET /auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logout berhasil",
  "result": null
}
```

### Check Token Status
```http
GET /auth/check-token
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "isValid": true,
    "isBlacklisted": false,
    "message": "Token masih valid"
  }
}
```

## 🏥 Health Check Endpoints

### Basic Health Check
```http
GET /health
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "status": "healthy",
    "service": "ai-cms-backend",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2025-10-21T04:36:52.604Z",
    "uptime": 50.1143887
  }
}
```

### Detailed Health Check
```http
GET /health/detailed
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "status": "healthy",
    "api": {
      "status": "healthy",
      "uptime": 50.1143887,
      "version": "1.0.0"
    },
    "database": {
      "status": "connected",
      "responseTime": 15.2
    },
    "memory": {
      "used": "45.2 MB",
      "free": "2.1 GB",
      "total": "8.0 GB"
    },
    "timestamp": "2025-10-21T04:36:52.604Z"
  }
}
```

### Database Health Check
```http
GET /health/database
```

**Response:**
```json
{
  "message": "Success",
  "result": {
    "status": "connected",
    "responseTime": 15.2,
    "timestamp": "2025-10-21T04:36:52.604Z"
  }
}
```

## 🏠 Home Endpoint

### Welcome Message
```http
GET /
```

**Response:**
```json
{
  "message": "Welcome to AI-Powered CMS API",
  "result": {
    "service": "ai-cms-backend",
    "version": "1.0.0",
    "environment": "development",
    "timestamp": "2025-10-21T04:36:52.604Z"
  }
}
```

## 📚 Documentation Endpoints

### Swagger UI
```http
GET /docs
```
Interactive API documentation interface.

### API JSON Schema
```http
GET /json-api-docs
```
Raw OpenAPI/Swagger JSON schema.

## 🔒 Authentication Requirements

### Public Endpoints (No Auth Required)
- `GET /` - Welcome message
- `POST /auth/login` - Login
- `GET /health` - Health check
- `GET /health/detailed` - Detailed health
- `GET /health/database` - Database health
- `GET /docs` - Swagger UI
- `GET /json-api-docs` - API schema

### Protected Endpoints (Auth Required)
- `GET /auth/logout` - Logout
- `GET /auth/check-token` - Check token status
- All future CMS endpoints

## 🚨 Error Responses

### 401 Unauthorized
```json
{
  "message": "Authorization header missing or invalid token.",
  "result": null
}
```

### 403 Forbidden
```json
{
  "message": "Token has been revoked. Please login again.",
  "result": null
}
```

### 404 Not Found
```json
{
  "message": "Route not found",
  "result": null
}
```

### 422 Validation Error
```json
{
  "message": "Username dan Password harus berupa string",
  "result": null
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "result": null
}
```

## 🔧 Request Headers

### Required for Protected Endpoints
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Optional Headers
```http
Accept: application/json
User-Agent: YourApp/1.0.0
```

## 📝 Response Format

All API responses follow this consistent format:

```json
{
  "message": "Success|Error message",
  "result": {
    // Response data or null
  }
}
```

## 🚀 Rate Limiting

Currently no rate limiting implemented. For production, consider adding:
- Express rate limit middleware
- Redis-based rate limiting
- Per-user rate limits

## 🔄 Pagination

For list endpoints, use these query parameters:
```
?page=1&limit=10&sort=created_at&order=desc
```

## 🔍 Filtering & Searching

For search endpoints, use these query parameters:
```
?search=keyword&filter=category&status=active
```

---

**Last Updated:** 2025-10-21  
**API Version:** 1.0.0
