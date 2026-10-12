'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('addis_eats_theme', next ? 'dark' : 'light'); } catch {}
        setDark(next);
      }}
      aria-label="Toggle dark mode"
      className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-sm hover:border-primary dark:border-cream/20"
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}