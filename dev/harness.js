// Local preview harness only — not published. Fakes window.claude with an in-memory store.
(function () {
  var store = {
    "config/app": { orgName: "Northbound Advising", advisorCode: "TRYME", welcome: "" },
    "clients/c1": { name: "Ama Serwaa Boateng", email: "a@example.com", country: "Ghana", field: "MS Computer Science",
      targetTerm: "Fall 2027", status: "Active", code: "NB-4821", notes: "",
      tasks: { t01: "2026-08-01", t02: "2026-08-04", t03: "2026-08-04", t04: "2026-08-06", t05: "2026-08-10", t06: "2026-08-12",
        t07: "2026-08-20", t08: "2026-09-02", t09: "2026-09-05", t10: "2026-09-06", t13: "2026-09-10", t14: "2026-09-12" },
      docs: { d01: 3, d02: 2, d03: 3, d05: 2, d07: 1 },
      schools: [
        { sid: "s1", name: "University of Texas at Dallas", program: "MS ITM", deadline: "2026-11-15", status: "Applying", note: "", loc: "Richardson, TX" },
        { sid: "s2", name: "Arizona State University", program: "MS CS", deadline: "2026-10-01", status: "Researching", note: "", loc: "Tempe, AZ" },
        { sid: "s3", name: "Syracuse University", program: "MS CS", deadline: "2027-01-10", status: "Researching", note: "", loc: "Syracuse, NY" }
      ], createdAt: "2026-08-01T10:00:00Z", updatedAt: "2026-09-14T10:00:00Z" },
    "clients/c2": { name: "Kwabena Mensah", email: "k@example.com", country: "Ghana", field: "MS Public Health",
      targetTerm: "Fall 2027", status: "Active", code: "NB-7310", notes: "",
      tasks: {}, docs: {}, schools: [], createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-18T10:00:00Z" },
    "clients/c3": { name: "Ngozi Okafor", email: "n@example.com", country: "Nigeria", field: "MEng Civil Engineering",
      targetTerm: "Spring 2028", status: "Active", code: "NB-2094", notes: "",
      tasks: (function () { var o = {}; ["t01","t02","t03","t04","t05","t06","t07","t08","t09","t10","t11","t12","t13","t14","t15","t16","t17","t18","t19","t20","t21","t22","t23","t24","t25","t27","t28","t30","t31","t32","t33","t34","t35","t36","t37"].forEach(function (k) { o[k] = "2026-07-01"; }); return o; })(),
      docs: { d01: 3, d02: 3, d03: 3, d04: 3, d05: 3, d07: 3, d08: 3, d10: 3, d11: 2, d15: 2 },
      schools: [{ sid: "s9", name: "University of Michigan", program: "MEng Civil", deadline: "2026-09-25", status: "Admitted", note: "", loc: "Ann Arbor, MI" }],
      createdAt: "2026-02-01T10:00:00Z", updatedAt: "2026-09-19T08:00:00Z" }
  };
  function docRef(path) {
    return {
      id: path.split("/").pop(), path: path,
      get: function () { return Promise.resolve(snap(path)); },
      set: function (d) { store[path] = d; return Promise.resolve(); },
      update: function (d) { Object.assign(store[path] || {}, d); return Promise.resolve(); },
      delete: function () { delete store[path]; return Promise.resolve(); },
      onSnapshot: function (n) { setTimeout(function () { n(snap(path)); }, 30); return function () {}; },
      collection: function (p) { return collRef(path + "/" + p); }
    };
  }
  function snap(path) {
    var d = store[path];
    return { id: path.split("/").pop(), exists: !!d, data: function () { return d; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function collRef(path) {
    var r = {
      path: path,
      doc: function (id) { return docRef(path + "/" + (id || "x" + Math.random().toString(36).slice(2))); },
      add: function (d) { var rr = r.doc(); return rr.set(d).then(function () { return rr; }); },
      where: function () { return r; }, orderBy: function () { return r; }, limit: function () { return r; },
      get: function () { return Promise.resolve(qsnap(path)); },
      onSnapshot: function (n) { setTimeout(function () { n(qsnap(path)); }, 30); return function () {}; }
    };
    return r;
  }
  function qsnap(path) {
    var docs = Object.keys(store).filter(function (k) {
      return k.indexOf(path + "/") === 0 && k.slice(path.length + 1).indexOf("/") < 0;
    }).map(snap);
    return { docs: docs, size: docs.length, empty: !docs.length, docChanges: function () { return []; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  store["notes/c1"] = { body: "Strong 2:1 from KNUST. Funding is the constraint — an assistantship is not optional.", at: "2026-09-14T10:00:00Z" };
  store["codes/NB-4821"] = { cid: "c1" };
  store["codes/NB-7310"] = { cid: "c2" };
  store["codes/NB-2094"] = { cid: "c3" };
  store["clients/c1/messages/m1"] = { from: "client", body: "I got my TOEFL result — 98 overall but speaking is 21. Is that a problem?", at: "2026-09-17T09:12:00Z" };
  store["clients/c1/messages/m2"] = { from: "advisor", body: "98 is fine overall. Two of your four targets set a speaking floor of 22, so book a retake for the first week of October — I will hold the applications until then.", at: "2026-09-17T11:40:00Z" };
  store["clients/c1"].due = { t11: "2026-09-10", t12: "2026-09-22", t13: "2026-10-05" };
  store["clients/c1"].budget = 22000;
  store["clients/c1"].schools[0].tuition = 34000; store["clients/c1"].schools[0].fees = 2400;
  store["clients/c1"].schools[0].living = 15000; store["clients/c1"].schools[0].award = 12000;
  store["clients/c1"].schools[1].tuition = 29000; store["clients/c1"].schools[1].fees = 1800;
  store["clients/c1"].schools[1].living = 14000; store["clients/c1"].schools[1].award = 0;
  store["clients/c1"].files = [{ aid: "abc123", name: "transcript.pdf", type: "application/pdf", size: 240000, at: "2026-09-10T09:00:00Z" }];
  setTimeout(function () {
    store["templates/default"] = { name: "Standard plan", tasks: (window.NB_TASKS || []).map(function (t) { return t; }) };
  }, 0);
  window.claude = {
    use: function (n) {
      if (n === "db") return Promise.resolve({ doc: docRef, collection: collRef });
      if (n === "assets") return Promise.resolve({
        upload: function (b) { return Promise.resolve({ id: "fake" + Date.now(), url: "/_blob/fake", sizeBytes: b.size, contentType: b.type }); },
        list: function () { return Promise.resolve({ assets: [], usage: {} }); },
        delete: function () { return Promise.resolve(); }
      });
      if (n === "user") return Promise.resolve({
        isOwner: function () { return Promise.resolve(true); },
        canEdit: function () { return Promise.resolve(true); },
        can: function () { return Promise.resolve(true); }
      });
      return Promise.resolve(null);
    }
  };
})();
