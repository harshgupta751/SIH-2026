export default function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-ink" />
      <path
        d="M6 20.5c4.2-6.4 7.2-9.8 10-9.8s5.8 3.4 10 9.8"
        fill="none"
        stroke="var(--copper)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.5 20.5h15"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="16" cy="11.2" r="1.35" fill="var(--copper)" />
    </svg>
  );
}
