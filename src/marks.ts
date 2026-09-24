/**
 * Candidate brand marks for BAZ (בז = falcon), shown on the `/marks` review
 * page. Each SVG uses `fill="currentColor"` so the page can show it in ink,
 * terracotta and on a dark tile. Remove this file and the route once a mark is
 * chosen and applied to the favicon and footer.
 */
import type { MarkVariant } from "./render.ts";
import head from "../public/marks/falcon-head.svg";
import perched from "../public/marks/falcon-perched.svg";
import flight from "../public/marks/falcon-stoop.svg";

export const markVariants: readonly MarkVariant[] = [
  {
    id: "perched",
    name: "בז יושב",
    note: "פרופיל מלא: מקור מאונקל, גוף חלק, זנב באלכסון. הגרסה שהיא הכי 'ציפור'.",
    svg: perched,
  },
  {
    id: "flight",
    name: "בז במעוף",
    note: "הצללית מלמטה: כנפיים חרמשיות שנמשכות אחורה וגוף צר. זו הצללית שלפיה מזהים בז בשמיים.",
    svg: flight,
  },
  {
    id: "head",
    name: "ראש בז",
    note: "ראש בפרופיל, מקור ועין. הצורה הבולטת ביותר בגודל קטן, קצת יותר 'דמות'.",
    svg: head,
  },
];
