# Bahrain Real Estate Backend - نظام الأدوار المحدّث

## 🎯 نظرة عامة

نظام إدارة العقارات في البحرين مع نظام أدوار متقدم (RBAC) يدعم:
- ✅ أدوار على مستوى النظام (SUPER_ADMIN, ADMIN)
- ✅ أدوار على مستوى الشركة (OWNER, MANAGER, AGENT)
- ✅ مصادقة معززة مع فحص حالة الشركة
- ✅ تفويض دقيق للـ Endpoints

---

## 📋 المتطلبات

```
Node.js: 18+
npm: 9+
PostgreSQL: 12+
```

---

## 🚀 البدء السريع

### 1. التثبيت
```bash
cd bahrain-realestate-backend
npm install
```

### 2. تكوين البيئة
```bash
# انسخ .env.example إلى .env
cp .env.example .env

# أضف البيانات المطلوبة
DATABASE_URL="postgresql://user:password@localhost:5432/bahrain_realestate"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRY="7d"
```

### 3. تطبيق Migration
```bash
npx prisma migrate deploy
```

### 4. تشغيل الخادم
```bash
npm run build
npm start
```

Server سيشتغل على: `http://localhost:3000`

---

## 📚 التوثيق

### المرجعيات الرئيسية
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - توثيق API كامل مع أمثلة
- **[ROLES_QUICK_START.md](./ROLES_QUICK_START.md)** - دليل سريع للبدء
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - دليل النشر والتشغيل
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - ملخص شامل

---

## 🔑 الأدوار والصلاحيات

### 🔴 SUPER_ADMIN
```
✓ إدارة Dashboard
✓ إدارة جميع الشركات
✓ تغيير حالة الشركات
✓ إدارة الشكاوى
✓ حذف أي محتوى
```

### 🟡 OWNER (Company)
```
✓ تعديل ملف الشركة
✓ إنشاء/تعديل/حذف الخصائص
✓ إنشاء وإدارة الموظفين
✓ تغيير أدوار الموظفين
```

### 🟢 MANAGER (Company)
```
✓ تعديل ملف الشركة
✓ إنشاء/تعديل/حذف الخصائص
✓ إنشاء وتعديل الموظفين
✓ عرض الموظفين
```

### 🔵 AGENT (Company)
```
✓ عرض ملف الشركة
✓ إنشاء/تعديل/حذف خصائصه
✓ عرض الموظفين
```

---

## 🔄 تدفق المصادقة

### Admin Registration
```bash
POST /api/auth/admin/register
Body: { email, password, name }
Response: Token + Admin Info (role: SUPER_ADMIN)
```

### Company Registration
```bash
POST /api/auth/company/register
Body: { email, password, name, crNumber, phone }
Response: Token + Company Info + Owner Employee
# يتم إنشاء CompanyEmployee بدور OWNER تلقائياً
```

### Employee Login
```bash
POST /api/employee/login
Body: { email, password, companyId }
Response: Token + Employee Info
# يجب أن تكون الشركة approved والموظف active
```

---

## 📝 أمثلة الاستخدام

### تسجيل Admin
```bash
curl -X POST http://localhost:3000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@app.com",
    "password": "secure123",
    "name": "System Admin"
  }'
```

### تسجيل شركة
```bash
curl -X POST http://localhost:3000/api/auth/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@company.com",
    "password": "company123",
    "name": "My Real Estate Company",
    "crNumber": "CR2024001",
    "phone": "+97333123456"
  }'
```

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

### إنشاء موظف جديد (OWNER فقط)
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

## 🗂️ هيكل المشروع

```
bahrain-realestate-backend/
├── src/
│   ├── controllers/          # طبقة التحكم
│   ├── services/             # منطق العمل
│   ├── routes/               # التوجيه
│   ├── middleware/           # Middleware (auth, validation)
│   ├── utils/                # دوال مساعدة
│   └── index.ts              # نقطة الدخول
├── prisma/
│   ├── schema.prisma         # تعريف قاعدة البيانات
│   └── migrations/           # ملفات Migration
├── dist/                     # الملفات المجمعة
├── .env                      # متغيرات البيئة
├── tsconfig.json             # إعدادات TypeScript
├── package.json              # المتعلقات
└── README.md                 # هذا الملف
```

---

## 🔐 Middleware الحماية

### superAdminAuthMiddleware
```typescript
// لـ SUPER_ADMIN فقط
app.use(superAdminAuthMiddleware);
```

### companyEmployeeAuthMiddleware
```typescript
// لجميع موظفي الشركة (OWNER, MANAGER, AGENT)
app.use(companyEmployeeAuthMiddleware);
```

### companyOwnerAuthMiddleware
```typescript
// لمالك الشركة (OWNER) فقط
app.use(companyOwnerAuthMiddleware);
```

### companyManagerAuthMiddleware
```typescript
// لمالك + مدير الشركة (OWNER, MANAGER)
app.use(companyManagerAuthMiddleware);
```

---

## 🧪 الاختبار

### اختبار سريع
```bash
# تشغيل الخادم
npm run dev

# في terminal آخر، اختبر بعض الـ endpoints
curl http://localhost:3000/api/auth/admin/register ...
```

### كتابة اختبارات
```bash
# اختبارات (جاهز قريباً)
npm run test
```

---

## 📊 Database Schema

### Enums
```
SystemRole:
  - SUPER_ADMIN
  - ADMIN

CompanyEmployeeRole:
  - OWNER
  - MANAGER
  - AGENT

CompanyStatus:
  - pending
  - approved
  - rejected
  - blocked
```

### Main Models
```
Admin {
  id, name, email, passwordHash, role (SystemRole)
}

Company {
  id, name, crNumber, phone, email, status, createdAt
}

CompanyEmployee {
  id, companyId, name, email, phone, role (CompanyEmployeeRole), 
  passwordHash, isActive, createdAt, updatedAt
}

Property {
  id, companyId, title, description, price, type, bedrooms, 
  bathrooms, area, location, status, createdAt, updatedAt
}
```

---

## 🚀 الأوامر المهمة

```bash
# البناء
npm run build

# التطوير (مع auto-reload)
npm run dev

# الإنتاج
npm start

# Prisma
npx prisma migrate dev
npx prisma migrate deploy
npx prisma studio

# الحالة
npm run build --check-only
```

---

## 📞 الدعم والمساعدة

### مشاكل شائعة

**Q: خطأ "Unauthorized"**
A: تأكد من وجود Token صحيح وأن الصلاحيات كافية

**Q: "Company not approved"**
A: اطلب من SUPER_ADMIN موافقة الشركة

**Q: خطأ في Migration**
A: تأكد من اتصالك بقاعدة البيانات

---

## 🤝 المساهمة

1. اشتغل على branch جديد
2. اعمل تغييراتك
3. اختبر التغييرات
4. أرسل Pull Request

---

## 📄 الترخيص

ISC License - راجع LICENSE.md

---

## 👥 الفريق

- **Backend Developer**: [Your Name]
- **Database Designer**: [Your Name]
- **DevOps**: [Your Name]

---

## 📚 المراجع الإضافية

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎯 خارطة الطريق

- [ ] كتابة Unit Tests
- [ ] كتابة Integration Tests
- [ ] إضافة Email Notifications
- [ ] إضافة WebSockets
- [ ] تحسين Performance
- [ ] إضافة Logging
- [ ] إضافة Rate Limiting

---

## ✅ الحالة الحالية

**Version:** v1.0.0
**Status:** ✅ جاهز للإنتاج
**Last Update:** 1 ديسمبر 2024

---

## 🔗 الروابط المهمة

- [API Documentation](./API_DOCUMENTATION.md)
- [Quick Start Guide](./ROLES_QUICK_START.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [System Overview](./ROLES_SYSTEM_UPDATE.md)

---

**للبدء الآن:**
```bash
npx prisma migrate deploy
npm run build
npm start
```

🎉 **النظام جاهز للاستخدام!**

---

*آخر تحديث: 1 ديسمبر 2024*
