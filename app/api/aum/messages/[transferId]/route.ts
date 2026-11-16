import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getMessageByTransferId,
  listEventsForTransfer,
  summarizeMessage
} from '@/lib/aum/queue';

export async function GET(
  _request: Request,
  context: { params: Promise<{ transferId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { transferId } = await context.params;
  const message = await getMessageByTransferId(transferId);
  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const events = await listEventsForTransfer(transferId);
  return NextResponse.json({
    summary: summarizeMessage(message),
    payload: message.payload,
    events
  });
}
