# 🤝 Contributing Guidelines

## 📋 Getting Started

### Prerequisites
- Node.js v20.11.1+
- pnpm package manager
- PostgreSQL 14+
- Git

### Development Setup

```bash
# 1. Fork and clone repository
git clone https://github.com/your-username/ai-cms-boilerplate.git
cd ai-cms-boilerplate

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp env.example .env
# Edit .env with your configuration

# 4. Setup database
podman exec -it postgres_16 psql -U postgres -c "CREATE DATABASE ai_cms_dev;"
podman exec -i postgres_16 psql -U postgres -d ai_cms_dev < database/migrations/002_create_users_table_uuid.sql

# 5. Start development server
pnpm dev
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── http/                   # REST API Layer
│   │   ├── auth/              # Authentication module
│   │   ├── health/            # Health check module
│   │   └── home/              # Home module
│   └── ws/                    # WebSocket Layer
├── libs/
│   ├── core/                  # Core utilities
│   ├── config/                # Configuration
│   ├── helpers/               # Helper functions
│   ├── middlewares/           # Express middlewares
│   └── types/                 # TypeScript definitions
└── index.ts                   # Application entry point
```

## 📝 Code Style Guidelines

### 1. TypeScript Standards

```typescript
// ✅ Good: Explicit types
interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'EDITOR';
}

// ✅ Good: Function signatures
const createUser = async (userData: CreateUserRequest): Promise<UserResponse> => {
  // Implementation
};

// ❌ Bad: Any types
const createUser = async (userData: any): Promise<any> => {
  // Implementation
};
```

### 2. Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const user = await findUserById(id);
  if (!user) {
    throw new InvalidParameterException('User not found');
  }
  return user;
} catch (error) {
  logger.error('Error finding user:', error);
  throw error;
}

// ❌ Bad: Generic error handling
try {
  const user = await findUserById(id);
  return user;
} catch (error) {
  throw new Error('Something went wrong');
}
```

### 3. API Documentation

```typescript
/**
 * POST /users
 * @tags Users
 * @summary Create new user
 * @description Create a new user with the provided information
 *
 * @typedef {object} CreateUserRequest
 * @property {string} name.required - User's full name
 * @property {string} email.required - User's email address
 * @property {string} password.required - User's password
 *
 * @param {CreateUserRequest} request.body.required - User data
 *
 * @return {object} 201 - User created successfully
 * @return {object} 400 - Bad request
 * @return {object} 409 - User already exists
 */
router.post('/users', requestHandler(controller.createUser));
```

## 🧪 Testing Guidelines

### 1. Unit Tests

```typescript
// tests/auth/auth.controller.spec.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import authController from '@/app/http/auth/auth.controller';

describe('Auth Controller', () => {
  beforeEach(() => {
    // Setup test data
  });

  it('should login with valid credentials', async () => {
    const mockReq = {
      body: {
        username: 'admin',
        password: 'password123'
      }
    };

    const result = await authController.login(mockReq);
    
    expect(result).toHaveProperty('result.user');
    expect(result.result.user.username).toBe('admin');
  });

  it('should reject invalid credentials', async () => {
    const mockReq = {
      body: {
        username: 'admin',
        password: 'wrongpassword'
      }
    };

    await expect(authController.login(mockReq))
      .rejects.toThrow('Username atau password salah');
  });
});
```

### 2. Integration Tests

```typescript
// tests/integration/auth.integration.spec.ts
import request from 'supertest';
import app from '@/app/http';

describe('Auth Integration', () => {
  it('should login and get token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toHaveProperty('token');
  });
});
```

### 3. Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test auth.controller.spec.ts

# Watch mode
pnpm test -- --watch
```

## 🔧 Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/user-management

# 2. Make changes
# - Add new files
# - Update existing files
# - Add tests

# 3. Commit changes
git add .
git commit -m "feat: add user management endpoints"

# 4. Push branch
git push origin feature/user-management

# 5. Create Pull Request
```

### 2. Bug Fixes

```bash
# 1. Create bugfix branch
git checkout -b bugfix/fix-login-validation

# 2. Fix the issue
# - Identify root cause
# - Implement fix
# - Add test case

# 3. Commit fix
git commit -m "fix: resolve login validation issue"

# 4. Push and create PR
```

### 3. Code Review Process

```markdown
## Pull Request Template

### Description
Brief description of changes

### Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

### Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
```

## 📚 Documentation Standards

### 1. Code Comments

```typescript
/**
 * Authenticates user and returns JWT token
 * @param username - User's username
 * @param password - User's password (will be hashed)
 * @returns Promise with user data and JWT token
 * @throws InvalidParameterException if credentials are invalid
 */
const login = async (username: string, password: string) => {
  // Implementation
};
```

### 2. README Updates

When adding new features:
- Update API endpoints list
- Add new environment variables
- Update setup instructions
- Add new dependencies

### 3. Changelog

```markdown
# Changelog

## [1.1.0] - 2025-10-21

### Added
- User management endpoints
- Role-based permissions
- Password reset functionality

### Changed
- Updated authentication flow
- Improved error messages

### Fixed
- Login validation issue
- Token expiration handling
```

## 🚀 Release Process

### 1. Version Bumping

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### 2. Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Tagged release
- [ ] Deployed to staging
- [ ] Deployed to production

## 🐛 Bug Reports

### Bug Report Template

```markdown
## Bug Report

### Description
Clear description of the bug

### Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior
What you expected to happen

### Actual Behavior
What actually happened

### Environment
- OS: [e.g. Windows 10]
- Node.js: [e.g. v20.11.1]
- Browser: [e.g. Chrome 95]

### Additional Context
Any other context about the problem
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Request

### Is your feature request related to a problem?
A clear description of what the problem is

### Describe the solution you'd like
A clear description of what you want to happen

### Describe alternatives you've considered
A clear description of any alternative solutions

### Additional context
Add any other context or screenshots
```

## 📞 Getting Help

- **Documentation**: Check README.md and other .md files
- **Issues**: Create GitHub issue for bugs/features
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: All PRs require review before merge

## 🎯 Contribution Ideas

### Good First Issues
- Add new API endpoints
- Improve error messages
- Add more test coverage
- Update documentation
- Performance optimizations

### Advanced Contributions
- Add Redis integration
- Implement caching
- Add monitoring/metrics
- Security improvements
- Database optimizations

---

**Thank you for contributing! 🚀**
