/**
 * The single source of truth for what BAZ has built.
 *
 * Adding a product = append one object here and drop its preview image in
 * `public/previews/`. Numbering (01, 02, ...) follows array order; nothing in
 * the UI knows about specific products.
 */
export interface Project {
  /** URL-safe slug. By convention also the preview file name: /previews/<id>.svg */
  id: string;
  /** Display name (Hebrew). */
  name: string;
  /** One short line, shown on the homepage card. */
  description: string;
  /**
   * A longer paragraph for the product's own landing page (see `localPath`).
   * Falls back to `description` when omitted.
   */
  longDescription?: string;
  /** Small label such as "Family / Calendar". Rendered left-to-right. */
  category: string;
  /** Absolute https:// URL of the product itself. Each product is its own deployment. */
  url: string;
  /** Site-relative path of the preview image (SVG or PNG), served from `public/`. */
  image: string;
  /**
   * "soon" shows the card without a link and with "בקרוב" instead of the
   * arrow, for a product that has a name but no address yet. Default: live.
   */
  status?: "live" | "soon";
  /**
   * Site-relative path of a small SEO landing page for this product (e.g.
   * "/family-calendar"), served by this Worker (see `renderProjectPage` in
   * `src/render.ts`). It explains the product and links out to `url`, and is
   * included in `/sitemap.xml` and the homepage's structured data. Omit if
   * the product doesn't have one yet.
   */
  localPath?: string;
  /**
   * A real screenshot of the product, shown on its landing page under the
   * illustration — concrete alongside the abstract. Width/height are the
   * image's actual pixel dimensions (avoids layout shift); also used as the
   * page's og:image for link previews. Demo data only — never a screenshot
   * containing a real user's personal data.
   */
  screenshot?: { src: string; width: number; height: number };
}

export const projects: Project[] = [
  {
    id: "family-calendar",
    name: "הלוח שלנו",
    description: "לוח שנה משפחתי שאפשר להכין בקלות.",
    longDescription:
      "לוח שנה משפחתי עם התאריכים והאירועים החשובים של המשפחה, מוכן להדפסה. כל שנה מתחילה מהתבנית הקיימת, כדי שלא צריך להתחיל מאפס.",
    category: "Family / Calendar",
    url: "https://family.bazy.co.il",
    image: "/previews/family-calendar.svg",
    localPath: "/family-calendar",
    // Not wired in yet: the uploaded screenshot (public/screens/family-calendar.webp)
    // is being served back as a "blocked by AI" placeholder — see conversation
    // with the user. Re-add `screenshot: { src: "/screens/family-calendar.webp",
    // width: 1100, height: 784 }` once a working replacement image is ready.
  },
  {
    id: "family-reminders",
    name: "המזכיר המשפחתי",
    description: "אנשים, אירועים ותזכורות במקום אחד.",
    longDescription:
      "תזכורת במייל לפני כל יום הולדת, יום נישואין ואזכרה, וביום עצמו, עם התמונה של האירוע. כל התזכורות של המשפחה במקום אחד.",
    category: "Family / Reminders",
    url: "https://family.bazy.co.il/reminders",
    image: "/previews/family-reminders.svg",
    localPath: "/family-reminders",
  },
  {
    id: "vehicle-cost",
    name: "מחשבון הוצאות רכב",
    description: "לחשב כמה הרכב באמת עולה.",
    longDescription:
      "מחשבון שמחשב את כל העלות האמיתית של הרכב: ירידת ערך, דלק והוצאות שנתיות, כדי לדעת כמה הרכב עולה בחודש ולא רק כמה שילמת עליו.",
    category: "Tools / Finance",
    url: "https://al-haderech.s0527141201.workers.dev",
    image: "/previews/vehicle-cost.svg",
    localPath: "/car-cost",
  },
];
