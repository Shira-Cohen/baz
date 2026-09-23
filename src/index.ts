/**
 * BAZ homepage Worker.
 *
 * Static files in `public/` (CSS, previews, favicon, robots) are served by
 * Workers Static Assets before this code runs. Anything that is not a static
 * file lands here: `/` is rendered from `src/projects.ts`, `www.` redirects to
 * the apex, everything else is a small 404 page.
 */
import { projects } from "./projects.ts";
import { renderHome, renderNotFound } from "./render.ts";

const CANONICAL_HOST = "bazy.co.il";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
const REDIRECT_HOSTS = new Set([`www.${CANONICAL_HOST}`]);

const SECURITY_HEADERS: Record<string, string> = {
  "content-security-policy":
    "default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
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
  async fetch(request): Promise<Response> {
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

    const options = { year: new Date().getFullYear(), canonicalUrl: `${CANONICAL_ORIGIN}/` };

    if (url.pathname === "/") {
      return htmlResponse(renderHome(projects, options), request, 200, "public, max-age=300");
    }

    return htmlResponse(renderNotFound(options), request, 404, "public, max-age=60");
  },
} satisfies ExportedHandler<Env>;
