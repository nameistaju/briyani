import React from "react";

interface ScallopDividerProps {
  topColor: string;
  bottomColor: string;
  flip?: boolean;
  className?: string;
}

/**
 * Crisp tiled scalloped divider echoing menu cards and editorial paper cuts.
 */
export function ScallopDivider({
  topColor,
  bottomColor,
  flip = false,
  className = "",
}: ScallopDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full overflow-hidden leading-none select-none ${className}`}
      style={{ backgroundColor: topColor, height: "28px" }}
    >
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className={`block w-full h-full ${flip ? "rotate-180" : ""}`}
      >
        <path
          d={
            Array.from({ length: 30 }, (_, idx) => {
              const x0 = idx * 40;
              const xMid = x0 + 20;
              const x1 = x0 + 40;
              return `${idx === 0 ? `M 0 28 L 0 14` : ""} Q ${xMid} -4 ${x1} 14`;
            }).join(" ") + " L 1200 28 Z"
          }
          fill={bottomColor}
        />
      </svg>
    </div>
  );
}
