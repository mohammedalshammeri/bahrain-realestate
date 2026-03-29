# 📚 توثيق API - نظام الأدوار الجديد

## 🌐 Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication Endpoints

### 1. تسجيل Admin جديد
**POST** `/auth/admin/register`

**Request Body:**
```json
{
  "email": "admin@app.com",
  "password": "secure123",
  "name": "System Administrator"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "id": 1,
    "email": "admin@app.com",
    "name": "System Administrator",
    "role": "SUPER_ADMIN"
  }
}
```

**Errors:**
- `400` - البريد موجود بالفعل
- `400` - بيانات غير صحيحة

---

### 2. دخول Admin
**POST** `/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@app.com",
  "password": "secure123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "id": 1,
    "email": "admin@app.com",
    "role": "SUPER_ADMIN"
  }
}
```

**Errors:**
- `401` - بيانات دخول غير صحيحة
- `400` - البريد غير موجود

---

### 3. تسجيل Company جديدة
**POST** `/auth/company/register`

**Request Body:**
```json
{
  "email": "owner@company.com",
  "password": "company123",
  "name": "Real Estate Company",
  "crNumber": "CR2024001",
  "phone": "+97333123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Company registered successfully. Owner account created.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "company": {
      "id": 1,
      "name": "Real Estate Company",
      "crNumber": "CR2024001",
      "phone": "+97333123456",
      "status": "pending"
    },
    "owner": {
      "id": 1,
      "email": "owner@company.com",
      "name": null,
      "phone": null,
      "companyId": 1,
      "role": "employee",
      "employeeRole": "OWNER"
    }
  }
}
```

**ملاحظات:**
- ✅ يتم إنشاء `CompanyEmployee` بدور `OWNER` تلقائياً
- ✅ Token يحتوي على `companyId` و `employeeRole`

**Errors:**
- `400` - البريد موجود بالفعل
- `400` - CR رقم موجود
- `400` - بيانات غير صحيحة

---

### 4. دخول Employee (Worldwide)
**POST** `/auth/refresh-token`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401` - Token منتهي الصلاحية
- `400` - Token غير صحيح

---

### 5. تسجيل الخروج
**POST** `/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 Employee Endpoints

### 1. دخول الموظف
**POST** `/employee/login`

**Request Body:**
```json
{
  "email": "owner@company.com",
  "password": "company123",
  "companyId": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "id": 1,
    "email": "owner@company.com",
    "name": null,
    "phone": null,
    "companyId": 1,
    "role": "employee",
    "employeeRole": "OWNER"
  }
}
```

**التحقق:**
- ✓ الشركة يجب أن تكون `approved`
- ✓ الموظف يجب أن يكون `isActive`

**Errors:**
- `400` - الشركة لم تُعتمد بعد
- `401` - بيانات دخول غير صحيحة
- `404` - الموظف غير موجود

---

### 2. تسجيل موظف جديد (OWNER فقط)
**POST** `/employee/register`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "companyId": 1,
  "name": "Agent Name",
  "email": "agent@company.com",
  "phone": "+97333999999",
  "role": "AGENT",
  "password": "agent123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Employee registered successfully",
  "data": {
    "id": 2,
    "companyId": 1,
    "name": "Agent Name",
    "email": "agent@company.com",
    "phone": "+97333999999",
    "role": "AGENT",
    "isActive": true
  }
}
```

**التحقق:**
- ✓ فقط OWNER يمكنه إنشاء موظفين جدد
- ✓ الدور يجب أن يكون: `AGENT` أو `MANAGER`

**Errors:**
- `401` - لا توجد صلاحيات (ليس OWNER)
- `400` - البريد موجود بالفعل
- `400` - دور غير صحيح

---

### 3. تعديل بيانات الموظف (OWNER فقط)
**PATCH** `/employee/:employeeId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "name": "New Name",
  "phone": "+97333999999",
  "role": "MANAGER",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": 2,
    "companyId": 1,
    "name": "New Name",
    "email": "agent@company.com",
    "phone": "+97333999999",
    "role": "MANAGER",
    "isActive": true
  }
}
```

**التحقق:**
- ✓ فقط OWNER يمكنه تعديل الموظفين
- ✓ لا يمكن تعديل OWNER نفسه

**Errors:**
- `401` - لا توجد صلاحيات
- `404` - الموظف غير موجود
- `400` - لا يمكن تعديل OWNER

---

### 4. حذف موظف (OWNER فقط)
**DELETE** `/employee/:employeeId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

**التحقق:**
- ✓ فقط OWNER يمكنه حذف الموظفين
- ✓ لا يمكن حذف OWNER نفسه

**Errors:**
- `401` - لا توجد صلاحيات
- `404` - الموظف غير موجود
- `400` - لا يمكن حذف OWNER

---

## 🏢 Company Endpoints

### 1. عرض ملف الشركة (جميع الموظفين)
**GET** `/company/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Company profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "Real Estate Company",
    "crNumber": "CR2024001",
    "phone": "+97333123456",
    "email": "owner@company.com",
    "status": "pending",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

**التحقق:**
- ✓ جميع موظفي الشركة يمكنهم عرض الملف

---

### 2. تعديل ملف الشركة (OWNER + MANAGER)
**PATCH** `/company/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "phone": "+97333999999",
  "email": "newemail@company.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Company profile updated successfully",
  "data": {
    "id": 1,
    "name": "Real Estate Company",
    "phone": "+97333999999",
    "email": "newemail@company.com"
  }
}
```

**التحقق:**
- ✓ فقط OWNER و MANAGER يمكنهم التعديل

**Errors:**
- `401` - لا توجد صلاحيات

---

### 3. عرض جميع الموظفين (جميع الموظفين)
**GET** `/company/employees`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": null,
      "email": "owner@company.com",
      "phone": null,
      "role": "OWNER",
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Agent Name",
      "email": "agent@company.com",
      "phone": "+97333999999",
      "role": "AGENT",
      "isActive": true,
      "createdAt": "2024-12-01T10:05:00Z"
    }
  ]
}
```

---

### 4. إنشاء خاصية عقارية (OWNER + MANAGER)
**POST** `/company/properties`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "title": "Villa in Manama",
  "description": "Luxury villa with 4 bedrooms",
  "price": 500000,
  "type": "villa",
  "bedrooms": 4,
  "bathrooms": 3,
  "area": 250,
  "location": "Manama",
  "coordinates": {
    "lat": 26.1445,
    "lng": 50.5574
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "id": 1,
    "companyId": 1,
    "createdBy": 1,
    "title": "Villa in Manama",
    "price": 500000,
    "status": "active"
  }
}
```

**التحقق:**
- ✓ فقط OWNER و MANAGER يمكنهم الإنشاء

---

### 5. عرض جميع الخصائص (جميع الموظفين)
**GET** `/company/properties`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
```
?page=1&limit=10&status=active
```

**Response (200):**
```json
{
  "success": true,
  "message": "Properties retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Villa in Manama",
      "price": 500000,
      "type": "villa",
      "status": "active",
      "createdBy": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

---

### 6. تعديل خاصية (OWNER + MANAGER)
**PATCH** `/company/properties/:propertyId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "price": 450000,
  "status": "inactive"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Property updated successfully",
  "data": {
    "id": 1,
    "price": 450000,
    "status": "inactive"
  }
}
```

---

### 7. حذف خاصية (OWNER + MANAGER)
**DELETE** `/company/properties/:propertyId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

## 📊 Admin Endpoints

### 1. عرض Dashboard (SUPER_ADMIN فقط)
**GET** `/admin/dashboard`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "totalCompanies": 50,
    "pendingCompanies": 5,
    "approvedCompanies": 45,
    "totalEmployees": 200,
    "totalProperties": 1500,
    "totalComplaints": 10
  }
}
```

---

### 2. عرض جميع الشركات (SUPER_ADMIN فقط)
**GET** `/admin/companies`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
```
?page=1&limit=10&status=pending
```

**Response (200):**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Real Estate Company",
      "crNumber": "CR2024001",
      "status": "pending",
      "employeeCount": 5,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

---

### 3. عرض شركة محددة (SUPER_ADMIN فقط)
**GET** `/admin/companies/:companyId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Company details retrieved",
  "data": {
    "id": 1,
    "name": "Real Estate Company",
    "crNumber": "CR2024001",
    "phone": "+97333123456",
    "email": "owner@company.com",
    "status": "pending",
    "employees": [
      {
        "id": 1,
        "name": null,
        "email": "owner@company.com",
        "role": "OWNER"
      }
    ],
    "propertyCount": 15
  }
}
```

---

### 4. تغيير حالة الشركة (SUPER_ADMIN فقط)
**PATCH** `/admin/companies/:companyId/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Company status updated successfully",
  "data": {
    "id": 1,
    "status": "approved"
  }
}
```

---

### 5. عرض الشكاوى (SUPER_ADMIN فقط)
**GET** `/admin/complaints`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Complaint Title",
      "description": "Complaint Description",
      "status": "open",
      "companyId": 1,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

---

### 6. تحديث حالة الشكوى (SUPER_ADMIN فقط)
**PATCH** `/admin/complaints/:complaintId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "status": "closed"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Complaint updated successfully",
  "data": {
    "id": 1,
    "status": "closed"
  }
}
```

---

## 🔑 Token Format

### Admin Token
```json
{
  "id": 1,
  "email": "admin@app.com",
  "role": "SUPER_ADMIN"
}
```

### Employee Token
```json
{
  "id": 5,
  "email": "owner@company.com",
  "companyId": 1,
  "role": "employee",
  "employeeRole": "OWNER"
}
```

---

## ⚠️ HTTP Status Codes

| Code | الوصف |
|------|-------|
| `200` | ✅ نجح |
| `201` | ✅ تم الإنشاء بنجاح |
| `400` | ❌ طلب غير صحيح |
| `401` | ❌ غير مصرح |
| `403` | ❌ لا توجد صلاحيات |
| `404` | ❌ غير موجود |
| `500` | ❌ خطأ في الخادم |

---

## 🔒 Headers المطلوبة

جميع الطلبات المحمية تحتاج على:

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

**آخر تحديث:** 1 ديسمبر 2024
**الإصدار:** 1.0.0
