import 'dotenv/config';
import {
  seedFixture,
  getNextMessage,
  consumeBatch,
  confirmReceipt,
  listMessages
} from '../lib/aum/queue';

async function main() {
  const m1 = await seedFixture('moveIn');
  const m2 = await seedFixture('moveOut');
  console.log('seeded_ok');

  const next1 = await getNextMessage();
  console.log(
    'get_next',
    next1.statusCode,
    next1.message?.transferId === m1.transferId
  );

  const bad = await confirmReceipt(m2.transferId);
  console.log('confirm_non_head', bad.ok, !bad.ok && bad.statusCode);

  const ok = await confirmReceipt(m1.transferId);
  console.log('confirm_head', ok.ok, ok.ok && ok.statusCode);

  const peek = await consumeBatch({ peekOnly: true, count: 5 });
  console.log('peek_count', peek.length);

  const consumed = await consumeBatch({ peekOnly: false, count: 5 });
  console.log('consume_count', consumed.length);

  const remaining = (await listMessages()).filter((m) => m.status === 'pending');
  console.log('pending_left', remaining.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
