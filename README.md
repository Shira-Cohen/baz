# BAZ — אתר הבית

אתר הבית של BAZ: דף אחד שמציג את המוצרים שבנינו ומקשר לכל אחד מהם.
רץ כ-Cloudflare Worker בשם `baz`, ללא framework וללא שלב build.

- כתובת: <https://bazy.co.il> (וגם <https://baz.s0527141201.workers.dev>)
- `www.bazy.co.il` מפנה ל-apex.

## איך זה בנוי

- `src/projects.ts` — **רשימת המוצרים.** זה הקובץ היחיד שצריך לגעת בו כדי להוסיף מוצר.
- `src/render.ts` — מייצר את ה-HTML של הדף מתוך הרשימה. פונקציות טהורות, נבדקות ב-`npm test`. כל מחרוזת עוברת escaping.
- `src/index.ts` — ה-Worker: מגיש את `/`, מפנה `www` ל-apex, מחזיר 404 לכל נתיב אחר, ומוסיף security headers (CSP, HSTS ועוד).
- `public/` — קבצים סטטיים (CSS, תמונות preview, favicon, robots). מוגשים ישירות על ידי Workers Static Assets לפני שה-Worker רץ. אין כאן `index.html` בכוונה.
- `wrangler.jsonc` — הגדרות ה-Worker, כולל ה-custom domains.

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
3. `npm test` — מוודא שהקונפיגורציה תקינה ושקובץ ה-preview קיים.
4. `npm run deploy`.

המספור (01, 02, ...) נקבע לפי סדר המערך. לא צריך לשנות שום דבר אחר.

## פקודות

```bash
npm install
npm run dev        # http://127.0.0.1:8787
npm run check      # TypeScript
npm test           # בדיקות
npm run screenshot # צילומי desktop/tablet/mobile + בדיקת console (דורש Chrome או Edge)
npm run deploy     # wrangler deploy
```

`npm run types` מייצר מחדש את `worker-configuration.d.ts` אחרי שינוי ב-`wrangler.jsonc`.

## הערות

- `compatibility_date` ב-`wrangler.jsonc` לא יכול להיות מאוחר מגרסת workerd המותקנת (`node_modules/workerd/package.json`), אחרת `wrangler dev` לא עולה.
- הפונט Heebo נטען מ-Google Fonts, כמו בשאר מוצרי BAZ. אפשר בעתיד לארח אותו מקומית ולצמצם את ה-CSP ל-`'self'` בלבד.
- תמונות ה-preview הנוכחיות הן איורים מופשטים (SVG), לא צילומי מסך של המוצרים.
- אין secrets בפרויקט ואין משתני סביבה להגדיר.
