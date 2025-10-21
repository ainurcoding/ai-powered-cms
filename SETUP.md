# 🚀 Setup Instructions - AI-Powered CMS Backend

## 📋 Prerequisites

- **Node.js** v20.11.1 atau lebih tinggi
- **pnpm** package manager (`npm install -g pnpm`)
- **Podman** atau **Docker** untuk PostgreSQL
- **Git** untuk version control

## 🗄️ Database Setup

### 1. Start PostgreSQL Container

```bash
# Start PostgreSQL container
podman run -d \
  --name postgres_16 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Create Database

```bash
# Create ai_cms_db database
podman exec -it postgres_16 psql -U postgres -c "CREATE DATABASE ai_cms_db;"
```

### 3. Run Migrations

```bash
# Run UUID users table migration
podman exec -i postgres_16 psql -U postgres -d ai_cms_db < database/migrations/002_create_users_table_uuid.sql
```

### 4. Verify Database

```bash
# Check tables
podman exec -it postgres_16 psql -U postgres -d ai_cms_db -c "\dt"

# Check users data
podman exec -it postgres_16 psql -U postgres -d ai_cms_db -c "SELECT id, name, username, email, role FROM users;"
```

## 🔧 Environment Setup

### 1. Copy Environment Template

```bash
cp env.example .env
```

### 2. Edit .env File

```env
# Application Configuration
APP_PORT_HTTP=8000
NODE_ENV=development
APP_SECRET_KEY=ainur_ai_cms
APP_EXPOSE_DOCS=true

# Database PostgreSQL Configuration
DB_HOST_POSTGRES=localhost
DB_NAME_POSTGRES=ai_cms_db
DB_USER_POSTGRES=postgres
DB_PASS_POSTGRES=postgres
DB_PORT_POSTGRES=5432
```

## 📦 Project Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Verify Setup

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test Swagger documentation
# Open: http://localhost:8000/docs
```

## 🧪 Test Authentication

### 1. Login Test

```bash
# Test login endpoint
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### 2. Expected Response

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

## 👥 Default Users

| Username | Password | Role | Email |
|----------|----------|------|-------|
| `admin` | `password123` | ADMIN | admin@example.com |
| `johndoe` | `password123` | USER | john@example.com |
| `janeeditor` | `password123` | EDITOR | jane@example.com |

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Kill all Node.js processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Or change port in .env
APP_PORT_HTTP=8001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
podman ps | grep postgres

# Check database exists
podman exec -it postgres_16 psql -U postgres -c "\l"

# Test connection
podman exec -it postgres_16 psql -U postgres -d ai_cms_db -c "SELECT 1;"
```

### Environment Variables Not Loading

```bash
# Check .env file exists
ls -la .env

# Check environment variables
echo $DB_HOST_POSTGRES
echo $DB_NAME_POSTGRES
```

## 🐳 Docker Alternative

If you prefer Docker over Podman:

```bash
# Replace 'podman' with 'docker' in all commands above
docker run -d --name postgres_16 ...
docker exec -it postgres_16 psql ...
```

## 📚 Next Steps

After successful setup:

1. **Explore API Documentation**: `http://localhost:8000/docs`
2. **Test Authentication**: Login with default users
3. **Create New Modules**: Follow the module creation guide in README.md
4. **Add New Users**: Implement user registration endpoint
5. **Deploy to Production**: Use Docker or cloud services

## 🆘 Support

If you encounter issues:

1. Check the logs in terminal
2. Verify database connection
3. Ensure all environment variables are set
4. Check if ports are available
5. Verify PostgreSQL container is running

---

**Happy Coding! 🚀**
