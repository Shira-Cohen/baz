/**
 * Pure HTML rendering for the BAZ site. No runtime globals, so it is
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

/** Wordmark shown in the header and wherever "BAZ" appears in running Hebrew text. */
const SITE_NAME = "BAZ";
const PAGE_TITLE = "BAZ - רעיונות שהופכים למוצרים שימושיים";
const HERO_TITLE = "דברים קטנים שאנחנו בונים";
const HERO_INTRO = "כמה דברים ששווה להכיר.";
const SECTION_TITLE = "מה בנינו";
const CARD_CTA = "לכניסה";
const FOOTER_BUILT_BY = "נבנה על ידי";
const NOT_FOUND_TITLE = "הדף הזה לא קיים.";
const NOT_FOUND_CTA = "לדף הבית";
const CARD_SOON = "בקרוב";
const ABOUT_TEXT =
  "BAZ הוא המקום שבו צורך אמיתי הופך לרעיון, ורעיון הופך למוצר שימושי.";
const ABOUT_SUB = "פשוט לשימוש, נוח, ועם מחשבה על הפרטים.";
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

/** "BAZ" wrapped the way it always is in running Hebrew text: LTR, marked as English for screen readers. */
function brandSpan(): string {
  return `<span dir="ltr" lang="en">${SITE_NAME}</span>`;
}

/**
 * Renders a JSON-LD script element. `<` is escaped so a string value can
 * never prematurely close the element (e.g. a stray "</script>" inside a
 * title) — the data is trusted config today, but this holds regardless.
 */
function jsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
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
  ogImageOverride?: { src: string; width: number; height: number },
): string {
  const ogImage = new URL(versioned(ogImageOverride?.src ?? OG_IMAGE_PATH, assetVersion), canonicalUrl).href;
  const ogWidth = ogImageOverride?.width ?? 1200;
  const ogHeight = ogImageOverride?.height ?? 630;
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
<meta property="og:image:width" content="${ogWidth}">
<meta property="og:image:height" content="${ogHeight}">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
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
<span class="footer-credit">${FOOTER_BUILT_BY} ${brandSpan()}${mark}</span>
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

/** The hero: unchanged across every round of design work — the one thing kept fixed on purpose. */
function renderHeroSection(): string {
  return `<section class="hero container">
<h1 class="hero-title">${HERO_TITLE}<span class="accent">.</span></h1>
<p class="hero-intro">${HERO_INTRO}</p>
</section>`;
}

/** "What is BAZ": an asymmetric two-column editorial block — the question sits in its own narrow column, the answer in the main one. Sits between the project grid and the footer. */
function renderAboutSection(): string {
  return `<section class="about container" aria-labelledby="about-title">
<div class="about-grid">
<h2 id="about-title" class="about-label">מה זה<br>${brandSpan()}?</h2>
<div class="about-copy">
<p class="about-text">${escapeHtml(ABOUT_TEXT)}</p>
<p class="about-sub">${escapeHtml(ABOUT_SUB)}</p>
</div>
</div>
</section>`;
}

/** The project grid, reused by the homepage so the grid markup has one source. */
function renderProjectsSection(
  projects: readonly Project[],
  inlinePreviews: Readonly<Record<string, string>> | undefined,
): string {
  const items = projects.map((project, index) => renderProject(project, index, inlinePreviews)).join("\n");
  return `<section id="projects" class="projects container" aria-labelledby="projects-title">
<div class="section-head">
<h2 id="projects-title" class="section-title">${SECTION_TITLE}</h2>
<span class="section-count" dir="ltr"><span class="sr-only">מספר הפרויקטים: </span>${twoDigits(projects.length)}</span>
</div>
<ul class="project-grid">
${items}
</ul>
</section>`;
}

export function renderHome(projects: readonly Project[], options: RenderOptions): string {
  const description =
    "BAZ הוא בית למוצרים ופרויקטים שימושיים שנולדו מתוך צורך אמיתי. בין המוצרים שלנו: לוח שנה משפחתי, מערכת תזכורות, מחשבון הוצאות רכב ועוד.";

  const jsonLd = jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: options.canonicalUrl,
        description,
        inLanguage: "he-IL",
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: options.canonicalUrl,
        logo: new URL(versioned("/apple-touch-icon.png", undefined), options.canonicalUrl).href,
      },
      {
        "@type": "ItemList",
        itemListElement: projects
          .filter((p): p is Project & { localPath: string } => Boolean(p.localPath))
          .map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: new URL(p.localPath, options.canonicalUrl).href,
          })),
      },
    ],
  });

  const body = `${renderHeader()}
<main>
${renderHeroSection()}
${renderProjectsSection(projects, options.inlinePreviews)}
${renderAboutSection()}
</main>
${renderFooter(options)}`;

  return renderDocument(
    renderHead(PAGE_TITLE, description, options.canonicalUrl, options.assetVersion, `\n${jsonLd}`),
    body,
  );
}

/**
 * A small SEO landing page for one product (e.g. `/family-calendar`), linked
 * from the homepage's structured data and from `/sitemap.xml`. It explains
 * the product in BAZ's own words and sends the visitor on to the real app
 * at `project.url`. Reuses the product's homepage illustration for visual
 * continuity. See `Project.localPath` in `src/projects.ts`.
 */
export function renderProjectPage(project: Project, options: RenderOptions): string {
  const title = `${project.name} — ${SITE_NAME}`;
  const description = project.longDescription ?? project.description;
  const canonical = new URL(project.localPath ?? "/", options.canonicalUrl).href;

  const breadcrumbs = jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: new URL("/", options.canonicalUrl).href },
      { "@type": "ListItem", position: 2, name: project.name, item: canonical },
    ],
  });

  const preview = renderPreview(project, 0, options.inlinePreviews);

  // A real screenshot, shown under the illustration — concrete alongside the
  // abstract, so a visitor sees at a glance what the product actually looks
  // like. Demo data only (see `Project.screenshot`).
  const shot = project.screenshot
    ? `<figure class="product-shot">
<img src="${escapeHtml(versioned(project.screenshot.src, options.assetVersion))}" width="${project.screenshot.width}" height="${project.screenshot.height}" loading="lazy" decoding="async" alt="צילום מסך של ${escapeHtml(project.name)}">
<figcaption class="product-shot-caption">כך זה נראה בפועל (נתוני הדמיה להמחשה).</figcaption>
</figure>`
    : "";

  const body = `${renderHeader()}
<main class="container product-page">
<a class="card-cta product-back" href="/"><span>${NOT_FOUND_CTA}</span><span class="card-cta-arrow" aria-hidden="true">←</span></a>
<div class="product-head">
${preview}
<div class="product-head-text">
<span class="product-meta" dir="ltr" lang="en">${escapeHtml(project.category)}</span>
<h1 class="product-title">${escapeHtml(project.name)}</h1>
<p class="product-description">${escapeHtml(description)}</p>
<a class="product-cta" href="${escapeHtml(project.url)}"><span>להמשיך ל${escapeHtml(project.name)}</span><span class="card-cta-arrow" aria-hidden="true">←</span></a>
</div>
</div>
${shot}
</main>
${renderFooter(options)}`;

  return renderDocument(
    renderHead(title, description, canonical, options.assetVersion, `\n${breadcrumbs}`, project.screenshot),
    body,
  );
}

/** `/sitemap.xml` — the home page plus every project that has a `localPath`, kept in sync automatically. */
export function renderSitemap(projects: readonly Project[], canonicalUrl: string): string {
  const paths = ["/", ...projects.filter((p) => p.localPath).map((p) => p.localPath as string)];
  const urls = paths.map((path) => `<url><loc>${escapeHtml(new URL(path, canonicalUrl).href)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
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
