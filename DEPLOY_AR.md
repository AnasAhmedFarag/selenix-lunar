# نشر SIGHTLINE على Vercel — خطوة بخطوة

المشروع مجهز لتشغيل خدمتين داخل مشروع Vercel واحد باستخدام **Vercel Services** (واجهة React من `frontend/` وFastAPI من `backend/`).

## المطلوب منك

1. اعمل حساب في GitHub: https://github.com ثم Vercel: https://vercel.com.
2. اعمل مستودع (Repository) جديد في GitHub، وارفع **محتويات هذا المجلد** بحيث يكون `vercel.json` في جذر المستودع.
3. في Vercel اضغط **Add New > Project**، واستورد مستودع GitHub.
4. **لازم** تختار `Framework Preset: Services` من Build Settings (أو Settings > Build and Deployment بعد إنشاء المشروع). ملف `vercel.json` يحدد الـFront-End والـBack-End والروابط تلقائيًا. اضغط Deploy.
5. اختبر `https://YOUR-PROJECT.vercel.app/` ثم `https://YOUR-PROJECT.vercel.app/api/health` ثم صفحة Compare Sites.

## الحفظ السحابي (اختياري لبدء النشر، لازم لميزة Saved Analyses)

- استخدم PostgreSQL سحابيًا، مثال Neon: https://neon.tech. أنشئ قاعدة بيانات واحصل على **connection string**.
- في Vercel، Project > Settings > Environment Variables أضف `DATABASE_URL` بقيمة الاتصال PostgreSQL، وفعّلها في Production ثم أعد النشر (Redeploy).
- الجداول الخاصة بالحفظ تُنشأ عند أول استدعاء. لا تضف DATABASE_URL إلى المشروع أو GitHub ولا ترسلها في المحادثة.
- لا يوجد تسجيل دخول. لكل متصفح رمز سري عشوائي محفوظ محليًا، وهو الذي يحدد التحليلات المحفوظة لهذا المتصفح. حذف بيانات المتصفح يفقد الوصول للتحليلات السابقة. للمزامنة بين الأجهزة نحتاج تسجيل دخول لاحقًا.
- بيانات NASA وأفق التضاريس محفوظة في ملف SQLite **للقراءة فقط** داخل التطبيق. `DATABASE_URL` مطلوب فقط لحفظ التحليلات على السحابة، وليس لتشغيل Compare Sites أو Analyze.

## ملاحظات

- لا ترفع ملفات إضافية بها أسرار أو كلمات مرور.
- هذه النسخة مبنية على SIGHTLINE v5 ونفس نموذجها العلمي الأولي. نسب Haworth لا تزال من نموذج مركز قرص الشمس، ولم تُستبدل بالنتائج التقريبية لمراجعة قرص الشمس.
- فقط أيام 1–7 من كل شهر 2028 متاحة، بدقة عينة كل ساعة.
- Python 3.12 مستخدم للخدمة الخلفية.
- إعداد Services حديث؛ إذا لم يظهر لك أو ظهر خطأ في بناء الخدمة، افتح Vercel deployment log وأرسل رسالة الخطأ بدون أسرار.
- المشروع على Vercel لم يتم نشره فعليًا من داخل هذه المحادثة؛ لازم تربط المستودع بحسابك وتضغط Deploy.

## SELENIX branding / Explore Sites image

- Added the supplied SELENIX logo at `frontend/public/selenix-logo.webp` for the sidebar and home page.
- Added the supplied annotated south-pole locations image at `frontend/public/lunar-south-pole-regions.webp`, displayed without grayscale filtering or cropping in Explore Sites.
- Candidate buttons underneath select the analysis preview; the reference image itself is not a clickable georeferenced map.
- The uploaded map labels Nobile Rim 2; this application dataset is Nobile Rim 1, and the Explore page explicitly flags that difference.
- Back-end, API routes and NASA scientific datasets were not altered.
