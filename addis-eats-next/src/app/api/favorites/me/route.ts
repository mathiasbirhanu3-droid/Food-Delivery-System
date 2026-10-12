import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session-server';
import { getFavoriteCounts, getFavoritesFor } from '@/lib/favorites-store';

/** 401 signed out · 200 { ids (mine, newest first), counts (public aggregate) } */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  return NextResponse.json({
    ids: getFavoritesFor(session.userId),
    counts: getFavoriteCounts(),
  });
}