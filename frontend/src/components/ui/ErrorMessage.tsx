export function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="animate-rise flex gap-2 rounded-2xl border border-clay/30 bg-clay/10 p-3 text-sm text-[#8a3a12]">
      <span aria-hidden>⚠</span>
      {message}
    </p>
  );
}
