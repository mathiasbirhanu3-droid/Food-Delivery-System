export default function ChartEmpty({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed border-ink/20 p-6 text-center dark:border-cream/20"
    >
      <div>
        <p className="font-display font-semibold">{title}</p>
        <p className="mt-1 text-sm text-ink/60 dark:text-cream/60">{message}</p>
        {children}
      </div>
    </div>
  );
}