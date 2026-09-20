# Data model

The store is a JSON document database addressed by slash-separated paths, where an **even** number of segments names a document and an **odd** number names a collection. `clients` is a collection; `clients/c_sample_ama` is a document; `clients/c_sample_ama/messages/m1` is a document in a subcollection.

---

## Collections

### `config/app`

One document. Practice-wide settings.

```json
{
  "orgName": "Northbound Advising",
  "advisorCode": "NB-ADVISOR",
  "welcome": "Shown at the top of every client dashboard."
}
```

### `clients/<id>`

One document per client. `id` is generated client-side (`c` + base-36 timestamp + random).

```json
{
  "name": "Ama Serwaa Boateng",
  "email": "ama.boateng@example.com",
  "phone": "+233 20 000 0000",
  "country": "Ghana",
  "field": "MS Computer Science",
  "targetTerm": "Fall 2027",
  "status": "Active",
  "code": "NB-4821",
  "template": "default",
  "budget": 22000,

  "tasks":  { "t01": "2026-08-06" },
  "due":    { "t11": "2026-10-06" },
  "docs":   { "d01": 3, "d02": 2 },

  "schools": [{
    "sid": "s1",
    "name": "The University of Texas at Dallas",
    "program": "MS Information Technology & Management",
    "deadline": "2026-11-15",
    "status": "Applying",
    "note": "Assistantship form is separate.",
    "loc": "Richardson, TX",
    "tuition": 34000, "fees": 2400, "living": 15000, "award": 12000
  }],

  "files": [{ "aid": "<asset id>", "name": "transcript.pdf", "type": "application/pdf", "size": 240000, "at": "…" }],

  "lastReadA": "…", "lastReadC": "…",
  "createdAt": "…", "updatedAt": "…"
}
```

Notes on the fields:

- **`tasks`** — a map of task id → the ISO date it was ticked. Presence means done. Ticks survive a step being removed from the template, so restoring the step restores the progress.
- **`due`** — task id → target date. Set by the advisor. A task with a `due` in the past and no `tasks` entry is *overdue*, which drives the Schedule column, the Pipeline count and the red calendar chips.
- **`docs`** — document id → `0 Not started · 1 Requested · 2 Received · 3 Verified`.
- **`schools[].status`** — `Researching · Applying · Submitted · Admitted · Waitlisted · Denied · Enrolling`.
- **Net year-one cost** = `tuition + fees + living − award`, floored at 0. The funding gap is that figure minus `budget`.
- **`files[].aid`** is an asset id. The file is served at `/_blob/<aid>` in every view.
- **`status`** — `Active · Paused · Placed · Archived`.

### `codes/<CODE>`

The sign-in lookup. One tiny document per access code, so a client login reads exactly one document instead of scanning the client list.

```json
{ "cid": "c_sample_ama" }
```

Maintained by the advisor console: written on client creation, rewritten and the old one deleted on regenerate, deleted with the client. Code characters are restricted to `A–Z 0–9 _ -`.

### `notes/<clientId>`

Private advisor notes, kept **out of the client document on purpose** so an access rule can restrict them.

```json
{ "body": "Funding is the constraint — an assistantship is not optional.", "at": "…" }
```

### `templates/<id>`

An editable plan. `templates/default` ships with the 49-step standard plan.

```json
{
  "name": "Standard plan — taught master's",
  "tasks": [{ "id": "t18", "s": "docs", "o": "c", "t": "Official transcripts requested", "h": "Sealed, from every institution attended." }]
}
```

`s` is a stage id (`intake · tests · shortlist · docs · apply · offers · visa · depart`). `o` is the owner: `c` client, `a` advisor. A client sees advisor-owned steps but cannot tick them.

A client record points at a template by id; if the document is missing, the app falls back to the built-in `window.NB_TASKS`.

### `clients/<clientId>/messages/<id>`

One document per message.

```json
{ "from": "advisor", "body": "Book the retake for the first week of October.", "at": "…" }
```

`from` is `advisor` or `client`. Unread counts compare each message's `at` against `lastReadA` / `lastReadC` on the parent client document.

---

## Access rules

Declared at publish time, enforced by the store rather than by the page:

```json
[
  { "path": "",          "read": "interact", "write": "interact" },
  { "path": "notes",     "read": "admin",    "write": "admin" },
  { "path": "templates", "read": "interact", "write": "admin" },
  { "path": "config",    "read": "interact", "write": "admin" },
  { "path": "codes",     "read": "interact", "write": "admin" }
]
```

Levels, in the sharing menu's words: **Can interact** → `interact`, **Can edit** → `admin`, and the artifact's owner meets every level.

So a client, who holds `interact`, can tick their own steps and send messages, and cannot touch settings, templates, access codes or private notes. A refused read returns as though the document does not exist — deliberately indistinguishable from absence.

Share the page as **Can interact**. Anyone given **Can edit** becomes a second advisor.

---

## Writes

- Every write to a client document goes through a debounced, serialised queue — one write at a time per document, coalescing a burst of clicks into a single save. See `scheduleSave` / `flush` in `src/app/core.js`.
- While a save is pending for a document, incoming snapshots for it are ignored, so a slow round-trip cannot overwrite what the user just typed.
- Writes are last-writer-wins; there are no transactions.
- The store holds at most 5,000 documents. Messages are the only collection that grows without bound — at a few hundred clients this is not close, but it is the thing to watch.
