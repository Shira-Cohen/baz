/**
 * Illustrations that are inlined into the page instead of loaded as `<img>`.
 *
 * Inlining lets `public/styles.css` animate shapes inside each illustration
 * (hover reactions, the tiny idle motion). The files still live in
 * `public/previews/` and are bundled into the Worker as text by the `rules`
 * entry in `wrangler.jsonc`.
 *
 * To animate a new project's SVG, import it here and add it to the map under
 * the project's `id`. A project without an entry renders `image` as a plain
 * `<img>`, which is the right choice for PNG screenshots.
 */
import familyCalendar from "../public/previews/family-calendar.svg";
import familyReminders from "../public/previews/family-reminders.svg";
import vehicleCost from "../public/previews/vehicle-cost.svg";

export const inlinePreviews: Readonly<Record<string, string>> = {
  "family-calendar": familyCalendar,
  "family-reminders": familyReminders,
  "vehicle-cost": vehicleCost,
};
