/* The US Master's Planner — public site. No storage, no accounts, nothing to sign into. */
(function () {
"use strict";
var $ = function (s) { return document.querySelector(s); };
var SCHOOLS = window.NB_SCHOOLS, STAGES = window.NB_STAGES, RES = window.NB_RESOURCES;

/* Site settings come from site.config.json at build time; these are the fallbacks. */
var SITE = window.NB_SITE || {};
var CONTACT = SITE.contactEmail || "hello@example.com";

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* ---------- contact ---------- */
$("#ctaLink").href = "mailto:" + CONTACT + "?subject=" + encodeURIComponent("US master's advising");
if (SITE.demoUrl) {
  var dl = document.getElementById("demoLink");
  if (dl) { dl.href = SITE.demoUrl; dl.hidden = false; }
}
if (SITE.portalUrl) {
  var pl = document.getElementById("portalLink");
  if (pl) { pl.href = SITE.portalUrl; pl.hidden = false; }
}

/* ---------- ticker ---------- */
(function () {
  var board = window.NB_BOARD || [];
  if (!board.length) return;
  var el = document.getElementById("ticker");
  var run = board.map(function (b) {
    var k = b.kind === "scholarship" ? "Funding" : b.kind === "application" ? "Applications" : "Cycle";
    var inner = '<span class="k">' + esc(k) + "</span><b>" + esc(b.title) + "</b><span>" + esc(b.detail || "") + "</span>";
    return '<span class="it">' + (b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + inner + "</a>" : inner) + "</span>";
  }).join("");
  el.innerHTML = '<span class="tag">Cycle board</span><div class="tickwin"><div class="track">' + run + run + "</div></div>";
  el.querySelector(".track").style.animationDuration = Math.max(50, board.length * 11) + "s";
  el.hidden = false;
})();

/* ---------- timeline ruler ---------- */
var TL = RES.filter(function (r) { return r.id === "timeline"; })[0];
$("#ruler").innerHTML = TL.items.map(function (it) {
  var m = it.t.replace(/\s*(months?)?\s*out$/i, "");
  return '<div class="tick"><div class="m">' + esc(m) + ' mo</div>' +
    "<h4>" + esc(it.h || it.t) + "</h4><p>" + esc(it.b) + "</p></div>";
}).join("");

/* ---------- stages ---------- */
$("#stageGrid").innerHTML = STAGES.map(function (s) {
  return '<div class="stage"><div class="n">' + s.n + '</div><h4>' + esc(s.name) + "</h4><p>" + esc(s.blurb) + "</p></div>";
}).join("");

/* ---------- school explorer ---------- */
var TAGN = { ivy: "Ivy League", hbcu: "HBCU", tech: "Institute of technology", art: "Art & design", med: "Health sciences" };
var LIMIT_STEP = 40, limit = LIMIT_STEP;

var states = SCHOOLS.reduce(function (a, s) { if (a.indexOf(s.state) < 0) a.push(s.state); return a; }, []).sort();
$("#fState").insertAdjacentHTML("beforeend", states.map(function (s) { return "<option>" + s + "</option>"; }).join(""));
$("#fTag").insertAdjacentHTML("beforeend", Object.keys(TAGN).map(function (k) {
  return '<option value="' + k + '">' + TAGN[k] + "</option>";
}).join(""));
$("#statSchools").textContent = SCHOOLS.length;

function matches() {
  var q = $("#q").value.trim().toLowerCase(), st = $("#fState").value, ct = $("#fCtrl").value, tg = $("#fTag").value;
  return SCHOOLS.filter(function (s) {
    if (st && s.state !== st) return false;
    if (ct && s.control !== ct) return false;
    if (tg && s.tags.indexOf(tg) < 0) return false;
    if (q && (s.name + " " + s.city + " " + s.state).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function drawSchools() {
  var list = matches(), shown = list.slice(0, limit);
  $("#count").textContent = list.length + (list.length === 1 ? " school" : " schools");
  $("#rows").innerHTML = shown.length ? shown.map(function (s) {
    return '<div class="row"><div style="min-width:0"><div class="nm">' + esc(s.name) + "</div>" +
      '<div class="loc">' + esc(s.city) + ", " + esc(s.state) + " · " + esc(s.control) +
      (s.tags.length ? " · " + s.tags.map(function (t) { return esc(TAGN[t] || t); }).join(", ") : "") + "</div></div>" +
      '<a target="_blank" rel="noopener" href="https://www.google.com/search?q=' +
      encodeURIComponent(s.name + " graduate admissions") + '">Admissions ↗</a></div>';
  }).join("") : '<div class="row"><div class="loc">Nothing matches. Widen the filters or clear the search.</div></div>';
  var rest = list.length - shown.length;
  $("#more").hidden = rest <= 0;
  if (rest > 0) $("#moreBtn").textContent = "Show " + Math.min(LIMIT_STEP, rest) + " more (" + rest + " left)";
}
["#q", "#fState", "#fCtrl", "#fTag"].forEach(function (sel) {
  $(sel).addEventListener("input", function () { limit = LIMIT_STEP; drawSchools(); });
});
$("#moreBtn").addEventListener("click", function () { limit += LIMIT_STEP; drawSchools(); });
drawSchools();

/* ---------- library ---------- */
var LIB = RES.filter(function (r) { return r.id !== "timeline"; });
var open = LIB[0].id;
function drawLib() {
  $("#libnav").innerHTML = LIB.map(function (r) {
    return '<button data-id="' + r.id + '" aria-pressed="' + (r.id === open) + '">' + esc(r.name) + "</button>";
  }).join("");
  var sec = LIB.filter(function (r) { return r.id === open; })[0];
  $("#libbody").innerHTML =
    '<p class="lead" style="margin-bottom:8px">' + esc(sec.lede) + "</p>" +
    sec.items.map(function (it) {
      return '<div class="libitem"><h4>' + esc(it.t) + "</h4><p>" + esc(it.b) + "</p></div>";
    }).join("") +
    (sec.links ? '<div class="links">' + sec.links.map(function (l) {
      return '<a href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + " ↗</a>";
    }).join("") + "</div>" : "");
}
$("#libnav").addEventListener("click", function (e) {
  var b = e.target.closest("button[data-id]");
  if (!b) return;
  open = b.getAttribute("data-id"); drawLib();
});
drawLib();

/* ---------- footer ---------- */
$("#foot").textContent = "Katakyie Advisors · " + SCHOOLS.length +
  " institutions across 51 states and territories · directory last reviewed " +
  new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
})();
