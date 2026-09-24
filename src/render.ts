/**
 * Pure HTML rendering for the BAZ homepage. No runtime globals, so it is
 * unit-testable with plain Node (`npm test`).
 *
 * Every string that reaches the markup goes through `escapeHtml`, including
 * attribute values, even though the config is trusted.
 */
import type { Project } from "./projects.ts";

export interface RenderOptions {
  /** Year shown in the footer. */
  year: number;
  /** Absolute canonical URL of the home page. */
  canonicalUrl: string;
  /**
   * Inline SVG markup by project id (see `src/previews.ts`). A project listed
   * here gets its illustration inlined so the page CSS can animate elements
   * inside it; any other project falls back to a plain `<img src=image>`.
   */
  inlinePreviews?: Readonly<Record<string, string>>;
  /**
   * Short identifier of the current deployment, appended to the stylesheet URL
   * as a cache-buster so a new deploy never pairs new HTML with stale CSS.
   */
  assetVersion?: string;
  /** Inline SVG of the brand mark (fill="currentColor"), shown in the footer when provided. */
  brandMark?: string;
}

/** Wordmark shown in the header and in the footer credit. */
const SITE_NAME = "BAZ";
const PAGE_TITLE = "BAZ — דברים קטנים שאנחנו בונים";
const HERO_TITLE = "דברים קטנים שאנחנו בונים";
const HERO_INTRO = "כמה דברים ששווה להכיר.";
const SECTION_TITLE = "מה בנינו";
const CARD_CTA = "לכניסה";
const FOOTER_BUILT_BY = "נבנה על ידי";
const NOT_FOUND_TITLE = "הדף הזה לא קיים.";
const NOT_FOUND_CTA = "לדף הבית";
const CARD_SOON = "בקרוב";
/** Self-hosted Heebo (variable weight, OFL) — one file per script, preloaded for the first paint. */
const FONT_FILES = ["/fonts/heebo-hebrew.woff2", "/fonts/heebo-latin.woff2"];
const OG_IMAGE_PATH = "/og.png";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}

/** Appends the deployment version to a static asset path so caches refresh per deploy. */
function versioned(path: string, assetVersion: string | undefined): string {
  return assetVersion ? `${path}?v=${encodeURIComponent(assetVersion)}` : path;
}

function stylesheetHref(assetVersion: string | undefined): string {
  return versioned("/styles.css", assetVersion);
}

function renderHead(
  title: string,
  description: string,
  canonicalUrl: string,
  assetVersion: string | undefined,
  extra = "",
): string {
  const ogImage = new URL(versioned(OG_IMAGE_PATH, assetVersion), canonicalUrl).href;
  const preloads = FONT_FILES.map(
    (f) => `\n<link rel="preload" href="${escapeHtml(f)}" as="font" type="font/woff2" crossorigin>`,
  ).join("");
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:locale" content="he_IL">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(PAGE_TITLE)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FAFAF7">${preloads}
<link rel="icon" href="${escapeHtml(versioned("/favicon.svg", assetVersion))}" type="image/svg+xml">
<link rel="icon" href="${escapeHtml(versioned("/favicon-32.png", assetVersion))}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${escapeHtml(versioned("/apple-touch-icon.png", assetVersion))}">
<link rel="stylesheet" href="${escapeHtml(stylesheetHref(assetVersion))}">${extra}
</head>`;
}

function renderHeader(): string {
  return `<header class="site-header">
<div class="container header-inner">
<a class="wordmark" href="/" dir="ltr" lang="en">${SITE_NAME}</a>
</div>
</header>`;
}

function renderFooter(options: RenderOptions): string {
  // First-party SVG from this repo (src/brand.ts), inlined verbatim.
  const mark = options.brandMark
    ? `<span class="footer-mark" aria-hidden="true">${options.brandMark}</span>`
    : "";
  return `<footer class="site-footer">
<div class="container footer-inner">
<span class="footer-credit">${FOOTER_BUILT_BY} <span dir="ltr" lang="en">${SITE_NAME}</span>${mark}</span>
<span dir="ltr">© ${String(options.year)}</span>
</div>
</footer>`;
}

function renderPreview(
  project: Project,
  index: number,
  inlinePreviews: Readonly<Record<string, string>> | undefined,
): string {
  const inline = inlinePreviews?.[project.id];
  if (inline !== undefined) {
    // First-party SVG bundled from this repo at deploy time (not config or user
    // input), inlined verbatim so CSS can reach the shapes inside it.
    return `<span class="card-preview card-preview-inline" aria-hidden="true">${inline}</span>`;
  }
  const loading = index < 3 ? "eager" : "lazy";
  return `<span class="card-preview"><img src="${escapeHtml(project.image)}" width="400" height="300" loading="${loading}" decoding="async" alt=""></span>`;
}

function renderProject(
  project: Project,
  index: number,
  inlinePreviews: Readonly<Record<string, string>> | undefined,
): string {
  const soon = project.status === "soon";
  const cta = soon
    ? `<span class="card-cta card-cta-soon"><span>${CARD_SOON}</span></span>`
    : `<span class="card-cta"><span>${CARD_CTA}</span><span class="card-cta-arrow" aria-hidden="true">←</span></span>`;
  const inner = `${renderPreview(project, index, inlinePreviews)}
<div class="card-body">
<span class="card-meta"><span class="card-number" dir="ltr">${twoDigits(index + 1)}</span><span class="card-sep" aria-hidden="true">·</span><span class="card-category" dir="ltr" lang="en">${escapeHtml(project.category)}</span></span>
<h3 class="card-title">${escapeHtml(project.name)}</h3>
<p class="card-description">${escapeHtml(project.description)}</p>
${cta}
</div>`;
  // A product that is not live yet is shown as a card without a link.
  const card = soon
    ? `<div class="card card-soon">\n${inner}\n</div>`
    : `<a class="card" href="${escapeHtml(project.url)}">\n${inner}\n</a>`;
  return `<li class="project">\n${card}\n</li>`;
}

function renderDocument(head: string, body: string): string {
  return `<!doctype html>
<html lang="he" dir="rtl">
${head}
<body>
${body}
</body>
</html>
`;
}

export function renderHome(projects: readonly Project[], options: RenderOptions): string {
  const names = projects.map((p) => p.name).join(", ");
  const description = `${SITE_NAME} הוא בית קטן למוצרים דיגיטליים: ${names}.`;
  const items = projects
    .map((project, index) => renderProject(project, index, options.inlinePreviews))
    .join("\n");

  const body = `${renderHeader()}
<main>
<section class="hero container">
<h1 class="hero-title">${HERO_TITLE}<span class="accent">.</span></h1>
<p class="hero-intro">${HERO_INTRO}</p>
</section>
<section id="projects" class="projects container" aria-labelledby="projects-title">
<div class="section-head">
<h2 id="projects-title" class="section-title">${SECTION_TITLE}</h2>
<span class="section-count" dir="ltr"><span class="sr-only">מספר הפרויקטים: </span>${twoDigits(projects.length)}</span>
</div>
<ul class="project-grid">
${items}
</ul>
</section>
</main>
${renderFooter(options)}`;

  return renderDocument(
    renderHead(PAGE_TITLE, description, options.canonicalUrl, options.assetVersion),
    body,
  );
}

/**
 * `/motion`: a small CSS-only self-check page. It tells the visitor whether
 * this browser runs the site's animations and, if not, why (reduced-motion
 * setting, missing scroll-animation support, touch-only device) and which
 * deployment the page came from. Not linked from anywhere; noindex.
 */
export function renderMotionCheck(options: RenderOptions): string {
  const version = options.assetVersion ?? "dev";
  const checkCss = options.assetVersion
    ? `/motion-check.css?v=${encodeURIComponent(options.assetVersion)}`
    : "/motion-check.css";
  const extra = `
<meta name="robots" content="noindex">
<link rel="stylesheet" href="${escapeHtml(checkCss)}">`;

  const body = `${renderHeader()}
<main class="container motion-check">
<p class="notfound-code"><span dir="ltr">/motion</span></p>
<h1 class="notfound-title">בדיקת תנועה</h1>
<p class="mc-lead">עמוד עזר: מראה אם הדפדפן במכשיר הזה מריץ את האנימציות של האתר, ואם לא, למה.</p>
<dl class="mc-list">
<div class="mc-row"><dt>אנימציות CSS</dt><dd><span class="mc-track" aria-hidden="true"><span class="mc-dot"></span></span><span class="mc-note">אם הנקודה נעה מצד לצד, אנימציות עובדות כאן.</span></dd></div>
<div class="mc-row"><dt>הפחתת תנועה במכשיר</dt><dd><span class="mc-rm-on">פעילה. המכשיר מבקש מאתרים להפחית תנועה. האתר משאיר את התנועה הקטנה (איורים, hover, כניסה) ומבטל רק תנועה שקשורה לגלילה: הכרטיסים מופיעים בלי לעלות והכותרת לא נסחפת. אפשר לשנות בהגדרות הנגישות של המכשיר (ב-Windows: אפקטי אנימציה; ב-iPhone: Reduce Motion).</span><span class="mc-rm-off">לא פעילה.</span></dd></div>
<div class="mc-row"><dt>אנימציות גלילה</dt><dd><span class="mc-sda-yes">נתמכות בדפדפן הזה.</span><span class="mc-sda-no">לא נתמכות בדפדפן הזה, ולכן הכרטיסים מוצגים בלי אפקט הגילוי בגלילה.</span></dd></div>
<div class="mc-row"><dt>עכבר (hover)</dt><dd><span class="mc-hover-yes">יש. <span class="mc-box" aria-hidden="true"></span> העבירו את העכבר על הריבוע: הוא צריך לעלות ולהיצבע.</span><span class="mc-hover-no">אין (מסך מגע). תגובות hover לא רלוונטיות במכשיר הזה.</span></dd></div>
<div class="mc-row"><dt>גרסת הדף</dt><dd dir="ltr">${escapeHtml(version)}</dd></div>
</dl>
<a class="card-cta" href="/"><span>לדף הבית</span><span class="card-cta-arrow" aria-hidden="true">←</span></a>
</main>
${renderFooter(options)}`;

  return renderDocument(
    renderHead(`בדיקת תנועה — ${SITE_NAME}`, "בדיקת תנועה", options.canonicalUrl, options.assetVersion, extra),
    body,
  );
}

export function renderNotFound(options: RenderOptions): string {
  const body = `${renderHeader()}
<main class="container notfound">
<p class="notfound-code"><span dir="ltr">404</span></p>
<h1 class="notfound-title">${NOT_FOUND_TITLE}</h1>
<a class="card-cta" href="/"><span>${NOT_FOUND_CTA}</span><span class="card-cta-arrow" aria-hidden="true">←</span></a>
</main>
${renderFooter(options)}`;

  return renderDocument(
    renderHead(`404 — ${SITE_NAME}`, NOT_FOUND_TITLE, options.canonicalUrl, options.assetVersion),
    body,
  );
}
