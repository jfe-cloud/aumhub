import { NextResponse } from 'next/server';
import { requireVnbSubscription } from '@/lib/aum/auth';
import { getNextMessage } from '@/lib/aum/queue';

export async function GET(request: Request) {
  const unauthorized = requireVnbSubscription(request);
  if (unauthorized) return unauthorized;

  const { message, statusCode } = await getNextMessage();
  if (statusCode === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(message, { status: 200 });
}
