/* The client portal — a read-only snapshot of one applicant's file, carried entirely in the link.
 *
 * The advisor generates the link from their console; everything the page needs is packed into the
 * URL fragment, so no server and no account are involved. A fragment never leaves the browser —
 * it is not sent to the host — which is why this works on a plain static site.
 *
 * Deliberately absent from the payload: the advisor's private notes, fees, and any contact detail
 * for referees. Anyone holding the link can read what is in it, so it carries only what the client
 * already knows about their own application.
 */
(function () {
"use strict";
var STAGES = window.NB_STAGES, TASKS = window.NB_TASKS, DOCS = window.NB_DOCS, DOCST = window.NB_DOC_STATES;
var SITE = window.NB_SITE || {};
var app = document.getElementById("app");

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(iso) {
  if (!iso) return "";
  var p = String(iso).slice(0, 10).split("-");
  if (p.length !== 3) return esc(iso);
  return Number(p[2]) + " " + (MON[Number(p[1]) - 1] || "?") + " " + p[0];
}
function today() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function daysUntil(iso) {
  if (!iso) return null;
  var a = new Date(iso + "T00:00:00"), b = new Date(today() + "T00:00:00");
  if (isNaN(a)) return null;
  return Math.round((a - b) / 86400000);
}
function money(n) { return "$" + Math.round(Number(n) || 0).toLocaleString("en-US"); }
var CHECK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.3 4.6 9 10 3.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------------------------------- unpacking the link ---------------------------------- */
function b64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  var bin = atob(str), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function inflate(bytes) {
  if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("no DecompressionStream"));
  var ds = new DecompressionStream("deflate-raw");
  var w = ds.writable.getWriter();
  w.write(bytes); w.close();
  return new Response(ds.readable).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
}
function unpack(frag) {
  var kind = frag.charAt(0), body = frag.slice(1);
  var bytes;
  try { bytes = b64urlToBytes(body); } catch (e) { return Promise.reject(e); }
  var step = kind === "z" ? inflate(bytes) : Promise.resolve(bytes);
  return step.then(function (u8) { return JSON.parse(new TextDecoder().decode(u8)); });
}

/* ---------------------------------- derived ---------------------------------- */
function taskList(d) { return (d.tpl && d.tpl.length) ? d.tpl : TASKS; }
function isDone(d, id) { return !!(d.ts && d.ts[id]); }
function dueOf(d, id) { return (d.du && d.du[id]) || ""; }
function progress(d) {
  var ts = taskList(d), n = ts.filter(function (t) { return isDone(d, t.id); }).length;
  return { done: n, total: ts.length, pct: ts.length ? Math.round((n / ts.length) * 100) : 0 };
}
function stageStats(d) {
  var ts = taskList(d);
  return STAGES.map(function (s) {
    var list = ts.filter(function (t) { return t.s === s.id; });
    var n = list.filter(function (t) { return isDone(d, t.id); }).length;
    return { s: s, done: n, total: list.length, pct: list.length ? Math.round((n / list.length) * 100) : 100 };
  });
}
function currentStage(d) {
  var st = stageStats(d);
  for (var i = 0; i < st.length; i++) if (st[i].done < st[i].total) return i;
  return st.length - 1;
}
function netCost(r) {
  var gross = (Number(r.tu) || 0) + (Number(r.fe) || 0) + (Number(r.li) || 0);
  return { has: gross > 0, net: Math.max(0, gross - (Number(r.aw) || 0)), award: Number(r.aw) || 0 };
}

/* ---------------------------------- calendar file ---------------------------------- */
function icsFor(d) {
  var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Katakyie Academic Advisor//Portal//EN", "CALSCALE:GREGORIAN"];
  function ev(date, title, note) {
    var stamp = date.replace(/-/g, "");
    var end = new Date(date + "T00:00:00");
    end.setDate(end.getDate() + 1);
    var endStamp = end.getFullYear() + String(end.getMonth() + 1).padStart(2, "0") + String(end.getDate()).padStart(2, "0");
    lines.push("BEGIN:VEVENT",
      "UID:" + stamp + "-" + Math.random().toString(36).slice(2) + "@katakyie",
      "DTSTAMP:" + stamp + "T000000Z",
      "DTSTART;VALUE=DATE:" + stamp,
      "DTEND;VALUE=DATE:" + endStamp,
      "SUMMARY:" + String(title).replace(/[\n,;]/g, " "),
      "DESCRIPTION:" + String(note || "").replace(/[\n,;]/g, " "),
      "END:VEVENT");
  }
  (d.sc || []).forEach(function (r) { if (r.dl) ev(r.dl, "Application deadline — " + r.n, r.p || ""); });
  taskList(d).forEach(function (t) {
    var due = dueOf(d, t.id);
    if (due && !isDone(d, t.id)) ev(due, t.t, t.h || "");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadIcs(d) {
  var blob = new Blob([icsFor(d)], { type: "text/calendar;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (d.n || "application").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase() + "-dates.ics";
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------------------------------- render ---------------------------------- */
function ring(pct) {
  var r = 44, C = 2 * Math.PI * r, off = C * (1 - pct / 100);
  return '<div class="ring"><svg viewBox="0 0 104 104" width="100%" height="100%">' +
    '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="var(--panel3)" stroke-width="8"></circle>' +
    '<circle cx="52" cy="52" r="' + r + '" fill="none" stroke="var(--brand)" stroke-width="8" stroke-linecap="round" ' +
    'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle></svg>' +
    '<div class="ctr"><b>' + pct + "%</b><span>done</span></div></div>";
}
function duePill(d, t) {
  var due = dueOf(d, t.id);
  if (!due) return "";
  if (isDone(d, t.id)) return '<span class="pill">Done</span>';
  var n = daysUntil(due);
  if (n === null) return "";
  if (n < 0) return '<span class="pill crit">Overdue by ' + (-n) + " days</span>";
  if (n <= 7) return '<span class="pill warn">Due in ' + n + ' day' + (n === 1 ? '' : 's') + '</span>';
  return '<span class="pill">Due ' + fmtDate(due) + "</span>";
}

function render(d) {
  document.title = (d.n ? d.n + " — " : "") + "Your Application";
  if (d.org) document.getElementById("orgName").textContent = d.org;
  document.getElementById("asOf").textContent = d.at ? "As of " + fmtDate(d.at) : "";

  var p = progress(d), st = stageStats(d), si = currentStage(d), ts = taskList(d);
  var open = ts.filter(function (t) { return t.s === STAGES[si].id && !isDone(d, t.id); });
  var overdue = ts.filter(function (t) {
    var due = dueOf(d, t.id);
    if (!due || isDone(d, t.id)) return false;
    var n = daysUntil(due);
    return n !== null && n < 0;
  });
  var mail = d.adv ? "mailto:" + d.adv + "?subject=" + encodeURIComponent((d.n || "My application") + " — question") : "";

  var html =
    '<header class="hero"><div class="wrap">' +
      '<div class="eyebrow">Your application</div>' +
      "<h1>" + esc(d.n || "Your application") + "</h1>" +
      '<p class="sub">' + esc([d.f, d.t ? d.t + " intake" : ""].filter(Boolean).join(" · ")) + "</p>" +
      (d.msg ? '<div class="notice info" style="margin-top:20px">' + esc(d.msg) + "</div>" : "") +
      (overdue.length ? '<div class="notice" style="margin-top:20px"><div><b>' + overdue.length + " step" +
        (overdue.length === 1 ? " is" : "s are") + " past the date we set.</b> " +
        esc(overdue.slice(0, 3).map(function (t) { return t.t; }).join("; ")) + (overdue.length > 3 ? " …" : "") + "</div></div>" : "") +
      '<div class="heroflex">' + ring(p.pct) +
        '<div class="stagebox"><div class="eyebrow">Where you are</div>' +
        "<h2>" + STAGES[si].n + ". " + esc(STAGES[si].name) + "</h2>" +
        '<p style="color:var(--muted);font-size:14px">' + esc(STAGES[si].blurb) + "</p>" +
        '<div class="chips"><span class="pill">' + p.done + " of " + p.total + " steps done</span>" +
        '<span class="pill">' + (d.sc || []).length + " school" + ((d.sc || []).length === 1 ? "" : "s") + " on your list</span>" +
        "</div></div></div>" +
      '<div class="stepper">' + st.map(function (x, i) {
        return '<div class="step ' + (x.pct === 100 ? "done" : "") + (i === si ? " cur" : "") + '">' +
          '<div class="rail"><i style="width:' + x.pct + '%"></i></div>' +
          '<div class="no">' + x.s.n + '</div><div class="nm">' + esc(x.s.name) + "</div>" +
          '<div class="ct">' + x.done + "/" + x.total + "</div></div>";
      }).join("") + "</div>" +
    "</div></header>";

  /* what's next */
  html += '<section><div class="wrap"><h3>What happens next</h3>' +
    '<p class="lede">The open steps in your current stage. Anything marked <b>Your advisor</b> is being handled for you.</p>' +
    '<div class="card">' + (open.length ? open.map(function (t) {
      return '<div class="row"><div class="tick">' + CHECK + "</div>" +
        '<div style="min-width:0;flex:1"><div class="nm">' + esc(t.t) + "</div>" +
        '<div class="loc">' + esc(t.h || "") + "</div>" +
        '<div class="chips" style="margin-top:8px"><span class="pill ' + (t.o === "a" ? "brand" : "") + '">' +
        (t.o === "a" ? "Your advisor" : "You") + "</span>" + duePill(d, t) + "</div></div></div>";
    }).join("") : '<div class="empty">Everything in this stage is done.</div>') + "</div></div></section>";

  /* schools */
  var sc = d.sc || [];
  html += '<section><div class="wrap"><h3>Your schools</h3>' +
    '<p class="lede">The date shown is the one we are working to — usually the funding or priority deadline, which falls before the final one.</p>' +
    '<div class="card">' + (sc.length ? sc.map(function (r) {
      var n = r.dl ? daysUntil(r.dl) : null;
      var cls = n === null || n < 0 ? "" : n <= 7 ? "crit" : n <= 21 ? "warn" : "";
      var k = netCost(r);
      return '<div class="row"><div style="min-width:0;flex:1 1 220px"><div class="nm">' + esc(r.n) + "</div>" +
        '<div class="loc">' + esc(r.p || "Programme to confirm") + (r.lo ? " · " + esc(r.lo) : "") + "</div>" +
        (k.has ? '<div class="loc money">Net year one ' + money(k.net) + (k.award ? " · award " + money(k.award) : "") + "</div>" : "") +
        '</div><div class="rt">' +
        (r.dl ? '<span class="pill ' + cls + '">' + fmtDate(r.dl) + (n !== null && n >= 0 ? " · " + n + "d" : "") + "</span>" : "") +
        '<span class="pill ' + (r.s === "Admitted" || r.s === "Enrolling" ? "ok" : r.s === "Denied" ? "crit" : r.s === "Submitted" ? "brand" : r.s === "Waitlisted" ? "warn" : "") + '">' +
        esc(r.s || "Researching") + "</span></div></div>";
    }).join("") : '<div class="empty">No schools on your list yet — we will build it together.</div>') + "</div>" +
    '<div class="acts"><a class="btn" href="../#schools">Browse all ' + (window.NB_SCHOOLS || []).length + " US schools</a></div></div></section>";

  /* documents */
  var dm = d.dc || {}, doneDocs = DOCS.filter(function (x) { return dm[x.id] === 3; }).length;
  html += '<section><div class="wrap"><h3>Your documents</h3>' +
    '<p class="lede">' + doneDocs + " of " + DOCS.length + " verified. Anything still <b>not started</b> is worth beginning now — the credential evaluation in particular takes weeks.</p>" +
    '<div class="card">' + DOCS.map(function (x) {
      var s = dm[x.id] || 0;
      var cls = s === 3 ? "ok" : s === 2 ? "brand" : s === 1 ? "warn" : "";
      return '<div class="row"><div class="tick' + (s === 3 ? " on" : "") + '">' + CHECK + "</div>" +
        '<div style="min-width:0;flex:1"><div class="nm">' + esc(x.t) + "</div>" +
        '<div class="loc">' + esc(x.h) + '</div></div><div class="rt"><span class="pill ' + cls + '">' + esc(DOCST[s]) + "</span></div></div>";
    }).join("") + "</div></div></section>";

  /* dates */
  var dates = [];
  sc.forEach(function (r) { if (r.dl) dates.push({ d: r.dl, t: "Application deadline — " + r.n }); });
  ts.forEach(function (t) { var due = dueOf(d, t.id); if (due && !isDone(d, t.id)) dates.push({ d: due, t: t.t }); });
  dates.sort(function (a, b) { return a.d.localeCompare(b.d); });
  html += '<section><div class="wrap"><h3>Your dates</h3>' +
    '<p class="lede">Every date we are working to, in order. Put them in your own calendar so none of them arrives as a surprise.</p>' +
    '<div class="card">' + (dates.length ? dates.map(function (x) {
      var n = daysUntil(x.d);
      var cls = n === null ? "" : n < 0 ? "crit" : n <= 7 ? "crit" : n <= 21 ? "warn" : "";
      return '<div class="row"><div style="min-width:0;flex:1"><div class="nm">' + esc(x.t) + "</div></div>" +
        '<div class="rt"><span class="pill ' + cls + '">' + fmtDate(x.d) +
        (n === null ? "" : n < 0 ? " · " + (-n) + "d ago" : " · in " + n + "d") + "</span></div></div>";
    }).join("") : '<div class="empty">No dates set yet.</div>') + "</div>" +
    (dates.length ? '<div class="acts"><button class="btn" id="icsBtn">Add these dates to my calendar</button></div>' : "") +
    "</div></section>";

  /* help */
  html += '<section style="border-bottom:0"><div class="wrap"><h3>Questions, and where to read more</h3>' +
    '<p class="lede">Ask about anything on this page. Between calls, the library covers the tests, the money, the I-20 and the visa in full.</p>' +
    '<div class="acts">' +
      (mail ? '<a class="btn pri" href="' + esc(mail) + '">Email your advisor</a>' : "") +
      '<a class="btn" href="../#library">Open the resource library</a>' +
      '<a class="btn" href="../#timeline">See the full timeline</a>' +
    "</div></div></section>";

  html += '<footer><div class="wrap">' +
    "<p>This is a snapshot of your file, prepared by " + esc(d.org || "your advisor") + " on " + fmtDate(d.at || today()) +
    ". It does not update on its own — ask for a fresh link whenever you want the current picture.</p>" +
    "<p>Anyone with this link can read this page, so treat it as private. General planning information, not legal or immigration advice.</p>" +
    "</div></footer>";

  app.innerHTML = html;
  var btn = document.getElementById("icsBtn");
  if (btn) btn.addEventListener("click", function () { downloadIcs(d); });
}

function fail(title, body) {
  app.innerHTML = '<header class="hero"><div class="wrap"><div class="eyebrow">Your application</div>' +
    "<h1>" + esc(title) + '</h1><p class="sub">' + esc(body) + "</p>" +
    '<div class="acts"><a class="btn" href="../">Go to the planner</a></div></div></header>';
}

/* ---------------------------------- boot ---------------------------------- */
var frag = (location.hash || "").replace(/^#/, "");
if (!frag) {
  fail("This link needs the rest of its address",
       "A portal link carries your file after the # in the address bar. Copy the whole link your advisor sent you, including everything after the #, and open it again.");
} else {
  unpack(frag).then(function (d) {
    if (!d || !d.v) throw new Error("bad payload");
    render(d);
  }).catch(function () {
    fail("This link could not be read",
         "It may have been cut short when it was copied, or it may be from an older version. Ask your advisor to send you a fresh one.");
  });
}
})();
