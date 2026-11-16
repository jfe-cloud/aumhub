import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { seedRequestSchema } from '@/lib/aum/schemas';
import { seedFixture, seedMessage } from '@/lib/aum/queue';
import type { DownloadMessage } from '@/lib/aum/types';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = seedRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid seed request' },
      { status: 400 }
    );
  }

  try {
    const data = parsed.data;
    const inserted =
      'fixture' in data
        ? await seedFixture(data.fixture, data.transferId)
        : await seedMessage(data.message as DownloadMessage);

    return NextResponse.json(
      {
        transferId: inserted.transferId,
        messageType: inserted.messageType,
        messageTypeCode: inserted.messageTypeCode,
        status: inserted.status
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    const conflict = message.toLowerCase().includes('unique');
    return NextResponse.json(
      { error: conflict ? 'transferId already exists' : message },
      { status: conflict ? 409 : 500 }
    );
  }
}
