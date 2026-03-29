# Project Directory Structure

```
bahrain-realestate-backend/
├── README.md                          # Project documentation
├── SETUP.md                           # Setup and deployment guide
├── PROJECT_SUMMARY.md                 # This project summary
├── package.json                       # Project dependencies
├── pnpm-lock.yaml                     # Dependency lock file
├── tsconfig.json                      # TypeScript configuration
├── drizzle.config.ts                  # Drizzle ORM configuration
│
├── dist/                              # Compiled JavaScript (generated)
│   └── src/
│       └── [compiled files]
│
├── node_modules/                      # Project dependencies (generated)
│
├── drizzle/                           # Database migrations
│   ├── schema.ts                      # Database schema definition
│   ├── meta/
│   │   └── _journal.json
│   └── migrations/
│       ├── 0000_dusty_energizer.sql
│       └── meta/
│           ├── _journal.json
│           └── 0000_snapshot.json
│
├── scripts/                           # Utility scripts
│   └── seed-locations.ts              # Database seeding script
│
└── src/                               # Source code
    ├── app.ts                         # Express app setup
    ├── index.ts                       # Application entry point
    │
    ├── config/                        # Configuration files
    │   ├── database.ts                # Database connection setup
    │   ├── cloudinary.ts              # Image upload service config
    │   └── jwt.ts                     # JWT token utilities
    │
    ├── middleware/                    # Express middleware
    │   ├── auth.ts                    # Authentication middleware
    │   ├── errorHandler.ts            # Global error handling
    │   └── validation.ts              # Request validation
    │
    ├── routes/                        # API routes
    │   ├── auth.routes.ts             # /api/auth routes
    │   ├── admin.routes.ts            # /api/admin routes
    │   ├── company.routes.ts          # /api/company routes
    │   └── public.routes.ts           # /api/public routes
    │
    ├── controllers/                   # Request handlers
    │   ├── auth.controller.ts         # Authentication handlers
    │   ├── admin.controller.ts        # Admin handlers
    │   ├── company.controller.ts      # Company handlers
    │   └── public.controller.ts       # Public handlers
    │
    ├── services/                      # Business logic
    │   ├── auth.service.ts            # Authentication logic
    │   ├── company.service.ts         # Company operations
    │   ├── property.service.ts        # Property management
    │   ├── payment.service.ts         # Payment processing
    │   └── upload.service.ts          # File upload handling
    │
    ├── utils/                         # Utility functions
    │   ├── bcrypt.ts                  # Password hashing
    │   ├── jwt.ts                     # JWT utilities
    │   └── validators.ts              # Input validation rules
    │
    ├── i18n/                          # Internationalization
    │   ├── en.json                    # English translations
    │   └── ar.json                    # Arabic translations
    │
    ├── jobs/                          # Background jobs
    │   └── expireAds.ts               # Ad expiration job
    │
    ├── db/                            # Database
    │   └── schema.ts                  # Database schema
    │
    └── types/                         # TypeScript type definitions
        └── [custom types]
```

## File Descriptions

### Root Files
- **README.md** - Comprehensive project documentation with API endpoints
- **SETUP.md** - Step-by-step setup guide and troubleshooting
- **PROJECT_SUMMARY.md** - Overview of created files and next steps
- **package.json** - Project dependencies and scripts
- **tsconfig.json** - TypeScript compiler configuration
- **drizzle.config.ts** - Database ORM configuration

### Source Code Organization

#### `/src/app.ts`
Main Express application file that:
- Sets up middleware (CORS, JSON parsing, logging)
- Registers all routes
- Configures global error handling
- Implements 404 handler
- Starts the HTTP server

#### `/src/config/`
Centralized configuration files:
- **database.ts** - Drizzle ORM connection with PostgreSQL
- **cloudinary.ts** - Image upload service configuration
- **jwt.ts** - JWT token generation and verification

#### `/src/middleware/`
Express middleware for request processing:
- **auth.ts** - Guards routes with JWT validation
  - `authMiddleware` - General authentication
  - `companyAuthMiddleware` - Company-only routes
  - `adminAuthMiddleware` - Admin-only routes
- **errorHandler.ts** - Catches and formats errors globally
- **validation.ts** - Express validator integration

#### `/src/routes/`
API endpoint definitions:
- **auth.routes.ts** - User authentication endpoints
- **admin.routes.ts** - Admin management endpoints
- **company.routes.ts** - Company profile and property management
- **public.routes.ts** - Public property browsing

#### `/src/controllers/`
Request handlers that process incoming requests and call services:
- **auth.controller.ts** - Login, register, token refresh
- **admin.controller.ts** - Company and complaint management
- **company.controller.ts** - Profile and property operations
- **public.controller.ts** - Property search and information

#### `/src/services/`
Business logic layer that interacts with database:
- **auth.service.ts** - User authentication logic
- **company.service.ts** - Company operations
- **property.service.ts** - Property management
- **payment.service.ts** - Payment processing
- **upload.service.ts** - File upload handling

#### `/src/utils/`
Reusable utility functions:
- **bcrypt.ts** - Password hashing and comparison
- **jwt.ts** - Token utilities
- **validators.ts** - Input validation rules

#### `/src/i18n/`
Multi-language support:
- **en.json** - English text for API responses
- **ar.json** - Arabic text for API responses

#### `/src/jobs/`
Background job workers:
- **expireAds.ts** - Runs periodically to expire old properties

#### `/src/db/`
Database layer:
- **schema.ts** - Defines database tables and relationships

### Database Files

#### `/drizzle/`
Drizzle ORM configuration and migrations:
- **schema.ts** - Table definitions
- **migrations/** - SQL migration files

#### `/scripts/`
Utility scripts:
- **seed-locations.ts** - Populates database with initial data

## Architecture Overview

```
Request Flow:
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────┐
│ Express Server  │
└────────┬────────┘
         │
    ┌────┴────────────────────────────┐
    │ Middleware Chain                │
    │ • CORS, JSON parsing, logging   │
    │ • Authentication (if needed)    │
    │ • Request validation            │
    └────────┬─────────────────────────┘
             │
             ▼
        ┌────────────┐
        │   Routes   │ Route matching
        └──────┬─────┘
               │
               ▼
        ┌──────────────┐
        │ Controllers  │ Request handling
        └───────┬──────┘
                │
                ▼
        ┌──────────────┐
        │  Services    │ Business logic
        └───────┬──────┘
                │
                ▼
         ┌─────────────┐
         │  Database   │ Data persistence
         └─────────────┘
```

## Layer Responsibilities

### Middleware Layer
- Authentication and authorization
- Request validation
- Error handling
- Logging and monitoring

### Routes Layer
- Map HTTP methods and paths
- Define which middleware applies
- Call appropriate controllers

### Controllers Layer
- Extract request data
- Call service layer
- Format responses
- Handle HTTP status codes

### Services Layer
- Business logic implementation
- Database operations
- External service integration
- Data transformation

### Database Layer
- Schema definitions
- Query builders
- Migration management
- Data models

## Development Workflow

1. **Create Route** in `/routes`
2. **Create Handler** in `/controllers`
3. **Create Logic** in `/services`
4. **Access Database** via database layer
5. **Handle Errors** with global error handler
6. **Test Endpoint** using API client

## Scaling Guidelines

As the project grows:

1. **Add Features** → Create new service files
2. **Add Endpoints** → Create new route files
3. **Add Models** → Update database schema
4. **Add Logic** → Expand service layer
5. **Add Tests** → Create `.test.ts` files
6. **Add Background Jobs** → Add to `/jobs`

---

This structure supports clean architecture and separation of concerns while keeping the codebase organized and maintainable.
