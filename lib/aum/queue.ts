import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { aumEvents, aumMessages, AumEvent, AumMessage } from '@/lib/db/schema';
import {
  createFixtureMessage,
  type FixtureKind
} from '@/lib/aum/fixtures';
import {
  DownloadMessage,
  normalizeMessageTypeCode,
  resolveMessageType,
  type AumEventAction
} from '@/lib/aum/types';

function asPayload(row: AumMessage): DownloadMessage {
  return row.payload as DownloadMessage;
}

export async function recordEvent(input: {
  action: AumEventAction;
  transferId?: string | null;
  statusCode?: number;
  meta?: Record<string, unknown>;
}) {
  await db.insert(aumEvents).values({
    action: input.action,
    transferId: input.transferId ?? null,
    statusCode: input.statusCode ?? null,
    meta: input.meta ?? null
  });
}

export async function getHead(): Promise<AumMessage | null> {
  const rows = await db
    .select()
    .from(aumMessages)
    .where(eq(aumMessages.status, 'pending'))
    .orderBy(asc(aumMessages.createdAt), asc(aumMessages.id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getNextMessage(): Promise<{
  message: DownloadMessage | null;
  statusCode: number;
}> {
  const head = await getHead();
  if (!head) {
    await recordEvent({ action: 'get_next', statusCode: 204 });
    return { message: null, statusCode: 204 };
  }

  const payload = asPayload(head);
  await recordEvent({
    action: 'get_next',
    transferId: head.transferId,
    statusCode: 200
  });
  return { message: payload, statusCode: 200 };
}

function cropCount(raw: number | undefined): number {
  if (raw === undefined || Number.isNaN(raw)) return 32;
  return Math.min(32, Math.max(0, Math.floor(raw)));
}

export async function consumeBatch(options: {
  peekOnly: boolean;
  count?: number;
}): Promise<DownloadMessage[]> {
  const limit = cropCount(options.count);
  if (limit === 0) {
    await recordEvent({
      action: options.peekOnly ? 'consume_peek' : 'consume',
      statusCode: 200,
      meta: { count: 0, peekOnly: options.peekOnly }
    });
    return [];
  }

  const rows = await db
    .select()
    .from(aumMessages)
    .where(eq(aumMessages.status, 'pending'))
    .orderBy(asc(aumMessages.createdAt), asc(aumMessages.id))
    .limit(limit);

  const payloads = rows.map(asPayload);

  if (!options.peekOnly && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    await db
      .update(aumMessages)
      .set({
        status: 'removed',
        removedAt: new Date(),
        removedBy: 'consume'
      })
      .where(inArray(aumMessages.id, ids));
  }

  await recordEvent({
    action: options.peekOnly ? 'consume_peek' : 'consume',
    transferId: rows[0]?.transferId ?? null,
    statusCode: 200,
    meta: {
      count: rows.length,
      peekOnly: options.peekOnly,
      transferIds: rows.map((r) => r.transferId)
    }
  });

  return payloads;
}

export type ConfirmResult =
  | { ok: true; statusCode: 204 }
  | { ok: false; statusCode: 400 | 404 | 422; error: string };

export async function confirmReceipt(
  transferId: string
): Promise<ConfirmResult> {
  if (!transferId?.trim()) {
    await recordEvent({
      action: 'confirm',
      transferId,
      statusCode: 400,
      meta: { reason: 'missing_transfer_id' }
    });
    return { ok: false, statusCode: 400, error: 'Invalid transfer-id' };
  }

  const existing = await db
    .select()
    .from(aumMessages)
    .where(eq(aumMessages.transferId, transferId))
    .limit(1);

  if (existing.length === 0) {
    await recordEvent({
      action: 'confirm',
      transferId,
      statusCode: 404,
      meta: { reason: 'not_found' }
    });
    return { ok: false, statusCode: 404, error: 'Message not found' };
  }

  const row = existing[0];
  if (row.status !== 'pending') {
    await recordEvent({
      action: 'confirm',
      transferId,
      statusCode: 404,
      meta: { reason: 'already_removed' }
    });
    return { ok: false, statusCode: 404, error: 'Message not available' };
  }

  const head = await getHead();
  if (!head || head.transferId !== transferId) {
    await recordEvent({
      action: 'confirm',
      transferId,
      statusCode: 400,
      meta: {
        reason: 'not_current_head',
        currentHead: head?.transferId ?? null
      }
    });
    return {
      ok: false,
      statusCode: 400,
      error:
        'transfer-id does not match the current message object (messages must be confirmed in order)'
    };
  }

  await db
    .update(aumMessages)
    .set({
      status: 'removed',
      removedAt: new Date(),
      removedBy: 'confirm'
    })
    .where(eq(aumMessages.id, head.id));

  await recordEvent({
    action: 'confirm',
    transferId,
    statusCode: 204
  });

  return { ok: true, statusCode: 204 };
}

export async function seedMessage(
  message: DownloadMessage
): Promise<AumMessage> {
  const code = normalizeMessageTypeCode(message.messageTypeCode);
  const type = resolveMessageType(code, message.messageType);
  const payload: DownloadMessage = {
    ...message,
    messageTypeCode: code,
    messageType: type,
    transferTimestamp: message.transferTimestamp || new Date().toISOString()
  };

  const [inserted] = await db
    .insert(aumMessages)
    .values({
      transferId: payload.transferId,
      messageTypeCode: code,
      messageType: type,
      payload,
      status: 'pending'
    })
    .returning();

  await recordEvent({
    action: 'seed',
    transferId: payload.transferId,
    statusCode: 201,
    meta: { messageType: type, messageTypeCode: code }
  });

  return inserted;
}

export async function seedFixture(
  kind: FixtureKind,
  transferId?: string
): Promise<AumMessage> {
  return seedMessage(createFixtureMessage(kind, { transferId }));
}

export async function listMessages(): Promise<AumMessage[]> {
  return db
    .select()
    .from(aumMessages)
    .orderBy(desc(aumMessages.createdAt), desc(aumMessages.id));
}

export async function getMessageByTransferId(
  transferId: string
): Promise<AumMessage | null> {
  const rows = await db
    .select()
    .from(aumMessages)
    .where(eq(aumMessages.transferId, transferId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listEventsForTransfer(
  transferId: string
): Promise<AumEvent[]> {
  return db
    .select()
    .from(aumEvents)
    .where(eq(aumEvents.transferId, transferId))
    .orderBy(asc(aumEvents.createdAt), asc(aumEvents.id));
}

export async function listRecentEvents(limit = 50): Promise<AumEvent[]> {
  return db
    .select()
    .from(aumEvents)
    .orderBy(desc(aumEvents.createdAt), desc(aumEvents.id))
    .limit(limit);
}

export async function clearQueue(): Promise<{
  removedPending: number;
  deletedEvents: number;
}> {
  const pending = await db
    .select({ id: aumMessages.id, transferId: aumMessages.transferId })
    .from(aumMessages)
    .where(eq(aumMessages.status, 'pending'));

  if (pending.length > 0) {
    await db
      .update(aumMessages)
      .set({
        status: 'removed',
        removedAt: new Date(),
        removedBy: 'consume'
      })
      .where(
        inArray(
          aumMessages.id,
          pending.map((p) => p.id)
        )
      );
  }

  const deletedEvents = await db.delete(aumEvents).returning({ id: aumEvents.id });

  await recordEvent({
    action: 'consume',
    statusCode: 200,
    meta: {
      clearQueue: true,
      removedPending: pending.length,
      transferIds: pending.map((p) => p.transferId)
    }
  });

  return {
    removedPending: pending.length,
    deletedEvents: deletedEvents.length
  };
}

export function summarizeMessage(row: AumMessage) {
  const payload = asPayload(row);
  const building = payload.building;
  return {
    id: row.id,
    transferId: row.transferId,
    messageTypeCode: row.messageTypeCode,
    messageType: row.messageType,
    status: row.status,
    removedBy: row.removedBy,
    createdAt: row.createdAt,
    removedAt: row.removedAt,
    building:
      building &&
      [building.street, building.houseNumber, building.swissZipCode, building.town]
        .filter((v) => v !== undefined && v !== '')
        .join(' ')
  };
}
