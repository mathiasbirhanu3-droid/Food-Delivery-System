export default function OrdersLoading() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
      <div className="h-9 w-40 animate-pulse rounded-xl bg-ink/10 dark:bg-cream/10" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10" />
        ))}
      </div>
    </section>
  );
}