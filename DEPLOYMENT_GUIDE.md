# 🚀 بوابة عقارات البحرين — دليل النشر على Hostinger VPS

> دليل شامل خطوة بخطوة لنشر الخادم الخلفي ولوحة الإدارة على Hostinger VPS.

---

## البنية

```
  Hostinger VPS (Ubuntu)
  ├── Nginx (reverse proxy + SSL)
  ├── الخادم الخلفي   ← Express API   → المنفذ 8000
  ├── لوحة الإدارة    ← Next.js       → المنفذ 3000
  └── PM2 (مدير العمليات)
        
  Neon Cloud (خارجي)
  └── PostgreSQL ← قاعدة البيانات
  
  تطبيق الجوال (Expo) → يتصل بالخادم الخلفي عبر الإنترنت
```

---

## الخطوة ١: شراء وإعداد VPS من Hostinger

1. اذهب إلى [hostinger.com](https://www.hostinger.com/vps-hosting)
2. اختر خطة **KVM 2** أو أعلى (يُنصح بـ 2GB RAM كحد أدنى)
3. اختر نظام التشغيل: **Ubuntu 22.04 LTS**
4. بعد الإنشاء، ادخل لوحة تحكم Hostinger → **VPS** → ستجد:
   - **عنوان IP** الخاص بالسيرفر
   - **كلمة مرور root**

---

## الخطوة ٢: الاتصال بالسيرفر

```bash
ssh root@عنوان_IP_الخاص_بك
```

---

## الخطوة ٣: تثبيت البرامج المطلوبة

```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# التحقق
node -v   # يجب أن يظهر v20.x
npm -v

# تثبيت PM2 (مدير العمليات — يشغل التطبيق ويعيد تشغيله تلقائياً)
npm install -g pm2

# تثبيت Nginx (reverse proxy)
apt install -y nginx

# تثبيت Git
apt install -y git
```

---

## الخطوة ٤: رفع المشروع إلى السيرفر

### الطريقة أ: عبر Git (مُوصى بها)

```bash
cd /var/www
git clone رابط_المستودع_الخاص_بك bahrain-realestate
cd bahrain-realestate
```

### الطريقة ب: رفع يدوي بـ SCP

```bash
# من جهازك المحلي (ليس السيرفر):
scp -r C:\Users\mohammed\Desktop\bahrain-realestate root@عنوان_IP:/var/www/bahrain-realestate
```

---

## الخطوة ٥: إعداد الخادم الخلفي (Backend)

```bash
cd /var/www/bahrain-realestate/bahrain-realestate-backend

# تثبيت الاعتماديات
npm install

# إعداد ملف البيئة
nano .env
```

**محتوى `.env` للإنتاج:**

```env
# قاعدة البيانات (Neon Cloud — نفس الرابط الحالي)
DATABASE_URL="postgresql://neondb_owner:npg_dMR8ArvEPB5W@ep-mute-glitter-agn0t6ps.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# مفتاح JWT — غيّره لقيمة عشوائية قوية!
JWT_SECRET="ضع_هنا_مفتاح_عشوائي_طويل_وقوي"

# إعدادات السيرفر
PORT=8000
NODE_ENV=production
BACKEND_PUBLIC_URL=https://api.yourdomain.com

# CORS — نطاق لوحة الإدارة فقط
CORS_ORIGINS=https://admin.yourdomain.com

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=بريدك@gmail.com
SMTP_PASS=كلمة_مرور_التطبيق
SMTP_FROM=noreply@yourdomain.com
```

> 💡 لتوليد JWT_SECRET عشوائي:
> ```bash
> openssl rand -base64 64
> ```

```bash
# بناء المشروع
npm run build

# تشغيل ترحيل قاعدة البيانات
npx prisma db push

# اختبار التشغيل
node dist/src/index.js
# يجب أن يظهر: ✓ Server running on port 8000
# اضغط Ctrl+C للإيقاف

# تشغيل بواسطة PM2 (يعمل في الخلفية ويعيد التشغيل تلقائياً)
pm2 start dist/src/index.js --name bph-api
pm2 save
```

---

## الخطوة ٦: إعداد لوحة الإدارة (Admin Dashboard)

```bash
cd /var/www/bahrain-realestate/bahrain-realestate-frontend-admin-dashboard

# تثبيت الاعتماديات
npm install

# إعداد ملف البيئة
nano .env.local
```

**محتوى `.env.local`:**

```env
NEXT_PUBLIC_ADMIN_API_BASE_URL=https://api.yourdomain.com/api/admin
```

```bash
# بناء المشروع
npm run build

# تشغيل بواسطة PM2
pm2 start npm --name bph-admin -- start
pm2 save
```

---

## الخطوة ٧: إعداد PM2 للتشغيل التلقائي

```bash
# يجعل PM2 يعمل تلقائياً عند إعادة تشغيل السيرفر
pm2 startup
# سيطبع أمر — انسخه والصقه وشغّله

pm2 save

# للتحقق من الحالة:
pm2 status
```

**النتيجة المتوقعة:**
```
┌────┬──────────┬─────┬──────┬───────┐
│ id │ name     │ mode│ status│ cpu   │
├────┼──────────┼─────┼──────┼───────┤
│ 0  │ bph-api  │ fork│ online│ 0.3%  │
│ 1  │ bph-admin│ fork│ online│ 0.2%  │
└────┴──────────┴─────┴──────┴───────┘
```

---

## الخطوة ٨: ربط الدومين في Hostinger

1. ادخل لوحة تحكم **Hostinger** → **DNS Zone**
2. أضف سجلات A:

| النوع | الاسم | القيمة |
|---|---|---|
| A | `api` | عنوان IP السيرفر |
| A | `admin` | عنوان IP السيرفر |

> ⏳ انتظر 5-30 دقيقة حتى ينتشر DNS

---

## الخطوة ٩: إعداد Nginx + SSL

### إعداد Nginx

```bash
# إنشاء ملف إعداد للخادم الخلفي
nano /etc/nginx/sites-available/api.yourdomain.com
```

**الصق هذا المحتوى:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 5m;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# إنشاء ملف إعداد للوحة الإدارة
nano /etc/nginx/sites-available/admin.yourdomain.com
```

**الصق هذا المحتوى:**

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# تفعيل المواقع
ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/

# اختبار الإعداد
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
```

### تفعيل SSL (HTTPS مجاني)

```bash
# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# الحصول على شهادات SSL
certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com

# سيسألك عن بريدك الإلكتروني — أدخله
# اختر: Redirect HTTP to HTTPS

# التجديد التلقائي (يتم تلقائياً، لكن للتأكد):
certbot renew --dry-run
```

---

## الخطوة ١٠: إعداد تطبيق الجوال

عدّل ملف `.env` في مجلد `bahrain-realestate-mobile`:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

ثم أعد بناء التطبيق:

```bash
cd bahrain-realestate-mobile
eas build --platform android --profile production
```

---

## قائمة التحقق النهائية ✅

- [ ] `NODE_ENV=production` مضبوط
- [ ] `JWT_SECRET` قيمة عشوائية قوية (ليست الافتراضية!)
- [ ] `CORS_ORIGINS` يحتوي فقط على نطاق لوحة الإدارة
- [ ] `curl https://api.yourdomain.com/health` يُرجع `200`
- [ ] لوحة الإدارة تعمل على `https://admin.yourdomain.com`
- [ ] تطبيق الجوال يتصل بخادم الإنتاج
- [ ] SMTP مُعدّ ورسائل استعادة كلمة المرور تعمل
- [ ] SSL مُفعّل (القفل الأخضر 🔒)

---

## أوامر مفيدة للصيانة

```bash
# حالة التطبيقات
pm2 status

# سجلات الخادم الخلفي
pm2 logs bph-api --lines 50

# سجلات لوحة الإدارة
pm2 logs bph-admin --lines 50

# إعادة تشغيل بعد تحديث الكود
cd /var/www/bahrain-realestate/bahrain-realestate-backend
git pull
npm install && npm run build
pm2 restart bph-api

cd /var/www/bahrain-realestate/bahrain-realestate-frontend-admin-dashboard
git pull
npm install && npm run build
pm2 restart bph-admin

# مراقبة الموارد (CPU + RAM)
pm2 monit
```

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `502 Bad Gateway` | تأكد أن PM2 يعمل: `pm2 status` — إذا offline: `pm2 restart all` |
| خطأ `CORS` في المتصفح | تحقق أن `CORS_ORIGINS` يحتوي نطاق لوحة الإدارة بالضبط |
| `ERR_CONNECTION_REFUSED` | تأكد أن المنفذ مفتوح: `ufw allow 8000` |
| لوحة الإدارة فارغة | تحقق أن `NEXT_PUBLIC_ADMIN_API_BASE_URL` صحيح في `.env.local` |
| تطبيق الجوال لا يتصل | حدّث `EXPO_PUBLIC_API_URL` وأعد بناء التطبيق |
| فشل اتصال قاعدة البيانات | تحقق من `DATABASE_URL` — Neon Cloud لا تحتاج فتح منافذ |
