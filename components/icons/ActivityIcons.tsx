interface IconProps {
  size?: number;
  className?: string;
}

export function SkiIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head with goggles */}
      <circle cx="70" cy="16" r="13" strokeWidth="3.5" />
      <path d="M58 16 L82 16" strokeWidth="2.5" />
      {/* Body crouched — thick stroke = body width */}
      <path d="M68 29 C60 33 50 36 38 40" strokeWidth="8" />
      <path d="M76 30 C80 35 78 43 70 46 L38 40" strokeWidth="3.5" />
      {/* Back arm with pole (upper-left) */}
      <path d="M58 34 L30 18" strokeWidth="8" />
      <path d="M30 18 L22 8" strokeWidth="3.5" />
      <path d="M19 5 L25 11" strokeWidth="3" />
      <path d="M19 11 L25 5" strokeWidth="3" />
      {/* Front arm with pole (lower-right) */}
      <path d="M72 40 L84 56" strokeWidth="3.5" />
      <path d="M81 55 L87 55" strokeWidth="3" />
      <path d="M84 52 L84 58" strokeWidth="3" />
      {/* Speed lines */}
      <path d="M16 50 L27 47" strokeWidth="2.5" />
      <path d="M12 58 L23 55" strokeWidth="2.5" />
      {/* Skis */}
      <path d="M8 80 L88 60" strokeWidth="4" />
      <path d="M6 88 L86 68" strokeWidth="4" />
    </svg>
  );
}

export function SnowboardIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head with goggles */}
      <circle cx="50" cy="12" r="12" strokeWidth="3.5" />
      <path d="M39 12 L61 12" strokeWidth="2.5" />
      {/* Body */}
      <path d="M48 24 L44 44" strokeWidth="8" />
      {/* Long right arm (characteristic of snowboarder pose) */}
      <path d="M50 30 L84 22" strokeWidth="8" />
      {/* Left arm */}
      <path d="M46 32 L28 48" strokeWidth="8" />
      {/* Knees / lower body */}
      <path d="M44 44 L36 58 L50 66" strokeWidth="3.5" />
      <path d="M44 44 L52 56 L50 66" strokeWidth="3.5" />
      {/* Snowboard — large rounded rectangle at diagonal */}
      <rect x="12" y="68" width="74" height="14" rx="7" strokeWidth="4" transform="rotate(-15 12 68)" />
    </svg>
  );
}

export function PedestrianIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Head */}
      <circle cx="63" cy="14" r="12" strokeWidth="3.5" />
      {/* Body / jacket outline — two side paths */}
      <path d="M59 26 C51 30 44 36 42 48 L54 50 L56 64" strokeWidth="3.5" />
      <path d="M67 26 C73 30 73 38 68 44 L58 48 L60 64" strokeWidth="3.5" />
      <path d="M54 50 L58 48" strokeWidth="3.5" />
      {/* Back arm — thick stroke with round cap gives body width */}
      <path d="M54 36 L34 48" strokeWidth="9" />
      {/* Front arm */}
      <path d="M58 38 L70 52" strokeWidth="9" />
      {/* Back leg */}
      <path d="M56 64 L38 84" strokeWidth="3.5" />
      <path d="M38 84 L26 86" strokeWidth="3.5" />
      {/* Front leg */}
      <path d="M60 64 L58 82" strokeWidth="3.5" />
      <path d="M58 82 L70 84" strokeWidth="3.5" />
    </svg>
  );
}
