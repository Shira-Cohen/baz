import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { escapeHtml, renderHome, renderMotionCheck, renderNotFound } from "../src/render.ts";
import { projects, type Project } from "../src/projects.ts";

const options = { year: 2026, canonicalUrl: "https://bazy.co.il/" };

test("escapeHtml escapes every HTML-significant character", () => {
  assert.equal(
    escapeHtml(`<a href="x">Tom & Jerry's</a>`),
    "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;",
  );
  assert.equal(escapeHtml("שלום"), "שלום");
});

test("project config is well-formed", () => {
  const ids = new Set<string>();
  for (const project of projects) {
    assert.ok(project.id.length > 0, "id required");
    assert.ok(!ids.has(project.id), `duplicate id ${project.id}`);
    ids.add(project.id);
    assert.match(project.id, /^[a-z0-9-]+$/, `id ${project.id} must be a lowercase slug`);
    assert.ok(project.url.startsWith("https://"), `${project.id}: url must be https://`);
    assert.ok(project.image.startsWith("/"), `${project.id}: image must be site-relative`);
    assert.ok(project.name.trim().length > 0, `${project.id}: name required`);
    assert.ok(project.description.trim().length > 0, `${project.id}: description required`);
    assert.ok(project.category.trim().length > 0, `${project.id}: category required`);
  }
});

test("every project preview file exists in public/", () => {
  for (const project of projects) {
    const file = fileURLToPath(new URL(`../public${project.image}`, import.meta.url));
    assert.ok(existsSync(file), `${project.id}: missing preview ${file}`);
  }
});

test("home page renders every project as one clickable card", () => {
  const html = renderHome(projects, options);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes('<html lang="he" dir="rtl">'));
  for (const project of projects) {
    assert.ok(html.includes(`<a class="card" href="${project.url}">`), `${project.id}: card link`);
    assert.ok(html.includes(`<img src="${project.image}"`), `${project.id}: preview image`);
    assert.ok(html.includes(project.name), `${project.id}: name`);
    assert.ok(html.includes(project.description), `${project.id}: description`);
    assert.ok(html.includes(project.category), `${project.id}: category`);
  }
  assert.ok(html.includes("© 2026"));
  assert.ok(html.includes('rel="canonical" href="https://bazy.co.il/"'));
});

test("cards are numbered in array order", () => {
  const html = renderHome(projects, options);
  const numbers = [...html.matchAll(/class="card-number" dir="ltr">(\d\d)</g)].map((m) => m[1]);
  assert.deepEqual(numbers, projects.map((_, i) => String(i + 1).padStart(2, "0")));
});

test("project fields are escaped in the output", () => {
  const hostile: Project = {
    id: "x",
    name: "<b>x</b>",
    description: `a & b "c"`,
    category: "C",
    url: "https://example.com/?a=1&b=2",
    image: "/previews/x.svg",
  };
  const html = renderHome([hostile], options);
  assert.ok(!html.includes("<b>x</b>"));
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(html.includes("a &amp; b &quot;c&quot;"));
  assert.ok(html.includes('href="https://example.com/?a=1&amp;b=2"'));
});

test("inline SVG previews replace the <img> only for registered projects", () => {
  const [first, second] = projects;
  assert.ok(first && second, "needs at least two projects");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect class="pv-test"/></svg>';
  const html = renderHome(projects, { ...options, inlinePreviews: { [first.id]: svg } });
  assert.ok(html.includes(`<span class="card-preview card-preview-inline" aria-hidden="true">${svg}</span>`));
  assert.ok(!html.includes(`<img src="${first.image}"`), "registered project must not also render an <img>");
  assert.ok(html.includes(`<img src="${second.image}"`), "unregistered project keeps the <img> fallback");
});

test("stylesheet URL carries the deployment version when one is known", () => {
  const plain = renderHome(projects, options);
  assert.ok(plain.includes('<link rel="stylesheet" href="/styles.css">'));
  const versioned = renderHome(projects, { ...options, assetVersion: "4e33d9e1" });
  assert.ok(versioned.includes('<link rel="stylesheet" href="/styles.css?v=4e33d9e1">'));
  assert.ok(renderNotFound({ ...options, assetVersion: "4e33d9e1" }).includes("/styles.css?v=4e33d9e1"));
});

test("/motion self-check page shows the deployment version and its own stylesheet", () => {
  const html = renderMotionCheck({ ...options, assetVersion: "ec3a0101" });
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(html.includes('href="/motion-check.css?v=ec3a0101"'));
  assert.ok(html.includes('class="mc-dot"'));
  assert.ok(html.includes('<dd dir="ltr">ec3a0101</dd>'));
});

test("404 page links back home", () => {
  const html = renderNotFound(options);
  assert.ok(html.includes("404"));
  assert.ok(html.includes('href="/"'));
});
