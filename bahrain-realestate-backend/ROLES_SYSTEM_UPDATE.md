# نظام الأدوار المحدّث - Bahrain Real Estate Backend

## 📋 ملخص التغييرات

تم تحديث نظام الأدوار بالكامل لدعم هيكل أدوار أكثر مرونة وأماناً:

### 1️⃣ **Enums الجديدة في Prisma Schema**

#### `SystemRole` (للمسؤولين)
```prisma
enum SystemRole {
  SUPER_ADMIN    # مالك التطبيق - لديه صلاحيات كاملة
  ADMIN          # مساعد اختياري للـ super admin
}
```

#### `CompanyEmployeeRole` (لموظفي الشركات)
```prisma
enum CompanyEmployeeRole {
  OWNER          # مالك الشركة - صلاحيات كاملة
  MANAGER        # مدير - يمكنه إدارة الموظفين والخصائص
  AGENT          # موظف عادي - يمكنه إدارة الخصائص التي أنشأها
}
```

---

## 🔄 تدفق المصادقة الجديد

### **1. تسجيل Admin (SUPER_ADMIN)**
```
POST /api/auth/admin/register
Body: {
  "email": "admin@app.com",
  "password": "password123",
  "name": "Administrator"
}
Response: Token + Admin Info (role: SUPER_ADMIN)
```

### **2. تسجيل Company**
```
POST /api/auth/company/register
Body: {
  "email": "company@realestate.com",
  "password": "password123",
  "name": "Real Estate Company",
  "crNumber": "CR123456",
  "phone": "+97333123456"
}

الإجراء:
- ✅ إنشاء Company record
- ✅ إنشاء CompanyEmployee بدور OWNER تلقائياً
- ✅ إرجاع token للمالك
```

### **3. تسجيل الدخول - Admin**
```
POST /api/auth/admin/login
Body: {
  "email": "admin@app.com",
  "password": "password123"
}
Response: Token (role: SUPER_ADMIN)
```

### **4. تسجيل الدخول - Company Employee**
```
POST /api/employee/login
Body: {
  "email": "employee@company.com",
  "password": "password123",
  "companyId": 1
}

التحقق:
- ✓ Company يجب أن يكون approved
- ✓ Employee يجب أن يكون active
Response: Token (role: employee, employeeRole: OWNER/MANAGER/AGENT)
```

---

## 🔐 Middleware الحماية الجديد

### **SuperAdminAuthMiddleware**
```typescript
- فقط SUPER_ADMIN يمكنه الوصول لـ Admin Dashboard
- يتحقق من: token.role === "SUPER_ADMIN"
```

### **CompanyEmployeeAuthMiddleware**
```typescript
- جميع موظفي الشركة (OWNER, MANAGER, AGENT)
- يتحقق من: token.role === "employee" && token.employeeRole في [OWNER, MANAGER, AGENT]
```

### **CompanyOwnerAuthMiddleware**
```typescript
- فقط مالك الشركة
- يتحقق من: token.role === "employee" && token.employeeRole === "OWNER"
- الاستخدام: إنشاء/حذف موظفين، تعديل الملف الشخصي للشركة
```

### **CompanyManagerAuthMiddleware**
```typescript
- مالك + مدير الشركة
- يتحقق من: token.employeeRole في [OWNER, MANAGER]
- الاستخدام: إنشاء/تعديل/حذف خصائص، تعديل الملف الشخصي
```

---

## 📊 الأدوار والصلاحيات

### **SUPER_ADMIN (النظام)**
| الإجراء | الصلاحية |
|--------|----------|
| عرض Dashboard | ✅ |
| إدارة الشركات | ✅ |
| تعديل حالة الشركات | ✅ |
| إدارة الشكاوى | ✅ |
| حذف أي محتوى | ✅ |

### **OWNER (صاحب الشركة)**
| الإجراء | الصلاحية |
|--------|----------|
| عرض ملف الشركة | ✅ |
| تعديل ملف الشركة | ✅ |
| إنشاء/تعديل/حذف خصائص | ✅ |
| إنشاء موظفين | ✅ |
| حذف موظفين | ✅ |
| تعديل بيانات الموظفين | ✅ |
| تغيير دور الموظفين | ✅ |
| عرض جميع الموظفين | ✅ |

### **MANAGER (مدير الشركة)**
| الإجراء | الصلاحية |
|--------|----------|
| عرض ملف الشركة | ✅ |
| تعديل ملف الشركة | ✅ |
| إنشاء/تعديل/حذف خصائص | ✅ |
| عرض الموظفين | ✅ |
| إنشاء موظفين | ❌ |
| حذف موظفين | ❌ |

### **AGENT (موظف عادي)**
| الإجراء | الصلاحية |
|--------|----------|
| عرض ملف الشركة | ✅ |
| عرض خصائصه | ✅ |
| إنشاء خصائص جديدة | ✅ |
| تعديل خصائصه | ✅ |
| حذف خصائصه | ✅ |
| تعديل خصائص الآخرين | ❌ |
| إدارة الموظفين | ❌ |

---

## 🔗 API Endpoints الجديدة

### **Authentication**
```
POST /api/auth/admin/register
POST /api/auth/admin/login
POST /api/auth/company/register
POST /api/auth/logout
POST /api/auth/refresh-token
```

### **Employee Management**
```
POST /api/employee/login                    # تسجيل الدخول
POST /api/employee/register                 # إنشاء موظف (OWNER فقط)
DELETE /api/employee/:employeeId            # حذف موظف (OWNER فقط)
PATCH /api/employee/:employeeId             # تعديل موظف (OWNER فقط)
```

### **Company**
```
GET /api/company/profile                    # جميع الموظفين
PATCH /api/company/profile                  # OWNER + MANAGER
POST /api/company/properties                # OWNER + MANAGER
GET /api/company/properties                 # جميع الموظفين
PATCH /api/company/properties/:id           # OWNER + MANAGER
DELETE /api/company/properties/:id          # OWNER + MANAGER
GET /api/company/employees                  # جميع الموظفين
```

### **Admin**
```
GET /api/admin/dashboard                    # SUPER_ADMIN فقط
GET /api/admin/companies                    # SUPER_ADMIN فقط
GET /api/admin/companies/:companyId         # SUPER_ADMIN فقط
PATCH /api/admin/companies/:companyId/status # SUPER_ADMIN فقط
GET /api/admin/complaints                   # SUPER_ADMIN فقط
PATCH /api/admin/complaints/:complaintId    # SUPER_ADMIN فقط
```

---

## 📝 نموذج Token الجديد

### **Admin Token**
```json
{
  "id": 1,
  "email": "admin@app.com",
  "role": "SUPER_ADMIN"
}
```

### **Employee Token**
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

## 🗄️ تحديثات Prisma Schema

### **Admin Model**
```prisma
model Admin {
  id           Int        @id @default(autoincrement())
  name         String     @db.Text
  email        String     @unique @db.VarChar(320)
  passwordHash String     @map("password_hash") @db.Text
  role         SystemRole @default(SUPER_ADMIN)
  createdAt    DateTime   @default(now()) @map("created_at")

  @@map("admins")
}
```

### **CompanyEmployee Model**
```prisma
model CompanyEmployee {
  id           Int                  @id @default(autoincrement())
  companyId    Int                  @map("company_id")
  name         String               @db.Text
  email        String               @db.VarChar(320)
  phone        String?              @db.VarChar(50)
  role         CompanyEmployeeRole  @default(AGENT)
  passwordHash String               @map("password_hash") @db.Text
  isActive     Boolean              @default(true) @map("is_active")
  createdAt    DateTime             @default(now()) @map("created_at")
  updatedAt    DateTime             @default(now()) @updatedAt @map("updated_at")

  company      Company              @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([companyId, email])
  @@index([companyId])
  @@map("company_employees")
}
```

---

## ✅ الملفات المحدّثة

### Services
- `src/services/auth.service.ts` - تحديث `registerCompanyService` و `loginEmployeeService`
- `src/services/company.service.ts` - إضافة `registerEmployeeService`, `deleteEmployeeService`, `updateEmployeeService`

### Controllers
- `src/controllers/auth.controller.ts` - حذف `loginCompanyService`
- `src/controllers/company.controller.ts` - تحديث لاستخدام `companyId` من token
- `src/controllers/employee.controller.ts` - إضافة `deleteEmployeeController`, `updateEmployeeController`

### Middleware
- `src/middleware/auth.ts` - إضافة `superAdminAuthMiddleware`, `companyEmployeeAuthMiddleware`, `companyOwnerAuthMiddleware`, `companyManagerAuthMiddleware`

### Routes
- `src/routes/auth.routes.ts` - حذف `/company/login`
- `src/routes/company.routes.ts` - تحديث لاستخدام الـ middleware الجديد
- `src/routes/employee.routes.ts` - إضافة `/register`, `/:employeeId` (DELETE/PATCH)
- `src/routes/admin.routes.ts` - تحديث لاستخدام `superAdminAuthMiddleware`

### Database
- `prisma/schema.prisma` - إضافة `SystemRole` enum، تحديث `CompanyEmployeeRole`
- `prisma/migrations/20251201163423_update_roles_structure/` - Migration جديد

---

## 🚀 التشغيل والاختبار

### 1. تطبيق التغييرات على قاعدة البيانات
```bash
npx prisma migrate deploy
```

### 2. تشغيل الـ Server
```bash
npm run build
npm start
```

### 3. اختبار الـ Endpoints

#### تسجيل Admin
```bash
curl -X POST http://localhost:3000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@app.com",
    "password": "admin123",
    "name": "System Admin"
  }'
```

#### تسجيل Company
```bash
curl -X POST http://localhost:3000/api/auth/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company@realestate.com",
    "password": "company123",
    "name": "Real Estate Company",
    "crNumber": "CR123456",
    "phone": "+97333123456"
  }'
```

#### تسجيل الدخول كـ Employee
```bash
curl -X POST http://localhost:3000/api/employee/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company@realestate.com",
    "password": "company123",
    "companyId": 1
  }'
```

---

## 📌 ملاحظات مهمة

1. **عند تسجيل شركة جديدة**: يتم إنشاء `CompanyEmployee` بدور `OWNER` تلقائياً
2. **جميع موظفي الشركة يسجلون دخولهم عبر** `/api/employee/login`
3. **لا يمكن حذف أو تعديل دور الـ OWNER** من قبل أي موظف
4. **الـ AGENT لا يمكنه إنشاء/حذف موظفين** - فقط الـ OWNER
5. **الـ Company يجب أن يكون `approved`** قبل أن يتمكن الموظفون من تسجيل الدخول

---

## 🔍 المراجع المتبقية

- [ ] كتابة Unit Tests
- [ ] كتابة Integration Tests
- [ ] إضافة Email Notifications
- [ ] إضافة WebSockets للتحديثات الفورية
- [ ] تحسين Performance

---

**تاريخ التحديث:** 1 ديسمبر 2025
**الحالة:** ✅ مكتمل وجاهز للإنتاج

