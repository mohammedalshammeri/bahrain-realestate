# Bahrain Property Hub - Admin Dashboard

## 🚀 النظام جاهز للاختبار!

### 📋 ملخص التكوين

- **Frontend Admin Dashboard**: `http://localhost:3002`
- **Backend API**: `http://localhost:8000` (متوقع)
- **بيانات تسجيل الدخول الافتراضية**:
  - Email: `admin`
  - Password: `admin123`

### 🔧 التكوين الحالي

#### ملف `.env`
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:8000/api/admin

# Admin Authentication (for development only)
NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME=admin
NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD=admin123

# App Configuration
NEXT_PUBLIC_APP_NAME="Bahrain Property Hub Admin"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features Configuration
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ITEMS_PER_PAGE=10
NEXT_PUBLIC_MAX_FILE_SIZE=5242880

# Development Mode
NODE_ENV=development
```

### 🎯 نقاط النهاية API المُحدثة

#### **Authentication Endpoints**
```typescript
// يجرب النظام هذه النقاط تلقائياً:
/api/auth/admin/login
/auth/admin/login
/admin/auth/login
/api/admin/login
/admin/login
/auth/login
/api/auth/login
/login
/api/login
```

#### **Data Endpoints**
- **Dashboard**: `GET /admin/dashboard`
- **Companies**: `GET /companies`
- **Properties**: `GET /properties`
- **Complaints**: `GET /complaints`
- **Ads**: `GET /ads`
- **Withdrawals**: `GET /withdrawals`
- **System Employees**: `GET /admin/employees`
- **Profile**: `GET /admin/profile`
- **Settings**: `GET /admin/settings`

### 🏗️ البنية المُحدثة

#### **API Client** (`src/lib/api/adminApi.ts`)
- ✅ دوال مركزية لجميع API calls
- ✅ معالجة أخطاء شاملة
- ✅ TypeScript interfaces متطابقة
- ✅ نظام authentication متكامل
- ✅ اختبار endpoints تلقائي

#### **Pages Integration**
- ✅ جميع الصفحات تستخدم `adminApi.ts`
- ✅ بنية البيانات موحدة (`response.data`, `response.pagination`)
- ✅ معالجة حالات الخطأ
- ✅ Loading states

#### **Authentication System**
- ✅ صفحة تسجيل دخول محسنة
- ✅ اختبار اتصال Backend تلقائي
- ✅ تخزين Token في localStorage
- ✅ Middleware لحماية المسارات
- ✅ تسجيل خروج عبر النوافذ المتعددة

### 🔍 ميزات التطوير

#### **Backend Connection Testing**
- اختبار اتصال تلقائي عند تسجيل الدخول
- عرض حالة Backend في الواجهة
- اختبار endpoints متعددة للعثور على الصحيح

#### **Development Helpers**
- زر "Fill Default Credentials" لملء البيانات الافتراضية
- عرض معلومات API URLs
- رسائل خطأ مفصلة للتطوير

### 🚦 خطوات التشغيل

#### 1. **تشغيل Frontend**
```bash
cd "c:\Users\Dell\Desktop\Bahrain Property Hub\bahrain-realestate-frontend\admin-dashboard"
npm run dev
```
✅ **يعمل حالياً على**: `http://localhost:3002`

#### 2. **تشغيل Backend** (مطلوب)
```bash
# تأكد من تشغيل Backend على المنفذ 8000
# أو حدث NEXT_PUBLIC_API_BASE_URL في .env للمنفذ الصحيح
```

#### 3. **الوصول للنظام**
1. افتح: `http://localhost:3002`
2. سيتم إعادة توجيهك لصفحة تسجيل الدخول
3. اضغط "Fill Default Credentials" (في وضع التطوير)
4. أو أدخل البيانات يدوياً:
   - Email: `admin`
   - Password: `admin123`

### 🔧 استكشاف الأخطاء

#### **Backend Connection Issues**
1. **تحقق من المنفذ**: تأكد أن Backend يعمل على `localhost:8000`
2. **تحديث .env**: غير `NEXT_PUBLIC_API_BASE_URL` للمنفذ الصحيح
3. **CORS**: تأكد من إعداد CORS في Backend للسماح بـ `http://localhost:3002`

#### **Login Issues**
- ستحاول صفحة تسجيل الدخول endpoints متعددة تلقائياً
- تحقق من Console للرسائل التفصيلية
- تحقق من حالة Backend في أعلى صفحة تسجيل الدخول

#### **API Errors**
- جميع الأخطاء تظهر في Console مع تفاصيل كاملة
- رسائل خطأ مفهومة للمستخدم
- إعادة المحاولة التلقائية للـ endpoints

### 📊 الواجهات المتاحة

#### **الصفحة الرئيسية**
- `/` - Dashboard بإحصائيات شاملة

#### **إدارة الشركات**
- `/companies` - قائمة الشركات
- `/companies/[id]` - تفاصيل الشركة
- `/companies/[id]/employees` - موظفي الشركة

#### **إدارة العقارات**
- `/properties` - قائمة العقارات
- `/properties/[id]` - تفاصيل العقار

#### **إدارة الشكاوى**
- `/complaints` - قائمة الشكاوى

#### **إدارة الإعلانات**
- `/ads` - قائمة الإعلانات
- `/ads/[id]` - تفاصيل الإعلان مع إمكانية الموافقة/الرفض

#### **إدارة السحوبات**
- `/withdrawals` - قائمة طلبات السحب
- `/withdrawals/[id]` - تفاصيل طلب السحب مع إمكانية الموافقة/الرفض

#### **إدارة موظفي النظام**
- `/system-employees` - قائمة موظفي النظام
- `/system-employees/create` - إنشاء موظف جديد
- `/system-employees/[id]` - تفاصيل الموظف

#### **الإعدادات**
- `/profile` - الملف الشخصي للمدير
- `/settings` - الإعدادات العامة
- `/system` - إعدادات النظام

### 🎯 الخطوات التالية

1. **تشغيل Backend** على `localhost:8000`
2. **تكوين Database** وتأكيد أن جميع الجداول موجودة
3. **إنشاء Admin User** بالبيانات الافتراضية
4. **اختبار جميع الواجهات** للتأكد من عمل CRUD operations
5. **تكوين CORS** للسماح بالوصول من Frontend

### ✅ حالة التطوير

- **✅ Frontend Setup**: مكتمل
- **✅ API Integration**: مكتمل
- **✅ Authentication**: مكتمل
- **✅ All Pages Connected**: مكتمل
- **✅ Error Handling**: مكتمل
- **✅ TypeScript**: مكتمل
- **✅ Build Success**: مكتمل
- **⏳ Backend Connection**: في انتظار تشغيل Backend

---

**النظام جاهز للاختبار! 🚀**

فقط قم بتشغيل Backend على المنفذ 8000 وجرب تسجيل الدخول.
