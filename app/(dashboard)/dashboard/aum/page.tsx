'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FlaskConical, Inbox, RefreshCw } from 'lucide-react';

type MessageSummary = {
  id: number;
  transferId: string;
  messageTypeCode: number;
  messageType: string;
  status: string;
  removedBy: string | null;
  createdAt: string;
  removedAt: string | null;
  building: string | false | null;
};

export default function AumInboxPage() {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/aum/messages');
      if (!res.ok) throw new Error('Failed to load messages');
      setMessages(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  async function clearQueue() {
    if (
      !window.confirm(
        'Clear all pending messages and reset the evidence log?'
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/aum/queue/clear', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear queue');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed');
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="flex-1 p-4 lg:p-0 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6 text-orange-500" />
            AUM Inbox
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Seeded and consumed Automatische Umzugsmeldung transfers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={clearQueue}
            disabled={loading}
          >
            Clear queue
          </Button>
          <Button asChild>
            <Link href="/dashboard/aum/simulator">
              <FlaskConical className="h-4 w-4 mr-2" />
              Simulator
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Building</th>
                <th className="px-4 py-3 font-medium">Transfer ID</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && messages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Queue empty. Seed a MoveIn or MoveOut in the simulator.
                  </td>
                </tr>
              )}
              {!loading &&
                messages.map((m) => (
                  <tr
                    key={m.transferId}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {m.status}
                        {m.removedBy ? ` · ${m.removedBy}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.messageType}
                      <span className="text-gray-400 ml-1">
                        ({m.messageTypeCode})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {m.building || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/aum/${m.transferId}`}
                        className="font-mono text-xs text-orange-600 hover:underline"
                      >
                        {m.transferId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
