import { NextResponse } from 'next/server';

export function requireVnbSubscription(
  request: Request
): NextResponse | null {
  const expected = process.env.AUM_VNB_SUBSCRIPTION_KEY;
  const provided = request.headers.get('Ocp-Apim-Subscription-Key');

  if (!expected || !provided || provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized: no valid VNB subscription recognized' },
      { status: 401 }
    );
  }

  return null;
}
