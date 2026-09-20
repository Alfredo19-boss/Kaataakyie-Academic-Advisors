#!/usr/bin/env node
/* Renders the preview in a headless browser and reports JS errors and horizontal overflow.
   Needs playwright available; skip it if you do not have one installed. */
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = "file://" + join(root, "dev/preview.html");
const shots = process.argv.includes("--shots");
const errs = [];
const b = await chromium.launch();
for (const [name, w, h] of [["desktop", 1360, 1020], ["phone", 390, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${name}: ${e.message}`));
  p.on("console", (m) => { const t = m.text(); if (m.type() === "error" && !/ERR_|fonts|_blob/.test(t)) errs.push(`${name} console: ${t}`); });
  await p.goto(url); await p.waitForTimeout(1200);
  if (shots) await p.screenshot({ path: join(root, `dev/${name}.png`) });
  const { sw, cw } = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(`${name}: ${sw > cw ? `HORIZONTAL OVERFLOW ${sw} > ${cw}` : "no overflow"}`);
  await ctx.close();
}
await b.close();
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no js errors");
