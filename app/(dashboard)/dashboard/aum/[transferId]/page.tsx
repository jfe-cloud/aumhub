'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type DetailResponse = {
  summary: {
    transferId: string;
    messageType: string;
    messageTypeCode: number;
    status: string;
    removedBy: string | null;
    building: string | false | null;
    createdAt: string;
    removedAt: string | null;
  };
  payload: unknown;
  events: Array<{
    id: number;
    action: string;
    statusCode: number | null;
    meta: unknown;
    createdAt: string;
  }>;
};

export default function AumMessageDetailPage() {
  const params = useParams<{ transferId: string }>();
  const transferId = decodeURIComponent(params.transferId);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/aum/messages/${encodeURIComponent(transferId)}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Not found' : 'Load failed');
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Load failed');
      }
    }
    load();
  }, [transferId]);

  return (
    <section className="flex-1 p-4 lg:p-0 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/aum">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Inbox
          </Link>
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="text-sm text-gray-500">Loading…</p>
      )}

      {data && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {data.summary.messageType}
              <span className="text-gray-400 font-normal text-lg ml-2">
                ({data.summary.messageTypeCode})
              </span>
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-500 break-all">
              {data.summary.transferId}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Status: <strong>{data.summary.status}</strong>
              {data.summary.removedBy ? ` · ${data.summary.removedBy}` : ''}
              {data.summary.building ? ` · ${data.summary.building}` : ''}
            </p>
          </div>

          <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Evidence
            </h2>
            {data.events.length === 0 ? (
              <p className="text-sm text-gray-500">No events yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.events.map((e) => (
                  <li
                    key={e.id}
                    className="text-sm border-b border-gray-100 pb-2 last:border-0"
                  >
                    <span className="font-medium">{e.action}</span>
                    {e.statusCode != null && (
                      <span className="text-gray-400 ml-2">{e.statusCode}</span>
                    )}
                    <span className="text-gray-400 ml-2">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Payload
            </h2>
            <pre className="text-xs overflow-x-auto bg-gray-50 rounded-lg p-3 text-gray-800">
              {JSON.stringify(data.payload, null, 2)}
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
