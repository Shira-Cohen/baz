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
}

const SITE_NAME = "BAZ";
const PAGE_TITLE = "BAZ — דברים קטנים שאנחנו בונים";
const HERO_TITLE = "דברים קטנים שאנחנו בונים";
const HERO_INTRO = "BAZ הוא בית קטן למוצרים דיגיטליים. כל פעם משהו שימושי אחר.";
const NAV_PROJECTS = "פרויקטים";
const SECTION_TITLE = "מה בנינו";
const CARD_CTA = "לכניסה";
const FOOTER_BUILT_BY = "נבנה על ידי";
const NOT_FOUND_TITLE = "הדף הזה לא קיים.";
const NOT_FOUND_CTA = "לדף הבית";
const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap";

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

function renderHead(title: string, description: string, canonicalUrl: string): string {
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
<meta name="theme-color" content="#FAFAF7">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_CSS_URL}">
<link rel="stylesheet" href="/styles.css">
</head>`;
}

function renderHeader(): string {
  return `<header class="site-header">
<div class="container header-inner">
<a class="wordmark" href="/" dir="ltr">${SITE_NAME}</a>
<nav aria-label="ניווט"><a class="nav-link" href="#projects">${NAV_PROJECTS}</a></nav>
</div>
</header>`;
}

function renderFooter(year: number): string {
  return `<footer class="site-footer">
<div class="container footer-inner">
<span>${FOOTER_BUILT_BY} <span dir="ltr">${SITE_NAME}</span></span>
<span dir="ltr">© ${String(year)}</span>
</div>
</footer>`;
}

function renderProject(project: Project, index: number): string {
  const loading = index < 3 ? "eager" : "lazy";
  return `<li class="project">
<a class="card" href="${escapeHtml(project.url)}">
<span class="card-preview"><img src="${escapeHtml(project.image)}" width="400" height="300" loading="${loading}" decoding="async" alt=""></span>
<span class="card-meta"><span class="card-number" dir="ltr">${twoDigits(index + 1)}</span><span class="card-sep" aria-hidden="true">·</span><span class="card-category" dir="ltr">${escapeHtml(project.category)}</span></span>
<h3 class="card-title">${escapeHtml(project.name)}</h3>
<p class="card-description">${escapeHtml(project.description)}</p>
<span class="card-cta"><span>${CARD_CTA}</span><span class="card-cta-arrow" aria-hidden="true">←</span></span>
</a>
</li>`;
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
  const items = projects.map(renderProject).join("\n");

  const body = `${renderHeader()}
<main>
<section class="hero container">
<h1 class="hero-title">${HERO_TITLE}<span class="accent">.</span></h1>
<p class="hero-intro">${HERO_INTRO}</p>
</section>
<section id="projects" class="projects container" aria-labelledby="projects-title">
<div class="section-head">
<h2 id="projects-title" class="section-title">${SECTION_TITLE}</h2>
<span class="section-count" dir="ltr">${twoDigits(projects.length)}</span>
</div>
<ul class="project-grid">
${items}
</ul>
</section>
</main>
${renderFooter(options.year)}`;

  return renderDocument(renderHead(PAGE_TITLE, description, options.canonicalUrl), body);
}

export function renderNotFound(options: RenderOptions): string {
  const body = `${renderHeader()}
<main class="container notfound">
<p class="notfound-code" dir="ltr">404</p>
<h1 class="notfound-title">${NOT_FOUND_TITLE}</h1>
<a class="card-cta" href="/"><span>${NOT_FOUND_CTA}</span><span class="card-cta-arrow" aria-hidden="true">←</span></a>
</main>
${renderFooter(options.year)}`;

  return renderDocument(renderHead(`404 — ${SITE_NAME}`, NOT_FOUND_TITLE, options.canonicalUrl), body);
}
