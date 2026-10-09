export default function KitchenLoading() {
  const block = 'animate-pulse rounded-xl bg-ink/10 dark:bg-cream/10';
  return (
    <section className="mx-auto max-w-5xl px-4 py-12" aria-busy="true">
      <div className={`h-9 w-56 ${block}`} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-24 ${block}`} />
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-7 w-24 ${block}`} />
        ))}
      </div>
      <div className={`mt-6 h-64 ${block}`} />
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className={`h-56 ${block}`} />
        <div className={`h-56 ${block}`} />
      </div>
    </section>
  );
}