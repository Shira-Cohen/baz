# BAZ — אתר הבית

אתר הבית של BAZ: דף אחד שמציג את המוצרים שבנינו ומקשר לכל אחד מהם.
רץ כ-Cloudflare Worker בשם `baz`, ללא framework, ללא שלב build וללא JavaScript בצד הלקוח.

- **כתובת:** <https://bazy.co.il> (וגם <https://baz.s0527141201.workers.dev>)
- `www.bazy.co.il` מפנה ל-apex.

## תוכן

1. [הוספת מוצר חדש](#הוספת-מוצר-חדש) — המדריך שרוב האנשים מחפשים
2. [איך זה בנוי](#איך-זה-בנוי)
3. [תנועה (motion)](#תנועה-motion)
4. [פקודות](#פקודות)
5. [הערות](#הערות)

## הוספת מוצר חדש

זה השינוי הנפוץ ביותר, ודורש רק שני קבצים.

### שלב 1: להוסיף אובייקט ל-`src/projects.ts`

`src/projects.ts` הוא **המקום היחיד** שמגדיר אילו מוצרים מוצגים באתר. מוסיפים אובייקט לסוף המערך `projects`:

```ts
{
  id: "my-product",                     // slug: אנגלית, אותיות קטנות, מקפים בלבד
  name: "השם של המוצר",                  // שם תצוגה בעברית
  description: "שורה אחת שמסבירה מה זה.", // תיאור קצר, משפט אחד
  category: "Tools / Something",         // תווית קטנה, מוצגת LTR (למשל "Family / Calendar")
  url: "https://my-product.example",     // חובה https://, הכתובת האמיתית של המוצר
  image: "/previews/my-product.svg",     // preview, ראו שלב 2
}
```

שדה אופציונלי נוסף:

```ts
status: "soon",   // אם עדיין אין כתובת חיה: הכרטיס מוצג בלי קישור, עם "בקרוב" במקום החץ
```

בלי `status` (או עם `status: "live"`) המוצר מוצג ככרטיס לחיץ רגיל.

המספור (01, 02, 03...) נקבע **אוטומטית** לפי מיקום האובייקט במערך — מוצר חדש בסוף המערך מקבל את המספר הבא. אין צורך לגעת בשום קובץ אחר כדי שהמוצר "ידע" את המספר שלו.

### שלב 2: להכין תמונת preview

שמים קובץ ב-`public/previews/` בפרופורציה 4:3:

- **SVG** (מועדף): `viewBox="0 0 400 300"`, בלי `<text>` (רק צורות — `rect`, `circle`, `path`, `line`), עם טינט רקע עדין ולא יותר מ-2–3 צבעים. ראו את שלושת הקיימים ב-`public/previews/` לדוגמה של השפה הגרפית (רקע מוטנט, "מסך" לבן במרכז, אלמנטים מופשטים).
- **PNG**: 800×600 (או כל יחס 4:3), אם זה צילום מסך אמיתי.

### שלב 3 (אופציונלי): להפוך את ה-SVG ל"חי"

אם ה-preview הוא SVG ורוצים שהוא יגיב ל-hover ויזוז קלות במנוחה (כמו שלושת הקיימים):

1. פותחים את ה-SVG ומוסיפים `class` עם קידומת `pv-` לאלמנטים שצריכים לזוז (למשל `class="pv-my-thing-dot"`).
2. מוסיפים ל-`src/previews.ts`:
   ```ts
   import myProduct from "../public/previews/my-product.svg";
   // ...
   export const inlinePreviews: Readonly<Record<string, string>> = {
     "family-calendar": familyCalendar,
     // ...
     "my-product": myProduct,
   };
   ```
3. מוסיפים כללי אנימציה/hover ל-`public/styles.css` לפי ה-class שבחרתם (חפשו `pv-` לדוגמאות קיימות).

**בלי השלב הזה** ה-preview מוצג כ-`<img>` רגיל — וזה בסדר גמור, במיוחד לצילומי מסך PNG.

### שלב 4: לבדוק ולפרוס

```bash
npm test           # מוודא שהקונפיגורציה תקינה, שה-URL הוא https://, ושקובץ ה-preview קיים
npm run dev         # בדיקה מקומית ב-http://127.0.0.1:8787
npm run deploy      # wrangler deploy — עולה לאוויר על bazy.co.il
```

זהו. לא צריך לגעת ב-`src/render.ts`, ב-`src/index.ts`, ב-CSS (חוץ מה-hover האופציונלי), או בכל קובץ אחר.

### דוגמה מלאה — כך נראה `src/projects.ts` עם ארבעה מוצרים

```ts
export const projects: Project[] = [
  {
    id: "family-calendar",
    name: "הלוח שלנו",
    description: "לוח שנה משפחתי שאפשר להכין בקלות.",
    category: "Family / Calendar",
    url: "https://family.bazy.co.il",
    image: "/previews/family-calendar.svg",
  },
  {
    id: "family-reminders",
    name: "המזכיר המשפחתי",
    description: "אנשים, אירועים ותזכורות במקום אחד.",
    category: "Family / Reminders",
    url: "https://family.bazy.co.il/reminders",
    image: "/previews/family-reminders.svg",
  },
  {
    id: "vehicle-cost",
    name: "מחשבון הוצאות רכב",
    description: "לחשב כמה הרכב באמת עולה.",
    category: "Tools / Finance",
    url: "https://al-haderech.s0527141201.workers.dev",
    image: "/previews/vehicle-cost.svg",
  },
  {
    id: "my-product",              // <-- המוצר החדש, יקבל אוטומטית את המספר 04
    name: "השם של המוצר",
    description: "שורה אחת שמסבירה מה זה.",
    category: "Tools / Something",
    url: "https://my-product.example",
    image: "/previews/my-product.svg",
  },
];
```

## איך זה בנוי

| קובץ | תפקיד |
|---|---|
| `src/projects.ts` | **רשימת המוצרים.** הקובץ היחיד שצריך לגעת בו כדי להוסיף מוצר. |
| `src/previews.ts` | רישום האיורים (SVG) שמוטמעים ישירות בדף כדי שה-CSS יוכל להזיז אלמנטים בתוכם. |
| `src/render.ts` | מייצר את ה-HTML של הדף מתוך הרשימה. פונקציות טהורות, נבדקות ב-`npm test`. כל מחרוזת עוברת escaping. |
| `src/index.ts` | ה-Worker: מגיש את `/`, מפנה `www` ל-apex, מחזיר 404 לכל נתיב אחר, ומוסיף security headers (CSP, HSTS, Permissions-Policy ועוד). |
| `src/brand.ts` | טוען את סימן המותג (הבז) לשימוש בפוטר. |
| `public/brand/falcon.svg` | סימן המותג: בז יושב, בצבע אחד. משמש ב-favicon (`public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`) ובחותמת הקטנה בפוטר. |
| `public/fonts/` | Heebo מתארח באתר עצמו: פונט משתנה (100–900), קובץ לעברית וקובץ ללטינית, רישיון OFL מצורף. אין תלות ב-Google Fonts. |
| `public/og.png` | תמונת השיתוף (1200×630) שמופיעה כשמשתפים קישור בוואטסאפ או ברשתות. נוצרה מ-HTML קטן; אם הכותרת משתנה, כדאי לעדכן גם אותה. |
| `public/previews/` | תמונות ה-preview של המוצרים (SVG/PNG). |
| `public/` | קבצים סטטיים נוספים (CSS, favicon, robots, `_headers`). מוגשים ישירות על ידי Workers Static Assets לפני שה-Worker רץ. אין כאן `index.html` בכוונה — כך ש-`/` מגיע ל-Worker ומרונדר מ-`src/projects.ts`. |
| `wrangler.jsonc` | הגדרות ה-Worker: שם, custom domains, כלל ה-`rules` שמאפשר לייבא SVG כטקסט, ה-binding ל-`CF_VERSION_METADATA`. |
| `test/render.test.ts` | בדיקות יחידה: escaping, תקינות הקונפיגורציה, מספור, headers, ועוד. |
| `scripts/screenshot.mjs` | כלי לצילום המסך (desktop/tablet/mobile) ובדיקת שגיאות console, דרך Chrome headless. |

## תנועה (motion)

הכול ב-CSS בלבד. במצב "הפחתת תנועה" של המכשיר (`prefers-reduced-motion`) האתר נוהג כמו רוב האתרים: התנועה הקטנה נשארת, ורק התנועה הקשורה לגלילה מתבטלת (הכרטיסים מופיעים בלי לעלות, הכותרת לא נסחפת).

- **כניסה לדף:** הכותרת עולה ומופיעה, אחריה השורה שמתחת, ואז הנקודה הכתומה.
- **גלילה:** הכרטיסים מתגלים כשהם נכנסים למסך (scroll-driven animations, עם fallback שקט לדפדפנים בלי תמיכה).
- **hover על כרטיס:** הכרטיס עולה 3px, מקבל צל רך, החץ זז, ואלמנט בתוך האיור מגיב (בלוח: התמונה והיום המסומן; במזכיר: השורה המסומנת; במחשבון: פס התוצאה והקטע הכתום).
- **מגע (ללא hover):** הכרטיס מגיב ללחיצה עצמה (`:active`) במקום.
- **במנוחה:** חלק קטן בכל איור נע כל הזמן, לאט (בלוח: השמש צפה והנקודות הכתומות מהבהבות; במזכיר: איש הקשר המסומן צף, אריח התאריך "נושם" ונקודת התזכורת מהבהבת; במחשבון: המחוג נע והקשת עוקבת אחריו).

כל איור נושא רמז או שניים למוצר, בלי טקסט: בלוח משפחה בתמונה וסימוני אירועים בתאים; במזכיר אנשי קשר, אריחי תאריך ונקודת תזכורת; במחשבון מד עם מחוג ורכב קטן.

אם לא רואים תנועה במכשיר מסוים, **`bazy.co.il/motion`** הוא עמוד עזר (CSS בלבד, לא מקושר, noindex) שמראה אם הדפדפן מריץ אנימציות, אם המכשיר מבקש הפחתת תנועה, אם יש תמיכה באנימציות גלילה ו-hover, ומאיזו גרסה הדף הגיע.

ה-CSS נטען עם מזהה הגרסה של ה-deploy (`/styles.css?v=...`, מתוך ה-binding `CF_VERSION_METADATA`), כך שאחרי deploy הדפדפן לא ממשיך להשתמש ב-CSS ישן מה-cache.

האלמנטים שנעים מסומנים ב-class עם קידומת `pv-` בתוך קובצי ה-SVG, וההתנהגות שלהם מוגדרת ב-`public/styles.css`.

## פקודות

```bash
npm install
npm run dev         # http://127.0.0.1:8787
npm run check       # wrangler types + TypeScript
npm test            # בדיקות
npm run screenshot  # צילומי desktop/tablet/mobile + בדיקת console (דורש Chrome או Edge)
npm run deploy      # wrangler deploy — עולה לאוויר
npm run types       # מייצר מחדש worker-configuration.d.ts (אחרי שינוי ב-wrangler.jsonc)
```

## הערות

- `compatibility_date` ב-`wrangler.jsonc` לא יכול להיות מאוחר מגרסת workerd המותקנת (`node_modules/workerd/package.json`), אחרת `wrangler dev` לא עולה.
- ה-CSP מצומצם ל-`'self'` בלבד (אין משאבים חיצוניים בכלל). צבעי הטקסט המשני והקישורים נבחרו כך שיעברו ניגודיות 4.5:1 על רקע השמנת.
- האיורים הנוכחיים הם איורי SVG מופשטים, לא צילומי מסך של המוצרים.
- אין secrets בפרויקט ואין משתני סביבה להגדיר.
- **לפני deploy אמיתי לפרודקשן:** מומלץ להריץ `npm test && npm run check` ולבדוק מקומית עם `npm run dev`. `npm run deploy` פורס ישירות ל-`bazy.co.il` — אין סביבת staging נפרדת ל-Worker הזה.
