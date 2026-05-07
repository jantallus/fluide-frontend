interface IconProps {
  size?: number;
  className?: string;
}

// Ski equipment icon: two skis + poles (front view)
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
      {/* Left pole grip */}
      <rect x="3" y="2" width="10" height="11" rx="2.5" strokeWidth="3.5" />
      {/* Left pole shaft */}
      <line x1="8" y1="13" x2="8" y2="88" strokeWidth="3.5" />
      {/* Left pole basket */}
      <line x1="3" y1="86" x2="13" y2="86" strokeWidth="3.5" />

      {/* Left ski body */}
      <path d="M22 18 C22 10 35 10 35 18 L36 44 L34 56 L36 72 L35 82 C35 90 22 90 22 82 L21 72 L23 56 L21 44 Z" strokeWidth="3.5" />
      {/* Left ski upper binding chevrons */}
      <path d="M23 28 L28.5 23 L34 28" strokeWidth="2.5" />
      <path d="M23 36 L28.5 31 L34 36" strokeWidth="2.5" />
      {/* Left ski lower binding chevrons */}
      <path d="M23 64 L28.5 59 L34 64" strokeWidth="2.5" />
      <path d="M23 72 L28.5 67 L34 72" strokeWidth="2.5" />

      {/* Right ski body */}
      <path d="M65 18 C65 10 78 10 78 18 L79 44 L77 56 L79 72 L78 82 C78 90 65 90 65 82 L64 72 L66 56 L64 44 Z" strokeWidth="3.5" />
      {/* Right ski upper binding chevrons */}
      <path d="M66 28 L71.5 23 L77 28" strokeWidth="2.5" />
      <path d="M66 36 L71.5 31 L77 36" strokeWidth="2.5" />
      {/* Right ski lower binding chevrons */}
      <path d="M66 64 L71.5 59 L77 64" strokeWidth="2.5" />
      <path d="M66 72 L71.5 67 L77 72" strokeWidth="2.5" />

      {/* Right pole grip */}
      <rect x="87" y="2" width="10" height="11" rx="2.5" strokeWidth="3.5" />
      {/* Right pole shaft */}
      <line x1="92" y1="13" x2="92" y2="88" strokeWidth="3.5" />
      {/* Right pole basket */}
      <line x1="87" y1="86" x2="97" y2="86" strokeWidth="3.5" />
    </svg>
  );
}

// Snowboard top-view icon with bindings
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
      {/* Board outer outline — rotated oval */}
      <ellipse cx="50" cy="50" rx="20" ry="46" strokeWidth="4" transform="rotate(35 50 50)" />
      {/* Board inner contour 1 */}
      <ellipse cx="50" cy="50" rx="15" ry="41" strokeWidth="2.5" transform="rotate(35 50 50)" />
      {/* Board inner contour 2 */}
      <ellipse cx="50" cy="50" rx="10" ry="36" strokeWidth="2" transform="rotate(35 50 50)" />
      {/* Upper binding */}
      <ellipse cx="40" cy="36" rx="9" ry="7" strokeWidth="3" transform="rotate(35 40 36)" />
      <line x1="32" y1="36" x2="48" y2="36" strokeWidth="2.5" transform="rotate(35 40 36)" />
      {/* Lower binding */}
      <ellipse cx="60" cy="64" rx="9" ry="7" strokeWidth="3" transform="rotate(35 60 64)" />
      <line x1="52" y1="64" x2="68" y2="64" strokeWidth="2.5" transform="rotate(35 60 64)" />
    </svg>
  );
}

// Hiking boot side-view icon
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
      {/* Boot collar / tongue flap */}
      <path d="M24 14 L38 8 L42 18" strokeWidth="3.5" />
      <line x1="26" y1="17" x2="40" y2="12" strokeWidth="2.5" />
      {/* Boot upper outline — back, heel, toe */}
      <path d="M24 14 L20 24 L18 62 C18 70 22 78 30 82 L72 82 C80 82 86 78 88 72 C90 66 88 60 82 58 L70 52 L52 44 L42 28 L38 18" strokeWidth="3.5" />
      {/* Toe cap rounded */}
      <path d="M82 58 C90 56 94 62 92 70 C90 78 84 84 72 82" strokeWidth="3.5" />
      {/* Laces */}
      <line x1="68" y1="55" x2="54" y2="46" strokeWidth="2.5" />
      <line x1="62" y1="59" x2="48" y2="50" strokeWidth="2.5" />
      <line x1="56" y1="63" x2="44" y2="54" strokeWidth="2.5" />
      <line x1="50" y1="67" x2="40" y2="60" strokeWidth="2.5" />
      {/* Sole */}
      <path d="M20 82 L20 88 L72 88 L72 82" strokeWidth="3.5" />
      <path d="M72 88 C80 88 88 86 90 80 L90 76" strokeWidth="3.5" />
      {/* Sole tread */}
      <line x1="28" y1="88" x2="28" y2="92" strokeWidth="2.5" />
      <line x1="38" y1="88" x2="38" y2="92" strokeWidth="2.5" />
      <line x1="48" y1="88" x2="48" y2="92" strokeWidth="2.5" />
      <line x1="58" y1="88" x2="58" y2="92" strokeWidth="2.5" />
      <line x1="68" y1="88" x2="68" y2="92" strokeWidth="2.5" />
    </svg>
  );
}
