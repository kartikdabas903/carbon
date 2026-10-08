/** Leaves drifting across the hero. */
export function Leaves({ className = "" }: { className?: string }) {
  const leaves = [
    { left: "8%", top: "18%", size: 26, delay: "0s", rot: 20 },
    { left: "84%", top: "14%", size: 34, delay: "-3s", rot: -30 },
    { left: "72%", top: "62%", size: 22, delay: "-6s", rot: 60 },
    { left: "18%", top: "70%", size: 18, delay: "-1.5s", rot: -10 },
    { left: "52%", top: "8%", size: 16, delay: "-4.5s", rot: 35 },
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {leaves.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="animate-drift absolute"
          style={{ left: l.left, top: l.top, width: l.size, height: l.size, animationDelay: l.delay, rotate: `${l.rot}deg` }}
        >
          <path d="M4 20C4 11 10 4 20 4c0 10-6 16-16 16z" fill="#c8e88a" opacity="0.5" />
          <path d="M4 20C8 14 12 10 17 7" stroke="#0f2a1f" strokeWidth="1.2" opacity="0.4" fill="none" />
        </svg>
      ))}
    </div>
  );
}
