export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-ink/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-fern border-t-transparent" />
      {label}
    </div>
  );
}
