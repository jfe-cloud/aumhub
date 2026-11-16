# AUM Hub – Technical Architecture

MVP architecture for the AUM VNB test cockpit.

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js App Router |
| DB | PostgreSQL (Neon) + Drizzle |
| Auth (UI) | Session cookie JWT |
| Auth (VNB API) | `Ocp-Apim-Subscription-Key` ↔ `AUM_VNB_SUBSCRIPTION_KEY` |

---

## Route map

### Dashboard (session)

| Route | Role |
|-------|------|
| `/dashboard/aum` | Inbox |
| `/dashboard/aum/[transferId]` | Payload + evidence |
| `/dashboard/aum/simulator` | Seed fixtures / custom JSON |
| `/dashboard/aum/api` | Integrator how-to + copy curls |

### VNB simulator API (subscription key)

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/vnb/messages/next` | Peek head |
| `GET` | `/api/vnb/messages/consume` | Batch peek/clear |
| `DELETE` | `/api/vnb/messages/[transferId]` | Confirm head |

### Internal helpers (session)

| Method | Path | Role |
|--------|------|------|
| `POST` | `/api/aum/seed` | Enqueue |
| `GET` | `/api/aum/messages` | List |
| `GET` | `/api/aum/messages/[transferId]` | Detail |
| `GET` | `/api/aum/events` | Evidence |
| `POST` | `/api/aum/queue/clear` | Clear pending + reset events |

---

## Data model

```
aum_messages
  transfer_id (unique)
  message_type_code / message_type
  payload (jsonb, immutable raw DownloadMessage)
  status: pending | removed
  removed_by: consume | confirm

aum_events
  action: seed | get_next | consume | consume_peek | confirm
  transfer_id?, status_code?, meta (jsonb)
```

Queue order = `created_at ASC, id ASC` among `pending` rows.

---

## Queue semantics

```
seed → pending FIFO
GET next → return head, keep pending
DELETE {transferId} → only if transferId === head → removed (confirm)
GET consume?peekOnly=true → return N, keep pending
GET consume → return N, mark removed (consume)
```

Evidence is appended for every VNB and seed action.

---

## Key modules

| Path | Responsibility |
|------|----------------|
| `lib/aum/types.ts` | DownloadMessage types |
| `lib/aum/fixtures.ts` | MoveIn / MoveOut samples |
| `lib/aum/schemas.ts` | Seed Zod |
| `lib/aum/auth.ts` | Subscription key gate |
| `lib/aum/queue.ts` | Queue + evidence operations |

---

## Out of scope (current MVP)

- Live SwissEldex APIM connectivity
- Per-team queues / keys
- OpenAPI export file
