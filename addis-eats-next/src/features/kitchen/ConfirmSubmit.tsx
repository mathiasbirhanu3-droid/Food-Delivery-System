'use client';
export default function ConfirmSubmit({ label, message }: { label: string; message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
      className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white"
    >
      {label}
    </button>
  );
}