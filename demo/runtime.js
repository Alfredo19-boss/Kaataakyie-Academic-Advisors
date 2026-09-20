/* Demo runtime — stands in for the Claude artifact runtime on a static host.
 *
 * It gives the dashboard a real, working database backed by this visitor's own localStorage:
 * everything they tick, type or add persists across reloads, in their browser only. Nothing is
 * shared, nothing reaches anyone else, and clearing site data resets it. Seeded with the same
 * three fictional clients so the console has something to show on the first look.
 *
 * Loaded only into site/demo/index.html. The published artifact never sees this file.
 */
(function () {
  "use strict";
  var KEY = "katakyie.demo.v2";
  window.NB_DEMO = true;

  /* ---------------------------------- persistence ---------------------------------- */
  var store = null;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }
  window.NB_DEMO_RESET = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  /* ---------------------------------- seed ---------------------------------- */
  function seed() {
    var s = {};
    s["config/app"] = {
      orgName: "Katakyie Academic Advisor",
      advisorCode: "KATAKYIE",
      welcome: "This dashboard is the single place we track your application. Tick anything off as you finish it — I keep the rest current, and anything marked Advisor is mine to do."
    };
    s["templates/default"] = {
      name: "Standard plan — taught master's",
      tasks: (window.NB_TASKS || []).map(function (t) { return { id: t.id, s: t.s, o: t.o, t: t.t, h: t.h }; })
    };

    var done = function (ids, d) { var o = {}; ids.forEach(function (k) { o[k] = d; }); return o; };

    s["clients/c_ama"] = {
      name: "Ama Serwaa Boateng", email: "ama.boateng@example.com", phone: "+233 20 000 0000",
      country: "Ghana", field: "MS Computer Science", targetTerm: "Fall 2027", status: "Active",
      code: "KA-4821", template: "default", budget: 22000,
      tasks: Object.assign(done(["t01","t02","t03","t04","t05","t06"], "2026-08-06"),
                           done(["t07","t08","t09","t10"], "2026-09-05"),
                           done(["t13","t14"], "2026-09-12")),
      due: { t11: "2026-10-06", t12: "2026-10-20", t13: "2026-09-30", t17: "2026-10-12" },
      docs: { d01: 3, d02: 2, d03: 3, d05: 2, d07: 1 },
      scores: { english: { test: "TOEFL iBT", total: 98, low: 21, date: "2026-09-02" }, greV: 0, greQ: 0, greAWA: 0, gmat: 0 },
      refs: [
        { name: "Dr Kwame Asare", role: "Supervisor, KNUST", email: "k.asare@example.edu", askedAt: "2026-09-08", sent: { "0": true } },
        { name: "Prof. Efua Danso", role: "Head of Department", email: "e.danso@example.edu", askedAt: "2026-09-08", sent: {} },
        { name: "Mr Yaw Owusu", role: "Engineering manager", email: "y.owusu@example.com", askedAt: "", sent: {} }
      ],
      schools: [
        { sid: "s1", name: "The University of Texas at Dallas", program: "MS Information Technology & Management",
          deadline: "2026-11-15", status: "Applying", note: "Assistantship form is separate and closes two weeks earlier.",
          loc: "Richardson, TX", tuition: 34000, fees: 2400, living: 15000, award: 12000,
          minEnglish: 90, minSection: 22, greRequired: "Optional", appFee: 50,
          portalUser: "ama.boateng@example.com", appId: "2027-448120", feePaid: true },
        { sid: "s2", name: "Arizona State University", program: "MS Computer Science", deadline: "2026-10-01",
          status: "Researching", note: "", loc: "Tempe, AZ", tuition: 29000, fees: 1800, living: 14000, award: 0,
          minEnglish: 80, minSection: 0, greRequired: "Not required", appFee: 0, portalUser: "", appId: "", feePaid: false },
        { sid: "s3", name: "Syracuse University", program: "MS Computer Science", deadline: "2027-01-10",
          status: "Researching", note: "", loc: "Syracuse, NY", tuition: 0, fees: 0, living: 0, award: 0,
          minEnglish: 0, minSection: 0, greRequired: "Not checked", appFee: 0, portalUser: "", appId: "", feePaid: false }
      ],
      files: [], createdAt: "2026-08-01T09:00:00.000Z", updatedAt: "2026-09-14T09:00:00.000Z"
    };

    s["clients/c_kwabena"] = {
      name: "Kwabena Mensah", email: "k.mensah@example.com", phone: "", country: "Ghana",
      field: "MPH Epidemiology", targetTerm: "Fall 2027", status: "Active", code: "KA-7310",
      template: "default", budget: 0,
      tasks: done(["t01","t02","t03"], "2026-09-16"),
      due: { t05: "2026-10-03", t07: "2026-09-30", t08: "2026-11-02" },
      docs: { d01: 1 }, schools: [], refs: [], files: [],
      createdAt: "2026-09-15T09:00:00.000Z", updatedAt: "2026-09-18T09:00:00.000Z"
    };

    s["clients/c_ngozi"] = {
      name: "Ngozi Okafor", email: "ngozi.okafor@example.com", phone: "", country: "Nigeria",
      field: "MEng Civil Engineering", targetTerm: "Spring 2028", status: "Placed", code: "KA-2094",
      template: "default", budget: 18000,
      tasks: done(["t01","t02","t03","t04","t05","t06","t07","t08","t09","t10","t11","t12","t13","t14","t15","t16",
                   "t17","t18","t19","t20","t21","t22","t23","t24","t25","t27","t28","t30","t31","t32","t33","t34",
                   "t35","t36"], "2026-08-28"),
      due: { t37: "2026-09-24", t38: "2026-09-28", t39: "2026-10-02", t40: "2026-10-08" },
      docs: { d01: 3, d02: 3, d03: 3, d04: 3, d05: 3, d07: 3, d08: 3, d10: 3, d11: 2, d13: 3, d15: 1 },
      refs: [], files: [],
      outcome: { school: "University of Michigan", program: "MEng Civil Engineering", term: "Spring 2028",
                 award: 14000, note: "Partial tuition waiver plus a departmental award." },
      schools: [
        { sid: "s9", name: "University of Michigan", program: "MEng Civil Engineering", deadline: "2026-09-25",
          status: "Admitted", note: "Partial tuition award. Deposit due on the 25th.", loc: "Ann Arbor, MI",
          tuition: 32000, fees: 2100, living: 16000, award: 14000, minEnglish: 100, minSection: 0,
          greRequired: "Not required", appFee: 90, portalUser: "", appId: "", feePaid: true },
        { sid: "s10", name: "Michigan State University", program: "MS Civil Engineering", deadline: "2026-10-15",
          status: "Waitlisted", note: "", loc: "East Lansing, MI", tuition: 28000, fees: 1900, living: 13500,
          award: 0, minEnglish: 0, minSection: 0, greRequired: "Not checked", appFee: 0, portalUser: "", appId: "", feePaid: false }
      ],
      createdAt: "2026-01-20T09:00:00.000Z", updatedAt: "2026-09-19T07:00:00.000Z"
    };

    s["codes/KA-4821"] = { cid: "c_ama" };
    s["codes/KA-7310"] = { cid: "c_kwabena" };
    s["codes/KA-2094"] = { cid: "c_ngozi" };

    s["notes/c_ama"] = { body: "Sample record — this is demo data.\n\nStrong 2:1 from KNUST, two years as a backend engineer. Family can cover roughly half of year one, so an assistantship is not optional. TOEFL speaking came back at 21 — retake booked for early October.", at: "2026-09-14T09:00:00.000Z" };
    s["notes/c_kwabena"] = { body: "Sample record — this is demo data.\n\nNursing degree plus three years in a district health directorate. No English test yet — that is the only thing blocking everything else.", at: "2026-09-18T09:00:00.000Z" };
    s["notes/c_ngozi"] = { body: "Sample record — this is demo data.\n\nAdmitted to Michigan with a partial award. Bank letter is with the sponsor. Book the visa interview the day the SEVIS receipt prints.", at: "2026-09-19T07:00:00.000Z" };

    s["billing/c_ama"] = { fee: 1500, referral: "Referral", note: "Half on signing, half when the first application goes in.",
      payments: [{ amount: 750, at: "2026-08-05", method: "Bank transfer", note: "First instalment" }] };
    s["billing/c_kwabena"] = { fee: 1200, referral: "WhatsApp group", note: "Full amount before the first submission.", payments: [] };
    s["billing/c_ngozi"] = { fee: 1800, referral: "University alumni", note: "",
      payments: [{ amount: 900, at: "2026-02-10", method: "Bank transfer", note: "" },
                 { amount: 900, at: "2026-09-02", method: "Mobile money", note: "Balance" }] };

    s["clients/c_ama/messages/m1"] = { from: "client", body: "My TOEFL came back — 98 overall but speaking is 21. Is that a problem?", at: "2026-09-17T09:12:00.000Z" };
    s["clients/c_ama/messages/m2"] = { from: "advisor", body: "98 overall is fine. Two of your targets set a speaking floor of 22, so book the retake for the first week of October — I'll hold those two applications until the new score lands. The other two we can send now.", at: "2026-09-17T11:40:00.000Z" };
    return s;
  }

  store = load() || seed();
  save();

  /* ---------------------------------- listeners ---------------------------------- */
  var docL = {}, colL = {};
  function on(map, key, fn) {
    (map[key] = map[key] || []).push(fn);
    return function () { map[key] = (map[key] || []).filter(function (f) { return f !== fn; }); };
  }
  function parentCollection(path) { return path.split("/").slice(0, -1).join("/"); }
  function fire(path) {
    save();
    (docL[path] || []).forEach(function (fn) { try { fn(docSnap(path)); } catch (e) {} });
    var col = parentCollection(path);
    (colL[col] || []).forEach(function (fn) { try { fn(querySnap(col)); } catch (e) {} });
  }

  /* ---------------------------------- snapshots ---------------------------------- */
  var META = { fromCache: false, hasPendingWrites: false };
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function docSnap(path) {
    var d = store[path];
    return { id: path.split("/").pop(), exists: !!d, data: function () { return clone(d); }, metadata: META };
  }
  function idsIn(col) {
    var pre = col + "/";
    return Object.keys(store).filter(function (k) {
      return k.indexOf(pre) === 0 && k.slice(pre.length).indexOf("/") < 0;
    }).sort();
  }
  function querySnap(col) {
    var docs = idsIn(col).map(docSnap);
    return { docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: META };
  }

  /* ---------------------------------- refs ---------------------------------- */
  function rid() { return "x" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function docRef(path) {
    return {
      id: path.split("/").pop(), path: path,
      get: function () { return Promise.resolve(docSnap(path)); },
      set: function (d) { store[path] = clone(d); fire(path); return Promise.resolve(); },
      update: function (d) {
        if (!store[path]) return Promise.reject({ code: "invalid_argument", message: "no such document" });
        Object.keys(d).forEach(function (k) { store[path][k] = clone(d[k]); });
        fire(path); return Promise.resolve();
      },
      delete: function () { delete store[path]; fire(path); return Promise.resolve(); },
      acquire: function () { return Promise.resolve({ acquired: true }); },
      onSnapshot: function (next) {
        setTimeout(function () { try { next(docSnap(path)); } catch (e) {} }, 20);
        return on(docL, path, next);
      },
      collection: function (p) { return collRef(path + "/" + p); }
    };
  }
  function collRef(col) {
    var q = {
      path: col,
      doc: function (id) { return docRef(col + "/" + (id || rid())); },
      add: function (d) { var r = q.doc(); return r.set(d).then(function () { return r; }); },
      where: function () { return q; }, orderBy: function () { return q; }, limit: function () { return q; },
      get: function () { return Promise.resolve(querySnap(col)); },
      onSnapshot: function (next) {
        setTimeout(function () { try { next(querySnap(col)); } catch (e) {} }, 20);
        return on(colL, col, next);
      }
    };
    return q;
  }

  /* ---------------------------------- the runtime ---------------------------------- */
  window.claude = {
    use: function (name) {
      if (name === "db") return Promise.resolve({ doc: docRef, collection: collRef });
      if (name === "user") return Promise.resolve({
        isOwner: function () { return Promise.resolve(true); },
        canEdit: function () { return Promise.resolve(true); },
        can: function () { return Promise.resolve(true); },
        me: function () { return Promise.resolve({ id: "demo", name: "", avatarUrl: "", color: "#D9B441", email: null, isOwner: true, canEdit: true }); },
        id: function () { return Promise.resolve("demo"); },
        profiles: function () { return Promise.resolve({}); }
      });
      /* File uploads need real storage; the demo has none, so the upload control stays hidden. */
      return Promise.resolve(null);
    }
  };
})();
