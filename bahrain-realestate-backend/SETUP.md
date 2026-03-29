# Project Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd "C:\Users\Dell\Desktop\Bahrain Property Hub\bahrain-realestate-backend"
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bahrain_realestate

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRE=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Setup

```bash
# Generate database migrations
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Or do both at once
pnpm db:push

# (Optional) Open Drizzle Studio to view database
pnpm db:studio
```

### 4. Seed Data (if available)

```bash
pnpm seed
```

### 5. Start Development Server

```bash
# Development mode with hot reload
pnpm dev

# Or build and start production mode
pnpm build
pnpm start
```

The server will be available at `http://localhost:3000`

## Project Structure Overview

### `/src/config`
- **database.ts** - Drizzle ORM database connection
- **cloudinary.ts** - Cloudinary configuration for image uploads
- **jwt.ts** - JWT token generation and verification

### `/src/middleware`
- **auth.ts** - Authentication middleware for protecting routes
- **errorHandler.ts** - Global error handling
- **validation.ts** - Express validator integration

### `/src/routes`
- **auth.routes.ts** - Authentication endpoints (register, login, etc.)
- **admin.routes.ts** - Admin-only endpoints
- **company.routes.ts** - Company-specific endpoints
- **public.routes.ts** - Public endpoints (no authentication required)

### `/src/controllers`
Controllers handle incoming requests and call services

### `/src/services`
Services contain business logic and database operations

### `/src/utils`
- **bcrypt.ts** - Password hashing utilities
- **jwt.ts** - JWT utilities
- **validators.ts** - Input validation rules

### `/src/i18n`
Internationalization files for Arabic and English

### `/src/jobs`
Background jobs (e.g., expiring old advertisements)

## API Documentation

### Authentication Endpoints

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

### Admin Endpoints (requires admin role)

```
GET /api/admin/dashboard
GET /api/admin/companies
PATCH /api/admin/companies/:companyId/status
GET /api/admin/complaints
PATCH /api/admin/complaints/:complaintId
```

### Company Endpoints (requires authentication)

```
GET /api/company/profile
PATCH /api/company/profile
POST /api/company/properties
GET /api/company/properties
PATCH /api/company/properties/:propertyId
DELETE /api/company/properties/:propertyId
```

### Public Endpoints (no authentication required)

```
GET /api/public/properties
GET /api/public/properties/search
GET /api/public/properties/:propertyId
GET /api/public/governorates
GET /api/public/governorates/:governorateId/areas
POST /api/public/complaints
```

## Development Tips

### 1. Using TypeScript
All files use TypeScript for type safety. The `tsconfig.json` is already configured.

### 2. Environment Variables
Never commit `.env` files. Use `.env.example` for documentation.

### 3. Database Migrations
After schema changes:
```bash
pnpm db:generate  # Creates migration file
pnpm db:push      # Applies migrations
```

### 4. Error Handling
The global error handler catches all errors and returns standardized responses:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

### 5. Authentication
- Use `authMiddleware` for general authentication
- Use `companyAuthMiddleware` for company-only endpoints
- Use `adminAuthMiddleware` for admin-only endpoints

JWT tokens are sent in the Authorization header:
```
Authorization: Bearer <token>
```

## Debugging

### 1. Check Logs
The server logs all requests to the console

### 2. Database Issues
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Use `pnpm db:studio` to inspect database

### 3. TypeScript Errors
```bash
npx tsc --noEmit  # Check for type errors without building
```

## Testing

To add tests, install testing libraries:
```bash
pnpm add -D jest @types/jest ts-jest
```

Then create `.test.ts` files next to your code.

## Deployment

### 1. Build for Production
```bash
pnpm build
```

### 2. Set Environment to Production
Update `.env`:
```
NODE_ENV=production
```

### 3. Run Server
```bash
pnpm start
```

### 4. Using PM2 (recommended for production)
```bash
pnpm add -g pm2
pm2 start dist/index.js --name "bahrain-backend"
pm2 save
pm2 startup
```

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or use:
PORT=3001 pnpm dev
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
pnpm store prune
pnpm install
```

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Test connection: `psql DATABASE_URL`

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [JWT Documentation](https://jwt.io/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

## Support

For issues or questions:
1. Check the README.md
2. Review API documentation
3. Check console logs for error messages
4. Verify environment variables are set correctly
