# AUM Hub – API Reference

AUM Hub mirrors **AUM VNB (v0)** under `/api/vnb/...` for integrator tests.  
Production APIM (reference): `https://sdx-aum-apim-t.azure-api.net`

---

## Authentication (VNB routes)

| Header | Required | Description |
|--------|----------|-------------|
| `Ocp-Apim-Subscription-Key` | yes | Must match env `AUM_VNB_SUBSCRIPTION_KEY` |

Missing or invalid key → `401 Unauthorized` (no valid VNB subscription).

Dashboard helper routes under `/api/aum/...` use the logged-in session cookie instead.

---

## GET /api/vnb/messages/next — Get Next

Delivers the next message in the queue **without deleting it**.

| Status | Meaning |
|--------|---------|
| `200` | Body: `DownloadMessage` |
| `204` | No message available |
| `401` | Invalid subscription |

```bash
curl -i "$BASE_URL/api/vnb/messages/next" \
  -H "Ocp-Apim-Subscription-Key: $AUM_VNB_SUBSCRIPTION_KEY"
```

---

## GET /api/vnb/messages/consume — Consume Batch

Consumes pending messages (up to configured max). **Removes** them unless peeked.

| Query | Type | Description |
|-------|------|-------------|
| `peekOnly` | boolean | If `true`, do not clear from queue |
| `count` | integer | Max messages; cropped to **0–32** |

| Status | Meaning |
|--------|---------|
| `200` | Body: `DownloadMessageSet` (array) |
| `401` | Invalid subscription |

```bash
curl -i "$BASE_URL/api/vnb/messages/consume?count=5" \
  -H "Ocp-Apim-Subscription-Key: $AUM_VNB_SUBSCRIPTION_KEY"

curl -i "$BASE_URL/api/vnb/messages/consume?peekOnly=true&count=5" \
  -H "Ocp-Apim-Subscription-Key: $AUM_VNB_SUBSCRIPTION_KEY"
```

---

## DELETE /api/vnb/messages/{transferId} — Confirm Receipt

Confirm that the message with the given `transferId` was received; **removes it from the queue**. Messages must be confirmed **strictly in order** (must match current head).

| Status | Meaning |
|--------|---------|
| `204` | Removed successfully |
| `400` | Missing/invalid `transferId`, or not the current head |
| `401` | Invalid subscription |
| `404` | Message not available (anymore) |
| `422` | Message not processable |

```bash
curl -i -X DELETE "$BASE_URL/api/vnb/messages/$TRANSFER_ID" \
  -H "Ocp-Apim-Subscription-Key: $AUM_VNB_SUBSCRIPTION_KEY"
```

---

## Dashboard / simulator helpers (session)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/aum/seed` | Enqueue fixture (`fixture`: `moveIn` \| `moveOut`) or custom `message` JSON |
| `GET` | `/api/aum/messages` | List all messages (pending + removed) |
| `GET` | `/api/aum/messages/{transferId}` | Detail + evidence for one transfer |
| `GET` | `/api/aum/events` | Recent evidence timeline |
| `POST` | `/api/aum/queue/clear` | Clear pending queue and reset evidence (demo helper) |

---

## Message types (`messageTypeCode`)

| Code | Type |
|------|------|
| 1 | MoveIn (Einzug) |
| 2 | MoveOut (Auszug) |
| 3 | Update |
| 4 | Cancellation (Stornierung) |
| 5 | PreInfoMoveIn |
| 6 | PreInfoMoveOut |

Not all payload properties are always present (depends on landlord delivery).

---

## DownloadMessage aggregates

| Path | Notes |
|------|-------|
| `transferId`, `transferTimestamp`, `messageTypeCode`, `messageType`, `messageTriggerType` | Transfer header |
| `contractor.*` | Organisation + contact + `postalAddress` |
| `tenant.*` | Person; `sex`: 1 Male, 2 Female, 3 Undefined |
| `owner.*` | Owner + `postalAddress` |
| `contract.beginOfContract` / `endOfContract` | MoveIn / MoveOut dates |
| `building.*` | Street, town, `swissZipCode`, optional `egid` |
| `dwelling.*` | `ewid`, floor, rooms |
| `goesTo.*` / `goesToOrganisation.*` | Forwarding / provider change |
| `previousTenant.*` | Prior occupant |
| `meterpointVSENationalID` | Optional SDAT-CH metering point |
| `recognizedBuildingAddress.*` | Resolved BFS address |
| `additionalTenants[]` | Extra occupants |
| `idxObjectInfo.*` | Object category/type |
| `sourceSystemReferences.*` | Landlord refs (contract, building, dwelling) |

`DownloadMessageSet` = array of `DownloadMessage`.

---

## Sample MoveOut (APIM example, abbreviated)

See simulator fixtures in `lib/aum/fixtures.ts` for full samples. Minimal shape:

```json
{
  "transferId": "fc3e1d87-8ccc-456c-9327-ecbc1c530370",
  "transferTimestamp": "13.02.2020 15:39:52",
  "messageTypeCode": 2,
  "messageType": "MoveOut",
  "messageTriggerType": "Scheduled",
  "building": {
    "street": "Aachstrasse",
    "houseNumber": "11",
    "town": "Erlen",
    "swissZipCode": 8586
  }
}
```
