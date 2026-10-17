import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session-server';
import { getOrderFor } from '@/lib/orders-store';

// AUTH.md — a private READ with the same discipline as an action:
// session verified here (401), then the scoped read (404). The order id in
// the URL is never trusted on its own.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const order = getOrderFor(session.userId, id); // ← scoped: foreign id === missing id
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ order });
}