# 🔒 Security Guidelines

## 🛡️ Security Overview

This document outlines security best practices for the AI-Powered CMS Backend boilerplate.

## 🔐 Authentication & Authorization

### JWT Security

```typescript
// ✅ Good: Strong secret key
const APP_SECRET_KEY = process.env.APP_SECRET_KEY || 'your-256-bit-secret';

// ✅ Good: Token expiration
const token = jwt.sign(payload, APP_SECRET_KEY, { expiresIn: '7d' });

// ✅ Good: Token blacklist
if (tokenBlacklist.isBlacklisted(token)) {
  throw new UnauthorizedException('Token revoked');
}
```

### Password Security

```typescript
// ✅ Good: Bcrypt with salt rounds
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// ✅ Good: Password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  throw new ValidationException('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
}
```

## 🚫 Input Validation

### Request Validation

```typescript
// ✅ Good: Strict validation
const loginValidation = object({
  username: string([minLength(3), maxLength(50)]),
  password: string([minLength(8), maxLength(100)])
});

// ✅ Good: SQL injection prevention
const user = await postgresConnection.queryOne(
  'SELECT * FROM users WHERE username = $1',
  [username] // Parameterized query
);
```

### XSS Prevention

```typescript
// ✅ Good: Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

// ✅ Good: Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 🔒 Environment Security

### Environment Variables

```bash
# ✅ Good: Strong secrets
APP_SECRET_KEY=your-256-bit-random-secret-key-here
DB_PASS_POSTGRES=strong-database-password-123

# ❌ Bad: Weak secrets
APP_SECRET_KEY=secret
DB_PASS_POSTGRES=password
```

### Production Environment

```typescript
// ✅ Good: Environment validation
const requiredEnvVars = [
  'APP_SECRET_KEY',
  'DB_HOST_POSTGRES',
  'DB_NAME_POSTGRES',
  'DB_USER_POSTGRES',
  'DB_PASS_POSTGRES'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## 🛡️ Database Security

### Connection Security

```typescript
// ✅ Good: SSL connection
const postgresConfig = {
  host: process.env.DB_HOST_POSTGRES,
  port: Number(process.env.DB_PORT_POSTGRES),
  database: process.env.DB_NAME_POSTGRES,
  user: process.env.DB_USER_POSTGRES,
  password: process.env.DB_PASS_POSTGRES,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};
```

### Query Security

```typescript
// ✅ Good: Parameterized queries
const getUserById = async (id: string) => {
  return await postgresConnection.queryOne(
    'SELECT id, name, email, role FROM users WHERE id = $1',
    [id]
  );
};

// ❌ Bad: String concatenation (SQL injection risk)
const getUserById = async (id: string) => {
  return await postgresConnection.query(
    `SELECT * FROM users WHERE id = '${id}'`
  );
};
```

## 🔐 API Security

### Rate Limiting

```typescript
// ✅ Good: Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/auth', limiter);
```

### CORS Configuration

```typescript
// ✅ Good: Restrictive CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Security Headers

```typescript
// ✅ Good: Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🔍 Logging & Monitoring

### Security Logging

```typescript
// ✅ Good: Security event logging
const logSecurityEvent = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

// Log failed login attempts
if (!isPasswordValid) {
  logSecurityEvent('FAILED_LOGIN', { username });
  throw new InvalidParameterException('Username atau password salah');
}
```

### Audit Trail

```typescript
// ✅ Good: User action logging
const logUserAction = async (userId: string, action: string, details: any) => {
  await postgresConnection.query(
    'INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, $4)',
    [userId, action, JSON.stringify(details), new Date()]
  );
};
```

## 🚨 Security Checklist

### Development Security

- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **SQL Injection**: Parameterized queries only
- [ ] **XSS Prevention**: Output encoding and CSP headers
- [ ] **Authentication**: Strong password requirements
- [ ] **Authorization**: Role-based access control
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Logging**: Security events logged
- [ ] **Dependencies**: Regular security updates

### Production Security

- [ ] **HTTPS Only**: All traffic encrypted
- [ ] **Strong Secrets**: Complex, random secrets
- [ ] **Database Security**: SSL connections, strong passwords
- [ ] **Rate Limiting**: API rate limits implemented
- [ ] **Monitoring**: Security monitoring and alerting
- [ ] **Backups**: Encrypted, regular backups
- [ ] **Updates**: Regular security patches
- [ ] **Access Control**: Limited server access

## 🔧 Security Tools

### Dependency Scanning

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Use Snyk for advanced scanning
npx snyk test
npx snyk monitor
```

### Code Security Scanning

```bash
# ESLint security rules
npm install --save-dev eslint-plugin-security

# Add to .eslintrc.js
{
  "extends": ["plugin:security/recommended"]
}
```

### Database Security

```sql
-- Enable audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Create audit table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 Incident Response

### Security Incident Checklist

1. **Immediate Response**
   - [ ] Identify scope of incident
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Notify stakeholders

2. **Investigation**
   - [ ] Analyze logs
   - [ ] Identify attack vector
   - [ ] Assess damage
   - [ ] Document findings

3. **Recovery**
   - [ ] Patch vulnerabilities
   - [ ] Reset compromised credentials
   - [ ] Restore from clean backups
   - [ ] Monitor for reoccurrence

4. **Post-Incident**
   - [ ] Update security measures
   - [ ] Review and update procedures
   - [ ] Conduct security audit
   - [ ] Document lessons learned

## 📞 Security Contacts

- **Security Issues**: Create private security issue
- **Vulnerability Reports**: security@yourcompany.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

## 🔄 Security Updates

### Regular Security Tasks

- [ ] **Weekly**: Review security logs
- [ ] **Monthly**: Update dependencies
- [ ] **Quarterly**: Security audit
- [ ] **Annually**: Penetration testing

### Security Monitoring

```typescript
// Example security monitoring
const monitorSecurity = () => {
  // Monitor failed login attempts
  const failedLogins = await getFailedLoginCount();
  if (failedLogins > 10) {
    alert('High number of failed login attempts detected');
  }

  // Monitor unusual activity
  const unusualActivity = await detectUnusualActivity();
  if (unusualActivity) {
    alert('Unusual activity detected');
  }
};
```

---

**Security is everyone's responsibility! 🛡️**

Remember: Security is not a one-time setup but an ongoing process. Regular reviews and updates are essential for maintaining a secure application.
