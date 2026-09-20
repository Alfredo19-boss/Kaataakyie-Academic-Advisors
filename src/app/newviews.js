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
