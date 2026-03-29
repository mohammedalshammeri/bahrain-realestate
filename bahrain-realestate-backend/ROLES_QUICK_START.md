# 🎯 دليل سريع - نظام الأدوار الجديد

## 📍 الموقع الحالي

**الحالة:** ✅ البناء ناجح | جميع الملفات محدّثة | جاهز للاختبار

---

## 🚀 البدء السريع

### 1️⃣ تطبيق التحديثات على قاعدة البيانات
```bash
cd "c:\Users\Dell\Desktop\Bahrain Property Hub\bahrain-realestate-backend"
npx prisma migrate deploy
```

### 2️⃣ تشغيل الـ Server
```bash
npm start
```

Server سيشتغل على: `http://localhost:3000`

---

## 🔑 الأدوار الجديدة

### **النظام (System)**
- **SUPER_ADMIN** - مالك التطبيق (صلاحيات كاملة)
- **ADMIN** - مساعد اختياري

### **الشركات (Company)**
- **OWNER** - مالك الشركة (صلاحيات كاملة للشركة)
- **MANAGER** - مدير (إدارة الموظفين والخصائص)
- **AGENT** - موظف عادي (إدارة الخصائص الخاصة به)

---

## 📝 أمثلة استخدام

### تسجيل Admin جديد
```bash
curl -X POST http://localhost:3000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@app.com",
    "password": "secure123",
    "name": "System Administrator"
  }'
```

### تسجيل شركة جديدة
```bash
curl -X POST http://localhost:3000/api/auth/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@company.com",
    "password": "company123",
    "name": "Real Estate Company",
    "crNumber": "CR2024001",
    "phone": "+97333123456"
  }'
```

> **ملاحظة:** يتم إنشاء `CompanyEmployee` بدور `OWNER` تلقائياً

### دخول الموظف
```bash
curl -X POST http://localhost:3000/api/employee/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@company.com",
    "password": "company123",
    "companyId": 1
  }'
```

### إنشاء موظف جديد (Owner فقط)
```bash
curl -X POST http://localhost:3000/api/employee/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": 1,
    "name": "Agent Name",
    "email": "agent@company.com",
    "phone": "+97333999999",
    "role": "AGENT",
    "password": "agent123"
  }'
```

---

## 🔐 Middleware الحماية

| Middleware | الدور المطلوب | الاستخدام |
|-----------|-------------|---------|
| `superAdminAuthMiddleware` | SUPER_ADMIN | Admin Dashboard |
| `companyEmployeeAuthMiddleware` | OWNER/MANAGER/AGENT | Company Endpoints |
| `companyOwnerAuthMiddleware` | OWNER | Employee Management |
| `companyManagerAuthMiddleware` | OWNER/MANAGER | Property Management |

---

## 📊 مخطط الصلاحيات

```
SUPER_ADMIN
├─ View Dashboard ✅
├─ Manage Companies ✅
├─ Manage Complaints ✅
└─ Delete Any Content ✅

OWNER (Company)
├─ View Company Profile ✅
├─ Edit Company Profile ✅
├─ Create/Edit/Delete Properties ✅
├─ Create Employees ✅
├─ Edit Employees ✅
├─ Delete Employees ✅
└─ Change Employee Roles ✅

MANAGER (Company)
├─ View Company Profile ✅
├─ Edit Company Profile ✅
├─ Create/Edit/Delete Properties ✅
├─ View Employees ✅
├─ Create Employees ✅
├─ Edit Employees ✅
└─ Delete Employees ❌

AGENT (Company)
├─ View Company Profile ✅
├─ View Own Properties ✅
├─ Create Own Properties ✅
├─ Edit Own Properties ✅
├─ Delete Own Properties ✅
└─ Manage Employees ❌
```

---

## 🔍 الملفات المهمة

### Services
- `src/services/auth.service.ts` - المصادقة والتسجيل
- `src/services/company.service.ts` - إدارة الشركات والموظفين

### Middleware
- `src/middleware/auth.ts` - جميع middleware الحماية

### Routes
- `src/routes/auth.routes.ts` - تسجيل وتسجيل دخول
- `src/routes/employee.routes.ts` - إدارة الموظفين
- `src/routes/company.routes.ts` - إدارة الشركات
- `src/routes/admin.routes.ts` - إدارة النظام

### Database
- `prisma/schema.prisma` - التعريف الكامل للـ schema
- `prisma/migrations/20251201163423_update_roles_structure/` - Migration الأدوار

---

## ✅ قائمة التحقق

- [x] Enums الجديدة (SystemRole, CompanyEmployeeRole)
- [x] Models محدّثة (Admin, CompanyEmployee)
- [x] Services كاملة (+3 جديدة)
- [x] Controllers محدّثة (+2 جديدة)
- [x] Middleware جديدة (4 وظائف)
- [x] Routes محدّثة (4 ملفات)
- [x] Migration جاهز
- [x] البناء ناجح (npm run build)
- [ ] اختبار الـ Endpoints
- [ ] اختبار الصلاحيات

---

## 📞 الدعم السريع

### هل حصلت على خطأ "Unauthorized"؟
✓ تأكد من توفر Token صحيح
✓ تأكد من أن الـ Token لم ينتهي (7 أيام)
✓ تأكد من استخدام الـ Role الصحيح

### هل Company لا تقبل تسجيل الدخول؟
✓ تحقق من حالة الشركة (يجب أن تكون `approved`)
✓ تحقق من أن الموظف `isActive = true`

### هل أريد تغيير كلمة المرور؟
⏳ هذه الميزة قادمة قريباً

---

## 📚 المراجع الإضافية

- `ROLES_SYSTEM_UPDATE.md` - توثيق شامل للنظام
- `ROLES_UPDATE_COMPLETE.md` - ملخص الإنجازات
- `API_DOCUMENTATION.md` - توثيق API كامل

---

**آخر تحديث:** 1 ديسمبر 2025
**الحالة:** ✅ جاهز للاستخدام
