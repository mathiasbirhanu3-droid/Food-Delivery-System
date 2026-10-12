// error.tsx
'use client';
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error(error); // visible in server logs, never shown to users raw
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-ink/60 dark:text-cream/60">The kitchen dropped a plate. Your cart is safe in this browser.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">Try again</button>
    </section>
  );
}