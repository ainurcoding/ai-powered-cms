# 🚀 Production Deployment Guide

## 📋 Prerequisites

- **Server**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **Node.js**: v20.11.1 or higher
- **PostgreSQL**: 14+ or use managed database
- **PM2**: Process manager for Node.js
- **Nginx**: Reverse proxy and load balancer
- **SSL Certificate**: Let's Encrypt or commercial

## 🐳 Docker Deployment (Recommended)

### 1. Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/storage ./storage

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8000

CMD ["node", "dist/index.js"]
```

### 2. Docker Compose for Production

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - APP_SECRET_KEY=${APP_SECRET_KEY}
      - APP_PORT_HTTP=8000
      - DB_HOST_POSTGRES=postgres
      - DB_NAME_POSTGRES=${DB_NAME_POSTGRES}
      - DB_USER_POSTGRES=${DB_USER_POSTGRES}
      - DB_PASS_POSTGRES=${DB_PASS_POSTGRES}
      - DB_PORT_POSTGRES=5432
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${DB_USER_POSTGRES}
      - POSTGRES_PASSWORD=${DB_PASS_POSTGRES}
      - POSTGRES_DB=${DB_NAME_POSTGRES}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 3. Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## 🖥️ Traditional Server Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx
```

### 2. Application Setup

```bash
# Clone repository
git clone <your-repo-url> /var/www/ai-cms
cd /var/www/ai-cms

# Install dependencies
npm install -g pnpm
pnpm install

# Build application
pnpm build

# Setup environment
cp env.example .env
# Edit .env with production values
```

### 3. Database Setup

```bash
# Create database
sudo -u postgres createdb ai_cms_prod

# Run migrations
sudo -u postgres psql -d ai_cms_prod -f database/migrations/002_create_users_table_uuid.sql
```

### 4. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-cms-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ☁️ Cloud Deployment

### AWS EC2 + RDS

```bash
# Launch EC2 instance (t3.medium recommended)
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Setup RDS PostgreSQL
# - Instance: db.t3.micro
# - Engine: PostgreSQL 16
# - Storage: 20GB
# - Security: VPC only

# Deploy application
docker-compose up -d
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: ai-cms-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/ai-cms
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST_POSTGRES
    value: ${db.HOSTNAME}
  - key: DB_PASS_POSTGRES
    value: ${db.PASSWORD}
    type: SECRET

databases:
- name: db
  engine: PG
  version: "16"
```

### Heroku

```bash
# Install Heroku CLI
# Create Heroku app
heroku create ai-cms-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set APP_SECRET_KEY=your-secret-key

# Deploy
git push heroku main
```

## 🔒 Security Checklist

### 1. Environment Security
- [ ] Change default passwords
- [ ] Use strong APP_SECRET_KEY
- [ ] Enable firewall (ufw/iptables)
- [ ] Disable root login
- [ ] Use SSH keys only

### 2. Database Security
- [ ] Enable SSL connections
- [ ] Use strong passwords
- [ ] Restrict database access
- [ ] Regular backups
- [ ] Enable audit logging

### 3. Application Security
- [ ] Enable HTTPS only
- [ ] Set security headers
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection protection

### 4. Server Security
- [ ] Keep system updated
- [ ] Monitor logs
- [ ] Intrusion detection
- [ ] Regular security scans

## 📊 Monitoring & Logging

### 1. Application Monitoring

```javascript
// Add to your application
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

### 2. Log Management

```bash
# Setup log rotation
sudo nano /etc/logrotate.d/ai-cms

# Content:
/var/www/ai-cms/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
}
```

### 3. Health Monitoring

```bash
# Setup health check script
#!/bin/bash
# health-check.sh

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ $response -eq 200 ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed"
    exit 1
fi
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm install -g pnpm && pnpm install
      
    - name: Run tests
      run: pnpm test
      
    - name: Build application
      run: pnpm build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/ai-cms
          git pull origin main
          pnpm install
          pnpm build
          pm2 restart ai-cms-api
```

## 📈 Performance Optimization

### 1. Database Optimization
- [ ] Add database indexes
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Database monitoring

### 2. Application Optimization
- [ ] Enable compression
- [ ] Static file caching
- [ ] API response caching
- [ ] Memory optimization

### 3. Infrastructure Optimization
- [ ] Load balancing
- [ ] CDN setup
- [ ] SSL optimization
- [ ] Monitoring setup

---

**Ready for Production! 🚀**
