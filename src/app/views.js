/* Northbound — views and interaction. */
(function (NB) {
"use strict";
var $ = NB.$, esc = NB.esc, S = NB.S, ico = NB.ico, ICONS = NB.ICONS, CHECK = NB.CHECK;
var STAGES = NB.STAGES, DOCS = NB.DOCS, DOCST = NB.DOCST, RES = NB.RES, SCHOOLS = NB.SCHOOLS, SCH_STATES = NB.SCH_STATES;
var fmtDate = NB.fmtDate, daysUntil = NB.daysUntil, money = NB.money, num = NB.num, toast = NB.toast;
var isAdvisor = NB.isAdvisor, meClient = NB.meClient, byId = NB.byId;

/* ------------------------------------------------ login ------------------------------------------------ */
function renderLogin() {
  var host = $("#login"); host.hidden = false;
  $("#shell").classList.remove("on");
  var org = esc(S.cfg.orgName || "Northbound Advising");
  host.innerHTML =
    '<div class="brandside">' +
      '<div style="display:flex;align-items:center;gap:11px">' +
        '<svg class="logomark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="rgba(255,255,255,.14)"></rect>' +
        '<path d="M11 28V12l18 16V12" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
        '<div style="font-weight:600;font-size:15px">' + org + "</div></div>" +
      "<div><h1>Every step from first enquiry to the airport, in one place.</h1>" +
      "<p>Sign in with the access code your advisor gave you. You see your own file and nothing else — " +
      "your progress, your shortlist, your documents and your messages.</p></div>" +
      '<div class="marks">' + STAGES.map(function (s) { return "<span>" + esc(s.name) + "</span>"; }).join("") + "</div>" +
    "</div>" +
    '<div class="formside"><div class="formwrap">' +
      '<div class="eyebrow" style="margin-bottom:8px">Sign in</div>' +
      '<div class="seg" role="group" aria-label="Sign in as">' +
        '<button data-act="logintab" data-v="client" aria-pressed="' + (S.loginTab === "client") + '">Client portal</button>' +
        '<button data-act="logintab" data-v="advisor" aria-pressed="' + (S.loginTab === "advisor") + '">Advisor</button></div>' +
      (S.loginTab === "client"
        ? '<div class="field"><label for="codeIn">Access code</label><input class="inp mono" id="codeIn" placeholder="NB-0000" autocomplete="off" spellcheck="false"></div>'
        : '<div class="field"><label for="codeIn">Advisor passcode</label><input class="inp mono" id="codeIn" type="password" placeholder="••••••••" autocomplete="off"></div>') +
      '<div id="loginErr" style="color:var(--crit);font-size:12.5px;margin-top:8px" hidden></div>' +
      '<button class="btn pri" data-act="dologin" style="width:100%;justify-content:center;margin-top:16px">Continue</button>' +
      (NB.MAY_EDIT ? '<button class="btn" data-act="ownerin" style="width:100%;justify-content:center;margin-top:8px">Open advisor console</button>' : "") +
      '<p class="muted" style="font-size:12px;margin-top:18px;line-height:1.5">' +
      (NB.DBDOWN ? "Shared storage is not available in this view, so nothing can be loaded or saved right now."
                 : "Codes are issued by your advisor. A client sign-in loads only that client's record.") + "</p>" +
    "</div></div>";
  var inp = $("#codeIn");
  if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
}
function doLogin() {
  var el = $("#codeIn"), v = (el && el.value || "").trim(), err = $("#loginErr");
  function fail(m) { if (err) { err.hidden = false; err.textContent = m; } }
  if (!v) return fail("Enter a code to continue.");
  if (S.loginTab === "advisor") {
    if (!S.cfg.advisorCode) return fail("No advisor passcode is set yet. Open the console as the account owner and set one in Settings.");
    if (v !== S.cfg.advisorCode) return fail("That passcode is not recognised.");
    return NB.signInAdvisor();
  }
  var code = v.toUpperCase().replace(/[^A-Z0-9_\-]/g, "");
  if (!code) return fail("That access code is not recognised.");
  if (!NB.DB) return fail("Storage is unavailable, so codes cannot be checked right now.");
  fail("Checking…"); if (err) err.style.color = "var(--muted)";
  var ref;
  try { ref = NB.DB.doc("codes/" + code); }
  catch (e) { return fail("That access code is not recognised."); }
  ref.get().then(function (snap) {
    if (err) err.style.color = "var(--crit)";
    var d = snap.exists ? snap.data() : null;
    if (!d || !d.cid) return fail("That access code is not recognised.");
    NB.signInClient(d.cid);
  }).catch(function () { if (err) err.style.color = "var(--crit)"; fail("Could not check that code. Try again."); });
}

/* ------------------------------------------------ shell ------------------------------------------------ */
var NAV_ADVISOR = [
  { v: "clients", n: "Clients", i: "clients" },
  { v: "pipeline", n: "Pipeline", i: "pipeline" },
  { v: "business", n: "Business", i: "money" },
  { v: "calendar", n: "Calendar", i: "cal" },
  { v: "directory", n: "School directory", i: "school" },
  { v: "resources", n: "Resource library", i: "book" },
  { v: "settings", n: "Settings", i: "gear" }
];
var NAV_CLIENT = [
  { v: "client:overview", n: "My progress", i: "home" },
  { v: "client:tasks", n: "Tasks", i: "check" },
  { v: "client:schools", n: "My schools", i: "school" },
  { v: "client:docs", n: "Documents", i: "doc" },
  { v: "client:messages", n: "Messages", i: "chat" },
  { v: "calendar", n: "Calendar", i: "cal" },
  { v: "directory", n: "School directory", i: "school" },
  { v: "resources", n: "Resource library", i: "book" }
];

function render() {
  $("#login").hidden = true;
  $("#shell").classList.add("on");

  if (S.loading) {
    $("#nav").innerHTML = ""; $("#title").textContent = "Loading"; $("#crumb").textContent = "";
    $("#topactions").innerHTML = "";
    $("#view").innerHTML = '<div class="card"><div class="empty"><h3>Opening your workspace</h3><p>Fetching records.</p></div></div>';
    return;
  }
  if (!S.role) { renderLogin(); return; }

  var items = isAdvisor() ? NAV_ADVISOR : NAV_CLIENT;
  var cur = isAdvisor() ? S.view : (S.view === "client" ? "client:" + S.tab : S.view);
  var un = !isAdvisor() ? NB.unread(meClient()) : 0;
  $("#nav").innerHTML = items.map(function (it) {
    var badge = (it.v === "client:messages" && un) ? ' <span class="pill accent" style="margin-left:auto">' + un + "</span>" : "";
    return '<a data-act="go" data-v="' + it.v + '" class="' + (cur === it.v ? "on" : "") + '">' + ico(ICONS[it.i]) + "<span>" + esc(it.n) + "</span>" + badge + "</a>";
  }).join("");

  $("#brandName").textContent = S.cfg.orgName || "Northbound Advising";
  $("#brandRole").textContent = isAdvisor() ? "Advisor console" : "Client portal";
  var who = isAdvisor() ? "Advisor" : ((meClient() && meClient().name) || "Client");
  $("#meInitials").textContent = NB.initials(who);
  $("#meName").textContent = who;
  $("#meRole").textContent = isAdvisor() ? (S.clients.length + " client" + (S.clients.length === 1 ? "" : "s")) : "Applicant";

  var v = $("#view"); v.innerHTML = ""; $("#topactions").innerHTML = ""; $("#crumb").textContent = "";

  if (NB.DBDOWN) v.insertAdjacentHTML("beforeend",
    '<div class="notice"><b>Not saving.</b> Shared storage is unavailable in this view, so changes will be lost on reload.</div>');

  if (S.view === "clients") viewClients(v);
  else if (S.view === "pipeline") viewPipeline(v);
  else if (S.view === "business") viewBusiness(v);
  else if (S.view === "calendar") viewCalendar(v);
  else if (S.view === "directory") viewDirectory(v);
  else if (S.view === "resources") viewResources(v);
  else if (S.view === "settings") viewSettings(v);
  else if (S.view === "templates") viewTemplates(v);
  else if (S.view === "client") viewClient(v);
  wire();
}
NB.render = render;

function kpi(val, label, flag) {
  return '<div class="kpi' + (flag ? " flag" : "") + '"><div class="v">' + esc(val) + '</div><div class="l">' + esc(label) + "</div></div>";
}

/* ------------------------------------------------ clients ------------------------------------------------ */
function viewClients(v) {
  $("#title").textContent = "Clients";
  $("#topactions").innerHTML = '<button class="btn pri" data-act="newclient">+ New client</button>';

  if (!S.clients.length) {
    v.insertAdjacentHTML("beforeend",
      '<div class="card"><div class="empty"><h3>No clients yet</h3>' +
      "<p>Add the first applicant and they get an access code, a plan across eight stages, and a portal of their own.</p>" +
      '<button class="btn pri" data-act="newclient" style="margin-top:16px">+ New client</button></div></div>');
    return;
  }
  var q = S.cq.toLowerCase();
  var list = S.clients.filter(function (c) {
    if (S.cstatus && (c.status || "Active") !== S.cstatus) return false;
    if (q && ((c.name || "") + " " + (c.field || "") + " " + (c.country || "") + " " + (c.targetTerm || "")).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });

  var rows = list.map(function (c) {
    var p = NB.progressOf(c), si = NB.currentStageIdx(c), nd = NB.nextDeadline(c), od = NB.overdue(c);
    var dl = nd ? daysUntil(nd.deadline) : null;
    var dlCls = dl === null ? "" : dl <= 7 ? "crit" : dl <= 21 ? "warn" : "";
    return '<tr class="clickable" data-act="openclient" data-v="' + esc(c.id) + '">' +
      '<td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">' + esc(NB.initials(c.name)) + "</div>" +
        '<div style="min-width:0"><div style="font-weight:600">' + esc(c.name || "Unnamed") + "</div>" +
        '<div class="muted" style="font-size:12px">' + esc(c.field || "Field not set") + (c.country ? " · " + esc(c.country) : "") + "</div></div></div></td>" +
      "<td>" + esc(c.targetTerm || "—") + "</td>" +
      '<td><span class="pill brand"><span class="dot"></span>' + esc(STAGES[si].n + ". " + STAGES[si].name) + "</span></td>" +
      '<td style="min-width:132px"><div style="display:flex;align-items:center;gap:9px">' +
        '<div class="bar" style="flex:1"><i style="width:' + p.pct + '%"></i></div>' +
        '<span class="num" style="font-size:12px;font-weight:600;width:32px;text-align:right">' + p.pct + "%</span></div></td>" +
      "<td>" + (nd ? '<span class="pill ' + dlCls + '">' + fmtDate(nd.deadline) + (dl !== null ? " · " + dl + "d" : "") + "</span>" : '<span class="muted">—</span>') + "</td>" +
      "<td>" + (od.length ? '<span class="pill crit"><span class="dot"></span>' + od.length + " overdue</span>" : '<span class="pill ok">On track</span>') + "</td>" +
      '<td><span class="pill ' + NB.statusPill(c.status) + '">' + esc(c.status || "Active") + "</span></td>" +
      '<td class="muted" style="font-size:12px;white-space:nowrap">' + esc(NB.relAge(c.updatedAt)) + "</td>" +
      "</tr>";
  }).join("");

  v.insertAdjacentHTML("beforeend",
    '<div class="card"><div class="card-h" style="align-items:center"><div class="filters" style="flex:1">' +
      '<input class="inp grow" id="cq" placeholder="Search clients" value="' + esc(S.cq) + '">' +
      '<select class="inp" data-act="cstatus"><option value="">Every status</option>' +
        ["Active", "Paused", "Placed", "Archived"].map(function (s) { return '<option ' + (S.cstatus === s ? "selected" : "") + ">" + s + "</option>"; }).join("") +
      "</select></div>" +
      '<span class="pill">' + list.length + " of " + S.clients.length + "</span></div>" +
    '<div class="card-b flush"><div class="scrollx"><table class="tbl">' +
    "<thead><tr><th>Client</th><th>Intake</th><th>Stage</th><th>Completion</th><th>Next deadline</th><th>Schedule</th><th>Status</th><th>Updated</th></tr></thead>" +
    "<tbody>" + (rows || '<tr><td colspan="8"><div class="empty"><p>No client matches that search.</p></div></td></tr>') + "</tbody></table></div></div></div>");
}

/* ------------------------------------------------ pipeline ------------------------------------------------ */
function viewPipeline(v) {
  $("#title").textContent = "Pipeline";
  var cs = S.clients;
  if (!cs.length) {
    v.insertAdjacentHTML("beforeend", '<div class="card"><div class="empty"><h3>Nothing to chart yet</h3><p>Pipeline figures appear once you have clients on the books.</p></div></div>');
    return;
  }
  var active = cs.filter(function (c) { return (c.status || "Active") === "Active"; });
  var avg = Math.round(cs.reduce(function (a, c) { return a + NB.progressOf(c).pct; }, 0) / cs.length);
  var submitted = cs.filter(function (c) { return NB.taskDone(c, "t30"); }).length;
  var offers = cs.filter(function (c) { return (c.schools || []).some(function (r) { return r.status === "Admitted" || r.status === "Enrolling"; }); }).length;
  var visas = cs.filter(function (c) { return NB.taskDone(c, "t43"); }).length;
  var late = cs.filter(function (c) { return NB.overdue(c).length > 0; }).length;

  v.insertAdjacentHTML("beforeend",
    '<div class="kpis">' + kpi(active.length, "Active clients") + kpi(avg + "%", "Average completion") +
    kpi(submitted, "Applications submitted") + kpi(offers, "Clients holding an offer") +
    kpi(visas, "Visas issued") + kpi(late, "Clients with overdue steps", late > 0) + "</div>");

  var counts = STAGES.map(function () { return 0; });
  cs.forEach(function (c) { counts[NB.currentStageIdx(c)]++; });
  var max = Math.max.apply(null, counts.concat([1]));
  var bars = STAGES.map(function (s, i) {
    return '<div class="chartrow"><div class="lb" title="' + esc(s.name) + '">' + s.n + ". " + esc(s.name) + "</div>" +
      '<div class="tr"><i style="width:' + Math.round((counts[i] / max) * 100) + '%"></i></div>' +
      '<div class="vl">' + counts[i] + "</div></div>";
  }).join("");

  var att = [];
  cs.forEach(function (c) {
    NB.overdue(c).forEach(function (o) { att.push({ c: c, label: o.t.t, when: o.due, days: -o.late, kind: "late" }); });
    (c.schools || []).forEach(function (r) {
      if (!r.deadline) return;
      var d = daysUntil(r.deadline);
      if (d === null || d < 0 || d > 120) return;
      att.push({ c: c, label: r.name, when: r.deadline, days: d, kind: "dl" });
    });
  });
  att.sort(function (a, b) { return a.days - b.days; });
  var attHtml = att.length ? att.slice(0, 14).map(function (x) {
    var cls = x.kind === "late" ? "crit" : x.days <= 7 ? "crit" : x.days <= 21 ? "warn" : "";
    return '<div class="schoolrow"><div style="min-width:0"><div class="nm">' + esc(x.label) + "</div>" +
      '<div class="loc">' + esc(x.c.name) + " · " + (x.kind === "late" ? "overdue step" : "application deadline") + "</div></div>" +
      '<div class="rt"><span class="pill ' + cls + '">' + fmtDate(x.when) + " · " + (x.days < 0 ? (-x.days) + "d late" : x.days + "d") + "</span></div></div>";
  }).join("") : '<div class="empty"><p>Nothing overdue and no deadline inside 120 days.</p></div>';

  v.insertAdjacentHTML("beforeend",
    '<div class="grid2">' +
      '<div class="card"><div class="card-h"><div><h3>Where clients are right now</h3>' +
        '<p class="muted" style="font-size:12.5px;margin-top:3px">Counted at each client\'s first incomplete stage.</p></div></div>' +
        '<div class="card-b"><div class="chart">' + bars + "</div></div></div>" +
      '<div class="card"><div class="card-h"><div><h3>Needs attention</h3>' +
        '<p class="muted" style="font-size:12.5px;margin-top:3px">Overdue steps first, then deadlines inside 120 days.</p></div></div>' +
        '<div class="card-b flush">' + attHtml + "</div></div></div>");
}

/* ------------------------------------------------ calendar ------------------------------------------------ */
function calEvents() {
  var src = isAdvisor() ? S.clients : (meClient() ? [meClient()] : []);
  var ev = {};
  function push(date, o) { if (!date) return; (ev[date] = ev[date] || []).push(o); }
  src.forEach(function (c) {
    (c.schools || []).forEach(function (r) {
      if (r.deadline) push(r.deadline, { k: "dl", label: r.name, who: c.name });
    });
    NB.tplOf(c).forEach(function (t) {
      var d = NB.dueOf(c, t.id);
      if (!d || NB.taskDone(c, t.id)) return;
      var n = daysUntil(d);
      push(d, { k: (n !== null && n < 0) ? "late" : "due", label: t.t, who: c.name });
    });
  });
  return ev;
}
function viewCalendar(v) {
  $("#title").textContent = "Calendar";
  var now = new Date();
  if (!S.cal) S.cal = { y: now.getFullYear(), m: now.getMonth() };
  var y = S.cal.y, m = S.cal.m;
  var first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay());
  var ev = calEvents(), tod = NB.today();
  var cells = "";
  for (var i = 0; i < 42; i++) {
    var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    var iso = NB.isoOf(d), out = d.getMonth() !== m;
    var list = (ev[iso] || []).slice(0, 4);
    var more = (ev[iso] || []).length - list.length;
    cells += '<div class="d' + (out ? " out" : "") + (iso === tod ? " now" : "") + '">' +
      '<div class="dn">' + d.getDate() + "</div>" +
      list.map(function (e) {
        return '<div class="ev ' + (e.k === "dl" ? "" : e.k) + '" title="' + esc((isAdvisor() ? e.who + " — " : "") + e.label) + '">' +
          (isAdvisor() ? esc(NB.initials(e.who)) + " " : "") + esc(e.label) + "</div>";
      }).join("") +
      (more > 0 ? '<div class="ev" style="background:transparent;color:var(--faint)">+' + more + " more</div>" : "") +
      "</div>";
  }
  v.insertAdjacentHTML("beforeend",
    '<div class="card"><div class="card-h" style="align-items:center">' +
      '<div class="calbar"><button class="btn sm" data-act="calprev">←</button>' +
      '<h3 class="serif" style="font-size:18px;min-width:168px;text-align:center">' + NB.MONFULL[m] + " " + y + "</h3>" +
      '<button class="btn sm" data-act="calnext">→</button>' +
      '<button class="btn sm" data-act="caltoday">Today</button></div>' +
      '<div class="legend"><span><i style="background:var(--brand)"></i>Application deadline</span>' +
      '<span><i style="background:var(--accent)"></i>Step due</span>' +
      '<span><i style="background:var(--crit)"></i>Overdue</span></div></div>' +
    '<div class="card-b"><div class="calhead">' + ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>" +
    '<div class="cal">' + cells + "</div></div></div>");
}

/* ------------------------------------------------ client detail ------------------------------------------------ */
function tabsFor() {
  var t = [{ k: "overview", n: "Overview" }, { k: "tasks", n: "Tasks" }, { k: "schools", n: "Schools & cost" },
           { k: "file", n: "Scores & referees" }, { k: "docs", n: "Documents" }, { k: "messages", n: "Messages" }];
  if (isAdvisor()) t.push({ k: "billing", n: "Fees" }, { k: "notes", n: "Private notes" });
  t.push({ k: "report", n: "Report" });
  return t;
}
function viewClient(v) {
  var c = meClient();
  if (!c) {
    v.insertAdjacentHTML("beforeend", '<div class="card"><div class="empty"><h3>Client record not found</h3><p>It may have been removed.</p></div></div>');
    return;
  }
  if (S.msgFor !== c.id) NB.attachMessages(c.id);
  if (!isAdvisor() && (S.tab === "billing" || S.tab === "notes")) S.tab = "overview";
  var T = tabsFor();
  $("#title").textContent = isAdvisor() ? (c.name || "Client") : (T.filter(function (x) { return x.k === S.tab; })[0] || T[0]).n;
  if (isAdvisor()) {
    $("#crumb").textContent = "Clients / " + (c.name || "");
    $("#topactions").innerHTML =
      '<button class="btn" data-act="go" data-v="clients">← All clients</button>' +
      '<button class="btn" data-act="outcome" data-v="' + esc(c.id) + '">Record outcome</button>' +
      '<button class="btn" data-act="editclient" data-v="' + esc(c.id) + '">Edit record</button>';
  } else {
    $("#crumb").textContent = (c.targetTerm ? c.targetTerm + " intake" : "") + (c.field ? " · " + c.field : "");
  }
  var un = NB.unread(c);
  var html = '<div class="card"><div class="tabs no-print" role="tablist">' + T.map(function (t) {
    return '<button role="tab" aria-selected="' + (S.tab === t.k) + '" data-act="ctab" data-v="' + t.k + '">' + esc(t.n) +
      (t.k === "messages" && un ? ' <span class="pill accent" style="margin-left:6px">' + un + "</span>" : "") + "</button>";
  }).join("") + "</div>";

  if (S.tab === "overview") html += cOverview(c);
  else if (S.tab === "tasks") html += cTasks(c);
  else if (S.tab === "schools") html += cSchools(c);
  else if (S.tab === "file") html += cFile(c);
  else if (S.tab === "billing") html += cBilling(c);
  else if (S.tab === "docs") html += cDocs(c);
  else if (S.tab === "messages") html += cMessages(c);
  else if (S.tab === "notes") html += cNotes(c);
  else if (S.tab === "report") html += cReport(c);
  html += "</div>";
  v.insertAdjacentHTML("beforeend", html);
}

function ringSvg(pct) {
  var r = 40, C = 2 * Math.PI * r, off = C * (1 - pct / 100);
  return '<div class="ring"><svg viewBox="0 0 96 96" width="100%" height="100%">' +
    '<circle cx="48" cy="48" r="' + r + '" fill="none" stroke="var(--panel2)" stroke-width="8"></circle>' +
    '<circle cx="48" cy="48" r="' + r + '" fill="none" stroke="var(--brand)" stroke-width="8" stroke-linecap="round" ' +
    'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle></svg>' +
    '<div class="ctr"><b>' + pct + "%</b><span>done</span></div></div>";
}
function duePill(c, t) {
  var d = NB.dueOf(c, t.id);
  if (!d) return "";
  if (NB.taskDone(c, t.id)) return '<span class="pill">Due ' + fmtDate(d) + "</span>";
  var n = daysUntil(d);
  if (n === null) return "";
  if (n < 0) return '<span class="pill crit"><span class="dot"></span>Overdue ' + (-n) + "d</span>";
  if (n <= 7) return '<span class="pill warn">Due in ' + n + "d</span>";
  return '<span class="pill">Due ' + fmtDate(d) + "</span>";
}
function cbHtml(t, done) {
  var lock = !isAdvisor() && t.o === "a";
  if (lock) return '<span class="cb" role="img" aria-label="' + esc(t.t) + ' — your advisor handles this" style="cursor:default;opacity:.55' +
    (done ? ";background:var(--ok);border-color:var(--ok);color:#fff" : "") + '">' + CHECK + "</span>";
  return '<button class="cb" role="checkbox" aria-checked="' + !!done + '" aria-label="' + esc(t.t) + '" data-act="tick" data-v="' + t.id + '">' + CHECK + "</button>";
}

function cOverview(c) {
  var p = NB.progressOf(c), si = NB.currentStageIdx(c), st = NB.stageStats(c), nd = NB.nextDeadline(c);
  var od = NB.overdue(c), soon = NB.dueSoon(c);
  var ts = NB.tplOf(c);
  var open = ts.filter(function (t) { return t.s === STAGES[si].id && !NB.taskDone(c, t.id); });
  var welcome = S.cfg.welcome && !isAdvisor() ? '<div class="notice info" style="margin-bottom:16px">' + esc(S.cfg.welcome) + "</div>" : "";
  var alert = od.length
    ? '<div class="notice" style="margin-bottom:16px"><b>' + od.length + " step" + (od.length === 1 ? " is" : "s are") + " overdue.</b> " +
      esc(od.slice(0, 3).map(function (o) { return o.t.t; }).join("; ")) + (od.length > 3 ? " …" : "") + "</div>"
    : soon.length ? '<div class="notice info" style="margin-bottom:16px"><b>' + soon.length + " step" + (soon.length === 1 ? "" : "s") + " due this week.</b> " +
      esc(soon.slice(0, 3).map(function (o) { return o.t.t; }).join("; ")) + "</div>" : "";

  var stepper = '<div class="stepper">' + st.map(function (x, i) {
    return '<div class="step ' + (x.pct === 100 ? "done" : "") + (i === si ? " cur" : "") + '">' +
      '<div class="rail"><i style="width:' + x.pct + '%"></i></div>' +
      '<div class="no">' + x.s.n + '</div><div class="nm">' + esc(x.s.name) + "</div>" +
      '<div class="ct">' + x.done + "/" + x.total + "</div></div>";
  }).join("") + "</div>";

  var nextList = open.length ? open.slice(0, 5).map(function (t) {
    return '<div class="task">' + cbHtml(t, false) +
      '<div style="min-width:0"><div class="tt">' + esc(t.t) + '</div><div class="hh">' + esc(t.h) + "</div>" +
      '<div class="meta"><span class="pill ' + (t.o === "a" ? "accent" : "brand") + '">' + (t.o === "a" ? "Advisor" : "You") + "</span>" +
      duePill(c, t) + "</div></div></div>";
  }).join("") : '<div class="empty"><p>Everything in this stage is done.</p></div>';

  var schools = c.schools || [];
  var subm = schools.filter(function (r) { return ["Submitted", "Admitted", "Denied", "Waitlisted", "Enrolling"].indexOf(r.status) >= 0; }).length;
  var admitted = schools.filter(function (r) { return r.status === "Admitted" || r.status === "Enrolling"; }).length;
  var docsDone = DOCS.filter(function (d) { return (c.docs || {})[d.id] === 3; }).length;

  return '<div class="card-b">' + welcome + alert +
    '<div class="rowsplit" style="margin-bottom:22px">' + ringSvg(p.pct) +
      '<div style="flex:1;min-width:220px"><div class="eyebrow">Current stage</div>' +
      '<h3 class="serif" style="font-size:22px;margin:4px 0 6px">' + STAGES[si].n + ". " + esc(STAGES[si].name) + "</h3>" +
      '<p class="muted" style="max-width:56ch">' + esc(STAGES[si].blurb) + "</p>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<span class="pill">' + p.done + " of " + p.total + " steps</span>" +
        (nd ? '<span class="pill ' + (daysUntil(nd.deadline) <= 21 ? "warn" : "") + '">Next deadline ' + fmtDate(nd.deadline) + "</span>" : "") +
        '<span class="pill">' + schools.length + " school" + (schools.length === 1 ? "" : "s") + " on the list</span>" +
      "</div></div></div>" + stepper +
    '<div class="grid3" style="margin-top:22px">' + kpi(subm, "Applications submitted") + kpi(admitted, "Offers in hand") +
      kpi(docsDone + "/" + DOCS.length, "Documents verified") + "</div></div>" +
    '<div class="card-h" style="border-top:1px solid var(--line)"><div><h3>What is next</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">Open steps in the current stage.</p></div></div>' +
    '<div class="card-b flush">' + nextList + "</div>";
}

function cTasks(c) {
  var st = NB.stageStats(c), ts = NB.tplOf(c), html = "";
  STAGES.forEach(function (s, i) {
    var list = ts.filter(function (t) { return t.s === s.id; });
    if (!list.length) return;
    html += '<div class="stagehead"><span class="n">' + s.n + '</span><h4>' + esc(s.name) + "</h4>" +
      '<span class="r">' + st[i].done + " / " + st[i].total + "</span></div>";
    html += list.map(function (t) {
      var d = NB.taskDone(c, t.id);
      return '<div class="task ' + (d ? "done" : "") + '">' + cbHtml(t, d) +
        '<div style="min-width:0;flex:1"><div class="tt">' + esc(t.t) + '</div><div class="hh">' + esc(t.h || "") + "</div>" +
        '<div class="meta"><span class="pill ' + (t.o === "a" ? "accent" : "brand") + '">' + (t.o === "a" ? "Advisor" : (isAdvisor() ? "Client" : "You")) + "</span>" +
        (d && c.tasks[t.id] !== true ? '<span class="pill ok">Done ' + fmtDate(c.tasks[t.id]) + "</span>" : "") +
        duePill(c, t) +
        (isAdvisor() ? '<input type="date" class="dateinp" data-act="setdue" data-v="' + t.id + '" value="' + esc(NB.dueOf(c, t.id)) + '" aria-label="Target date">' : "") +
        "</div></div></div>";
    }).join("");
  });
  return '<div class="card-h"><div><h3>The plan</h3><p class="muted" style="font-size:12.5px;margin-top:3px">' +
    (isAdvisor() ? "Set a target date on any step — the client sees it, and overdue steps flag on your client list."
                 : "Steps marked Advisor are handled for you. Tick off your own as you finish them.") +
    "</p></div>" + (isAdvisor() ? '<button class="btn sm" data-act="go" data-v="templates">Edit this plan</button>' : "") + "</div>" +
    '<div class="card-b flush">' + html + "</div>";
}

function cSchools(c) {
  var rows = c.schools || [];
  var body = rows.length ? rows.map(function (r, i) {
    var d = r.deadline ? daysUntil(r.deadline) : null;
    var cls = d === null || d < 0 ? "" : d <= 7 ? "crit" : d <= 21 ? "warn" : "";
    var k = NB.costOf(r), fl = NB.scoreFlags(c, r);
    return '<div class="schoolrow"><div style="min-width:0;flex:1 1 220px">' +
      '<div class="nm">' + esc(r.name) + "</div>" +
      '<div class="loc">' + esc(r.program || "Programme not set") + (r.loc ? " · " + esc(r.loc) : "") + "</div>" +
      (k.has ? '<div class="loc money" style="margin-top:3px">Net year one ' + money(k.net) + (k.award ? " · award " + money(k.award) : "") + "</div>" : "") +
      (r.appId || r.portalUser ? '<div class="loc mono" style="margin-top:3px;font-size:11.5px">' +
        (r.portalUser ? esc(r.portalUser) : "") + (r.appId ? (r.portalUser ? " · " : "") + "app " + esc(r.appId) : "") +
        (num(r.appFee) ? " · fee " + money(num(r.appFee)) + (r.feePaid ? " paid" : " unpaid") : "") + "</div>" : "") +
      (fl.length ? fl.map(function (m) { return '<div class="loc" style="margin-top:4px;color:var(--crit);font-weight:500">⚠ ' + esc(m) + "</div>"; }).join("") : "") +
      (r.note ? '<div class="loc" style="margin-top:3px">' + esc(r.note) + "</div>" : "") + "</div>" +
      '<div class="rt">' + (r.deadline ? '<span class="pill ' + cls + '">' + fmtDate(r.deadline) + (d !== null && d >= 0 ? " · " + d + "d" : "") + "</span>" : "") +
        '<select class="inp" style="width:auto;padding:5px 28px 5px 9px;font-size:12px" data-act="schstat" data-v="' + i + '">' +
        SCH_STATES.map(function (s) { return "<option " + (r.status === s ? "selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select>" +
        '<button class="btn ghost sm" data-act="editsch" data-v="' + i + '">Edit</button>' +
        '<button class="btn ghost sm" data-act="delsch" data-v="' + i + '" aria-label="Remove">✕</button></div></div>';
  }).join("") : '<div class="empty"><h3>No schools on the list yet</h3><p>Build a longlist from the directory, then cut it to two reach, four match and two safe programmes.</p>' +
    '<button class="btn pri" data-act="go" data-v="directory" style="margin-top:14px">Open the directory</button></div>';

  var costed = rows.filter(function (r) { return NB.costOf(r).has; });
  var cost = "";
  if (costed.length) {
    var maxNet = Math.max.apply(null, costed.map(function (r) { return NB.costOf(r).net; }).concat([1]));
    var budget = num(c.budget);
    cost = '<div class="costwrap"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:14px">' +
      '<div><h3 style="font-size:14.5px">Net cost of year one</h3>' +
      '<p class="muted" style="font-size:12.5px;margin-top:3px">Tuition plus fees plus living cost, less any award. Figures are the ones you entered per school.</p></div>' +
      (budget ? '<span class="pill">Funds available ' + money(budget) + " / year</span>" : '<span class="pill warn">No annual budget set on this record</span>') + "</div>" +
      '<div class="chart">' + costed.map(function (r) {
        var k = NB.costOf(r), gap = budget ? k.net - budget : 0;
        return '<div class="chartrow" style="grid-template-columns:150px minmax(0,1fr) 92px">' +
          '<div class="lb" title="' + esc(r.name) + '">' + esc(r.name) + "</div>" +
          '<div class="tr"><i style="width:' + Math.round((k.net / maxNet) * 100) + '%;background:' + (budget && gap > 0 ? "var(--crit)" : "var(--brand)") + '"></i></div>' +
          '<div class="vl money">' + money(k.net) + "</div></div>" +
          (budget ? '<div class="chartrow" style="grid-template-columns:150px minmax(0,1fr) 92px;margin-top:-4px">' +
            '<div></div><div class="lb" style="font-size:11.5px">' + (gap > 0 ? "Gap to close " + money(gap) : "Covered, " + money(-gap) + " spare") + "</div><div></div></div>" : "");
      }).join("") + "</div></div>";
  }

  return '<div class="card-h"><div><h3>Shortlist</h3><p class="muted" style="font-size:12.5px;margin-top:3px">' +
    "Record the funding or priority deadline here, not the final one. Add cost figures from each school's own cost-of-attendance page.</p></div>" +
    '<div style="display:flex;gap:8px"><button class="btn" data-act="setbudget">Annual budget</button>' +
    '<button class="btn pri" data-act="addsch">+ Add school</button></div></div>' +
    '<div class="card-b flush">' + body + "</div>" + cost;
}

function fileIcon(f) {
  if (f.type && f.type.indexOf("image/") === 0) return '<img src="/_blob/' + esc(f.aid) + '" alt="">';
  var ext = (f.name || "").split(".").pop().slice(0, 4).toUpperCase();
  return '<div class="fi">' + esc(ext || "FILE") + "</div>";
}
function cDocs(c) {
  var m = c.docs || {};
  var rows = DOCS.map(function (d) {
    var s = m[d.id] || 0;
    var cls = s === 3 ? "ok" : s === 2 ? "brand" : s === 1 ? "warn" : "";
    return '<div class="schoolrow"><div style="min-width:0;flex:1 1 240px">' +
      '<div class="nm">' + esc(d.t) + '</div><div class="loc">' + esc(d.h) + "</div></div>" +
      '<div class="rt"><span class="pill ' + cls + '">' + esc(DOCST[s]) + "</span>" +
      '<button class="btn sm" data-act="docnext" data-v="' + d.id + '">Advance</button></div></div>';
  }).join("");
  var done = DOCS.filter(function (d) { return m[d.id] === 3; }).length;
  var files = c.files || [];
  var fileHtml = files.length
    ? '<div class="filegrid">' + files.map(function (f, i) {
        return '<div class="filechip">' + fileIcon(f) +
          '<div style="min-width:0;flex:1"><div style="font-weight:500;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + "</div>" +
          '<div class="muted" style="font-size:11.5px">' + esc(NB.relTime(f.at)) + (f.size ? " · " + Math.max(1, Math.round(f.size / 1024)) + " KB" : "") + "</div></div>" +
          '<a class="btn ghost sm" href="/_blob/' + esc(f.aid) + '" target="_blank" rel="noopener">Open</a>' +
          (isAdvisor() ? '<button class="btn ghost sm" data-act="delfile" data-v="' + i + '" aria-label="Remove">✕</button>' : "") + "</div>";
      }).join("") + "</div>"
    : '<div class="empty"><p>' + (isAdvisor() ? "Nothing attached yet. Upload transcripts, the credential evaluation, SOP drafts or the I-20 so they live with the file."
        : "Your advisor has not attached anything yet.") + "</p></div>";

  return '<div class="card-h"><div><h3>Document tracker</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">' + done + " of " + DOCS.length + " verified. Statuses cycle: not started → requested → received → verified.</p></div>" +
    '<div style="min-width:160px"><div class="bar"><i style="width:' + Math.round(done / DOCS.length * 100) + '%"></i></div></div></div>' +
    '<div class="card-b flush">' + rows + "</div>" +
    '<div class="card-h" style="border-top:1px solid var(--line)"><div><h3>Attached files</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">' +
    (isAdvisor() ? "Stored with this artifact and visible to this client." : "Uploaded by your advisor.") + "</p></div>" +
    (isAdvisor() && NB.ASSETS ? '<label class="btn pri" style="cursor:pointer">+ Upload file<input type="file" id="fileIn" hidden></label>' : "") + "</div>" +
    fileHtml;
}

function cMessages(c) {
  var mine = isAdvisor() ? "advisor" : "client";
  var body = S.msgs.length ? S.msgs.map(function (m) {
    return '<div class="bub ' + (m.from === mine ? "mine" : "") + '">' + esc(m.body) +
      '<div class="wh">' + (m.from === "advisor" ? "Advisor" : esc(c.name || "Client")) + " · " + esc(NB.relTime(m.at)) + "</div></div>";
  }).join("") : '<div class="empty"><p>No messages yet. Anything written here stays attached to this client\'s file.</p></div>';
  return '<div class="card-h"><div><h3>Messages</h3><p class="muted" style="font-size:12.5px;margin-top:3px">' +
    (isAdvisor() ? "Only you and this client can see this thread." : "Questions for your advisor — answers land right here.") + "</p></div></div>" +
    '<div class="thread" id="thread">' + body + "</div>" +
    '<div class="composer"><textarea class="inp" id="msgIn" placeholder="Write a message…" rows="1"></textarea>' +
    '<button class="btn pri" data-act="sendmsg">Send</button></div>';
}

function cNotes(c) {
  return '<div class="card-h"><div><h3>Private notes</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">Stored separately and restricted to editors — a client signed in to the portal cannot read this, in the page or underneath it.</p></div></div>' +
    '<div class="card-b"><textarea class="inp" id="notesBox" style="min-height:220px" placeholder="Call notes, family situation, funding constraints, what to chase next…">' +
    esc(S.notes[c.id] || "") + "</textarea>" +
    '<p class="muted" style="font-size:12px;margin-top:8px">Saved when you click away.</p></div>';
}

function cReport(c) {
  var p = NB.progressOf(c), st = NB.stageStats(c), si = NB.currentStageIdx(c), ts = NB.tplOf(c);
  var od = NB.overdue(c), m = c.docs || {};
  var outstanding = ts.filter(function (t) { return !NB.taskDone(c, t.id); }).slice(0, 14);
  var missing = DOCS.filter(function (d) { return (m[d.id] || 0) < 3; });
  var schools = (c.schools || []);
  return '<div class="card-h no-print"><div><h3>Status report</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">A one-page summary to print, save as PDF, or hand to a sponsor.</p></div>' +
    '<button class="btn pri" data-act="printrep">Print / save as PDF</button></div>' +
    '<div class="card-b rep">' +
      '<div class="printonly" style="margin-bottom:18px;border-bottom:2px solid var(--brand);padding-bottom:10px">' +
        '<div style="font-family:var(--serif);font-size:22px;font-weight:600">' + esc(S.cfg.orgName || "Northbound Advising") + "</div>" +
        '<div class="muted" style="font-size:12px">Application status report · ' + fmtDate(NB.today()) + "</div></div>" +
      '<h3 class="serif" style="font-size:24px">' + esc(c.name || "") + "</h3>" +
      '<p class="muted" style="margin-bottom:18px">' + esc([c.field, c.targetTerm ? c.targetTerm + " intake" : "", c.country].filter(Boolean).join(" · ")) + "</p>" +
      '<div class="grid3" style="margin-bottom:20px">' + kpi(p.pct + "%", "Plan complete") +
        kpi(STAGES[si].n + " of 8", "Current stage — " + STAGES[si].name) + kpi(schools.length, "Schools on the list") + "</div>" +
      '<h4 style="margin:18px 0 8px">Stage by stage</h4><div class="chart">' + st.map(function (x) {
        return '<div class="chartrow"><div class="lb">' + x.s.n + ". " + esc(x.s.name) + "</div>" +
          '<div class="tr"><i style="width:' + x.pct + '%"></i></div><div class="vl">' + x.done + "/" + x.total + "</div></div>";
      }).join("") + "</div>" +
      '<h4 style="margin:22px 0 8px">Shortlist</h4>' +
      (schools.length ? '<div class="scrollx"><table class="tbl"><thead><tr><th>Institution</th><th>Programme</th><th>Deadline</th><th>Status</th><th>Net year one</th></tr></thead><tbody>' +
        schools.map(function (r) {
          var k = NB.costOf(r);
          return "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.program || "—") + "</td><td>" + (r.deadline ? fmtDate(r.deadline) : "—") +
            '</td><td><span class="pill ' + NB.schPill(r.status) + '">' + esc(r.status || "—") + "</span></td>" +
            '<td class="money">' + (k.has ? money(k.net) : "—") + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="muted">No schools recorded yet.</p>') +
      '<h4 style="margin:22px 0 8px">Outstanding documents</h4>' +
      (missing.length ? "<ul style=\"margin:0;padding-left:20px;color:var(--muted);line-height:1.7\">" + missing.map(function (d) {
          return "<li>" + esc(d.t) + " — <b style=\"color:var(--text)\">" + esc(DOCST[m[d.id] || 0]) + "</b></li>";
        }).join("") + "</ul>" : '<p class="muted">Every document on the list is verified.</p>') +
      '<h4 style="margin:22px 0 8px">Next actions</h4>' +
      (outstanding.length ? "<ul style=\"margin:0;padding-left:20px;color:var(--muted);line-height:1.7\">" + outstanding.map(function (t) {
          var d = NB.dueOf(c, t.id), n = d ? daysUntil(d) : null;
          return "<li>" + esc(t.t) + " <span style=\"font-size:12px\">(" + (t.o === "a" ? "advisor" : "client") +
            (d ? ", due " + fmtDate(d) + (n !== null && n < 0 ? " — overdue" : "") : "") + ")</span></li>";
        }).join("") + "</ul>" : '<p class="muted">Nothing outstanding.</p>') +
      (od.length ? '<p style="margin-top:16px;color:var(--crit);font-weight:600">' + od.length + " step" + (od.length === 1 ? " is" : "s are") + " past its target date.</p>" : "") +
      '<p class="muted" style="font-size:11.5px;margin-top:26px;border-top:1px solid var(--line);padding-top:10px">' +
      "Prepared by " + esc(S.cfg.orgName || "Northbound Advising") + " on " + fmtDate(NB.today()) +
      ". General planning information, not legal or immigration advice.</p>" +
    "</div>";
}

/* ------------------------------------------------ directory ------------------------------------------------ */
var TAGN = { ivy: "Ivy League", hbcu: "HBCU", tech: "Institute of technology", art: "Art & design", med: "Health sciences" };
function viewDirectory(v) {
  $("#title").textContent = "School directory";
  var states = SCHOOLS.reduce(function (a, s) { if (a.indexOf(s.state) < 0) a.push(s.state); return a; }, []).sort();
  var q = S.dir.q.toLowerCase();
  var list = SCHOOLS.filter(function (s) {
    if (S.dir.st && s.state !== S.dir.st) return false;
    if (S.dir.ctrl && s.control !== S.dir.ctrl) return false;
    if (S.dir.tag && s.tags.indexOf(S.dir.tag) < 0) return false;
    if (q && (s.name + " " + s.city + " " + s.state).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  var shown = list.slice(0, S.dir.limit);
  var target = meClient(), have = {};
  if (target) (target.schools || []).forEach(function (r) { if (r.sid) have[r.sid] = 1; });

  v.insertAdjacentHTML("beforeend",
    '<div class="card"><div class="card-h" style="align-items:center"><div class="filters" style="flex:1">' +
      '<input class="inp grow" id="dq" placeholder="Search ' + SCHOOLS.length + ' institutions by name or city" value="' + esc(S.dir.q) + '">' +
      '<select class="inp" data-act="dfil" data-k="st"><option value="">All states</option>' +
        states.map(function (s) { return "<option " + (S.dir.st === s ? "selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" +
      '<select class="inp" data-act="dfil" data-k="ctrl"><option value="">Public & private</option>' +
        ["Public", "Private"].map(function (s) { return "<option " + (S.dir.ctrl === s ? "selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" +
      '<select class="inp" data-act="dfil" data-k="tag"><option value="">Any type</option>' +
        Object.keys(TAGN).map(function (k) { return '<option value="' + k + '" ' + (S.dir.tag === k ? "selected" : "") + ">" + TAGN[k] + "</option>"; }).join("") + "</select>" +
      "</div><span class=\"pill\">" + list.length + " result" + (list.length === 1 ? "" : "s") + "</span></div>" +
    '<div class="card-b" style="padding-bottom:0"><div class="notice info"><span>' +
      "<b>Tuition, deadlines and entry requirements are not stored here.</b> They change every cycle and differ by department — " +
      "open the school's own graduate admissions page and record the figures on the shortlist." +
      (isAdvisor() && !S.open ? " <b>Open a client first</b> to add schools to their list." : "") + "</span></div></div>" +
    '<div class="card-b flush">' + (shown.length ? shown.map(function (s) {
      return '<div class="schoolrow"><div style="min-width:0;flex:1 1 240px"><div class="nm">' + esc(s.name) + "</div>" +
        '<div class="loc">' + esc(s.city) + ", " + esc(s.state) + " · " + esc(s.control) +
        (s.tags.length ? " · " + s.tags.map(function (t) { return esc(TAGN[t] || t); }).join(", ") : "") + "</div></div>" +
        '<div class="rt"><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=' +
          encodeURIComponent(s.name + " graduate admissions") + '">Admissions ↗</a>' +
        (target ? (have[s.id] ? '<span class="pill ok"><span class="dot"></span>On list</span>'
                              : '<button class="btn sm pri" data-act="addfromdir" data-v="' + s.id + '">Add to list</button>') : "") +
        "</div></div>";
    }).join("") : '<div class="empty"><h3>No matches</h3><p>Widen the filters or clear the search.</p></div>') + "</div>" +
    (list.length > shown.length ? '<div class="card-b" style="text-align:center;border-top:1px solid var(--line)"><button class="btn" data-act="dmore">Show 60 more (' + (list.length - shown.length) + " remaining)</button></div>" : "") +
    "</div>");
}

/* ------------------------------------------------ resources ------------------------------------------------ */
function viewResources(v) {
  $("#title").textContent = "Resource library";
  var sec = RES.filter(function (r) { return r.id === S.res; })[0] || RES[0];
  v.insertAdjacentHTML("beforeend",
    '<div class="res-nav">' + RES.map(function (r) {
      return '<button data-act="res" data-v="' + r.id + '" aria-pressed="' + (r.id === sec.id) + '">' + esc(r.name) + "</button>";
    }).join("") + "</div>" +
    '<div class="card"><div class="card-h"><div><h3 class="serif" style="font-size:19px">' + esc(sec.name) + "</h3>" +
    '<p class="muted" style="font-size:13px;margin-top:5px;max-width:70ch">' + esc(sec.lede) + "</p></div></div>" +
    '<div class="card-b flush">' + sec.items.map(function (it) {
      return '<div class="res-item"><h4>' + esc(it.t) + "</h4><p>" + esc(it.b) + "</p></div>";
    }).join("") + "</div>" +
    (sec.links ? '<div class="linklist" style="border-top:1px solid var(--line)">' + sec.links.map(function (l) {
      return '<a href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + " ↗</a>";
    }).join("") + "</div>" : "") + "</div>" +
    '<p class="muted" style="font-size:12px;max-width:70ch">General guidance for planning, not legal or immigration advice. ' +
    "Requirements differ by school, by embassy and by year — confirm everything against the official sources above.</p>");
}

/* ------------------------------------------------ settings ------------------------------------------------ */
function viewSettings(v) {
  $("#title").textContent = "Settings";
  v.insertAdjacentHTML("beforeend",
    '<div class="grid2">' +
    '<div class="card"><div class="card-h"><div><h3>Practice details</h3>' +
      '<p class="muted" style="font-size:12.5px;margin-top:3px">Shown on the sign-in screen and in the sidebar.</p></div></div>' +
      '<div class="card-b" style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="field"><label for="setName">Practice name</label><input class="inp" id="setName" value="' + esc(S.cfg.orgName) + '"></div>' +
      '<div class="field"><label for="setCode">Advisor passcode</label><input class="inp mono" id="setCode" value="' + esc(S.cfg.advisorCode) + '" placeholder="set a passcode"></div>' +
      '<div class="field"><label for="setWelcome">Welcome note on every client dashboard</label><textarea class="inp" id="setWelcome" style="min-height:80px">' + esc(S.cfg.welcome) + "</textarea></div>" +
      '<div><button class="btn pri" data-act="savecfg">Save</button></div></div></div>' +
    '<div class="card"><div class="card-h"><div><h3>What each person can see</h3></div></div>' +
      '<div class="card-b" style="display:flex;flex-direction:column;gap:12px;font-size:13.5px;color:var(--muted)">' +
      "<p>A client signs in with their access code and their session loads <b style=\"color:var(--text)\">only their own record</b> — the client list is never fetched, and the code is checked against a single lookup rather than by scanning everyone.</p>" +
      "<p>Your private notes are stored apart from the client file and restricted to editors, so a client cannot reach them even outside the page.</p>" +
      "<p><b style=\"color:var(--text)\">Where the line actually is:</b> progress records live in one shared store. Someone technical who has been given the link could, with effort, reach another client's progress data underneath the page. Codes and the split above cover ordinary confidentiality; a hard guarantee would need a hosted app with a real server.</p>" +
      "<p>Share the page from the Share menu with <i>Can interact</i> so clients can tick their own steps. Anyone you give <i>Can edit</i> becomes a second advisor.</p>" +
      "</div></div></div>" +
    '<div class="card"><div class="card-h"><div><h3>Client access codes</h3>' +
      '<p class="muted" style="font-size:12.5px;margin-top:3px">Regenerate a code if it has been shared with the wrong person — the old one stops working straight away.</p></div></div>' +
      '<div class="card-b flush">' + (S.clients.length ? S.clients.map(function (c) {
        return '<div class="schoolrow"><div style="min-width:0;flex:1"><div class="nm">' + esc(c.name) + "</div>" +
          '<div class="loc">' + esc(c.email || "no email on file") + " · plan: " + esc((S.templates[c.template || "default"] || {}).name || "Standard") + "</div></div>" +
          '<div class="rt"><span class="pill mono">' + esc(c.code || "—") + "</span>" +
          '<button class="btn sm" data-act="regen" data-v="' + esc(c.id) + '">New code</button>' +
          '<button class="btn sm danger" data-act="delclient" data-v="' + esc(c.id) + '">Delete</button></div></div>';
      }).join("") : '<div class="empty"><p>No clients yet.</p></div>') + "</div></div>" +
    '<div class="card"><div class="card-h"><div><h3>Task templates</h3>' +
      '<p class="muted" style="font-size:12.5px;margin-top:3px">Different plans for different kinds of client — taught MS, MBA, PhD-track.</p></div>' +
      '<button class="btn" data-act="go" data-v="templates">Open templates</button></div></div>');
}

/* ------------------------------------------------ templates ------------------------------------------------ */
function viewTemplates(v) {
  $("#title").textContent = "Task templates";
  $("#crumb").textContent = "Settings / Templates";
  $("#topactions").innerHTML = '<button class="btn" data-act="go" data-v="settings">← Settings</button>' +
    '<button class="btn pri" data-act="tplnew">+ New template</button>';
  var ids = Object.keys(S.templates);
  if (!ids.length) {
    v.insertAdjacentHTML("beforeend", '<div class="card"><div class="empty"><h3>No templates stored</h3>' +
      '<p>The built-in 49-step plan is in use. Create a template to start editing the steps.</p>' +
      '<button class="btn pri" data-act="tplnew" style="margin-top:14px">+ New template</button></div></div>');
    return;
  }
  var tid = S.tplOpen && S.templates[S.tplOpen] ? S.tplOpen : ids[0];
  var t = S.templates[tid];
  var used = S.clients.filter(function (c) { return (c.template || "default") === tid; }).length;

  v.insertAdjacentHTML("beforeend",
    '<div class="res-nav">' + ids.map(function (i) {
      return '<button data-act="tplopen" data-v="' + esc(i) + '" aria-pressed="' + (i === tid) + '">' + esc(S.templates[i].name) + "</button>";
    }).join("") + "</div>" +
    '<div class="card"><div class="card-h"><div><h3 class="serif" style="font-size:19px">' + esc(t.name) + "</h3>" +
      '<p class="muted" style="font-size:12.5px;margin-top:4px">' + t.tasks.length + " steps · used by " + used + " client" + (used === 1 ? "" : "s") + "</p></div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="tplrename" data-v="' + esc(tid) + '">Rename</button>' +
      '<button class="btn sm" data-act="tpldup" data-v="' + esc(tid) + '">Duplicate</button>' +
      (tid !== "default" ? '<button class="btn sm danger" data-act="tpldel" data-v="' + esc(tid) + '">Delete</button>' : "") + "</div></div>" +
    '<div class="card-b flush">' + STAGES.map(function (s) {
      var list = t.tasks.filter(function (x) { return x.s === s.id; });
      return '<div class="stagehead"><span class="n">' + s.n + '</span><h4>' + esc(s.name) + "</h4>" +
        '<span class="r">' + list.length + ' step' + (list.length === 1 ? "" : "s") + "</span>" +
        '<button class="btn ghost sm" data-act="stepadd" data-v="' + esc(tid) + "|" + esc(s.id) + '">+ Add</button></div>' +
        (list.length ? list.map(function (x) {
          return '<div class="tplrow"><div style="min-width:0;flex:1"><div style="font-weight:500">' + esc(x.t) + "</div>" +
            '<div class="muted" style="font-size:12.5px;margin-top:2px">' + esc(x.h || "No guidance note") + "</div></div>" +
            '<span class="pill ' + (x.o === "a" ? "accent" : "brand") + '">' + (x.o === "a" ? "Advisor" : "Client") + "</span>" +
            '<button class="btn ghost sm" data-act="stepedit" data-v="' + esc(tid) + "|" + esc(x.id) + '">Edit</button>' +
            '<button class="btn ghost sm" data-act="stepdel" data-v="' + esc(tid) + "|" + esc(x.id) + '" aria-label="Delete">✕</button></div>';
        }).join("") : '<div class="tplrow"><span class="muted" style="font-size:13px">No steps in this stage.</span></div>');
    }).join("") + "</div></div>" +
    '<p class="muted" style="font-size:12px;max-width:70ch">Deleting a step keeps any tick a client already made against it, so restoring the step restores their progress.</p>');
}

/* ------------------------------------------------ business ------------------------------------------------ */
function viewBusiness(v) {
  $("#title").textContent = "Business";
  $("#topactions").innerHTML = '<button class="btn" data-act="printrep">Print</button>';
  var cs = S.clients;
  if (!cs.length) {
    v.insertAdjacentHTML("beforeend", '<div class="card"><div class="empty"><h3>Nothing to total yet</h3><p>Fees and outcomes appear once you have clients on the books.</p></div></div>');
    return;
  }
  var contracted = 0, collected = 0, recent = 0, cut = Date.now() - 30 * 86400000;
  cs.forEach(function (c) {
    var b = NB.billOf(c.id);
    contracted += b.fee; collected += b.paid;
    b.payments.forEach(function (p) { if (p.at && new Date(p.at).getTime() >= cut) recent += num(p.amount); });
  });
  var placed = cs.filter(function (c) { return c.outcome && c.outcome.school; });
  var aid = placed.reduce(function (a, c) { return a + num(c.outcome.award); }, 0);

  v.insertAdjacentHTML("beforeend",
    '<div class="kpis">' + kpi(money(contracted), "Contracted") + kpi(money(collected), "Collected") +
    kpi(money(Math.max(0, contracted - collected)), "Outstanding", contracted - collected > 0) +
    kpi(money(recent), "Collected, last 30 days") + kpi(placed.length, "Clients placed") +
    kpi(money(aid), "Aid won for clients") + "</div>");

  var rows = cs.map(function (c) {
    var b = NB.billOf(c.id);
    var cls = !b.has ? "" : b.due > 0 ? "warn" : "ok";
    return '<tr class="clickable" data-act="openbill" data-v="' + esc(c.id) + '">' +
      "<td><b>" + esc(c.name) + "</b><div class=\"muted\" style=\"font-size:12px\">" + esc(c.targetTerm || "—") + "</div></td>" +
      '<td class="money">' + (b.fee ? money(b.fee) : '<span class="muted">not set</span>') + "</td>" +
      '<td class="money">' + (b.paid ? money(b.paid) : "—") + "</td>" +
      '<td>' + (b.has ? '<span class="pill ' + cls + '">' + (b.due > 0 ? money(b.due) + " due" : "settled") + "</span>" : '<span class="muted">—</span>') + "</td>" +
      "<td>" + (b.referral ? esc(b.referral) : '<span class="muted">—</span>') + "</td>" +
      '<td><span class="pill ' + NB.statusPill(c.status) + '">' + esc(c.status || "Active") + "</span></td></tr>";
  }).join("");

  var srcs = {};
  cs.forEach(function (c) { var r = NB.billOf(c.id).referral || "Not recorded"; srcs[r] = (srcs[r] || 0) + 1; });
  var keys = Object.keys(srcs).sort(function (a, b) { return srcs[b] - srcs[a]; });
  var maxS = Math.max.apply(null, keys.map(function (k) { return srcs[k]; }).concat([1]));

  var outHtml = placed.length ? placed.map(function (c) {
    var o = c.outcome;
    return '<div class="schoolrow"><div style="min-width:0;flex:1 1 240px"><div class="nm">' + esc(c.name) + "</div>" +
      '<div class="loc">' + esc(o.school) + (o.program ? " · " + esc(o.program) : "") + (o.term ? " · " + esc(o.term) : "") + "</div>" +
      (o.note ? '<div class="loc" style="margin-top:3px">' + esc(o.note) + "</div>" : "") + "</div>" +
      '<div class="rt">' + (num(o.award) ? '<span class="pill ok money">' + money(o.award) + " award</span>" : "") +
      '<button class="btn ghost sm" data-act="outcome" data-v="' + esc(c.id) + '">Edit</button></div></div>';
  }).join("") : '<div class="empty"><p>No placements recorded yet. Record one the day a client accepts an offer — this list is the only marketing asset that actually converts.</p></div>';

  v.insertAdjacentHTML("beforeend",
    '<div class="card"><div class="card-h"><div><h3>Fees</h3>' +
      '<p class="muted" style="font-size:12.5px;margin-top:3px">Stored apart from the client record and restricted to editors — a client signed in to the portal never sees this.</p></div></div>' +
      '<div class="card-b flush"><div class="scrollx"><table class="tbl">' +
      "<thead><tr><th>Client</th><th>Fee</th><th>Paid</th><th>Balance</th><th>Came from</th><th>Status</th></tr></thead><tbody>" +
      rows + "</tbody></table></div></div></div>" +
    '<div class="grid2">' +
      '<div class="card"><div class="card-h"><div><h3>Where clients come from</h3>' +
        '<p class="muted" style="font-size:12.5px;margin-top:3px">Record the source on each client\'s Fees tab.</p></div></div>' +
        '<div class="card-b"><div class="chart">' + keys.map(function (k) {
          return '<div class="chartrow"><div class="lb" title="' + esc(k) + '">' + esc(k) + "</div>" +
            '<div class="tr"><i style="width:' + Math.round((srcs[k] / maxS) * 100) + '%"></i></div>' +
            '<div class="vl">' + srcs[k] + "</div></div>";
        }).join("") + "</div></div></div>" +
      '<div class="card"><div class="card-h"><div><h3>Placements</h3>' +
        '<p class="muted" style="font-size:12.5px;margin-top:3px">Where past clients landed, and what they were awarded.</p></div></div>' +
        '<div class="card-b flush">' + outHtml + "</div></div>" +
    "</div>");
}

/* ------------------------------------------------ fees (per client) ------------------------------------------------ */
function cBilling(c) {
  var b = NB.billOf(c.id);
  var pays = b.payments.slice().sort(function (x, y) { return String(y.at).localeCompare(String(x.at)); });
  var payHtml = pays.length ? pays.map(function (p, i) {
    return '<div class="schoolrow"><div style="min-width:0;flex:1"><div class="nm money">' + money(num(p.amount)) + "</div>" +
      '<div class="loc">' + fmtDate(p.at) + (p.method ? " · " + esc(p.method) : "") + (p.note ? " · " + esc(p.note) : "") + "</div></div>" +
      '<div class="rt"><button class="btn ghost sm" data-act="delpay" data-v="' + i + '" aria-label="Remove">✕</button></div></div>';
  }).join("") : '<div class="empty"><p>No payments recorded.</p></div>';

  return '<div class="card-h"><div><h3>Fees and payments</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">Restricted to editors. This tab does not exist in the client portal.</p></div>' +
    '<button class="btn pri" data-act="addpay">+ Record payment</button></div>' +
    '<div class="card-b">' +
      '<div class="grid3" style="margin-bottom:18px">' + kpi(money(b.fee), "Fee agreed") + kpi(money(b.paid), "Collected") +
        kpi(money(Math.max(0, b.due)), "Outstanding", b.due > 0) + "</div>" +
      '<div class="grid2" style="gap:14px">' +
        '<div class="field"><label for="feeAmt">Fee agreed (USD)</label><input class="inp" id="feeAmt" value="' + esc(b.fee || "") + '" placeholder="1500"></div>' +
        '<div class="field"><label for="feeSrc">How this client found you</label><input class="inp" id="feeSrc" value="' + esc(b.referral) + '" placeholder="Referral — Ngozi Okafor" list="srcList"></div>' +
      "</div>" +
      '<div class="field" style="margin-top:14px"><label for="feeNote">Terms</label>' +
      '<textarea class="inp" id="feeNote" style="min-height:70px" placeholder="Half on signing, half when the first application goes in.">' + esc(b.note) + "</textarea></div>" +
      '<div style="margin-top:14px"><button class="btn pri" data-act="savebill">Save</button></div>' +
    "</div>" +
    '<div class="card-h" style="border-top:1px solid var(--line)"><div><h3>Payments received</h3></div></div>' +
    '<div class="card-b flush">' + payHtml + "</div>";
}

/* ------------------------------------------------ scores & referees ------------------------------------------------ */
var ENGLISH_TESTS = ["TOEFL iBT", "IELTS Academic", "Duolingo English Test", "PTE Academic", "Not sat yet"];
function cFile(c) {
  var sc = c.scores || {}, e = sc.english || {};
  var flags = [];
  (c.schools || []).forEach(function (r) {
    NB.scoreFlags(c, r).forEach(function (f) { flags.push({ school: r.name, msg: f }); });
  });
  var gaps = NB.refGaps(c);
  var refs = c.refs || [], schools = c.schools || [];

  var refHtml = refs.length ? refs.map(function (f, i) {
    var sent = f.sent || {}, done = schools.filter(function (_, si) { return sent[String(si)]; }).length;
    return '<div class="tplrow" style="flex-direction:column;align-items:stretch;gap:8px">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="min-width:0;flex:1"><div style="font-weight:600">' + esc(f.name) + "</div>" +
        '<div class="muted" style="font-size:12.5px">' + esc(f.role || "Role not set") + (f.email ? " · " + esc(f.email) : "") +
        (f.askedAt ? " · asked " + fmtDate(f.askedAt) : " · not asked yet") + "</div></div>" +
        '<span class="pill ' + (schools.length && done === schools.length ? "ok" : done ? "warn" : "") + '">' + done + " / " + schools.length + " submitted</span>" +
        '<button class="btn ghost sm" data-act="editref" data-v="' + i + '">Edit</button>' +
        '<button class="btn ghost sm" data-act="delref" data-v="' + i + '" aria-label="Remove">✕</button>' +
      "</div>" +
      (schools.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap">' + schools.map(function (r, si) {
        var on = !!sent[String(si)];
        return '<button class="pill ' + (on ? "ok" : "") + '" style="border:1px solid ' + (on ? "transparent" : "var(--line2)") +
          ';cursor:pointer" data-act="refsent" data-v="' + i + "|" + si + '">' + (on ? "✓ " : "") + esc(r.name) + "</button>";
      }).join("") + "</div>" : '<div class="muted" style="font-size:12.5px">No schools on the shortlist yet.</div>') +
      "</div>";
  }).join("") : '<div class="empty"><p>No referees recorded. A missing recommendation letter is the most common way a finished application still misses its deadline — track them by name.</p></div>';

  return '<div class="card-h"><div><h3>Test scores</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">The lowest section matters as much as the total — many programmes set a floor on speaking or writing separately.</p></div>' +
    '<button class="btn pri" data-act="editscores">Edit scores</button></div>' +
    '<div class="card-b">' +
      '<div class="grid3">' +
        kpi(e.total ? (e.total + "") : "—", (e.test || "English test") + (e.date ? " · " + fmtDate(e.date) : "")) +
        kpi(e.low ? (e.low + "") : "—", "Lowest section") +
        kpi(num(sc.greV) || num(sc.greQ) ? (num(sc.greV) + " V / " + num(sc.greQ) + " Q") : (num(sc.gmat) ? num(sc.gmat) + "" : "—"),
            num(sc.gmat) && !num(sc.greV) ? "GMAT total" : "GRE verbal / quant") +
      "</div>" +
      (flags.length
        ? '<div class="notice" style="margin-top:16px"><div><b>' + flags.length + " score problem" + (flags.length === 1 ? "" : "s") + " on the shortlist.</b>" +
          "<ul style=\"margin:6px 0 0;padding-left:18px\">" + flags.map(function (f) {
            return "<li>" + esc(f.school) + " — " + esc(f.msg) + "</li>"; }).join("") + "</ul></div></div>"
        : ((c.schools || []).some(function (r) { return num(r.minEnglish); })
            ? '<div class="notice info" style="margin-top:16px">Scores clear every minimum recorded on the shortlist.</div>'
            : '<p class="muted" style="font-size:12.5px;margin-top:14px">Add each programme\'s minimum score on its shortlist entry and the mismatches get flagged here automatically.</p>')) +
    "</div>" +
    '<div class="card-h" style="border-top:1px solid var(--line)"><div><h3>Referees</h3>' +
    '<p class="muted" style="font-size:12.5px;margin-top:3px">Tick a school once that referee has actually submitted through its portal.</p></div>' +
    '<button class="btn pri" data-act="addref">+ Add referee</button></div>' +
    (gaps.length ? '<div class="card-b" style="padding-bottom:0"><div class="notice">' +
      "<div><b>Letters still missing on applications in flight.</b><ul style=\"margin:6px 0 0;padding-left:18px\">" +
      gaps.map(function (g) { return "<li>" + esc(g.school) + " — " + g.missing + " of " + g.of + " outstanding</li>"; }).join("") +
      "</ul></div></div></div>" : "") +
    '<div class="card-b flush">' + refHtml + "</div>";
}

/* ------------------------------------------------ modals ------------------------------------------------ */
function closeModal() { $("#modalHost").innerHTML = ""; }
function modal(title, bodyHtml, okLabel, onOk) {
  $("#modalHost").innerHTML =
    '<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true">' +
    '<div class="card-h"><h3>' + esc(title) + '</h3><button class="btn ghost sm" data-act="closemodal" aria-label="Close">✕</button></div>' +
    '<div class="mb">' + bodyHtml + "</div>" +
    '<div class="mf"><button class="btn" data-act="closemodal">Cancel</button>' +
    '<button class="btn pri" data-act="modalok">' + esc(okLabel) + "</button></div></div></div>";
  $("#modalHost")._ok = onOk;
  var f = $("#modalHost").querySelector("input,select,textarea"); if (f) f.focus();
}
function fld(id, label, val, ph, type) {
  return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><input class="inp" id="' + id +
    '" type="' + (type || "text") + '" value="' + esc(val == null ? "" : val) + '" placeholder="' + esc(ph || "") + '"></div>';
}
function sel(id, label, val, opts) {
  return '<div class="field"><label for="' + id + '">' + esc(label) + '</label><select class="inp" id="' + id + '">' +
    opts.map(function (o) {
      var value = typeof o === "string" ? o : o.v, text = typeof o === "string" ? o : o.n;
      return '<option value="' + esc(value) + '" ' + (value === val ? "selected" : "") + ">" + esc(text) + "</option>";
    }).join("") + "</select></div>";
}
function newCode() {
  var n = ""; for (var i = 0; i < 4; i++) n += Math.floor(Math.random() * 10);
  return "NB-" + n;
}
var TERMS = ["Fall 2027", "Spring 2028", "Fall 2028", "Spring 2029", "Fall 2029", "Not set"];

function clientModal(existing) {
  var c = existing || {};
  var tplOpts = Object.keys(S.templates).map(function (i) { return { v: i, n: S.templates[i].name }; });
  if (!tplOpts.length) tplOpts = [{ v: "default", n: "Standard plan" }];
  modal(existing ? "Edit client" : "New client",
    fld("fName", "Full name (exactly as on the passport)", c.name, "Ama Serwaa Boateng") +
    '<div class="grid2" style="gap:12px">' + fld("fEmail", "Email", c.email, "name@example.com", "email") + fld("fPhone", "Phone", c.phone, "+233 …") + "</div>" +
    '<div class="grid2" style="gap:12px">' + fld("fCountry", "Country", c.country, "Ghana") + fld("fField", "Field of study", c.field, "MS Computer Science") + "</div>" +
    '<div class="grid2" style="gap:12px">' + sel("fTerm", "Target intake", c.targetTerm || "Fall 2027", TERMS) +
      sel("fStatus", "Status", c.status || "Active", ["Active", "Paused", "Placed", "Archived"]) + "</div>" +
    '<div class="grid2" style="gap:12px">' + sel("fTpl", "Plan", c.template || "default", tplOpts) +
      fld("fBudget", "Funds available per year (USD)", c.budget || "", "25000") + "</div>" +
    fld("fCode", "Access code", c.code || newCode(), ""),
    existing ? "Save changes" : "Create client",
    function () {
      var name = $("#fName").value.trim();
      if (!name) { toast("A name is required."); return false; }
      var oldCode = existing && existing.code ? String(existing.code).toUpperCase() : "";
      var body = {
        name: name, email: $("#fEmail").value.trim(), phone: $("#fPhone").value.trim(),
        country: $("#fCountry").value.trim(), field: $("#fField").value.trim(),
        targetTerm: $("#fTerm").value, status: $("#fStatus").value, template: $("#fTpl").value,
        budget: num($("#fBudget").value),
        code: ($("#fCode").value.trim().toUpperCase() || newCode()).replace(/[^A-Z0-9_\-]/g, "")
      };
      if (!body.code) body.code = newCode();
      if (existing) {
        for (var k in body) existing[k] = body[k];
        if (oldCode && oldCode !== body.code) NB.dropCode(oldCode);
        NB.setCode(body.code, existing.id);
        NB.scheduleSave(existing.id, 0); toast("Client updated");
      } else {
        var id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
        body.tasks = {}; body.due = {}; body.docs = {}; body.schools = []; body.files = [];
        body.createdAt = new Date().toISOString(); body.updatedAt = body.createdAt;
        body.id = id; S.clients.push(body);
        S.clients.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
        NB.setCode(body.code, id);
        NB.scheduleSave(id, 0);
        toast("Client created — access code " + body.code);
      }
      render(); return true;
    });
}

function schoolModal(idx) {
  var c = meClient(); if (!c) return;
  var r = idx != null ? (c.schools || [])[idx] : {};
  modal(idx != null ? "Edit school" : "Add school",
    fld("sName", "Institution", r.name, "University of Texas at Dallas") +
    fld("sProg", "Programme", r.program, "MS Information Technology & Management") +
    '<div class="grid2" style="gap:12px">' + fld("sDl", "Funding / priority deadline", r.deadline, "", "date") +
      sel("sSt", "Status", r.status || "Researching", SCH_STATES) + "</div>" +
    '<p class="muted" style="font-size:12px;margin:2px 0 -4px">Cost figures come from the school\'s own cost-of-attendance page. Leave blank until you have them.</p>' +
    '<div class="grid2" style="gap:12px">' + fld("sTu", "Tuition per year (USD)", r.tuition || "", "0") + fld("sFe", "Fees per year", r.fees || "", "0") + "</div>" +
    '<div class="grid2" style="gap:12px">' + fld("sLi", "Living cost per year", r.living || "", "0") + fld("sAw", "Award / assistantship per year", r.award || "", "0") + "</div>" +
    '<p class="muted" style="font-size:12px;margin:2px 0 -4px">Entry requirements, from the programme page. Scores on file get checked against these.</p>' +
    '<div class="grid2" style="gap:12px">' + fld("sMinE", "Minimum English score", r.minEnglish || "", "90") +
      fld("sMinS", "Minimum single section", r.minSection || "", "22") + "</div>" +
    '<div class="grid2" style="gap:12px">' + sel("sGre", "GRE / GMAT", r.greRequired || "Not checked", ["Not checked", "Required", "Optional", "Not required"]) +
      fld("sAppFee", "Application fee (USD)", r.appFee || "", "90") + "</div>" +
    '<div class="grid2" style="gap:12px">' + fld("sPortal", "Portal login", r.portalUser, "ama.boateng@example.com") +
      fld("sAppId", "Application ID", r.appId, "2027-448120") + "</div>" +
    sel("sFeePaid", "Application fee", r.feePaid ? "Paid" : "Not paid", ["Not paid", "Paid", "Waived"]) +
    fld("sNote", "Note", r.note, "Assistantship form is separate and closes two weeks earlier"),
    idx != null ? "Save" : "Add to list",
    function () {
      var nm = $("#sName").value.trim();
      if (!nm) { toast("Name the institution."); return false; }
      var o = { sid: r.sid || null, name: nm, program: $("#sProg").value.trim(), deadline: $("#sDl").value || "",
        status: $("#sSt").value, note: $("#sNote").value.trim(), loc: r.loc || "",
        tuition: num($("#sTu").value), fees: num($("#sFe").value), living: num($("#sLi").value), award: num($("#sAw").value),
        minEnglish: num($("#sMinE").value), minSection: num($("#sMinS").value), greRequired: $("#sGre").value,
        appFee: num($("#sAppFee").value), portalUser: $("#sPortal").value.trim(), appId: $("#sAppId").value.trim(),
        feePaid: $("#sFeePaid").value !== "Not paid" };
      c.schools = c.schools || [];
      if (idx != null) c.schools[idx] = o; else c.schools.push(o);
      NB.scheduleSave(c.id, 0); render(); return true;
    });
}

function stepModal(tid, stage, stepId) {
  var t = S.templates[tid]; if (!t) return;
  var x = stepId ? t.tasks.filter(function (a) { return a.id === stepId; })[0] : null;
  modal(x ? "Edit step" : "Add step",
    fld("xT", "Step", x ? x.t : "", "Official transcripts requested") +
    '<div class="field"><label for="xH">Guidance note</label><textarea class="inp" id="xH" style="min-height:76px" placeholder="What the client actually has to do, and the trap to avoid.">' + esc(x ? x.h : "") + "</textarea></div>" +
    sel("xS", "Stage", x ? x.s : stage, STAGES.map(function (s) { return { v: s.id, n: s.n + ". " + s.name }; })) +
    sel("xO", "Owner", x ? x.o : "c", [{ v: "c", n: "Client" }, { v: "a", n: "Advisor" }]),
    x ? "Save step" : "Add step",
    function () {
      var title = $("#xT").value.trim();
      if (!title) { toast("Give the step a title."); return false; }
      var o = { id: x ? x.id : "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36),
        t: title, h: $("#xH").value.trim(), s: $("#xS").value, o: $("#xO").value };
      if (x) { for (var k in o) x[k] = o[k]; } else { t.tasks.push(o); }
      NB.saveTemplate(tid); render(); return true;
    });
}


function scoresModal(c) {
  var sc = c.scores || {}, e = sc.english || {};
  modal("Test scores",
    sel("zTest", "English test", e.test || "Not sat yet", ENGLISH_TESTS) +
    '<div class="grid2" style="gap:12px">' + fld("zTotal", "Overall score", e.total || "", "98") +
      fld("zLow", "Lowest section", e.low || "", "21") + "</div>" +
    fld("zDate", "Date sat", e.date || "", "", "date") +
    '<p class="muted" style="font-size:12px;margin:4px 0 -4px">GRE and GMAT \u2014 leave blank where the programmes do not ask for them.</p>' +
    '<div class="grid3" style="gap:12px">' + fld("zV", "GRE verbal", sc.greV || "", "155") +
      fld("zQ", "GRE quant", sc.greQ || "", "162") + fld("zA", "GRE AWA", sc.greAWA || "", "4.0") + "</div>" +
    fld("zG", "GMAT total", sc.gmat || "", "650"),
    "Save scores",
    function () {
      c.scores = {
        english: { test: $("#zTest").value, total: num($("#zTotal").value), low: num($("#zLow").value), date: $("#zDate").value || "" },
        greV: num($("#zV").value), greQ: num($("#zQ").value), greAWA: num($("#zA").value), gmat: num($("#zG").value)
      };
      NB.scheduleSave(c.id, 0); render(); toast("Scores saved"); return true;
    });
}

function refModal(c, idx) {
  var f = idx != null ? (c.refs || [])[idx] : {};
  modal(idx != null ? "Edit referee" : "Add referee",
    fld("rName", "Name", f.name, "Dr Kwame Asare") +
    '<div class="grid2" style="gap:12px">' + fld("rRole", "Role", f.role, "Supervisor, KNUST") +
      fld("rEmail", "Email", f.email, "k.asare@example.edu", "email") + "</div>" +
    fld("rAsked", "Asked on", f.askedAt || "", "", "date"),
    idx != null ? "Save" : "Add referee",
    function () {
      var nm = $("#rName").value.trim();
      if (!nm) { toast("Name the referee."); return false; }
      var o = { name: nm, role: $("#rRole").value.trim(), email: $("#rEmail").value.trim(),
                askedAt: $("#rAsked").value || "", sent: f.sent || {} };
      c.refs = c.refs || [];
      if (idx != null) c.refs[idx] = o; else c.refs.push(o);
      NB.scheduleSave(c.id, 0); render(); return true;
    });
}

function payModal(c) {
  modal("Record payment",
    fld("pAmt", "Amount (USD)", "", "750") +
    fld("pAt", "Received on", NB.today(), "", "date") +
    sel("pHow", "Method", "Bank transfer", ["Bank transfer", "Mobile money", "Cash", "Card", "Other"]) +
    fld("pNote", "Note", "", "First instalment"),
    "Record",
    function () {
      var amt = num($("#pAmt").value);
      if (!amt) { toast("Enter an amount."); return false; }
      var b = NB.billOf(c.id), cur = S.billing[c.id] || {};
      var pays = (cur.payments || []).slice();
      pays.push({ amount: amt, at: $("#pAt").value || NB.today(), method: $("#pHow").value, note: $("#pNote").value.trim() });
      NB.saveBilling(c.id, { fee: b.fee, referral: b.referral, note: b.note, payments: pays });
      render(); toast("Payment recorded"); return true;
    });
}

function outcomeModal(c) {
  var o = c.outcome || {};
  modal("Where did " + (c.name || "this client") + " land?",
    fld("oSchool", "Institution", o.school, "University of Michigan") +
    fld("oProg", "Programme", o.program, "MEng Civil Engineering") +
    '<div class="grid2" style="gap:12px">' + fld("oTerm", "Intake", o.term, "Spring 2028") +
      fld("oAward", "Total award (USD)", o.award || "", "14000") + "</div>" +
    fld("oNote", "Note", o.note, "Assistantship plus partial tuition waiver") +
    '<p class="muted" style="font-size:12px">Recording an outcome also marks the client Placed.</p>',
    "Save outcome",
    function () {
      var sch = $("#oSchool").value.trim();
      if (!sch) {
        if (c.outcome) { delete c.outcome; NB.scheduleSave(c.id, 0); render(); toast("Outcome cleared"); return true; }
        toast("Name the institution."); return false;
      }
      c.outcome = { school: sch, program: $("#oProg").value.trim(), term: $("#oTerm").value.trim(),
                    award: num($("#oAward").value), note: $("#oNote").value.trim() };
      c.status = "Placed";
      NB.scheduleSave(c.id, 0); render(); toast("Outcome recorded"); return true;
    });
}

/* ------------------------------------------------ wiring ------------------------------------------------ */
function wire() {
  var notes = $("#notesBox");
  if (notes) notes.addEventListener("blur", function () {
    var c = meClient(); if (!c) return;
    if ((S.notes[c.id] || "") === notes.value) return;
    NB.saveNote(c.id, notes.value); toast("Notes saved");
  });
  var dq = $("#dq");
  if (dq) dq.addEventListener("input", function () {
    S.dir.q = dq.value; S.dir.limit = 60;
    var pos = dq.selectionStart; render();
    var n = $("#dq"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
  });
  var cq = $("#cq");
  if (cq) cq.addEventListener("input", function () {
    S.cq = cq.value;
    var pos = cq.selectionStart; render();
    var n = $("#cq"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
  });
  var th = $("#thread"); if (th) th.scrollTop = th.scrollHeight;
  var mi = $("#msgIn");
  if (mi) {
    mi.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doSend(); }
    });
    var c = meClient(); if (c && NB.unread(c)) NB.markRead(c.id);
  }
  var fi = $("#fileIn");
  if (fi) fi.addEventListener("change", function () {
    var f = fi.files && fi.files[0]; if (!f) return;
    doUpload(f);
  });
}
function doSend() {
  var c = meClient(), mi = $("#msgIn");
  if (!c || !mi) return;
  var body = mi.value.trim(); if (!body) return;
  mi.value = "";
  NB.sendMsg(c.id, body);
  render();
}
function doUpload(f) {
  var c = meClient(); if (!c) return;
  if (!NB.ASSETS) { toast("Uploads are not available in this view."); return; }
  if (f.size > 19 * 1024 * 1024) { toast("That file is too large — 19 MB maximum."); return; }
  toast("Uploading " + f.name + "…");
  NB.ASSETS.upload(f).then(function (a) {
    c.files = c.files || [];
    c.files.push({ aid: a.id, name: f.name, type: f.type || "", size: f.size, at: new Date().toISOString() });
    NB.scheduleSave(c.id, 0); render(); toast("Uploaded");
  }).catch(function (e) {
    console.warn(e); toast("Upload failed — try a smaller file or a different format.");
  });
}

document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-act]");
  if (!t) return;
  var a = t.getAttribute("data-act"), v = t.getAttribute("data-v");

  if (a === "logintab") { S.loginTab = v; render(); return; }
  if (a === "dologin") { doLogin(); return; }
  if (a === "ownerin") { NB.signInAdvisor(); return; }
  if (a === "signout") { NB.signOut(); return; }

  if (a === "go") {
    if (v.indexOf("client:") === 0) { S.view = "client"; S.tab = v.slice(7); }
    else { S.view = v; if (v === "clients" && isAdvisor()) S.open = null; }
    render(); return;
  }
  if (a === "openclient") { S.open = v; S.view = "client"; S.tab = "overview"; NB.attachMessages(v); render(); return; }
  if (a === "ctab") { S.tab = v; render(); return; }
  if (a === "res") { S.res = v; render(); return; }
  if (a === "dmore") { S.dir.limit += 60; render(); return; }
  if (a === "calprev") { S.cal.m--; if (S.cal.m < 0) { S.cal.m = 11; S.cal.y--; } render(); return; }
  if (a === "calnext") { S.cal.m++; if (S.cal.m > 11) { S.cal.m = 0; S.cal.y++; } render(); return; }
  if (a === "caltoday") { var n = new Date(); S.cal = { y: n.getFullYear(), m: n.getMonth() }; render(); return; }
  if (a === "printrep") { window.print(); return; }

  if (a === "newclient") { clientModal(null); return; }
  if (a === "editclient") { clientModal(byId(v)); return; }
  if (a === "delclient") {
    var c0 = byId(v); if (!c0) return;
    modal("Delete " + c0.name + "?", "<p>This removes the record, their progress, their shortlist and their messages for good. It cannot be undone.</p>",
      "Delete permanently", function () {
        S.clients = S.clients.filter(function (x) { return x.id !== v; });
        if (c0.code) NB.dropCode(String(c0.code).toUpperCase());
        if (NB.DB) NB.queue("clients/" + v, function () { return NB.DB.doc("clients/" + v).delete(); });
        if (NB.DB) NB.queue("notes/" + v, function () { return NB.DB.doc("notes/" + v).delete(); });
        if (S.open === v) { S.open = null; S.view = "clients"; }
        render(); toast("Client deleted"); return true;
      });
    return;
  }
  if (a === "regen") {
    var c1 = byId(v); if (!c1) return;
    if (c1.code) NB.dropCode(String(c1.code).toUpperCase());
    c1.code = newCode(); NB.setCode(c1.code, c1.id);
    NB.scheduleSave(c1.id, 0); render(); toast("New code: " + c1.code); return;
  }
  if (a === "savecfg") {
    S.cfg.orgName = $("#setName").value.trim() || "Northbound Advising";
    S.cfg.advisorCode = $("#setCode").value.trim();
    S.cfg.welcome = $("#setWelcome").value.trim();
    NB.saveCfg(); render(); toast("Settings saved"); return;
  }
  if (a === "setbudget") {
    var cb = meClient(); if (!cb) return;
    modal("Funds available per year", fld("bAmt", "Amount the family can commit each year (USD)", cb.budget || "", "25000") +
      '<p class="muted" style="font-size:12.5px">Used to work out the funding gap against each school\'s net cost.</p>',
      "Save", function () { cb.budget = num($("#bAmt").value); NB.scheduleSave(cb.id, 0); render(); return true; });
    return;
  }

  if (a === "tick") {
    var c2 = meClient(); if (!c2) return;
    var ts = NB.tplOf(c2), td = null;
    for (var ti = 0; ti < ts.length; ti++) if (ts[ti].id === v) { td = ts[ti]; break; }
    if (td && !isAdvisor() && td.o === "a") { toast("Your advisor marks this one off."); return; }
    c2.tasks = c2.tasks || {};
    if (c2.tasks[v]) delete c2.tasks[v]; else c2.tasks[v] = NB.today();
    NB.scheduleSave(c2.id); render(); return;
  }
  if (a === "docnext") {
    var c3 = meClient(); if (!c3) return;
    c3.docs = c3.docs || {};
    c3.docs[v] = ((c3.docs[v] || 0) + 1) % 4;
    NB.scheduleSave(c3.id); render(); return;
  }
  if (a === "addsch") { schoolModal(null); return; }
  if (a === "editsch") { schoolModal(Number(v)); return; }
  if (a === "delsch") {
    var c4 = meClient(); if (!c4) return;
    c4.schools.splice(Number(v), 1); NB.scheduleSave(c4.id, 0); render(); return;
  }
  if (a === "delfile") {
    var c6 = meClient(); if (!c6) return;
    var f = (c6.files || [])[Number(v)]; if (!f) return;
    modal("Remove " + f.name + "?", "<p>The file is deleted from this workspace for good.</p>", "Remove", function () {
      c6.files.splice(Number(v), 1); NB.scheduleSave(c6.id, 0);
      if (NB.ASSETS && f.aid) NB.ASSETS.delete(f.aid).catch(function () {});
      render(); return true;
    });
    return;
  }
  if (a === "addfromdir") {
    var c5 = meClient();
    if (!c5) { toast("Open a client first, then add schools to their list."); return; }
    var s = null;
    for (var i = 0; i < SCHOOLS.length; i++) if (SCHOOLS[i].id === v) { s = SCHOOLS[i]; break; }
    if (!s) return;
    c5.schools = c5.schools || [];
    c5.schools.push({ sid: s.id, name: s.name, program: "", deadline: "", status: "Researching", note: "",
      loc: s.city + ", " + s.state, tuition: 0, fees: 0, living: 0, award: 0,
      minEnglish: 0, minSection: 0, greRequired: "Not checked", appFee: 0, portalUser: "", appId: "", feePaid: false });
    NB.scheduleSave(c5.id, 0); render(); toast("Added to " + (c5.name || "the") + "'s list"); return;
  }
  if (a === "sendmsg") { doSend(); return; }

  if (a === "openbill") { S.open = v; S.view = "client"; S.tab = "billing"; NB.attachMessages(v); render(); return; }
  if (a === "outcome") { var co = byId(v) || meClient(); if (co) outcomeModal(co); return; }
  if (a === "savebill") {
    var cb2 = meClient(); if (!cb2) return;
    var prev = NB.billOf(cb2.id);
    NB.saveBilling(cb2.id, { fee: num($("#feeAmt").value), referral: $("#feeSrc").value.trim(),
                             note: $("#feeNote").value.trim(), payments: prev.payments });
    render(); toast("Saved"); return;
  }
  if (a === "addpay") { var cp = meClient(); if (cp) payModal(cp); return; }
  if (a === "delpay") {
    var cd = meClient(); if (!cd) return;
    var bb = NB.billOf(cd.id);
    var sorted = bb.payments.slice().sort(function (x, y) { return String(y.at).localeCompare(String(x.at)); });
    var gone = sorted[Number(v)];
    var kept = bb.payments.filter(function (p) { return p !== gone; });
    NB.saveBilling(cd.id, { fee: bb.fee, referral: bb.referral, note: bb.note, payments: kept });
    render(); toast("Payment removed"); return;
  }

  if (a === "editscores") { var cs2 = meClient(); if (cs2) scoresModal(cs2); return; }
  if (a === "addref") { var cr = meClient(); if (cr) refModal(cr, null); return; }
  if (a === "editref") { var cr2 = meClient(); if (cr2) refModal(cr2, Number(v)); return; }
  if (a === "delref") {
    var cr3 = meClient(); if (!cr3) return;
    (cr3.refs || []).splice(Number(v), 1); NB.scheduleSave(cr3.id, 0); render(); return;
  }
  if (a === "refsent") {
    var cr4 = meClient(); if (!cr4) return;
    var pr = v.split("|"), f = (cr4.refs || [])[Number(pr[0])]; if (!f) return;
    f.sent = f.sent || {};
    if (f.sent[pr[1]]) delete f.sent[pr[1]]; else f.sent[pr[1]] = true;
    NB.scheduleSave(cr4.id, 0); render(); return;
  }

  if (a === "tplopen") { S.tplOpen = v; render(); return; }
  if (a === "tplnew" || a === "tpldup") {
    var src = a === "tpldup" ? (S.templates[v] || {}) : null;
    var base = src && src.tasks ? src.tasks : (S.templates["default"] && S.templates["default"].tasks) || NB.TASKS;
    modal(a === "tpldup" ? "Duplicate template" : "New template",
      fld("tName", "Name", a === "tpldup" ? (src.name || "") + " copy" : "", "MBA applicants"),
      "Create", function () {
        var nm = $("#tName").value.trim(); if (!nm) { toast("Name it first."); return false; }
        var id = "tpl" + Date.now().toString(36);
        S.templates[id] = { id: id, name: nm, tasks: JSON.parse(JSON.stringify(base)) };
        NB.saveTemplate(id); S.tplOpen = id; render(); toast("Template created"); return true;
      });
    return;
  }
  if (a === "tplrename") {
    var tr = S.templates[v]; if (!tr) return;
    modal("Rename template", fld("tName", "Name", tr.name, ""), "Save", function () {
      var nm = $("#tName").value.trim(); if (!nm) return false;
      tr.name = nm; NB.saveTemplate(v); render(); return true;
    });
    return;
  }
  if (a === "tpldel") {
    if (v === "default") { toast("The standard plan cannot be deleted."); return; }
    var usedBy = S.clients.filter(function (c) { return c.template === v; });
    modal("Delete this template?",
      "<p>" + (usedBy.length ? usedBy.length + " client" + (usedBy.length === 1 ? "" : "s") + " will move back to the standard plan. Their ticks are kept."
                              : "No client is using it.") + "</p>",
      "Delete", function () {
        usedBy.forEach(function (c) { c.template = "default"; NB.scheduleSave(c.id, 0); });
        delete S.templates[v];
        if (NB.DB) NB.queue("templates/" + v, function () { return NB.DB.doc("templates/" + v).delete(); });
        S.tplOpen = null; render(); return true;
      });
    return;
  }
  if (a === "stepadd") { var pa = v.split("|"); stepModal(pa[0], pa[1], null); return; }
  if (a === "stepedit") { var pe = v.split("|"); stepModal(pe[0], null, pe[1]); return; }
  if (a === "stepdel") {
    var pd = v.split("|"), tt = S.templates[pd[0]]; if (!tt) return;
    tt.tasks = tt.tasks.filter(function (x) { return x.id !== pd[1]; });
    NB.saveTemplate(pd[0]); render(); return;
  }

  if (a === "closemodal" || a === "scrim") { if (a === "scrim" && e.target !== t) return; closeModal(); return; }
  if (a === "modalok") { var fn = $("#modalHost")._ok; if (!fn || fn() !== false) closeModal(); return; }
});

document.addEventListener("change", function (e) {
  var t = e.target.closest("[data-act]");
  if (!t) return;
  var a = t.getAttribute("data-act");
  if (a === "dfil") { S.dir[t.getAttribute("data-k")] = t.value; S.dir.limit = 60; render(); return; }
  if (a === "cstatus") { S.cstatus = t.value; render(); return; }
  if (a === "schstat") {
    var c = meClient(); if (!c) return;
    c.schools[Number(t.getAttribute("data-v"))].status = t.value;
    NB.scheduleSave(c.id, 0); render(); return;
  }
  if (a === "setdue") {
    var c2 = meClient(); if (!c2) return;
    c2.due = c2.due || {};
    var id = t.getAttribute("data-v");
    if (t.value) c2.due[id] = t.value; else delete c2.due[id];
    NB.scheduleSave(c2.id, 0); render(); return;
  }
});
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

NB.boot();
})(window.NB);
