#!/usr/bin/env node
/* Tiny static server for local work — no dependencies. `npm run dev` builds then serves this. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteMode = process.argv.includes("--site");
const port = Number(process.env.PORT || (siteMode ? 5174 : 5173));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/") p = siteMode ? "/site/index.html" : "/dev/preview.html";
  if (siteMode && !p.startsWith("/site/")) p = "/site" + p;
  const file = join(root, normalize(p).replace(/^(\.\.[/\\])+/, ""));
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(buf);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found: " + p);
  }
}).listen(port, () => console.log(`${siteMode ? "Katakyie site" : "Katakyie preview"} → http://localhost:${port}`));
