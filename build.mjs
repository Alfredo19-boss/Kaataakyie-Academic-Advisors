#!/usr/bin/env node
/**
 * Concatenates the sources into two artefacts:
 *
 *   dist/index.html    the page to publish as a Claude artifact.
 *                      No <!doctype>/<html>/<head>/<body> — the artifact host supplies those.
 *
 *   dev/preview.html   a standalone page for local work: a full HTML document with
 *                      dev/harness.js in front of it, faking the window.claude runtime
 *                      so the app has a database, an identity and sample records.
 *
 * No dependencies. Node 18+.
 *   node build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");

/* Order matters: data globals first, then core (window.NB), then the views that consume it. */
const SHELL = "src/shell.html";
const SCRIPTS = [
  ["src/data/schools.js", "src/data/content.js"],
  ["src/app/core.js"],
  ["src/app/views.js"],
];

const bundle = (files) => `<script>\n${files.map(read).join("\n")}\n</script>`;
const body = [read(SHELL), ...SCRIPTS.map(bundle)].join("\n");

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/index.html"), body + "\n");

const preview = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
  /* Mirrors the small reset the artifact host injects, so the preview matches production. */
  :root { color-scheme: light dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
  body { margin: 0; font: 14px system-ui, sans-serif; background: #fafafa; }
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

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
console.log(`dist/index.html    ${kb(body)}   (publish this)`);
console.log(`dev/preview.html   ${kb(preview)}   (open in a browser, or: npm run dev)`);
