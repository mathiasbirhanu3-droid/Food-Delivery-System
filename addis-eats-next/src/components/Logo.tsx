export default function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#0C7A4D" />
        <circle cx="16" cy="16" r="9" fill="#E9B44C" />
        <circle cx="16" cy="16" r="3.5" fill="#E4572E" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">Addis Eats</span>
    </span>
  );
}