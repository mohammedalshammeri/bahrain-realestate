# 🔍 تقرير المراجعة الشاملة — مشروع Bahrain Property Hub

> **تاريخ المراجعة:** 29 مارس 2026
> **نطاق المراجعة:** قراءة عميقة لكل ملفات الكود (بدون الاعتماد على ملفات MD)

---

## ⚡ ملخص سريع

| القسم | الحالة | النسبة |
|-------|--------|--------|
| **Backend API** | يعمل مع مشاكل أمنية وأكواد ميتة | ~75% |
| **لوحة تحكم الأدمن (Next.js)** | مكتمل تقريباً | ~88% |
| **تطبيق الموبايل (Expo)** | يعمل مع شاشات وهمية | ~78% |

---

## 🔴 مشاكل حرجة (يجب إصلاحها فوراً)

### 1. ثغرات أمنية خطيرة

| # | المشكلة | الموقع |
|---|---------|--------|
| 1 | **بيانات أدمن مشفرة في الكود** — يوجد login مباشر بـ `admin@bahrain.com` / `admin123` يعطي صلاحيات `SUPER_ADMIN` لأي شخص | `admin.controller.ts` → `adminLogin` |
| 2 | **JWT Secret ضعيف** — القيمة الافتراضية `"your-secret-key"` في حال عدم وجود env variable | `src/config/jwt.ts` سطر 3 |
| 3 | **Endpoint يكشف كل بيانات الموظفين** — `GET /api/auth/test-data` يعرض كل الموظفين بدون حماية | `auth.controller.ts` → `testData` |
| 4 | **بيانات قاعدة البيانات مكشوفة في `.env`** — Neon DB URL مع كلمة مرور ظاهرة | `.env` |
| 5 | **IP مطور محلي مشفر** — `192.168.100.103` في ملفات ENV و public.service كـ `BACKEND_PUBLIC_URL` | ملفات `.env` في كل الأقسام |

### 2. أنظمة غير منفذة بالكامل

| # | النظام | التفاصيل |
|---|--------|----------|
| 1 | **انتهاء صلاحية الإعلانات** — `expireAdsJob` فارغ تماماً | `src/jobs/expireAds.ts` — كل الكود TODO comments فقط |
| 2 | **Push Notifications وهمية** — تستخدم `Math.random()` لمحاكاة النجاح بنسبة 90% — لا إشعارات حقيقية تُرسل | `push.service.ts` |
| 3 | **الدفع في الموبايل وهمي** — شاشة الدفع تستخدم `setTimeout` لمحاكاة النجاح — كود AFS الحقيقي مُعلق عليه | `app/company/payment.tsx` |
| 4 | **Cloudinary غير مفعل** — الإعداد مجرد object بدون SDK — الصور تُخزن على الديسك المحلي فقط | `src/config/cloudinary.ts` |

---

## 🟡 أقسام ناقصة أو بها مشاكل

### Backend API

| المشكلة | التفاصيل |
|---------|----------|
| **ملفات Services ميتة** | `property.service.ts` — كل الـ functions stubs بـ `"To be implemented"`. `upload.service.ts` — نفس الشيء |
| **i18n غير مستخدم** | ملفات `ar.json` و `en.json` في Backend موجودة لكن **لا تُستورد في أي مكان** — النصوص مكتوبة مباشرة في الكود |
| **utils/jwt.ts فارغ** | ملف فارغ — منطق JWT في `config/jwt.ts` |
| **validators قديمة** | ملف validators يستخدم أسماء حقول مختلفة عن الـ controllers الفعلية |
| **`adminLogin` يرجع HTTP 200 عند خطأ داخلي** | عند حدوث exception في `getAllIndividualProperties` يرجع بيانات فارغة بدلاً من 500 |
| **حذف الشركة بدون cascade** | `deleteCompany` لا يحذف الموظفين/العقارات/الصور المرتبطة — سيفشل بسبب FK constraints |
| **التحقق من صلاحية الأدوار معطل** | في `company.controller` يقارن `'owner'` (lowercase) بينما الأدوار في DB هي `'OWNER'` (uppercase) |
| **Pagination خاطئ** | في payment, boost, push controllers — `total` يساوي عدد العناصر في الصفحة وليس العدد الكلي |
| **ملف admin.controller.ts ضخم جداً** | 2808 سطر — يجب تقسيمه |
| **`logout` لا يفعل شيء** | لا يوجد token blacklisting — JWT يبقى صالح حتى انتهاء صلاحيته |
| **`refreshToken` لا يجدد التوكن** | يتحقق فقط من صلاحية التوكن الحالي بدون إصدار جديد |
| **AFS على Sandbox** | بوابة الدفع تشير إلى `sandbox-ipg.afs.com.kw` — تحتاج تحويل للإنتاج |
| **SMTP غير مُعد** | `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` كلها فارغة — إعادة تعيين كلمة المرور لن تعمل |
| **loginEmployee فيه inline logic** | يستخدم Prisma مباشرة بدلاً من auth.service — غير متسق مع باقي الكود |
| **registerIndividual لا يتحقق من الحقول** | لا يتحقق من phone, name, email — يمكن التسجيل ببيانات فارغة |
| **حذف admin بدون حماية** | لا يمنع حذف آخر super admin — يمكن حذف جميع الأدمنز |
| **updatePropertyDetails بدون whitelist** | يقبل أي حقول من body — يمكن تعديل أعمدة غير مسموح بها |
| **handleAfsCallback بدون تحقق** | Callback عام بدون التحقق من توقيع AFS أو IP |
| **Debug logging في createProperty** | يكتب debug logs إلى ملف على الديسك في كل عملية رفع |
| **Boost service WHERE clause bug** | يبني WHERE clause كـ string ثم يمررها لـ Prisma tagged template — لن تعمل بشكل صحيح |
| **Push service WHERE clause bug** | نفس مشكلة Boost service |
| **getCompanyPaymentsController pagination** | `total: payments.length` بدلاً من count query حقيقي |
| **Payment success redirect بدون verification** | تعليق يقول "In a real implementation, you'd verify" — التحقق غير منفذ |

### لوحة تحكم الأدمن (Next.js)

| المشكلة | التفاصيل |
|---------|----------|
| **أزرار Stub في إدارة الأدمنز** | حذف/تفعيل المستخدمين الأدمنز = `console.log("TODO")` |
| **أزرار Stub في موظفي الشركة** | toggle/delete الموظفين في صفحة تفاصيل الشركة = `console.log("TODO")` |
| **صفحة الإعدادات لا تحمل البيانات** | تبدأ بقيم ثابتة ولا تجلب الإعدادات الحالية من الـ API |
| **صفحة System لا تحمل البيانات** | نفس المشكلة — الحقول تبدأ فارغة |
| **الملف الشخصي للأدمن للقراءة فقط** | لا يوجد تعديل الاسم/الإيميل أو تغيير كلمة المرور |
| **صفحة root مكررة** | Dashboard قديم بأرقام ثابتة (24 شركة، 1247 عقار) — dead code |
| **`next-auth` مثبت لكن غير مستخدم** | المصادقة كلها يدوية عبر cookies |
| **Duplicate `getAllProperties` method** | مُعرّف مرتين في class الـ AdminApi |
| **Duplicate `ApiError` interface** | مُصدّر مرتين في نفس الملف |
| **Mixed API patterns** | بعض الميزات تتجاوز AdminApi class وتستخدم fetch مباشرة |
| **لا يوجد Error Boundary** | لا يوجد React Error Boundary للتعامل مع crashes |
| **لا يوجد data caching** | لا SWR/React Query — كل navigation يعيد جلب البيانات من الصفر |

### تطبيق الموبايل (Expo)

| المشكلة | التفاصيل |
|---------|----------|
| **🔴 شاشة الإشعارات وهمية 100%** | بيانات مشفرة مباشرة — لا اتصال بالـ API إطلاقاً |
| **🔴 شاشة الدفع وهمية** | `setTimeout` يحاكي النجاح — AFS معلق عليه |
| **🔴 شاشة Featured Packages معطلة** | أسعار مشفرة (5/8/12 BD) وزر الشراء يوجه إلى route غير موجود — **سيسبب crash** |
| **Location Picker لا يستخدم GPS** | يستخدم إحداثيات ثابتة لمركز البحرين بدلاً من `expo-location` |
| **سعر التمييز مشفر** | 1 BHD/يوم — غير مأخوذ من الـ API |
| **تقييم 4.8 مشفر** | في `FeaturedPlusCard` — لا يوجد نظام تقييمات |
| **زر المفضلة لا يعمل** | الـ heart icon لا يفعل شيء عند الضغط |
| **لغة الأوردو فارغة** | مُعرّفة كلغة مدعومة لكن تستخدم ترجمات إنجليزية |
| **Debug logs في كل مكان** | `console.log` للطلبات/الأخطاء/التنقل في الكود الإنتاجي |
| **تسجيل دخول شركة مكرر** | `company-login.tsx` (root) و `company/login.tsx` يستخدمان endpoints مختلفة |
| **Duplicate prop في edit property** | `editable` مكرر على حقل السعر |
| **Duplicate PropertyImage type** | معرّف في ملفين مختلفين |
| **Individual profile بدون صورة** | تعليق يقول "no image upload yet" |
| **Debug log لـ property 128** | كود debugging خاص بعقار محدد متروك في الكود |

---

## ✅ ما هو مكتمل ويعمل بشكل جيد

### Backend (Express + Prisma + PostgreSQL)
- ✅ تسجيل/تسجيل دخول الشركات مع الموظفين (Owner/Manager/Agent)
- ✅ تسجيل/تسجيل دخول الأفراد (Individual Users)
- ✅ CRUD كامل للعقارات (إضافة/تعديل/حذف/عرض) مع صور وفيديوهات متعددة
- ✅ نظام العقارات الفردية (Individual Properties) مع حالات متعددة (DRAFT → PENDING_ADMIN → SENT_TO_COMPANIES → ACTIVE/SOLD)
- ✅ توزيع العقارات على الشركات (distribute to ALL or SELECTED)
- ✅ نظام العروض (Company Offers) على عقارات الأفراد
- ✅ نظام الشكاوى (إنشاء/عرض/تحديث الحالة) — يدعم شكاوى الأفراد والشركات
- ✅ إدارة الموظفين (إضافة/تعديل/حذف/تعطيل) مع أدوار OWNER/MANAGER/AGENT
- ✅ نظام الحزم والاشتراكات (Subscription Packages CRUD)
- ✅ طلبات الاشتراك (إنشاء/موافقة/رفض)
- ✅ نظام الإعلانات (Ads CRUD + featured toggle + approve/reject)
- ✅ نظام السحوبات (Withdrawals — approve/reject)
- ✅ البحث المتقدم للعقارات (فلاتر: نوع، غرض، محافظة، منطقة، سعر، مساحة)
- ✅ نظام المحافظات والمناطق مع بذر البيانات (seed)
- ✅ رفع الملفات (Multer + disk storage) — صور وفيديوهات
- ✅ إعادة تعيين كلمة المرور (email flow مع SHA-256 tokens)
- ✅ نظام الإشعارات الداخلية (notifications in DB)
- ✅ نظام Featured Packages (إنشاء/إلغاء/تمديد)
- ✅ نظام Boost (إنشاء/إلغاء/تمديد/إحصائيات)
- ✅ نظام مستخدمي الأدمن (System Employees CRUD)
- ✅ Prisma schema شامل (554 سطر، 17+ model)
- ✅ Drizzle schema كـ بديل (218 سطر)
- ✅ Express 5 مع error handling و CORS

### لوحة تحكم الأدمن — Next.js (23 صفحة)
- ✅ Dashboard مع إحصائيات مباشرة من API
- ✅ إدارة الشركات (قائمة/تفاصيل/تغيير الحالة/حذف/CSV export)
- ✅ إدارة العقارات (قائمة معقدة ~2082 سطر مع فلاتر متعددة + bulk actions + preview modal + edit modal + countdown timers)
- ✅ إدارة عقارات الأفراد (~1384 سطر — عرض/تعديل/توزيع/رفض/بيع/عروض)
- ✅ إدارة الشكاوى مع modal تفصيلي يعرض الصور والفيديوهات
- ✅ إدارة الموظفين عبر كل الشركات (بحث/فلترة/تغيير حالة)
- ✅ إدارة الإعلانات (CRUD + featured toggle + approve/reject مع سبب)
- ✅ تفاصيل الإعلان (~837 سطر — صور/تعديل/حذف)
- ✅ إدارة السحوبات (قائمة + تفاصيل + موافقة/رفض)
- ✅ إدارة المدفوعات (عرض + بحث + فلترة)
- ✅ إدارة الحزم (CRUD كامل مع modal)
- ✅ طلبات الاشتراك (موافقة/رفض)
- ✅ إنشاء مستخدمي أدمن جدد
- ✅ نظام i18n كامل (عربي/إنجليزي ~878 سطر ترجمات) مع RTL
- ✅ Dark/Light mode
- ✅ Responsive design مع mobile sidebar
- ✅ Global search في topbar
- ✅ Expiring properties notification
- ✅ Cross-tab logout synchronization
- ✅ Custom AdminApi class (~1131 سطر)

### تطبيق الموبايل — Expo/React Native (28 شاشة)
- ✅ الصفحة الرئيسية مع FeaturedPlus carousel + side menu
- ✅ بحث العقارات مع فلاتر (محافظة/منطقة/نوع/غرض/سعر)
- ✅ تفاصيل العقار (gallery صور/فيديو + خريطة + معلومات + اتصال/واتساب + شكوى)
- ✅ لوحة تحكم الشركة (إحصائيات + quick actions)
- ✅ تسجيل شركة جديدة (مع رفع صورة CR)
- ✅ إضافة عقار للشركات (~1408 سطر — شامل جداً مع draft auto-save + drag-to-reorder + multi-video)
- ✅ تعديل العقار
- ✅ معاينة العقار قبل النشر
- ✅ قائمة عقارات الشركة مع فلاتر الحالة
- ✅ إدارة الموظفين (قائمة + إضافة)
- ✅ عقارات مميزة (قائمة + تمييز عقار)
- ✅ عروض العقارات الفردية (قائمة + تفاصيل + قبول/رفض)
- ✅ نظام الشكاوى (عامة + خاصة بشركة)
- ✅ الحزم والاشتراكات (عرض + طلب اشتراك)
- ✅ اشتراكاتي (سجل الاشتراكات)
- ✅ تسجيل/دخول الأفراد
- ✅ لوحة تحكم الأفراد (عقاراتي + حالة العروض من الشركات)
- ✅ إضافة عقار فردي (مع صور/فيديو + auto-save)
- ✅ ملف شخصي للأفراد (تعديل الاسم/الهاتف + تبديل اللغة)
- ✅ نسيت كلمة المرور + إعادة التعيين (شركات + أفراد)
- ✅ نظام i18n كامل (عربي/إنجليزي ~644 مفتاح) مع RTL
- ✅ Zustand state management (4 stores: auth, individualAuth, language, location)
- ✅ Dual auth system (شركات + أفراد مع tokens منفصلة)
- ✅ Axios interceptors ذكية (تكشف نوع المستخدم تلقائياً)
- ✅ Custom components (PropertyCard, BottomNav, Toast, SkeletonLoader, ModalSelector, etc.)
- ✅ MapWrapper مع web fallback

---

## 📊 ملخص نهائي — ما هو غير منفذ

| النظام | الحالة | الأولوية |
|--------|--------|----------|
| بوابة الدفع AFS (حقيقي) | ❌ غير منفذ (sandbox + كود معلق) | 🔴 عالية |
| Push Notifications (حقيقي) | ❌ وهمي (Math.random) | 🔴 عالية |
| انتهاء صلاحية الإعلانات (Cron Job) | ❌ فارغ تماماً | 🔴 عالية |
| Cloudinary لرفع الصور | ❌ Stub فقط | 🟡 متوسطة |
| شاشة الإشعارات في الموبايل | ❌ بيانات مشفرة | 🔴 عالية |
| شاشة Featured Packages في الموبايل | ❌ معطلة (crash) | 🔴 عالية |
| نظام المفضلة (Favorites) | ❌ غير موجود | 🟡 متوسطة |
| نظام التقييمات (Ratings) | ❌ غير موجود | 🟡 متوسطة |
| GPS حقيقي في Location Picker | ❌ إحداثيات ثابتة | 🟡 متوسطة |
| تعديل ملف الأدمن الشخصي | ❌ للقراءة فقط | 🟢 منخفضة |
| حذف/تعطيل مستخدمي الأدمن | ❌ TODO stubs | 🟡 متوسطة |
| إعدادات النظام (جلب البيانات) | ❌ لا تحمل القيم الحالية | 🟡 متوسطة |
| SMTP لإرسال الإيميلات | ❌ غير مُعد | 🔴 عالية |
| Token Blacklisting (Logout) | ❌ غير منفذ | 🟡 متوسطة |
| Refresh Token (حقيقي) | ❌ لا يجدد التوكن | 🟡 متوسطة |
| اختبارات وحدة (Unit Tests) | ❌ ملف واحد فقط (AFS e2e) | 🟡 متوسطة |

---

## 🗑️ Dead Code — أكواد ميتة يجب حذفها

| الملف | السبب |
|-------|-------|
| `src/services/property.service.ts` | كل الـ functions stubs — غير مستخدمة |
| `src/services/upload.service.ts` | كل الـ functions stubs — غير مستخدمة |
| `src/config/cloudinary.ts` | Stub بدون SDK — غير مستخدم |
| `src/utils/jwt.ts` | ملف فارغ — المنطق في `config/jwt.ts` |
| `src/utils/validators.ts` | أسماء حقول قديمة — غير مستخدمة |
| `src/i18n/ar.json` + `en.json` (backend) | لا تُستورد في أي مكان |
| `src/jobs/expireAds.ts` | فارغ — TODO فقط |
| `app/admin/` (dashboard) | Dashboard مكرر قديم |
| `app/page.tsx` (dashboard root) | أرقام ثابتة — dead code |
| ملفات test-*.js في root | ملفات اختبار يدوية متروكة |
| `check-*.js` في root | ملفات debug متروكة |
| `debug-*.js` في root | ملفات debug متروكة |
| `devserver.err.log` + `devserver.out.log` | ملفات log لا يجب أن تكون في المشروع |
| `prisma_output.txt` | ملف مؤقت |

---

## 🏗️ البنية التقنية

### Backend
- **Framework:** Express 5 + TypeScript
- **ORM:** Prisma (رئيسي) + Drizzle (بديل/قديم)
- **Database:** PostgreSQL (Neon Cloud)
- **Auth:** JWT (jsonwebtoken)
- **File Upload:** Multer (disk storage)
- **Payment:** AFS Gateway (sandbox)
- **Port:** 8000

### Admin Dashboard
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Auth:** Custom JWT (cookie + localStorage)
- **i18n:** Custom dictionary-based (EN + AR)
- **Port:** 3001

### Mobile App
- **Framework:** React Native (Expo SDK 54)
- **Router:** expo-router v6
- **State:** Zustand v5
- **i18n:** i18next (AR + EN)
- **HTTP:** Axios
- **Maps:** react-native-maps

### Database Schema (Prisma — 17+ Models)
- `Admin` — مستخدمي النظام
- `Company` — الشركات العقارية
- `CompanyEmployee` — موظفي الشركات (Owner/Manager/Agent)
- `Property` — العقارات
- `PropertyImage` — صور وفيديوهات العقارات
- `Complaint` — الشكاوى (أفراد + شركات)
- `Payment` — المدفوعات
- `PaymentTransaction` — معاملات الدفع (AFS)
- `Ad` — الإعلانات
- `Governorate` — المحافظات
- `Area` — المناطق
- `Setting` — الإعدادات
- `IndividualUser` — المستخدمين الأفراد
- `IndividualProperty` — عقارات الأفراد
- `IndividualPropertyImage` — صور عقارات الأفراد
- `IndividualPropertyVideo` — فيديوهات عقارات الأفراد
- `IndividualPropertyCompanyOffer` — عروض الشركات على عقارات الأفراد
- `SubscriptionPackage` — حزم الاشتراكات
- `SubscriptionRequest` — طلبات الاشتراك
- `PasswordReset` — إعادة تعيين كلمة المرور
- `Withdrawal` — السحوبات
