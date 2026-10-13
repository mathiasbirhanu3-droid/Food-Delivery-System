/** Small availability label shown wherever a hidden dish still appears
 *  in history/favorites — honest UI for real inventory state. */
export default function OutOfStock({ compact = false }: { compact?: boolean }) {
  return (
    <span
      role="status"
      className={`shrink-0 rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink/60 dark:bg-cream/10 dark:text-cream/60 ${
        compact ? '' : 'whitespace-nowrap'
      }`}
    >
      Out of stock
    </span>
  );
}