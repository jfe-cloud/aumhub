import { NextResponse } from 'next/server';
import { requireVnbSubscription } from '@/lib/aum/auth';
import { confirmReceipt } from '@/lib/aum/queue';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ transferId: string }> }
) {
  const unauthorized = requireVnbSubscription(request);
  if (unauthorized) return unauthorized;

  const { transferId } = await context.params;
  const result = await confirmReceipt(transferId);

  if (result.ok) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(
    { error: result.error },
    { status: result.statusCode }
  );
}
