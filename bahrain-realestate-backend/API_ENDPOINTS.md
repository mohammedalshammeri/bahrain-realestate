# API Endpoints Reference & Testing Guide

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints (except public ones) require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response: 200 OK
{
  "message": "Account created successfully",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logout successful"
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

{
  "token": "your_expired_token"
}

Response: 200 OK
{
  "newToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🏢 Admin Endpoints

### Get Dashboard
```
GET /admin/dashboard
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "totalCompanies": 25,
  "activeProperties": 150,
  "totalComplaints": 12,
  "statistics": { ... }
}
```

### Get All Companies
```
GET /admin/companies
Authorization: Bearer <admin_token>
Query Params:
  ?page=1&limit=20&status=pending

Response: 200 OK
{
  "companies": [
    {
      "id": 1,
      "name": "Real Estate Co",
      "email": "contact@realestate.com",
      "status": "verified",
      "createdAt": "2025-01-15"
    }
  ],
  "total": 25,
  "pages": 2
}
```

### Update Company Status
```
PATCH /admin/companies/:companyId/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "verified"
}

Response: 200 OK
{
  "message": "Company status updated",
  "company": { ... }
}
```

### Get All Complaints
```
GET /admin/complaints
Authorization: Bearer <admin_token>
Query Params:
  ?page=1&limit=20&status=open

Response: 200 OK
{
  "complaints": [
    {
      "id": 1,
      "title": "Misleading listing",
      "description": "Property details don't match",
      "status": "open",
      "createdAt": "2025-01-18"
    }
  ],
  "total": 12
}
```

### Update Complaint
```
PATCH /admin/complaints/:complaintId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "resolved",
  "notes": "Issue resolved with company"
}

Response: 200 OK
{
  "message": "Complaint updated",
  "complaint": { ... }
}
```

---

## 🏪 Company Endpoints

### Get Company Profile
```
GET /company/profile
Authorization: Bearer <company_token>

Response: 200 OK
{
  "id": 1,
  "name": "Al-Khaleej Properties",
  "email": "contact@alkhalej.com",
  "phone": "+973-33-123456",
  "address": "Manama, Bahrain",
  "license": "BH-001234",
  "website": "www.alkhalej.com",
  "description": "Leading real estate company in Bahrain"
}
```

### Update Company Profile
```
PATCH /company/profile
Authorization: Bearer <company_token>
Content-Type: application/json

{
  "phone": "+973-33-654321",
  "address": "Seef, Bahrain",
  "description": "Updated description"
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "company": { ... }
}
```

### Create Property
```
POST /company/properties
Authorization: Bearer <company_token>
Content-Type: application/json

{
  "title": "Luxury Villa in Manama",
  "description": "Beautiful villa with garden",
  "type": "villa",
  "price": 450000,
  "area": 350,
  "bedrooms": 4,
  "bathrooms": 3,
  "governorate_id": 1,
  "area_id": 5,
  "features": ["Garden", "Pool", "Parking"],
  "contact": "+973-33-123456"
}

Response: 201 Created
{
  "message": "Property created successfully",
  "property": {
    "id": 101,
    "title": "Luxury Villa in Manama",
    "slug": "luxury-villa-in-manama",
    "status": "active",
    "createdAt": "2025-01-20"
  }
}
```

### Get Company Properties
```
GET /company/properties
Authorization: Bearer <company_token>
Query Params:
  ?page=1&limit=10&status=active

Response: 200 OK
{
  "properties": [
    {
      "id": 101,
      "title": "Luxury Villa in Manama",
      "type": "villa",
      "price": 450000,
      "area": 350,
      "status": "active",
      "views": 245,
      "createdAt": "2025-01-20"
    }
  ],
  "total": 12,
  "pages": 2
}
```

### Update Property
```
PATCH /company/properties/:propertyId
Authorization: Bearer <company_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 475000,
  "description": "Updated description"
}

Response: 200 OK
{
  "message": "Property updated successfully",
  "property": { ... }
}
```

### Delete Property
```
DELETE /company/properties/:propertyId
Authorization: Bearer <company_token>

Response: 200 OK
{
  "message": "Property deleted successfully"
}
```

---

## 🌍 Public Endpoints

### Get All Properties
```
GET /public/properties
Query Params:
  ?page=1&limit=20&sort=newest

Response: 200 OK
{
  "properties": [
    {
      "id": 101,
      "title": "Luxury Villa in Manama",
      "type": "villa",
      "price": 450000,
      "area": 350,
      "governorate": "Manama",
      "images": ["url1", "url2"],
      "company": {
        "id": 1,
        "name": "Al-Khaleej Properties"
      },
      "createdAt": "2025-01-20"
    }
  ],
  "total": 1245,
  "pages": 63
}
```

### Search Properties
```
GET /public/properties/search
Query Params:
  ?governorate_id=1
  &area_id=5
  &type=villa
  &minPrice=300000
  &maxPrice=600000
  &bedrooms=4
  &page=1

Response: 200 OK
{
  "properties": [ ... ],
  "total": 45,
  "filters": {
    "governorate": "Manama",
    "type": "villa",
    "priceRange": [300000, 600000]
  }
}
```

### Get Property Details
```
GET /public/properties/:propertyId

Response: 200 OK
{
  "id": 101,
  "title": "Luxury Villa in Manama",
  "description": "Beautiful villa with garden",
  "type": "villa",
  "price": 450000,
  "area": 350,
  "bedrooms": 4,
  "bathrooms": 3,
  "features": ["Garden", "Pool", "Parking"],
  "images": [
    {
      "id": 1,
      "url": "https://cloudinary.com/...",
      "alt": "Front view"
    }
  ],
  "company": {
    "id": 1,
    "name": "Al-Khaleej Properties",
    "email": "contact@alkhalej.com",
    "phone": "+973-33-123456"
  },
  "views": 245,
  "createdAt": "2025-01-20"
}
```

### Get All Governorates
```
GET /public/governorates

Response: 200 OK
{
  "governorates": [
    {
      "id": 1,
      "name": "Manama",
      "nameAr": "المنامة",
      "code": "13"
    },
    {
      "id": 2,
      "name": "Muharraq",
      "nameAr": "المحرق",
      "code": "15"
    }
  ]
}
```

### Get Areas for Governorate
```
GET /public/governorates/:governorateId/areas

Response: 200 OK
{
  "governorate": "Manama",
  "areas": [
    {
      "id": 1,
      "name": "Manama Downtown",
      "nameAr": "وسط المدينة",
      "code": "1301"
    },
    {
      "id": 5,
      "name": "Seef",
      "nameAr": "السيف",
      "code": "1302"
    }
  ]
}
```

### Submit Complaint
```
POST /public/complaints
Content-Type: application/json

{
  "property_id": 101,
  "title": "Misleading listing",
  "description": "The property photos are not accurate",
  "contact_email": "complaint@example.com",
  "contact_phone": "+973-33-999999"
}

Response: 201 Created
{
  "message": "Complaint submitted successfully",
  "complaint": {
    "id": 1,
    "reference": "COMP-20250120-001",
    "status": "pending",
    "createdAt": "2025-01-20T14:30:00Z"
  }
}
```

---

## Testing with cURL

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:3000/api/company/profile \
  -H "Authorization: Bearer your_jwt_token"
```

### Test Property Search
```bash
curl -X GET "http://localhost:3000/api/public/properties/search?governorate_id=1&type=villa" \
  -H "Content-Type: application/json"
```

---

## Testing with Postman

1. **Create New Workspace**
   - Name: "Bahrain Real Estate API"

2. **Create Environment**
   - Variable: `base_url` = `http://localhost:3000/api`
   - Variable: `token` = (will be set after login)

3. **Create Collections**
   - Auth Collection
   - Admin Collection
   - Company Collection
   - Public Collection

4. **Setup Pre-request Scripts** (in Auth requests)
   ```javascript
   // After login, save token
   const jsonData = pm.response.json();
   pm.environment.set("token", jsonData.token);
   ```

5. **Use Variables in Headers**
   ```
   Authorization: Bearer {{token}}
   ```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "No token provided",
  "stack": "Error stack trace (development only)"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Only admins can access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Property not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "Internal Server Error",
  "stack": "Error stack trace (development only)"
}
```

---

## Response Status Codes

| Status | Meaning |
|--------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal error |

---

## Rate Limiting (To Be Implemented)

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Best Practices

1. **Always validate** input on the client side
2. **Use HTTPS** in production
3. **Store tokens** securely in httpOnly cookies
4. **Implement refresh tokens** for better security
5. **Log all API** calls for debugging
6. **Use pagination** for large datasets
7. **Cache responses** when appropriate
8. **Monitor rate limits** to prevent abuse
9. **Implement CORS** properly for security
10. **Keep tokens short-lived** (15-30 minutes)

---

## Next Implementation Steps

The endpoints are currently returning placeholder responses. To implement real functionality:

1. **Update Services** - Add database queries
2. **Update Controllers** - Call services and return data
3. **Add Validation** - Use express-validator rules
4. **Add Error Handling** - Use AppError class
5. **Test Each Endpoint** - Use Postman or cURL
6. **Add Authentication** - Implement login logic
7. **Add Database** - Create tables and migrations

Each endpoint is ready to be connected to actual business logic!
