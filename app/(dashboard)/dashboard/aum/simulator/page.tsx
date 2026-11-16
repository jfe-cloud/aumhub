'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FlaskConical } from 'lucide-react';

export default function AumSimulatorPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState('');

  async function seedFixture(fixture: 'moveIn' | 'moveOut') {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/aum/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Seed failed');
      setResult(`Seeded ${body.messageType}: ${body.transferId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setBusy(false);
    }
  }

  async function seedCustom() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const message = JSON.parse(rawJson);
      const res = await fetch('/api/aum/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Seed failed');
      setResult(`Seeded ${body.messageType}: ${body.transferId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setBusy(false);
    }
  }

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
          <FlaskConical className="h-6 w-6 text-orange-500" />
          AUM Simulator
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Enqueue sample DownloadMessage payloads into the VNB test queue.
        </p>
      </div>

      <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Fixtures</h2>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => seedFixture('moveIn')}>
            Seed MoveIn (Einzug)
          </Button>
          <Button
            disabled={busy}
            variant="outline"
            onClick={() => seedFixture('moveOut')}
          >
            Seed MoveOut (Auszug)
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Custom JSON</h2>
        <p className="text-xs text-gray-500">
          Must include at least <code>transferId</code> and{' '}
          <code>messageTypeCode</code>.
        </p>
        <textarea
          className="w-full min-h-40 rounded-md border border-gray-200 p-3 font-mono text-xs"
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          placeholder='{"transferId":"…","messageTypeCode":1,"messageType":"MoveIn",…}'
        />
        <Button disabled={busy || !rawJson.trim()} onClick={seedCustom}>
          Enqueue custom message
        </Button>
      </div>

      {result && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
          {result}{' '}
          <Link href="/dashboard/aum" className="underline">
            Open inbox
          </Link>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}
