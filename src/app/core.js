/* Katakyie Advisors — core: helpers, state, storage, auth, boot. Views live in the next script. */
window.NB = (function () {
"use strict";

var STAGES = window.NB_STAGES, TASKS = window.NB_TASKS, DOCS = window.NB_DOCS,
    DOCST = window.NB_DOC_STATES, RES = window.NB_RESOURCES, SCHOOLS = window.NB_SCHOOLS;

function $(s, r) { return (r || document).querySelector(s); }
function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MONFULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtDate(iso) {
  if (!iso) return "";
  var p = String(iso).slice(0, 10).split("-");
  if (p.length !== 3) return esc(iso);
  return Number(p[2]) + " " + (MON[Number(p[1]) - 1] || "?") + " " + p[0];
}
function today() { var d = new Date(); return isoOf(d); }
function isoOf(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function daysUntil(iso) {
  if (!iso) return null;
  var a = new Date(iso + "T00:00:00"), b = new Date(today() + "T00:00:00");
  if (isNaN(a)) return null;
  return Math.round((a - b) / 86400000);
}
function relAge(iso) {
  if (!iso) return "—";
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return d + "d ago";
  if (d < 365) return Math.floor(d / 30) + "mo ago";
  return Math.floor(d / 365) + "y ago";
}
function relTime(iso) {
  if (!iso) return "";
  var m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  if (m < 1440) return Math.floor(m / 60) + "h ago";
  return fmtDate(String(iso).slice(0, 10));
}
function initials(n) {
  var p = String(n || "").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "—";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
function money(n) {
  n = Number(n) || 0;
  return "$" + Math.round(n).toLocaleString("en-US");
}
function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; }
var TOAST_T;
function toast(msg) {
  var t = $("#toast"); if (!t) return;
  t.textContent = msg; t.classList.add("on");
  clearTimeout(TOAST_T); TOAST_T = setTimeout(function () { t.classList.remove("on"); }, 2800);
}
function ls(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) { localStorage.removeItem(k); return null; }
    localStorage.setItem(k, v); return v;
  } catch (e) { return null; }
}
var CHECK = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.3 4.6 9 10 3.2" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function ico(d) {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
}
var ICONS = {
  clients: '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.2"/><path d="M22 19v-1a4 4 0 0 0-3-3.8"/><path d="M16.5 4.2a4 4 0 0 1 0 5.6"/>',
  pipeline: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  school: '<path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z"/><path d="M20 16H6.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  check: '<path d="M9 11.2 11.6 14 17 7.8"/><circle cx="12" cy="12" r="9.2"/>',
  doc: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.6V20h14V9.6"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  chat: '<path d="M21 11.5a8 8 0 0 1-11.6 7.1L3 20.5l1.9-6A8 8 0 1 1 21 11.5Z"/>',
  bell: '<path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.4 7.4-2.4 7.4h16.8S18 14.6 18 8.6Z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
  money: '<path d="M12 2.5v19"/><path d="M16.8 6.2H9.9a2.9 2.9 0 0 0 0 5.8h4.2a2.9 2.9 0 0 1 0 5.8H6.6"/>'
};

/* ---------------- state ---------------- */
var DB = null, USER = null, ASSETS = null, MAY_EDIT = false, DBDOWN = false;
var S = {
  role: null, meId: null,
  clients: [], notes: {}, billing: {}, templates: {}, board: [], extra: {}, msgs: [], msgFor: null,
  cfg: { orgName: "Katakyie Advisors", advisorCode: "", welcome: "" },
  view: "clients", open: null, tab: "overview",
  res: RES[0].id,
  dir: { q: "", st: "", ctrl: "", tag: "", limit: 60 },
  cq: "", cstatus: "",
  cal: null,
  tplOpen: null,
  loginTab: "client", loading: true, demo: !!window.NB_DEMO
};
function byId(id) { for (var i = 0; i < S.clients.length; i++) if (S.clients[i].id === id) return S.clients[i]; return null; }
function isAdvisor() { return S.role === "advisor"; }
function meClient() { return S.role === "client" ? byId(S.meId) : (S.open ? byId(S.open) : null); }

/* ---------------- derived ---------------- */
function tplOf(c) {
  var t = S.templates[(c && c.template) || "default"];
  return (t && t.tasks && t.tasks.length) ? t.tasks : TASKS;
}
function taskDone(c, id) { return !!(c && c.tasks && c.tasks[id]); }
function dueOf(c, id) { return (c && c.due && c.due[id]) || ""; }
function progressOf(c) {
  var ts = tplOf(c), d = 0;
  for (var i = 0; i < ts.length; i++) if (taskDone(c, ts[i].id)) d++;
  return { done: d, total: ts.length, pct: ts.length ? Math.round((d / ts.length) * 100) : 0 };
}
function stageStats(c) {
  var ts = tplOf(c);
  return STAGES.map(function (s) {
    var list = ts.filter(function (t) { return t.s === s.id; });
    var d = list.filter(function (t) { return taskDone(c, t.id); }).length;
    return { s: s, done: d, total: list.length, pct: list.length ? Math.round((d / list.length) * 100) : 100 };
  });
}
function currentStageIdx(c) {
  var st = stageStats(c);
  for (var i = 0; i < st.length; i++) if (st[i].done < st[i].total) return i;
  return st.length - 1;
}
function nextDeadline(c) {
  var best = null;
  (c.schools || []).forEach(function (r) {
    if (!r.deadline) return;
    var d = daysUntil(r.deadline);
    if (d === null || d < 0) return;
    if (!best || r.deadline < best.deadline) best = r;
  });
  return best;
}
function overdue(c) {
  var out = [], ts = tplOf(c);
  ts.forEach(function (t) {
    var d = dueOf(c, t.id);
    if (!d || taskDone(c, t.id)) return;
    var n = daysUntil(d);
    if (n !== null && n < 0) out.push({ t: t, due: d, late: -n });
  });
  return out;
}
function dueSoon(c) {
  var out = [], ts = tplOf(c);
  ts.forEach(function (t) {
    var d = dueOf(c, t.id);
    if (!d || taskDone(c, t.id)) return;
    var n = daysUntil(d);
    if (n !== null && n >= 0 && n <= 7) out.push({ t: t, due: d, inDays: n });
  });
  return out;
}
function costOf(r) {
  var gross = num(r.tuition) + num(r.fees) + num(r.living);
  return { gross: gross, award: num(r.award), net: Math.max(0, gross - num(r.award)), has: gross > 0 || num(r.award) > 0 };
}
/* ---- money ---- */
function billOf(cid) {
  var b = S.billing[cid] || {};
  var fee = num(b.fee), paid = (b.payments || []).reduce(function (a, p) { return a + num(p.amount); }, 0);
  return { fee: fee, paid: paid, due: Math.round((fee - paid) * 100) / 100, payments: b.payments || [],
           referral: b.referral || "", note: b.note || "", has: fee > 0 || paid > 0 };
}
/* ---- test scores against a school's stated minimums ---- */
function scoreFlags(c, r) {
  var out = [], e = (c.scores || {}).english || {};
  if (num(r.minEnglish) && num(e.total) && num(e.total) < num(r.minEnglish))
    out.push((e.test || "English") + " " + e.total + " is below the " + r.minEnglish + " this programme asks for");
  if (num(r.minSection) && num(e.low) && num(e.low) < num(r.minSection))
    out.push("Lowest section " + e.low + " is below the " + r.minSection + " section floor");
  if (r.greRequired === "Required" && !num((c.scores || {}).greV) && !num((c.scores || {}).gmat))
    out.push("GRE/GMAT required and no score on file");
  return out;
}
function anyScoreFlags(c) {
  var n = 0;
  (c.schools || []).forEach(function (r) { n += scoreFlags(c, r).length; });
  return n;
}
/* ---- recommender coverage ---- */
function refGaps(c) {
  var refs = c.refs || [], out = [];
  if (!refs.length) return out;
  (c.schools || []).forEach(function (r, i) {
    if (["Applying", "Submitted"].indexOf(r.status) < 0) return;
    var missing = refs.filter(function (f) { return !(f.sent || {})[String(i)]; });
    if (missing.length) out.push({ school: r.name, missing: missing.length, of: refs.length });
  });
  return out;
}
var SCH_STATES = ["Researching", "Applying", "Submitted", "Admitted", "Waitlisted", "Denied", "Enrolling"];
function schPill(st) {
  if (st === "Admitted" || st === "Enrolling") return "ok";
  if (st === "Denied") return "crit";
  if (st === "Submitted") return "brand";
  if (st === "Waitlisted") return "warn";
  return "";
}
function statusPill(st) { return st === "Active" ? "ok" : st === "Placed" ? "brand" : st === "Paused" ? "warn" : ""; }
function unread(c) {
  if (!c) return 0;
  var mark = isAdvisor() ? c.lastReadA : c.lastReadC;
  var from = isAdvisor() ? "client" : "advisor";
  return S.msgs.filter(function (m) { return m.from === from && (!mark || m.at > mark); }).length;
}

/* ---------------- storage ---------------- */
var chains = {}, pending = {}, timers = {};
function queue(path, fn) {
  var prev = chains[path] || Promise.resolve();
  var next = prev.then(fn, fn).catch(function (e) {
    console.warn("write failed", path, e);
    toast(e && e.code === "invalid_argument" ? "You don't have permission to save that." : "Couldn't save — try again.");
  });
  chains[path] = next; return next;
}
function scheduleSave(id, ms) {
  pending[id] = true;
  clearTimeout(timers[id]);
  timers[id] = setTimeout(function () { flush(id); }, ms == null ? 500 : ms);
}
function flush(id) {
  var c = byId(id); if (!c) { pending[id] = false; return; }
  c.updatedAt = new Date().toISOString();
  var body = {}; for (var k in c) if (k !== "id") body[k] = c[k];
  if (!DB) { pending[id] = false; return; }
  queue("clients/" + id, function () { return DB.doc("clients/" + id).set(body); })
    .then(function () { pending[id] = false; });
}
function saveCfg() { if (DB) queue("config/app", function () { return DB.doc("config/app").set(S.cfg); }); }
function saveNote(cid, body) {
  S.notes[cid] = body;
  if (DB) queue("notes/" + cid, function () { return DB.doc("notes/" + cid).set({ body: body, at: new Date().toISOString() }); });
}
function allSchools() {
  var extra = Object.keys(S.extra || {}).map(function (k) {
    var o = S.extra[k];
    return { id: "x" + k, docId: k, name: o.name || "", city: o.city || "", state: o.state || "",
             control: o.control || "Private", tags: o.tags || [], custom: true };
  }).filter(function (o) { return o.name; });
  extra.sort(function (a, b) { return a.name.localeCompare(b.name); });
  return SCHOOLS.concat(extra);
}
function saveSchool(id, obj) {
  if (!DB) return;
  queue("directory/" + id, function () { return DB.doc("directory/" + id).set(obj); });
}
function dropSchool(id) {
  if (!DB) return;
  queue("directory/" + id, function () { return DB.doc("directory/" + id).delete(); });
}
function saveBoardItem(id, obj) {
  if (!DB) return;
  queue("board/" + id, function () { return DB.doc("board/" + id).set(obj); });
}
function dropBoardItem(id) {
  if (!DB) return;
  queue("board/" + id, function () { return DB.doc("board/" + id).delete(); });
}
function saveBilling(cid, obj) {
  S.billing[cid] = obj;
  if (DB) queue("billing/" + cid, function () { return DB.doc("billing/" + cid).set(obj); });
}
function saveTemplate(tid) {
  var t = S.templates[tid]; if (!t || !DB) return;
  queue("templates/" + tid, function () { return DB.doc("templates/" + tid).set({ name: t.name, tasks: t.tasks }); });
}
var codeCache = {};
function setCode(code, cid) {
  if (!DB || !code) return;
  if (codeCache[code] === cid) return;
  codeCache[code] = cid;
  try { DB.doc("codes/" + code); } catch (e) { return; }
  queue("codes/" + code, function () { return DB.doc("codes/" + code).set({ cid: cid }); });
}
function dropCode(code) {
  if (!DB || !code) return;
  delete codeCache[code];
  try { DB.doc("codes/" + code); } catch (e) { return; }
  queue("codes/" + code, function () { return DB.doc("codes/" + code).delete(); });
}
function sendMsg(cid, body) {
  var m = { from: isAdvisor() ? "advisor" : "client", body: body, at: new Date().toISOString() };
  var mid = "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  m.id = mid;
  S.msgs.push(m);
  if (DB) queue("clients/" + cid + "/messages/" + mid, function () {
    return DB.doc("clients/" + cid).collection("messages").doc(mid).set({ from: m.from, body: m.body, at: m.at });
  });
  markRead(cid);
}
function markRead(cid) {
  var c = byId(cid); if (!c) return;
  var k = isAdvisor() ? "lastReadA" : "lastReadC";
  var now = new Date().toISOString();
  if (c[k] === now) return;
  c[k] = now; scheduleSave(cid, 900);
}

/* ---------------- boot ---------------- */
var unsubs = [], msgUnsub = null, BOOTED = false;
function addUn(f) { if (typeof f === "function") unsubs.push(f); }

function boot() {
  NB.render();
  var w = window.claude, has = w && typeof w.use === "function";
  Promise.all([has ? w.use("db") : null, has ? w.use("user") : null, has ? w.use("assets") : null]).then(function (r) {
    DB = r[0] || null; USER = r[1] || null; ASSETS = r[2] || null;
    var perm = USER
      ? Promise.all([USER.isOwner(), USER.canEdit()]).then(function (a) { MAY_EDIT = !!(a[0] || a[1]); }, function () {})
      : Promise.resolve();
    if (!DB) { DBDOWN = true; S.board = (window.NB_BOARD || []).slice(); return perm.then(finishBoot); }
    var settle, loaded = new Promise(function (res) { settle = res; setTimeout(res, 8000); });
    var got = 0;
    function tick() { if (++got >= 1) settle(); }
    addUn(DB.doc("config/app").onSnapshot(function (snap) {
      if (snap.exists) {
        var d = snap.data();
        S.cfg = { orgName: d.orgName || "Katakyie Advisors", advisorCode: d.advisorCode || "", welcome: d.welcome || "" };
      }
      tick(); if (BOOTED) NB.render();
    }, tick));
    addUn(DB.collection("board").onSnapshot(function (snap) {
      var b = [];
      snap.docs.forEach(function (d) { var o = d.data() || {}; o.id = d.id; b.push(o); });
      b.sort(function (x, y) { return String(x.closes || "9999").localeCompare(String(y.closes || "9999")); });
      S.board = b.concat(window.NB_BOARD || []);
      if (BOOTED) NB.render();
    }, function () { S.board = (window.NB_BOARD || []).slice(); }));
    addUn(DB.collection("directory").onSnapshot(function (snap) {
      var e = {};
      snap.docs.forEach(function (d) { e[d.id] = d.data() || {}; });
      S.extra = e; if (BOOTED) NB.render();
    }, function () {}));
    addUn(DB.collection("templates").onSnapshot(function (snap) {
      var t = {};
      snap.docs.forEach(function (d) { var o = d.data() || {}; t[d.id] = { id: d.id, name: o.name || d.id, tasks: o.tasks || [] }; });
      S.templates = t; if (BOOTED) NB.render();
    }, function () {}));
    return Promise.all([perm, loaded]).then(finishBoot);
  }).catch(function () { DBDOWN = true; finishBoot(); });
  setTimeout(function () { if (!BOOTED) { DBDOWN = !DB; finishBoot(); } }, 13000);
}

function attachAdvisor() {
  if (!DB) return Promise.resolve();
  return new Promise(function (res) {
    var done = false, t = setTimeout(function () { if (!done) { done = true; res(); } }, 6000);
    addUn(DB.collection("clients").onSnapshot(function (snap) {
      var next = [];
      snap.docs.forEach(function (d) {
        if (pending[d.id]) { var cur = byId(d.id); if (cur) { next.push(cur); return; } }
        var o = d.data() || {}; o.id = d.id; next.push(o);
      });
      next.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
      S.clients = next;
      next.forEach(function (c) { if (c.code) setCode(String(c.code).toUpperCase(), c.id); });
      if (!done) { done = true; clearTimeout(t); res(); }
      if (BOOTED) NB.render();
    }, function () { if (!done) { done = true; clearTimeout(t); res(); } }));
    addUn(DB.collection("notes").onSnapshot(function (snap) {
      var n = {};
      snap.docs.forEach(function (d) { n[d.id] = (d.data() || {}).body || ""; });
      S.notes = n; if (BOOTED) NB.render();
    }, function () {}));
    addUn(DB.collection("billing").onSnapshot(function (snap) {
      var b = {};
      snap.docs.forEach(function (d) { b[d.id] = d.data() || {}; });
      S.billing = b; if (BOOTED) NB.render();
    }, function () {}));
  });
}
function attachClient(cid) {
  if (!DB) return Promise.resolve();
  return new Promise(function (res) {
    var done = false, t = setTimeout(function () { if (!done) { done = true; res(); } }, 6000);
    addUn(DB.doc("clients/" + cid).onSnapshot(function (snap) {
      if (snap.exists) {
        if (!pending[cid]) { var o = snap.data() || {}; o.id = cid; S.clients = [o]; }
      } else { S.clients = []; }
      if (!done) { done = true; clearTimeout(t); res(); }
      if (BOOTED) NB.render();
    }, function () { if (!done) { done = true; clearTimeout(t); res(); } }));
  });
}
function attachMessages(cid) {
  if (msgUnsub) { try { msgUnsub(); } catch (e) {} msgUnsub = null; }
  S.msgs = []; S.msgFor = cid;
  if (!DB || !cid) return;
  msgUnsub = DB.doc("clients/" + cid).collection("messages").onSnapshot(function (snap) {
    var out = [];
    snap.docs.forEach(function (d) { var o = d.data() || {}; o.id = d.id; out.push(o); });
    out.sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
    S.msgs = out;
    if (BOOTED) NB.render();
  }, function () {});
}

function finishBoot() {
  if (BOOTED) return;
  BOOTED = true;
  var sess = null;
  try { sess = JSON.parse(ls("nb.session") || "null"); } catch (e) {}
  var go = Promise.resolve();
  if (sess && sess.role === "client" && sess.id) {
    S.role = "client"; S.meId = sess.id; S.open = sess.id; S.view = "client"; S.tab = "overview";
    go = attachClient(sess.id).then(function () { attachMessages(sess.id); });
  } else if ((sess && sess.role === "advisor") || MAY_EDIT) {
    S.role = "advisor"; S.view = "clients";
    go = attachAdvisor();
  }
  go.then(function () { S.loading = false; NB.render(); });
  setTimeout(function () { if (S.loading) { S.loading = false; NB.render(); } }, 7000);
}

/* ---------------- auth ---------------- */
function signInAdvisor() {
  S.role = "advisor"; S.meId = null; S.open = null; S.view = "clients"; S.loading = true;
  ls("nb.session", JSON.stringify({ role: "advisor" }));
  NB.render();
  attachAdvisor().then(function () { S.loading = false; NB.render(); });
}
function signInClient(cid) {
  S.role = "client"; S.meId = cid; S.open = cid; S.view = "client"; S.tab = "overview"; S.loading = true;
  ls("nb.session", JSON.stringify({ role: "client", id: cid }));
  NB.render();
  attachClient(cid).then(function () { attachMessages(cid); S.loading = false; NB.render(); });
}
function signOut() {
  ls("nb.session", null);
  unsubs.forEach(function (f) { try { f(); } catch (e) {} });
  unsubs = [];
  if (msgUnsub) { try { msgUnsub(); } catch (e) {} msgUnsub = null; }
  S.role = null; S.meId = null; S.open = null; S.clients = []; S.notes = {}; S.billing = {}; S.msgs = []; S.msgFor = null;
  S.loginTab = "client";
  // keep config + templates live for the login screen
  if (DB) {
    addUn(DB.doc("config/app").onSnapshot(function (snap) {
      if (snap.exists) {
        var d = snap.data();
        S.cfg = { orgName: d.orgName || "Katakyie Advisors", advisorCode: d.advisorCode || "", welcome: d.welcome || "" };
      }
      NB.render();
    }, function () {}));
  }
  NB.render();
}

var NB = {
  $: $, esc: esc, fmtDate: fmtDate, today: today, isoOf: isoOf, daysUntil: daysUntil, relAge: relAge, relTime: relTime,
  initials: initials, money: money, num: num, toast: toast, ls: ls, ico: ico, ICONS: ICONS, CHECK: CHECK,
  MON: MON, MONFULL: MONFULL,
  STAGES: STAGES, TASKS: TASKS, DOCS: DOCS, DOCST: DOCST, RES: RES, SCHOOLS: SCHOOLS, SCH_STATES: SCH_STATES,
  S: S, byId: byId, isAdvisor: isAdvisor, meClient: meClient,
  tplOf: tplOf, taskDone: taskDone, dueOf: dueOf, progressOf: progressOf, stageStats: stageStats,
  currentStageIdx: currentStageIdx, nextDeadline: nextDeadline, overdue: overdue, dueSoon: dueSoon,
  costOf: costOf, schPill: schPill, statusPill: statusPill, unread: unread,
  billOf: billOf, scoreFlags: scoreFlags, anyScoreFlags: anyScoreFlags, refGaps: refGaps,
  allSchools: allSchools, saveSchool: saveSchool, dropSchool: dropSchool,
  saveBoardItem: saveBoardItem, dropBoardItem: dropBoardItem,
  queue: queue, scheduleSave: scheduleSave, flush: flush, saveCfg: saveCfg, saveNote: saveNote,
  saveTemplate: saveTemplate, saveBilling: saveBilling, setCode: setCode, dropCode: dropCode, sendMsg: sendMsg, markRead: markRead,
  attachMessages: attachMessages, signInAdvisor: signInAdvisor, signInClient: signInClient, signOut: signOut,
  boot: boot, render: function () {}
};
Object.defineProperty(NB, "DB", { get: function () { return DB; }, configurable: true });
Object.defineProperty(NB, "ASSETS", { get: function () { return ASSETS; }, configurable: true });
Object.defineProperty(NB, "MAY_EDIT", { get: function () { return MAY_EDIT; }, configurable: true });
Object.defineProperty(NB, "DBDOWN", { get: function () { return DBDOWN; }, configurable: true });
return NB;
})();
