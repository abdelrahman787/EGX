# Thndr Companion — أداة اتخاذ قرار الاستثمار في الأسهم

تطبيق ويب شخصي يعمل كـ **أداة اتخاذ قرار** لمستثمر يتداول عبر منصة Thndr في البورصة المصرية (EGX).
ليس منصة تعليمية — المحتوى المعرفي (نسب مالية، مؤشرات فنية، رسوم/ضرائب) يظهر كسياق مساعد داخل لوحة مرجعية سريعة أثناء استخدام الأدوات.

> A personal, bilingual (Arabic/English, RTL-aware) stock-decision tool for Thndr / EGX traders.
> Frontend + Backend + SQLite, with an optional AI reflection assistant proxied securely through NaraRouter.

---

## المزايا / Features

- **Dashboard** — نظرة سريعة: عدد الأسهم، قيمة المحفظة، الربح/الخسارة، تنبيهات (اقتراب من الهدف/وقف الخسارة، تركّز مرتفع).
- **Decision Checklist** — نموذج قرار إلزامي: تحديد الهوية الاستثمارية، بيانات السهم، الأساس المنطقي، نقاط فحص، إدارة المخاطر + حاسبة حجم المركز، السيناريو السيء. تحذير تلقائي عند تناقض هوية البيع مع هوية الشراء المسجلة.
- **Portfolio & Goals Tracker** — جدول الأسهم مع حساب تلقائي للربح/الخسارة والوزن، أهداف مالية بمؤشر تقدم، وتنبيه تركّز الخطر.
- **Trading Journal** — تايم-لاين للقرارات، تفاصيل كاملة، حقل "مراجعة لاحقة"، وفلترة حسب النوع/الرمز/التاريخ.
- **Reference Panel** — لوحة مرجعية جانبية (Drawer) بعلامات تبويب: نسب مالية | تحليل فني | حاسبات تفاعلية | مصر و Thndr | الهوية الاستثمارية — مع بحث فوري.
- **AI Assistant (NaraRouter)** — تحليل نصي للتناقضات وتلخيص الـ Thesis، خلف Backend آمن. الفحوصات الحتمية (حجم المركز، تناقض الهوية) تعمل **بدون** مفتاح API.

## البنية التقنية / Stack

- **Backend**: Node.js + Express (ESM)
- **Database**: SQLite via `better-sqlite3` (ملف واحد `database.sqlite`)
- **Frontend**: Vanilla HTML/CSS/JS (بدون خطوة build) يُخدَّم من نفس السيرفر
- **AI**: NaraRouter (OpenAI-compatible chat completions) — المفتاح في `.env` فقط، لا يصل للمتصفح أبدًا

## التشغيل / Getting started

```bash
npm install
cp .env.example .env      # ثم عدّل القيم
npm start
```

ثم افتح: `http://localhost:3000`

### متغيرات البيئة (.env)

| المتغير | الوصف |
|---|---|
| `NARAROUTER_API_KEY` | مفتاح NaraRouter — سري، لا يُرفع لأي مكان عام. بدونه يعمل التطبيق مع الفحوصات الحتمية فقط. |
| `NARAROUTER_BASE_URL` | عنوان NaraRouter (متوافق مع OpenAI chat completions). |
| `NARAROUTER_MODEL` | النموذج الافتراضي (مثل `tencent-hy3` اقتصادي، أو `mistral-large` لتحليل أعمق). تغييره = سطر واحد. |
| `PORT` | منفذ السيرفر المحلي (افتراضي 3000). |

> **أمان**: ملف `.env` و`database.sqlite` مستثنيان في `.gitignore` ولا يُرفعان إطلاقًا.

## النشر لاحقًا (اختياري)

يمكن تشغيل السيرفر على جهاز Windows Server والوصول له عبر Tailscale من الموبايل أو أي جهاز آخر —
نفس منفذ `PORT`، مع الحفاظ على `.env` على السيرفر فقط.

## واجهة الـ API

| Method | Endpoint | الوصف |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/stocks` | إدارة أسهم المحفظة (مع حساب P/L والوزن). |
| GET/POST/DELETE | `/api/journal` | سجلات القرارات + فلترة. |
| PATCH | `/api/journal/:id/review` | إضافة المراجعة اللاحقة. |
| GET/POST/PUT/DELETE | `/api/goals` | الأهداف المالية. |
| GET/PUT | `/api/settings` | التفضيلات (اللغة، حدود المخاطر). |
| POST | `/api/assistant` | الفحوصات الحتمية + تحليل NaraRouter. |
| GET | `/api/health` | حالة السيرفر وهل المساعد مُفعّل. |

## ملاحظة مهمة / Disclaimer

هذا التطبيق أداة تنظيم ومساعدة في التفكير فقط، وليس توصية استثمارية أو ضمانًا لأي عائد. القرار النهائي دائمًا يعود للمستخدم.
الرسوم والضرائب في السوق المصري وThndr تتغير — تحقق دائمًا من [المصدر الرسمي](https://thndr.app/support/docs/egyptian-exchange-listed-stocks-etfs-en-en-en/egypt-transaction-fees/) قبل أي قرار.
