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
      <rect width="32" height="32" rx="7" fill="hsl(188 94% 48%)" />
      {/* main branch vertical */}
      <line x1="10" y1="5" x2="10" y2="27" stroke="hsl(222 20% 7%)" strokeWidth="2.2" strokeLinecap="round" />
      {/* feature branch vertical */}
      <line x1="22" y1="14" x2="22" y2="27" stroke="hsl(222 20% 7%)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.65" />
      {/* branch curve */}
      <path d="M10 14 Q16 14 22 19" stroke="hsl(222 20% 7%)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeOpacity="0.55" />
      {/* commit nodes main */}
      <circle cx="10" cy="7" r="2.8" fill="hsl(222 20% 7%)" />
      <circle cx="10" cy="19" r="2.4" fill="hsl(222 20% 7%)" fillOpacity="0.8" />
      <circle cx="22" cy="22" r="2.2" fill="hsl(222 20% 7%)" fillOpacity="0.6" />
      {/* AI node */}
      <circle cx="22" cy="11" r="4" fill="hsl(222 20% 7%)" />
      <path d="M20 11 L22 9 L24 11 L22 13 Z" fill="hsl(188 94% 48%)" />
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
          fontWeight: 600,
          fontSize: `${Math.round(size * 0.53)}px`,
          letterSpacing: "-0.03em",
          color: "hsl(210 20% 94%)",
          lineHeight: 1,
        }}
      >
        GitMind
      </span>
    </div>
  );
}