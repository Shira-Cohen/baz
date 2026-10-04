/**
 * BAZ site Worker.
 *
 * Static files in `public/` (CSS, previews, favicon, robots) are served by
 * Workers Static Assets before this code runs. Anything that is not a static
 * file lands here: `/` is the homepage; each project with a `localPath` gets
 * a small SEO landing page; `/sitemap.xml` is generated from the same project
 * list; `www.` redirects to the apex; everything else is a small 404 page.
 */
import { brandMark } from "./brand.ts";
import { inlinePreviews } from "./previews.ts";
import { projects } from "./projects.ts";
import { renderHome, renderMotionCheck, renderNotFound, renderProjectPage, renderSitemap } from "./render.ts";

const CANONICAL_HOST = "bazy.co.il";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const REDIRECT_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

const PROJECT_PAGES = new Map(projects.filter((p) => p.localPath).map((p) => [p.localPath as string, p]));

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy":
    "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

function htmlResponse(html: string, request: Request, status: number, cacheControl: string): Response {
  return new Response(request.method === "HEAD" ? null : html, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/html; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (REDIRECT_HOSTS.has(url.hostname)) {
      return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 301);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET, HEAD", "content-type": "text/plain; charset=utf-8" },
      });
    }

    // First 8 chars of the deployment version id; changes on every deploy.
    const versionId = env.CF_VERSION_METADATA?.id;
    const options = {
      year: new Date().getFullYear(),
      canonicalUrl: `${CANONICAL_ORIGIN}/`,
      inlinePreviews,
      assetVersion: versionId ? versionId.slice(0, 8) : undefined,
      brandMark,
    };

    if (url.pathname === "/") {
      // Short HTML cache so a deploy is visible within a minute; the versioned
      // stylesheet URL keeps HTML and CSS consistent with each other.
      return htmlResponse(renderHome(projects, options), request, 200, "public, max-age=60");
    }

    if (url.pathname === "/motion") {
      return htmlResponse(renderMotionCheck(options), request, 200, "no-store");
    }

    const project = PROJECT_PAGES.get(url.pathname);
    if (project) {
      return htmlResponse(renderProjectPage(project, options), request, 200, "public, max-age=300");
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(renderSitemap(projects, options.canonicalUrl), {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    return htmlResponse(renderNotFound(options), request, 404, "public, max-age=60");
  },
} satisfies ExportedHandler<Env>;
