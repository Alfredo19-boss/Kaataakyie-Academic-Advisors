#!/usr/bin/env node
/**
 * One set of sources, three outputs.
 *
 *   dist/index.html    the advisor platform, as a Claude artifact.
 *                      No <!doctype>/<html>/<head>/<body> — the artifact host supplies those.
 *                      It needs the artifact runtime for its database, so it is NOT a static page.
 *
 *   dist/public.html   the public planner, as a Claude artifact. Same rule about the skeleton.
 *
 *   site/              the public planner as a real, standalone website — a complete HTML
 *                      document with its own head, social preview tags and favicon.
 *                      This is what GitHub Pages (or Netlify, or any static host) serves.
 *
 *   dev/preview.html   the platform for local work, in front of dev/harness.js, which fakes
 *                      the runtime so it has a database and sample records.
 *
 * Settings for the standalone site come from site.config.json. No dependencies. Node 18+.
 *   node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const bundle = (files) => `<script>\n${files.map(read).join("\n")}\n</script>`;
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";

const cfg = JSON.parse(read("site.config.json"));
const siteUrl = String(cfg.siteUrl || "").replace(/\/+$/, "");
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------------------------------- the advisor platform ---------------------------------- */
/* Order matters: data globals first, then core (window.NB), then the views that consume it. */
const body = [
  read("src/shell.html"),
  bundle(["src/data/schools.js", "src/data/content.js"]),
  bundle(["src/app/core.js"]),
  bundle(["src/app/views.js"]),
].join("\n");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), body + "\n");

/* ---------------------------------- the public planner ---------------------------------- */
const siteSettings = (demoUrl) => `<script>window.NB_SITE=${JSON.stringify({
  org: cfg.org || "",
  contactEmail: cfg.contactEmail || "",
  portalUrl: cfg.portalUrl || "",
  demoUrl,
})};</script>`;

const publicBody = [
  siteSettings(""),
  read("public/shell.html"),
  bundle(["src/data/schools.js", "src/data/content.js"]),
  bundle(["public/app.js"]),
].join("\n");
writeFileSync(join(root, "dist/public.html"), publicBody + "\n");

/* ---------------------------------- the standalone website ---------------------------------- */
/* A gold K on near-black, inline so the page carries its own icon with no extra request. */
const favicon =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
      '<rect width="40" height="40" rx="9" fill="#15120B"/>' +
      '<path d="M14 10v20M14 20.2 24.5 10M14 19.8 24.5 30" fill="none" stroke="#D9B441" ' +
      'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  );

const title = `${cfg.org || "Katakyie Advisors"} — The US Master's Planner`;
const desc =
  cfg.tagline ||
  "A free planner for international applicants to US master's programmes: the eighteen-month timeline, every US institution that awards a master's, and the traps that sink finished applications.";

const sitePublicBody = [
  siteSettings("demo/"),
  read("public/shell.html"),
  bundle(["src/data/schools.js", "src/data/content.js"]),
  bundle(["public/app.js"]),
].join("\n");

const site = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0A0908">
<link rel="icon" href="${favicon}">
${siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}/">` : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
${siteUrl ? `<meta property="og:url" content="${esc(siteUrl)}/">` : ""}
${siteUrl ? `<meta property="og:image" content="${esc(siteUrl)}/social.png">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${siteUrl ? `<meta name="twitter:image" content="${esc(siteUrl)}/social.png">` : ""}
<style>
  /* The artifact host injects a small reset; a standalone page has to carry its own. */
  :root { color-scheme: dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  body { margin: 0; background: #0A0908; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
${sitePublicBody}
</body>
</html>
`;

mkdirSync(join(root, "site"), { recursive: true });
writeFileSync(join(root, "site/index.html"), site);
writeFileSync(join(root, "site/.nojekyll"), "");
writeFileSync(
  join(root, "site/robots.txt"),
  "User-agent: *\nAllow: /\n" + (siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : "")
);
if (siteUrl) {
  writeFileSync(
    join(root, "site/sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`
  );
}
if (cfg.customDomain) writeFileSync(join(root, "site/CNAME"), cfg.customDomain + "\n");
if (existsSync(join(root, "docs/planner.png"))) copyFileSync(join(root, "docs/planner.png"), join(root, "site/social.png"));

/* ---------------------------------- the demo dashboard ---------------------------------- */
/* The same platform, in front of a localStorage runtime, so it genuinely works on a static host. */
const demoBody = [
  read("src/shell.html"),
  bundle(["src/data/schools.js", "src/data/content.js"]),
  bundle(["demo/runtime.js"]),
  bundle(["src/app/core.js"]),
  bundle(["src/app/views.js"]),
].join("\n");

const demoPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(cfg.org || "Katakyie Advisors")} — dashboard demo</title>
<meta name="description" content="A working demo of the ${esc(cfg.org || "Katakyie Advisors")} advisor console and client portals. Sample data, saved in your own browser.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0A0908">
<link rel="icon" href="${favicon}">
<style>
  :root { color-scheme: dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  html, body { height: 100%; }
  body { margin: 0; background: #0A0908; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
${demoBody}
</body>
</html>
`;
mkdirSync(join(root, "site/demo"), { recursive: true });
writeFileSync(join(root, "site/demo/index.html"), demoPage);

/* ---------------------------------- local preview ---------------------------------- */
const preview = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
  /* Mirrors the small reset the artifact host injects, so the preview matches production. */
  :root { color-scheme: light dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  body { margin: 0; font: 14px system-ui, sans-serif; background: #0A0908; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
</head>
<body>
<script>\n${read("dev/harness.js")}\n</script>
${body}
</body>
</html>
`;
writeFileSync(join(root, "dev/preview.html"), preview);

console.log(`dist/index.html    ${kb(body)}   Claude artifact — the advisor platform`);
console.log(`dist/public.html   ${kb(publicBody)}   Claude artifact — the public planner`);
console.log(`site/index.html    ${kb(site)}   static website — what GitHub Pages serves`);
console.log(`site/demo/         ${kb(demoPage)}   the dashboard as a self-contained demo`);
console.log(`dev/preview.html   ${kb(preview)}   local preview (npm run dev)`);
if (!siteUrl || siteUrl.includes("YOURNAME")) console.log("\n  note: set siteUrl in site.config.json so social previews and the canonical link work.");
if ((cfg.contactEmail || "").includes("example.com")) console.log("  note: set contactEmail in site.config.json — the 'Get in touch' button points at it.");
