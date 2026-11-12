import React from "react";

interface DumbaazWordmarkProps {
  className?: string;
  size?: "nav" | "hero";
  color?: string;
  accentColor?: string;
}

/**
 * Custom architectural wordmark & steam-crown mark for DUMBAAZ.
 * Designed with heavy editorial letterforms and an integrated copper handi crest.
 */
export function DumbaazWordmark({
  className = "",
  size = "nav",
  color = "#F7F0DE",
  accentColor = "#F4B41A",
}: DumbaazWordmarkProps) {
  if (size === "nav") {
    return (
      <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <svg
          width="30"
          height="28"
          viewBox="0 0 36 34"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          {/* Three rising aromatic steam wisps */}
          <path
            d="M11 9.5C11 6.5 13 5.5 13 2.5"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <path
            d="M18 8.5C18 5 20.2 4 20.2 1"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          <path
            d="M25 9.5C25 6.5 27 5.5 27 2.5"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          {/* Flared handi rim */}
          <path d="M4 13.5H32L29.2 17.2H6.8L4 13.5Z" fill={color} />
          {/* Sculpted handi belly */}
          <path
            d="M6.8 18.2H29.2C31.6 22.8 28.4 31 18 31C7.6 31 4.4 22.8 6.8 18.2Z"
            fill={color}
          />
          {/* Spice band inset */}
          <rect x="11" y="22.5" width="14" height="2.4" fill={accentColor} />
        </svg>
        <span
          className="font-display text-2xl font-black tracking-[0.06em] uppercase leading-none"
          style={{ color }}
        >
          DUMBAAZ
        </span>
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 920 190"
      role="img"
      aria-label="DUMBAAZ"
      className={`w-full h-auto select-none ${className}`}
    >
      {/* Subtle drop block shadow for tactile poster depth */}
      <text
        x="466"
        y="156"
        textAnchor="middle"
        fill="#3A060D"
        fontFamily="var(--font-display), Impact, sans-serif"
        fontWeight="900"
        fontSize="168"
        letterSpacing="8"
      >
        DUMBAAZ
      </text>
      <text
        x="460"
        y="150"
        textAnchor="middle"
        fill={color}
        fontFamily="var(--font-display), Impact, sans-serif"
        fontWeight="900"
        fontSize="168"
        letterSpacing="8"
      >
        DUMBAAZ
      </text>
      {/* Twin spice diamond accents flanking the wordmark */}
      <polygon points="34,92 48,78 62,92 48,106" fill={accentColor} />
      <polygon points="858,92 872,78 886,92 872,106" fill={accentColor} />
    </svg>
  );
}
