'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine { id: string; name: string; price: number; image: string; qty: number }

const STORAGE_KEY = 'addis_eats_cart_v1';

interface CartApi {
  lines: CartLine[];
  hydrated: boolean;
  add: (line: Omit<CartLine, 'qty'>) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;   // floors at 1 — removal is explicit (feature 6)
  remove: (id: string) => void;
  clear: () => void;
  count: number;                     // derived — never stored (Day 35 state table)
  subtotal: number;                  // derived ETB subtotal
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { // feature 8 — cart survives refresh
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch { /* corrupted storage — start empty */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, 'qty'>) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      if (existing) return prev.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...line, qty: 1 }];
    });
  }, []);

  const increment = useCallback((id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + 1, 20) } : l)));
  }, []);

  const decrement = useCallback((id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(l.qty - 1, 1) } : l)));
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => ({
    lines, hydrated, add, increment, decrement, remove, clear,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
  }), [lines, hydrated, add, increment, decrement, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}