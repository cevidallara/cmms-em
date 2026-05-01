type Props = {
  size?: number;
  showText?: boolean;
  className?: string;
};

export function Logo({ size = 22, showText = true, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="nk-grad" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#B5F500" />
            <stop offset="0.6" stopColor="#00E5FF" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M3 19V3h2.6l11 12.4V3H19v16h-2.6L5.4 6.6V19H3Z" fill="url(#nk-grad)" />
      </svg>
      {showText && (
        <span className="font-semibold tracking-tight text-text">Nikolator</span>
      )}
    </span>
  );
}
