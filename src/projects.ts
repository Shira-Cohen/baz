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
  /** One short line. */
  description: string;
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
}

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
];
