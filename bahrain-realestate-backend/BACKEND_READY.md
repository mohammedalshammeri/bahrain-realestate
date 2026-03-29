# 🇧🇭 Bahrain Real Estate Backend

## ✅ Backend Complete & Running

الخادم الخلفي لمنصة العقارات في البحرين - جاهز للإنتاج

---

## 🚀 Quick Start

### 1. الخادم يعمل الآن على:
```
http://localhost:3000
```

### 2. اختبر Health Check:
```bash
curl http://localhost:3000/health
```

### 3. استعرض التوثيق:
- **API_DOCUMENTATION.md** - شامل لجميع الـ endpoints
- **PROJECT_STATUS.md** - حالة المشروع والحالات المنجزة

---

## 📚 Documentation Files

| الملف | الوصف |
|------|-------|
| **API_DOCUMENTATION.md** | توثيق كامل لجميع endpoints مع أمثلة |
| **PROJECT_STATUS.md** | حالة المشروع والمميزات المنجزة |
| **QUICK_REFERENCE.md** | مرجع سريع للـ endpoints |

---

## 🔐 Quick Test

### 1. Register Company
```bash
curl -X POST http://localhost:3000/api/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "password123",
    "name": "Test Company",
    "crNumber": "123456789",
    "phone": "+97333123456"
  }'
```

### 2. Login Company
```bash
curl -X POST http://localhost:3000/api/auth/login/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "password123"
  }'
```

### 3. Get Company Profile (استخدم التوكن من الخطوة 2)
```bash
curl -X GET http://localhost:3000/api/company/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 API Endpoints Overview

### Public (No Auth)
- `GET /api/public/properties` - List properties
- `GET /api/public/properties/search` - Search properties
- `GET /api/public/properties/:id` - Get property details
- `GET /api/public/governorates` - List governorates
- `POST /api/public/complaints` - Submit complaint

### Auth
- `POST /api/auth/register/admin` - Register admin
- `POST /api/auth/register/company` - Register company
- `POST /api/auth/login/admin` - Login admin
- `POST /api/auth/login/company` - Login company

### Company (Auth Required)
- `GET /api/company/profile` - Get profile
- `POST /api/company/properties` - Create property
- `GET /api/company/properties` - List properties
- `PATCH /api/company/properties/:id` - Update property
- `DELETE /api/company/properties/:id` - Delete property

### Admin (Auth Required)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/companies` - List companies
- `PATCH /api/admin/companies/:id/status` - Approve/reject company
- `GET /api/admin/complaints` - List complaints
- `PATCH /api/admin/complaints/:id` - Update complaint

---

## 🛠️ Development

### Start Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
pnpm test
```

---

## 📁 Project Structure

```
src/
├── app.ts                    # Express app
├── index.ts                  # Server entry
├── config/                   # Configuration
├── controllers/              # Request handlers
├── services/                 # Business logic
├── routes/                   # API routes
├── middleware/               # Middleware
├── db/                       # Database
├── utils/                    # Utilities
└── types/                    # TypeScript types
```

---

## 🗄️ Database

- **Provider**: Neon PostgreSQL
- **Models**: 9 models
- **Enums**: 5 enums
- **Status**: ✅ Connected & Ready

---

## 🔑 Key Features

✅ JWT Authentication
✅ Role-based Access Control (Admin, Company, Public)
✅ Company Management
✅ Property Management
✅ Admin Dashboard
✅ Complaint System
✅ Pagination Support
✅ Error Handling
✅ Input Validation
✅ Password Security (bcrypt)

---

## 📊 Database Models

1. **Admin** - Admin users
2. **Company** - Property companies
3. **Property** - Real estate properties
4. **PropertyImage** - Property images
5. **Complaint** - User complaints
6. **Payment** - Payment records
7. **Governorate** - BH governorates
8. **Area** - Areas within governorates
9. **Setting** - Application settings

---

## 🔄 Status

| Component | Status |
|-----------|--------|
| Database | ✅ Connected |
| Server | ✅ Running |
| Authentication | ✅ Working |
| Company Routes | ✅ Functional |
| Admin Routes | ✅ Functional |
| Public Routes | ✅ Functional |
| Error Handling | ✅ Implemented |

---

## 📞 Next Steps

1. 📖 Read **API_DOCUMENTATION.md** for detailed endpoint info
2. 🧪 Test endpoints with Postman or curl
3. 🔧 Integrate with frontend
4. 🚀 Deploy to production

---

## 💡 Notes

- جميع كلمات المرور محمية بـ bcrypt
- جميع الـ tokens صالحة لمدة 7 أيام
- الـ properties تنتهي تلقائياً بعد 30 يوم
- الشركات يجب أن توافق عليها الإدارة قبل تسجيل الدخول

---

## ✨ Ready to Use!

البَاكإند جاهز الآن للاستخدام الفوري! 🎉

