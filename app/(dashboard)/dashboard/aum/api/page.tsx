import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/aum/copy-button';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AumApiDocsPage() {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const key = process.env.AUM_VNB_SUBSCRIPTION_KEY || '';

  const curlNext = `curl -i "${base}/api/vnb/messages/next" \\\n  -H "Ocp-Apim-Subscription-Key: ${key || '$AUM_VNB_SUBSCRIPTION_KEY'}"`;
  const curlConsume = `curl -i "${base}/api/vnb/messages/consume?count=5" \\\n  -H "Ocp-Apim-Subscription-Key: ${key || '$AUM_VNB_SUBSCRIPTION_KEY'}"`;
  const curlPeek = `curl -i "${base}/api/vnb/messages/consume?peekOnly=true&count=5" \\\n  -H "Ocp-Apim-Subscription-Key: ${key || '$AUM_VNB_SUBSCRIPTION_KEY'}"`;
  const curlConfirm = `curl -i -X DELETE "${base}/api/vnb/messages/$TRANSFER_ID" \\\n  -H "Ocp-Apim-Subscription-Key: ${key || '$AUM_VNB_SUBSCRIPTION_KEY'}"`;

  return (
    <section className="flex-1 p-4 lg:p-0 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/aum">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Inbox
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-orange-500" />
          AUM VNB API
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Point your integrator at AUM Hub instead of production APIM. Full
          reference: <code className="text-xs">docs/api.md</code>.
        </p>
      </div>

      <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-5 space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            <strong>Base URL:</strong>{' '}
            <code className="text-xs bg-gray-50 px-1 rounded">{base}</code>
          </p>
          <CopyButton value={base} label="Copy base" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0">
            <strong>Subscription key:</strong>{' '}
            <code className="text-xs bg-gray-50 px-1 rounded break-all">
              {key || '(set AUM_VNB_SUBSCRIPTION_KEY in .env)'}
            </code>
          </p>
          {key ? <CopyButton value={key} label="Copy key" /> : null}
        </div>
        <p className="text-xs text-gray-500">
          Send as header{' '}
          <code className="bg-gray-50 px-1 rounded">
            Ocp-Apim-Subscription-Key
          </code>
          . Test key only — not for production APIM.
        </p>
      </div>

      {[
        { title: 'Get Next', curl: curlNext },
        { title: 'Consume Batch', curl: `${curlConsume}\n\n${curlPeek}` },
        { title: 'Confirm Receipt', curl: curlConfirm }
      ].map((block) => (
        <div
          key={block.title}
          className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-5 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{block.title}</h2>
            <CopyButton value={block.curl} label="Copy curl" />
          </div>
          <pre className="text-xs overflow-x-auto bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
            {block.curl}
          </pre>
        </div>
      ))}
    </section>
  );
}
