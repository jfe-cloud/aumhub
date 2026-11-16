# AUM Hub – Domain Model

Conceptual domain for the AUM VNB test cockpit. Normative for product behaviour; payload field catalogs live in [api.md](api.md).

---

## Overview

AUM Hub models a **VNB inbound queue** of Automatische Umzugsmeldung messages and the evidence around Get Next, Consume Batch, and Confirm Receipt.

Core objects:

- AUM Transfer / DownloadMessage
- Message type
- Queue (pending head + order)
- Consume batch
- Confirm receipt
- Evidence event

---

## 1. AUM Transfer (DownloadMessage)

A single move notification identified by `transferId`.

- Stored as an **immutable raw payload** (`DownloadMessage`)
- Belongs to exactly one queue position while `pending`
- May be removed by **Consume Batch** (destructive) or **Confirm Receipt**

Key attributes: `transferId`, `transferTimestamp`, `messageTypeCode`, `messageType`, nested contractor / tenant / owner / building / dwelling / goesTo / meterpoint aggregates.

---

## 2. Message types

| Code | Type | Meaning |
|------|------|---------|
| 1 | MoveIn | Einzug |
| 2 | MoveOut | Auszug |
| 3 | Update | Update |
| 4 | Cancellation | Stornierung |
| 5 | PreInfoMoveIn | Vorinfo Einzug |
| 6 | PreInfoMoveOut | Vorinfo Auszug |

---

## 3. Queue

FIFO pending messages for the simulated VNB subscription.

- **Head** = oldest pending message
- **Get Next** returns the head without removing it
- **Confirm Receipt** may only remove the **current head** (`transferId` must match)
- **Consume Batch** returns up to N pending messages and removes them unless `peekOnly`

Statuses: `pending` | `removed`  
Removal cause: `consume` | `confirm`

---

## 4. Consume batch

A pull of 0–32 messages (`count` cropped to that range).

- `peekOnly=true` → inspect without clearing
- otherwise → clear returned messages from the pending queue

---

## 5. Confirm receipt

Acknowledgement that the integrator processed the current head message.

- Path identity: `transferId`
- Strict ordering: confirming a non-head id fails (`400`)
- Missing id → `404`

---

## 6. Evidence event

Audit entry for simulator and VNB API actions:

- `seed`, `get_next`, `consume`, `consume_peek`, `confirm`
- Optional `transferId`, HTTP status, request meta, timestamp

---

## Participants (payload aggregates)

Contextual, not master data:

- **Contractor** — property manager / contact
- **Tenant** / **AdditionalTenants** / **PreviousTenant**
- **Owner**
- **GoesToOrganisation** — provider change (`providerId`, EIC-style)

---

## What this domain is not

- Production AUM routing or address-to-VNB assignment
- SDAT Lieferantenwechsel / Messdaten process correlation
- Business decisions inside SAP / CRM
