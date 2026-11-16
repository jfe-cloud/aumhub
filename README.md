# AUM Hub

Test and integration cockpit for Swiss **Automatische Umzugsmeldung (AUM)** — built for **VNBs and EVU integrators**.

Product site: [aumhub.ch](https://aumhub.ch)  
Source: [github.com/jfe-cloud/aumhub](https://github.com/jfe-cloud/aumhub)

AUM Hub helps integration teams consume and verify AUM VNB messages safely: inspect payloads, exercise peek vs destructive consume, confirm receipts, and seed scenarios — without depending on live landlord traffic or production routing.

Normative external contract: **AUM VNB (v0)** from [aum.swisseldex.ch](https://aum.swisseldex.ch/) (Azure API Management).  
Observed test host: `https://sdx-aum-apim-t.azure-api.net`

> AUM Hub is not a production AUM router.  
> Business processing and system-of-record decisions remain in the VNB / EVU systems.

---

## Purpose

Make AUM VNB integration:

- **Testable** — controllable inbound queue and scenarios (MoveIn, MoveOut, …)
- **Inspectable** — full visibility into `DownloadMessageSet` payloads
- **Explainable** — clear peek vs consume vs confirm semantics and evidence
- **Auditable** — timeline of pulls, batches, and receipt confirmations

---

## What AUM Hub Is

- A VNB/EVU-facing **integration test cockpit** for AUM
- A controllable **AUM VNB API counterpart** for local and staging tests
- An **inbox / payload inspector** for `DownloadMessageSet` items
- A **scenario injector** (seed Einzug / Auszug / Update / …)
- A **consume & confirm audit trail** (delivery / consume evidence)
- API documentation aligned with AUM VNB (v0)

## What AUM Hub Is Not

- A production SwissEldex / Data River AUM router
- A live APIM subscription broker
- A business decision or CRM engine for move processes
- An SDAT Lieferantenwechsel or Messdaten observability platform
- A replacement for SAP IS-U, S/4, or other EVU systems of record

---

## Core Principles

- Faithful to **AUM VNB (v0)**
- Raw payloads are **immutable** once stored
- **Peek vs consume** semantics are explicit (consume clears unless peek)
- Explainability of every pull and confirm
- Testability over automation
- Loose coupling to production AUM — simulation first
- Production VNB/EVU systems remain the system of record

---

## Normative Contract — AUM VNB (v0)

Integrator-facing operations (first-class in this product):

| Operation | Role |
|-----------|------|
| **Get Next** | Pull the next pending message from the VNB queue |
| **Consume Batch** | Return up to N pending messages; **clears** them from the server cache unless peeked |
| **Confirm Receipt** | Acknowledge that transfers have been processed |

### Consume Batch

```
GET/POST https://sdx-aum-apim-t.azure-api.net/vnb/messages/consume[?peekOnly][&count]
```

| Parameter | In | Type | Description |
|-----------|----|------|-------------|
| `peekOnly` | query | boolean | If `true`, returned messages are **not** cleared from the server cache |
| `count` | query | integer | Max messages to consume; range **0–32** (cropped automatically) |

- Response `200`: `DownloadMessageSet` (JSON array). Not all properties are always present (depends on landlord delivery).
- Response `401`: no valid VNB subscription recognized.
- Caution: without `peekOnly=true`, consume **removes** messages from the cache.

### Get Next

```
GET /api/vnb/messages/next
```

Returns the **head** of the queue **without deleting** it (`DownloadMessage`).

- `200` — message body
- `204` — queue empty
- `401` — invalid subscription

### Confirm Receipt

```
DELETE /api/vnb/messages/{transferId}
```

Confirms receipt of the message and **removes it** from the queue. Messages must be confirmed **in order** (must match the current head).

- `204` — removed
- `400` — invalid id or not the current head
- `401` — invalid subscription
- `404` — message not available
- `422` — unprocessable

Full reference: [docs/api.md](docs/api.md).

### Message types (`messageTypeCode`)

| Code | Type | Meaning |
|------|------|---------|
| 1 | MoveIn | Einzug |
| 2 | MoveOut | Auszug |
| 3 | Update | Update |
| 4 | Cancellation | Stornierung |
| 5 | PreInfoMoveIn | Vorinfo Einzug |
| 6 | PreInfoMoveOut | Vorinfo Auszug |

### Payload aggregates (`DownloadMessageSet` item)

Full field catalog belongs in [docs/api.md](docs/api.md). Conceptual groups:

| Aggregate | Role |
|-----------|------|
| **Transfer** | `transferId`, `transferTimestamp`, `messageTypeCode` / `messageType`, `messageTriggerType` |
| **Contractor** | Property manager / contact + postal address |
| **Tenant** / **AdditionalTenants** / **PreviousTenant** | Person data |
| **Owner** | Owner + postal address |
| **Contract** | `beginOfContract` (MoveIn), `endOfContract` (MoveOut) |
| **Building** / **Dwelling** | Address, EGID/EWID, floor, rooms |
| **GoesTo** / **GoesToOrganisation** | Forwarding address / provider change |
| **Meterpoint** | Optional `meterpointVSENationalID` (SDAT-CH) |
| **RecognizedBuildingAddress** | Resolved BFS address |
| **SourceSystemReferences** | Landlord contract / building / dwelling refs |
| **IdxObjectInfo** | Object category / type |

---

## Architecture Overview

```
Property software
  │
  │  (production)
  ▼
AUM VNB APIM (SwissEldex / Data River)
  │  Get Next · Consume Batch · Confirm Receipt
  ▼
VNB / EVU integrator systems
  (SAP IS-U / CRM / middleware)


AUM Hub (test cockpit)
  │  simulates AUM VNB API + inbox / seed / evidence
  ▼
VNB / EVU integrator systems (under test)
```

AUM Hub does **not** claim live connectivity to production APIM. It provides a controllable counterpart for integration tests.

---

## Domain Objects (v1)

- **AUM Transfer** — identified by `transferId`
- **DownloadMessageSet item** — one move notification payload
- **Message type** — MoveIn / MoveOut / Update / Cancellation / PreInfo*
- **Consume session / batch** — peek or destructive pull
- **Confirm receipt** — acknowledgement of processed transfers
- **Evidence timeline** — audit of pulls, batches, confirms

---

## Application Areas

| Area | Route | Intent |
|------|-------|--------|
| Inbox | `/dashboard/aum` | List seeded / pending / removed transfers |
| Detail | `/dashboard/aum/[transferId]` | Payload + evidence timeline |
| Simulator | `/dashboard/aum/simulator` | Seed MoveIn / MoveOut (and custom JSON) |
| API docs | `/dashboard/aum/api` | Curl how-to for VNB ops |
| VNB API | `/api/vnb/messages/...` | Get Next, Consume Batch, Confirm Receipt |

Starter SaaS routes (auth, team, pricing) remain as plumbing.

---

## Relation to SDAT Hub

AUM Hub shares DNA with [SDAT Hub](https://github.com/jfe-cloud/sdathub) — especially the **Test Tool** ideas (inbox, validation, delivery evidence) — but targets **AUM VNB**, not SDAT Lieferantenwechsel or Messdatenaustausch observability.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **Auth**: Session cookies (JWT)
- **Payments**: [Stripe](https://stripe.com/) (commercial wrapping later)

Bootstrap template: [Next.js SaaS Starter](https://github.com/nextjs/saas-starter).

---

## Getting Started

```bash
pnpm install
```

Create a `.env` file (see `.env.example`):

```bash
POSTGRES_URL=postgresql://…
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
BASE_URL=http://localhost:3000
AUTH_SECRET=…   # e.g. openssl rand -base64 32
AUM_VNB_SUBSCRIPTION_KEY=…   # test key for Ocp-Apim-Subscription-Key
```

Apply schema and optional seed:

```bash
pnpm db:migrate
pnpm db:seed
```

Seed user (when using `db:seed`):

- User: `test@test.com`
- Password: `admin123`

Run the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Stripe webhooks (optional, for billing plumbing):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Documentation

| Document | Status | Description |
|----------|--------|-------------|
| [README.md](README.md) | Normative | Product positioning and cornerstones |
| [docs/domain.md](docs/domain.md) | Normative | Domain model |
| [docs/api.md](docs/api.md) | Normative | VNB + simulator API reference |
| [docs/architecture.md](docs/architecture.md) | Normative | Technical architecture |

---

## License

See [LICENSE](LICENSE).
