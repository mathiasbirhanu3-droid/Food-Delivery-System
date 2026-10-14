import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session-server';
import { getOrderFor } from '@/lib/orders-store';
import { getZone, getRestaurant } from '@/lib/db';
import { computeCourierPosition } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // serverless cap; EventSource auto-reconnects after close

/**
 * AUTH.md — a private SSE channel with the same discipline as the poll:
 * session verified HERE (401), then the scoped read (404). The stream
 * re-reads the scoped order every tick, so status advancing mid-stream is
 * picked up live. Snapshot immediately (seeded), tick every 2.5 s, close
 * after ~50 s — EventSource reconnects automatically.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) return new Response('unauthenticated', { status: 401 });

  const order = getOrderFor(session.userId, id); // ← scoped: foreign id === missing id
  if (!order) return new Response('not found', { status: 404 });

  const restaurant = (getRestaurant().location ?? [9.0054, 38.7636]) as [number, number];
  const dropoff = (getZone(order.zone)?.center ?? restaurant) as [number, number];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      request.signal.addEventListener('abort', () => { open = false; });

      const send = (event: string, data: unknown) => {
        if (!open) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      controller.enqueue(encoder.encode('retry: 4000\n\n'));

      const snapshot = () => {
        const fresh = getOrderFor(session.userId, id);
        if (!fresh) return null;
        return {
          id: fresh.id,
          status: fresh.status,
          courier: computeCourierPosition(fresh, restaurant, dropoff),
          courierName: fresh.courier?.name ?? null,
          etaMin: fresh.etaMin,
          etaMax: fresh.etaMax,
          updatedAt: new Date().toISOString(),
        };
      };

      send('order', snapshot());

      const TICKS = 20; // ~50 s, then close — EventSource reconnects itself
      for (let i = 0; i < TICKS && open && !request.signal.aborted; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        if (!open || request.signal.aborted) break;
        const snap = snapshot();
        if (!snap) break;
        send('order', snap);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}