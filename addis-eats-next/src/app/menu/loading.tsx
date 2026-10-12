export default function MenuLoading() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-ink/10 dark:bg-cream/10" />
      <div className="mt-6 h-12 animate-pulse rounded-full bg-ink/10 dark:bg-cream/10" />
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="overflow-hidden rounded-2xl border border-ink/10 dark:border-cream/10">
            <div className="aspect-[4/3] animate-pulse bg-ink/10 dark:bg-cream/10" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-ink/10 dark:bg-cream/10" />
              <div className="h-3 w-full animate-pulse rounded bg-ink/10 dark:bg-cream/10" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}