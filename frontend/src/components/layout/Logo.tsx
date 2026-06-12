"use client";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 28, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark obsidian background */}
      <rect width="32" height="32" rx="8" fill="hsl(220 16% 8%)" />
      {/* Amber border glow */}
      <rect
        x="0.5" y="0.5" width="31" height="31" rx="7.5"
        stroke="hsl(38 92% 54%)"
        strokeOpacity="0.35"
        fill="none"
      />
      {/* Main branch */}
      <line
        x1="10" y1="5" x2="10" y2="27"
        stroke="hsl(38 92% 58%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Feature branch */}
      <line
        x1="22" y1="14" x2="22" y2="27"
        stroke="hsl(38 92% 54%)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Branch curve */}
      <path
        d="M10 14 Q16 14 22 19"
        stroke="hsl(38 92% 54%)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
      {/* Commit nodes — main */}
      <circle cx="10" cy="7" r="2.8" fill="hsl(38 92% 58%)" />
      <circle cx="10" cy="7" r="1.2" fill="hsl(220 16% 6%)" />
      <circle cx="10" cy="19" r="2.4" fill="hsl(38 92% 54%)" fillOpacity="0.8" />
      <circle cx="10" cy="19" r="1" fill="hsl(220 16% 6%)" />
      <circle cx="22" cy="22" r="2.2" fill="hsl(38 92% 54%)" fillOpacity="0.55" />
      {/* AI diamond node */}
      <circle cx="22" cy="11" r="4" fill="hsl(38 92% 54%)" />
      <path d="M20.2 11 L22 9.2 L23.8 11 L22 12.8 Z" fill="hsl(220 16% 6%)" />
    </svg>
  );
}

export function Wordmark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", gap: "9px" }}
    >
      <Logo size={size} />
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: `${Math.round(size * 0.53)}px`,
          letterSpacing: "-0.03em",
          color: "hsl(38 10% 94%)",
          lineHeight: 1,
        }}
      >
        GitMind
      </span>
    </div>
  );
}