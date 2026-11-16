import { NextResponse } from 'next/server';
import { requireVnbSubscription } from '@/lib/aum/auth';
import { consumeBatch } from '@/lib/aum/queue';

export async function GET(request: Request) {
  const unauthorized = requireVnbSubscription(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const peekOnly =
    searchParams.get('peekOnly') === 'true' ||
    searchParams.get('peekOnly') === '1';
  const countParam = searchParams.get('count');
  const count =
    countParam === null ? undefined : Number.parseInt(countParam, 10);

  const messages = await consumeBatch({ peekOnly, count });
  return NextResponse.json(messages, { status: 200 });
}
