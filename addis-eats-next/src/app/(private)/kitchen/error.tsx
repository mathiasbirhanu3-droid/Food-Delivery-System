'use client';

export default function KitchenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[kitchen] dashboard error:', error);
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">The dashboard hit a snag</h1>
      <p className="mt-2 text-ink/60 dark:text-cream/60">
        Charts failed to render — your orders and the kitchen queue are unaffected.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600"
      >
        Retry the dashboard
      </button>
    </section>
  );
}