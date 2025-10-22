# 🔐 Authorization & Permissions

Complete guide untuk Role-Based Access Control (RBAC) di AI-CMS.

---

## 🎭 User Roles

### 1. **ADMIN** (Administrator)
- Full access to all resources
- Can manage all posts (any author)
- Can manage categories and tags
- Can manage users (future)

### 2. **EDITOR**
- Can manage own posts
- Can create, update, delete own content
- Limited admin capabilities (future: category management)

### 3. **USER** (Regular User)
- Can create posts
- Can only manage own posts
- Read-only access to others' content

---

## 📋 Posts Permissions Matrix

| Action | Endpoint | ADMIN | EDITOR | USER | Public |
|--------|----------|-------|--------|------|--------|
| **List Posts** | GET /posts | ✅ All | ✅ All | ✅ All | ✅ Published only |
| **View Post** | GET /posts/:id | ✅ All | ✅ All | ✅ All | ✅ Published only |
| **Create Post** | POST /posts | ✅ | ✅ | ✅ | ❌ |
| **Update Post** | PUT /posts/:id | ✅ Any post | ✅ Own posts | ✅ Own posts | ❌ |
| **Delete Post** | DELETE /posts/:id | ✅ Any post | ✅ Own posts | ✅ Own posts | ❌ |
| **Update Status** | PATCH /posts/:id/status | ✅ Any post | ✅ Own posts | ✅ Own posts | ❌ |

---

## 🔒 Authorization Logic

### **Ownership Check:**
```typescript
// User can only modify their own posts
if (post.author_id !== userId) {
    throw new ForbiddenException('...');
}
```

### **Admin Override:**
```typescript
// ADMIN can modify any post
if (post.author_id !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenException('...');
}
```

---

## 🧪 Testing Authorization

### **Scenario 1: User tries to delete own post** ✅
```
User: johndoe (USER role)
Post Author: johndoe
Result: SUCCESS - User owns the post
```

### **Scenario 2: User tries to delete another user's post** ❌
```
User: johndoe (USER role)
Post Author: admin
Result: 403 Forbidden
Message: "You do not have permission to delete this post..."
```

### **Scenario 3: Admin deletes any post** ✅
```
User: admin (ADMIN role)
Post Author: johndoe
Result: SUCCESS - Admin has override permission
```

### **Scenario 4: Editor updates own post** ✅
```
User: janeeditor (EDITOR role)
Post Author: janeeditor
Result: SUCCESS - Owner can update
```

---

## 🚫 Error Responses

### **403 Forbidden (Update)**
```json
{
  "message": "You do not have permission to update this post",
  "result": null
}
```

### **403 Forbidden (Delete)**
```json
{
  "message": "You do not have permission to delete this post. Only the post author or administrators can delete posts.",
  "result": null
}
```

### **403 Forbidden (Status Update)**
```json
{
  "message": "You do not have permission to update this post status",
  "result": null
}
```

---

## 🔧 Implementation Details

### **Protected Endpoints:**

#### **PUT /posts/:id**
```typescript
// Get current user
const userId = req.userId;
const userRole = req.userData?.role;

// Check ownership or admin
if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenException('You do not have permission to update this post');
}
```

#### **DELETE /posts/:id**
```typescript
// Authorization check
if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenException('You do not have permission to delete this post...');
}
```

#### **PATCH /posts/:id/status**
```typescript
// Status update authorization
if (existingPost.author_id !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenException('You do not have permission to update this post status');
}
```

---

## 📊 Role Hierarchy

```
┌─────────────────────────┐
│       ADMIN             │  Full access to everything
│  (Administrator)        │  Override all permissions
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│       EDITOR            │  Manage own content
│  (Content Editor)       │  Limited admin features
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│        USER             │  Basic user
│  (Regular User)         │  Own content only
└─────────────────────────┘
```

---

## 🎯 Best Practices

### ✅ DO:
1. **Always check ownership** before modification
2. **Allow admin override** for management purposes
3. **Return clear error messages** for authorization failures
4. **Log authorization attempts** (security audit)
5. **Use role-based checks** consistently

### ❌ DON'T:
1. **Don't trust client-side role checks** - always verify on server
2. **Don't expose sensitive data** in error messages
3. **Don't allow privilege escalation** - users can't change their own role
4. **Don't skip authorization** for "trusted" users

---

## 🔐 Security Considerations

### **JWT Token Claims:**
```typescript
{
  id: "user-uuid",
  name: "User Name",
  username: "username",
  role: "ADMIN" // Trust this from token, verify from DB
}
```

### **Database Verification:**
```typescript
// Always fetch from database to verify current status
const user = await postgresConnection.queryOne(
    'SELECT id, name, username, role FROM users WHERE id = $1 AND is_active = true',
    [decode.id]
);
```

### **Token Blacklist:**
- Revoked tokens are checked before authorization
- Logged out users cannot access protected resources

---

## 📝 Future Enhancements

### **Category-Based Permissions (Planned):**
```
- EDITOR can manage posts in assigned categories
- Category owners can moderate content
- Hierarchical category permissions
```

### **Content Moderation (Planned):**
```
- Moderator role for content review
- Approval workflow for published content
- Report system for inappropriate content
```

### **Advanced RBAC (Planned):**
```
- Custom role creation
- Fine-grained permissions
- Permission groups
- Role inheritance
```

---

## 🧪 Testing Checklist

### **Manual Testing:**
- [ ] Admin can delete any post
- [ ] User can delete own post
- [ ] User CANNOT delete others' posts
- [ ] Same for UPDATE operations
- [ ] Same for STATUS updates
- [ ] Proper error messages returned

### **Automated Tests (Future):**
```typescript
describe('Posts Authorization', () => {
  it('should allow admin to delete any post')
  it('should allow user to delete own post')
  it('should prevent user from deleting others posts')
  it('should return 403 for unauthorized actions')
})
```

---

## 📚 Related Documentation

- **Authentication:** See `src/app/http/auth/`
- **Middleware:** See `src/libs/middlewares/authorization.middleware.ts`
- **Exceptions:** See `src/libs/core/exceptions.ts`
- **User Roles:** See database migration `002_create_users_table_uuid.sql`

---

## 🎓 Examples

### **Example 1: Testing with Different Users**

```bash
# Login as admin
curl -X POST http://localhost:8000/auth/login \
  -d '{"username":"admin","password":"password123"}'

# Admin can delete any post
curl -X DELETE http://localhost:8000/posts/{any-post-id} \
  -H "Authorization: Bearer {admin-token}"
# Result: SUCCESS

# Login as regular user
curl -X POST http://localhost:8000/auth/login \
  -d '{"username":"johndoe","password":"password123"}'

# User tries to delete admin's post
curl -X DELETE http://localhost:8000/posts/{admin-post-id} \
  -H "Authorization: Bearer {user-token}"
# Result: 403 Forbidden
```

---

**Last Updated:** 22 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ Implemented & Active

