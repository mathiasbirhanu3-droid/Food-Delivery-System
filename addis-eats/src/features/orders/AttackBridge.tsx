'use client';

import { useEffect } from 'react';
import { cancelOrder } from '@/actions/orders';
import { advanceOrderStatus } from '@/actions/kitchen';

/**
 * Demo bridge — mounts the REAL server actions on window so the sheet's
 * attack commands (and one bonus role attack) run verbatim from the console:
 *
 *   await cancelOrder("ord_812")        // signed out          → { refusedBy: 'session' }
 *   await cancelOrder("ord_814")        // someone else's id   → { refusedBy: 'ownership' }
 *   await advanceOrderStatus("ord_812") // as a CUSTOMER       → { reason: 'role' }
 *
 * The actions enforce every layer themselves; this bridge grants no access —
 * it only makes the refusals observable.
 */
export default function AttackBridge() {
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.cancelOrder = cancelOrder;
    w.advanceOrderStatus = advanceOrderStatus;
  }, []);
  return null;
}