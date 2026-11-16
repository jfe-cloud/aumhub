import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { clearQueue } from '@/lib/aum/queue';

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await clearQueue();
  return NextResponse.json(result);
}
