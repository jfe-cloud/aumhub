import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { listMessages, summarizeMessage } from '@/lib/aum/queue';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await listMessages();
  return NextResponse.json(rows.map(summarizeMessage));
}
