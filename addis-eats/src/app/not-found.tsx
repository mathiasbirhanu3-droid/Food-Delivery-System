// not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">This page isn't on the menu</h1>
      <p className="mt-2 text-ink/60 dark:text-cream/60">
        If you followed a link to someone else's order — that 404 is the security working as designed.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/menu" className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">Browse the menu</Link>
        <Link href="/" className="rounded-full border border-ink/15 px-6 py-3 font-semibold dark:border-cream/20">Home</Link>
      </div>
    </section>
  );
}