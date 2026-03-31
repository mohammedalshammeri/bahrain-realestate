# 🚀 خطة تجهيز التطبيق لـ App Store & Google Play

> التاريخ: 29 مارس 2026  
> الحالة: **قيد التنفيذ**

---

## المرحلة 1: المتطلبات القانونية (إجبارية - ترفض التطبيق بدونها)

### 1.1 ✅ صفحة سياسة الخصوصية (Privacy Policy)
- **الملف**: `bahrain-realestate-mobile/app/privacy-policy.tsx`
- **المحتوى**: سياسة خصوصية كاملة (عربي + إنجليزي) تشمل:
  - ما هي البيانات التي نجمعها (الاسم، الإيميل، الهاتف، الموقع، صور العقارات)
  - كيف نستخدم البيانات
  - مع من نشارك البيانات
  - حقوق المستخدم (الوصول، التعديل، الحذف)
  - سياسة الكوكيز
  - معلومات التواصل
- **الربط**: إضافة رابط في شاشة التسجيل + شاشة البروفايل + app.json

### 1.2 ✅ صفحة الشروط والأحكام (Terms & Conditions)
- **الملف**: `bahrain-realestate-mobile/app/terms.tsx`
- **المحتوى**: شروط وأحكام كاملة (عربي + إنجليزي) تشمل:
  - شروط الاستخدام
  - المسؤوليات
  - حقوق الملكية الفكرية
  - سياسة الإلغاء والاسترجاع
  - القانون المعمول به (مملكة البحرين)
- **الربط**: ربط الـ checkbox الموجود في تسجيل الشركات + إضافة checkbox لتسجيل الأفراد

### 1.3 ✅ خاصية حذف الحساب (Account Deletion) — متطلب Apple الإجباري
- **الباكيند**:
  - `DELETE /api/auth/individual/delete-account` — حذف حساب الفرد
  - `DELETE /api/auth/company/delete-account` — حذف حساب الشركة
  - حذف جميع البيانات المرتبطة (العقارات، الصور، الشكاوى)
- **الموبايل**:
  - زر "حذف الحساب" في شاشة البروفايل للأفراد
  - زر "حذف الحساب" في لوحة الشركة
  - تأكيد بكلمة المرور قبل الحذف
  - شاشة تأكيد واضحة

---

## المرحلة 2: إصلاحات تقنية حرجة

### 2.1 ✅ إصلاح Release Signing (Android)
- إنشاء تعليمات لعمل release keystore
- تحديث `build.gradle` لاستخدام release signing config
- إضافة `keystore.properties` للـ gitignore

### 2.2 ✅ إضافة NSCameraUsageDescription (iOS)
- تحديث `app.json` → `ios.infoPlist` بإضافة:
  - `NSCameraUsageDescription`
  - `NSPhotoLibraryAddUsageDescription` (للحفظ)

### 2.3 ✅ تنظيف console.log
- حذف جميع `console.log` من كود الإنتاج
- إضافة babel plugin لحذفها تلقائياً في production

### 2.4 ✅ إعداد متغيرات البيئة للإنتاج
- إنشاء `.env.production` بـ API URL الحقيقي
- إنشاء `.env.example` كمرجع
- التأكد من أن `.env` موجود في `.gitignore`

---

## المرحلة 3: الاستقرار والحماية

### 3.1 ✅ إضافة Error Boundary
- **الملف**: `bahrain-realestate-mobile/src/components/ErrorBoundary.tsx`
- شاشة خطأ جميلة بدل crash
- زر "إعادة المحاولة"
- دعم عربي + إنجليزي

### 3.2 ✅ إضافة Crash Reporting (Sentry)
- تثبيت `@sentry/react-native`
- إعداد Sentry في `_layout.tsx`
- إضافة `sentry.properties` للـ gitignore

---

## المرحلة 4: الاختبارات

### 4.1 ✅ إعداد بيئة الاختبار
- تثبيت Jest + React Native Testing Library
- إنشاء `jest.config.js`
- إنشاء test setup file

### 4.2 ✅ اختبارات الوحدات (Unit Tests)
- اختبار `storage.ts` (تخزين التوكن)
- اختبار `url.ts` (تحويل الروابط)
- اختبار Auth stores (تسجيل الدخول/الخروج)

### 4.3 ✅ اختبارات المكونات (Component Tests)
- اختبار `Button` component
- اختبار `ErrorBoundary`
- اختبار شاشة تسجيل الدخول

---

## المرحلة 5: التجهيز النهائي

### 5.1 ✅ تحديث app.json للإنتاج
- التأكد من version و buildNumber
- إضافة `privacy` URL
- إضافة الـ plugins المطلوبة

### 5.2 ✅ إنشاء .env.example
- نموذج لملف البيئة بالقيم المطلوبة

### 5.3 ✅ تحديث README
- تعليمات Build للإنتاج
- تعليمات إنشاء Keystore
- تعليمات رفع للمتاجر

---

## ملخص الملفات المطلوب إنشاؤها/تعديلها

### ملفات جديدة:
| # | الملف | الغرض |
|---|-------|-------|
| 1 | `mobile/app/privacy-policy.tsx` | صفحة سياسة الخصوصية |
| 2 | `mobile/app/terms.tsx` | صفحة الشروط والأحكام |
| 3 | `mobile/src/components/ErrorBoundary.tsx` | معالج الأخطاء |
| 4 | `mobile/src/components/__tests__/Button.test.tsx` | اختبار الزر |
| 5 | `mobile/src/__tests__/storage.test.ts` | اختبار التخزين |
| 6 | `mobile/src/__tests__/url.test.ts` | اختبار الروابط |
| 7 | `mobile/jest.config.js` | إعداد Jest |
| 8 | `mobile/.env.example` | نموذج متغيرات البيئة |
| 9 | `backend/src/controllers/deleteAccount.controller.ts` | API حذف الحساب |
| 10 | `backend/src/routes/deleteAccount.routes.ts` | Routes حذف الحساب |

### ملفات معدّلة:
| # | الملف | التعديل |
|---|-------|---------|
| 1 | `mobile/app.json` | إضافة permissions + privacy URL |
| 2 | `mobile/app/individual/register.tsx` | إضافة checkbox الشروط |
| 3 | `mobile/app/individual/profile.tsx` | إضافة زر حذف الحساب |
| 4 | `mobile/app/company/register.tsx` | ربط checkbox بصفحة الشروط |
| 5 | `mobile/app/_layout.tsx` | إضافة ErrorBoundary + Sentry |
| 6 | `mobile/babel.config.js` | حذف console.log في production |
| 7 | `mobile/src/store/languageStore.ts` | تنظيف console.log |
| 8 | `mobile/src/store/locationStore.ts` | تنظيف console.log |
| 9 | `mobile/src/i18n/en.json` | إضافة نصوص Privacy + Terms + Delete |
| 10 | `mobile/src/i18n/ar.json` | إضافة نصوص Privacy + Terms + Delete |
| 11 | `android/app/build.gradle` | تحسين signing config |
| 12 | `mobile/package.json` | إضافة test scripts |

---

## ⏱️ الوقت المتوقع: تنفيذ فوري
## 🎯 الهدف: تطبيق جاهز 100% لمراجعة Apple و Google
