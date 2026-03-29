# Quick Reference Card

## 🚀 Getting Started (5 minutes)

```bash
# 1. Navigate to project
cd "C:\Users\Dell\Desktop\Bahrain Property Hub\bahrain-realestate-backend"

# 2. Create .env file
# Add your database and API credentials

# 3. Run migrations
pnpm db:push

# 4. Start development
pnpm dev

# 5. Server running!
# http://localhost:3000
```

---

## 📂 Key Files Location

| Purpose | File Path |
|---------|-----------|
| Main App | `src/app.ts` |
| Entry Point | `src/index.ts` |
| Database Config | `src/config/database.ts` |
| JWT Config | `src/config/jwt.ts` |
| Auth Routes | `src/routes/auth.routes.ts` |
| Company Routes | `src/routes/company.routes.ts` |
| Admin Routes | `src/routes/admin.routes.ts` |
| Public Routes | `src/routes/public.routes.ts` |
| Auth Service | `src/services/auth.service.ts` |
| Company Service | `src/services/company.service.ts` |
| Property Service | `src/services/property.service.ts` |
| Upload Service | `src/services/upload.service.ts` |

---

## 📋 API Base Endpoints

```
Base URL: http://localhost:3000/api

/auth          → Authentication
/admin         → Admin operations
/company       → Company management
/public        → Public browsing
```

---

## 🔐 Authentication

### Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Use Token
```bash
curl -X GET http://localhost:3000/api/company/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🛠️ Common Commands

```bash
# Development
pnpm dev                    # Start server with hot reload
pnpm build                  # Compile TypeScript
pnpm start                  # Run compiled server

# Database
pnpm db:generate           # Create migrations
pnpm db:push               # Apply migrations
pnpm db:studio             # View database UI

# Data
pnpm seed                  # Seed initial data
```

---

## 📁 File Structure Overview

```
src/
├── app.ts              ← Main application
├── config/             ← Configuration
├── middleware/         ← Request processors
├── routes/             ← API endpoints
├── controllers/        ← Request handlers
├── services/           ← Business logic
├── utils/              ← Helper functions
├── i18n/               ← Translations
└── jobs/               ← Background tasks
```

---

## 🔄 Request Flow

```
Client Request
    ↓
Express Middleware (CORS, JSON, Auth)
    ↓
Route Matching
    ↓
Controller (Extract data)
    ↓
Service (Business logic)
    ↓
Database
    ↓
Response
```

---

## 🚨 Error Response Format

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

---

## ✅ Success Response Format

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

---

## 🔑 Middleware Explanation

| Middleware | Purpose | Location |
|-----------|---------|----------|
| `authMiddleware` | Verify JWT token | `src/middleware/auth.ts` |
| `companyAuthMiddleware` | Check if company role | `src/middleware/auth.ts` |
| `adminAuthMiddleware` | Check if admin role | `src/middleware/auth.ts` |
| `errorHandler` | Catch errors | `src/middleware/errorHandler.ts` |
| `validateRequest` | Validate inputs | `src/middleware/validation.ts` |

---

## 📝 Environment Variables

```env
PORT=3000                      # Server port
NODE_ENV=development           # Environment
DATABASE_URL=postgresql://... # Database
JWT_SECRET=your-secret         # JWT secret
JWT_EXPIRE=7d                  # Token expiry
CLOUDINARY_CLOUD_NAME=...     # Image service
CLOUDINARY_API_KEY=...        # Image API key
CLOUDINARY_API_SECRET=...     # Image API secret
```

---

## 🎯 Implementation Priority

1. **Authentication** (Week 1)
   - User login/registration
   - Token management

2. **Core Features** (Week 2-3)
   - Properties CRUD
   - Company profile

3. **Search & Filter** (Week 4)
   - Advanced search
   - Filtering

4. **Admin Features** (Week 5)
   - Dashboard
   - Management

5. **Testing** (Week 6)
   - Tests
   - Optimization

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `SETUP.md` | Installation guide |
| `API_ENDPOINTS.md` | API reference |
| `DIRECTORY_STRUCTURE.md` | File organization |
| `IMPLEMENTATION_CHECKLIST.md` | Todo list |
| `PROJECT_SUMMARY.md` | What was created |
| `QUICK_REFERENCE.md` | This file! |

---

## 🐛 Debugging Checklist

- [ ] Check server logs in terminal
- [ ] Verify `.env` file exists and is correct
- [ ] Check database connection: `pnpm db:studio`
- [ ] Verify token format in Authorization header
- [ ] Check request payload format
- [ ] Verify TypeScript errors: `npx tsc --noEmit`

---

## 🔗 Important Links

- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Database UI**: http://localhost:3000 (after `pnpm db:studio`)
- **Postman**: Import requests from `API_ENDPOINTS.md`

---

## 💾 Database Schema Files

- **Definitions**: `src/db/schema.ts`
- **Migrations**: `drizzle/migrations/`
- **Config**: `drizzle.config.ts`

---

## 🔑 Key Exports

### From `src/middleware/auth.ts`
```typescript
export { authMiddleware, companyAuthMiddleware, adminAuthMiddleware, AuthRequest }
```

### From `src/config/jwt.ts`
```typescript
export { generateToken, verifyToken, decodeToken }
```

### From `src/utils/bcrypt.ts`
```typescript
export { hashPassword, comparePassword, generateRandomPassword }
```

---

## 🎨 Code Style

- **Language**: TypeScript (strict mode)
- **Naming**: camelCase for variables, PascalCase for classes
- **Async**: Always use async/await
- **Errors**: Use AppError class for consistency
- **Types**: Define types in service/controller files

---

## ⚡ Performance Tips

1. **Use pagination** for large datasets
2. **Cache common queries** in memory
3. **Index database** columns used in WHERE clauses
4. **Compress responses** with gzip
5. **Use CDN** for images
6. **Implement rate limiting** on public endpoints
7. **Monitor query performance** with logs

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Hash passwords with bcrypt
- [ ] Use JWT for authentication
- [ ] Enable CORS properly
- [ ] Add security headers
- [ ] Implement request logging
- [ ] Keep dependencies updated

---

## 📞 Support

If you get stuck:
1. Check relevant documentation file
2. Look at error message carefully
3. Check console logs: `pnpm dev`
4. Verify `.env` configuration
5. Check database connection
6. Review similar working code

---

## 🎓 Learning Resources

- [Express.js Tutorial](https://expressjs.com/en/starter/basic-routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT Basics](https://jwt.io/introduction)
- [REST API Design](https://restfulapi.net/)
- [PostgreSQL Basics](https://www.postgresql.org/docs/current/tutorial.html)

---

**Happy Coding! 🚀**

*Last Updated: December 1, 2025*
