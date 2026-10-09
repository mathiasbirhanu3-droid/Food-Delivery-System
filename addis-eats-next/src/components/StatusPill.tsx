const styles: Record<string, string> = {
  pending: 'border-gold/40 bg-gold/15 text-yellow-800 dark:text-gold',
  preparing: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  delivering: 'border-accent/30 bg-accent/10 text-accent-600 dark:text-accent',
  delivered: 'border-primary/30 bg-primary/10 text-primary-700 dark:text-primary-300',
  cancelled: 'border-ink/20 bg-ink/5 text-ink/60 dark:border-cream/20 dark:text-cream/60',
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? styles.cancelled}`}
    >
      {status}
    </span>
  );
}