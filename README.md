# BAZ — אתר הבית

אתר הבית של BAZ: דף אחד שמציג את המוצרים שבנינו ומקשר לכל אחד מהם.
רץ כ-Cloudflare Worker בשם `baz`, ללא framework, ללא שלב build וללא JavaScript בצד הלקוח.

- כתובת: <https://bazy.co.il> (וגם <https://baz.s0527141201.workers.dev>)
- `www.bazy.co.il` מפנה ל-apex.

## איך זה בנוי

- `src/projects.ts` — **רשימת המוצרים.** זה הקובץ היחיד שצריך לגעת בו כדי להוסיף מוצר.
- `src/previews.ts` — רישום האיורים (SVG) שמוטמעים ישירות בדף כדי שה-CSS יוכל להזיז אלמנטים בתוכם.
- `src/render.ts` — מייצר את ה-HTML של הדף מתוך הרשימה. פונקציות טהורות, נבדקות ב-`npm test`. כל מחרוזת עוברת escaping.
- `src/index.ts` — ה-Worker: מגיש את `/`, מפנה `www` ל-apex, מחזיר 404 לכל נתיב אחר, ומוסיף security headers (CSP, HSTS ועוד).
- `public/` — קבצים סטטיים (CSS, איורים, favicon, robots). מוגשים ישירות על ידי Workers Static Assets לפני שה-Worker רץ. אין כאן `index.html` בכוונה.
- `wrangler.jsonc` — הגדרות ה-Worker, כולל ה-custom domains וכלל ה-`rules` שמאפשר לייבא SVG כטקסט.

## הוספת מוצר חדש

1. מוסיפים אובייקט ל-`projects` ב-`src/projects.ts`:

   ```ts
   {
     id: "my-product",                    // slug באנגלית, קטן, עם מקפים
     name: "השם של המוצר",
     description: "שורה אחת שמסבירה מה זה.",
     category: "Tools / Something",
     url: "https://my-product.example",   // חובה https://
     image: "/previews/my-product.svg",   // או .png
   }
   ```

2. שמים תמונת preview ב-`public/previews/` בפרופורציה 4:3 (SVG עם `viewBox="0 0 400 300"`, או צילום מסך PNG ‏800×600).
3. אם זה SVG ורוצים שהאיור יגיב ל-hover ויהיה "חי", מוסיפים אותו גם ל-`src/previews.ts` (שורת import ושורה במפה). בלי זה הוא יוצג כ-`<img>` רגיל, וזה בסדר גמור לצילומי מסך.
4. `npm test` — מוודא שהקונפיגורציה תקינה ושקובץ ה-preview קיים.
5. `npm run deploy`.

המספור (01, 02, ...) נקבע לפי סדר המערך. לא צריך לשנות שום דבר אחר.

## תנועה (motion)

הכול ב-CSS בלבד, ומכבד `prefers-reduced-motion`:

- כניסה לדף: הכותרת עולה ומופיעה, אחריה השורה שמתחת, ואז הנקודה הכתומה.
- גלילה: הכרטיסים מתגלים כשהם נכנסים למסך (scroll-driven animations, עם fallback שקט לדפדפנים בלי תמיכה).
- hover על כרטיס: הכרטיס עולה 3px, מקבל צל רך, החץ זז, ואלמנט בתוך האיור מגיב (בלוח: התמונה והיום המסומן; במזכיר: השורה המסומנת; במחשבון: הנקודה על המחוג והקטע הכתום).
- במנוחה: אלמנט אחד בכל איור נע 2px פעם בכמה שניות.

האלמנטים שנעים מסומנים ב-class עם קידומת `pv-` בתוך קובצי ה-SVG, וההתנהגות שלהם מוגדרת ב-`public/styles.css`.

## פקודות

```bash
npm install
npm run dev        # http://127.0.0.1:8787
npm run check      # wrangler types + TypeScript
npm test           # בדיקות
npm run screenshot # צילומי desktop/tablet/mobile + בדיקת console (דורש Chrome או Edge)
npm run deploy     # wrangler deploy
```

## הערות

- `compatibility_date` ב-`wrangler.jsonc` לא יכול להיות מאוחר מגרסת workerd המותקנת (`node_modules/workerd/package.json`), אחרת `wrangler dev` לא עולה.
- הפונט Heebo נטען מ-Google Fonts, כמו בשאר מוצרי BAZ. אפשר בעתיד לארח אותו מקומית ולצמצם את ה-CSP ל-`'self'` בלבד.
- האיורים הנוכחיים הם איורי SVG מופשטים, לא צילומי מסך של המוצרים.
- אין secrets בפרויקט ואין משתני סביבה להגדיר.
