import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { listRecentEvents } from '@/lib/aum/queue';

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam
    ? Math.min(200, Math.max(1, Number.parseInt(limitParam, 10) || 50))
    : 50;

  const events = await listRecentEvents(limit);
  return NextResponse.json(events);
}
