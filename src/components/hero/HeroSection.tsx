"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BRAND } from "@/data/brand";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";

const HeroScene3D = dynamic(
  () => import("@/components/hero/HeroScene3D").then((m) => m.HeroScene3D),
  { ssr: false }
);

const HERO_LETTERS = [
  { char: "D", rotate: "-5deg", y: "-1%" },
  { char: "U", rotate: "2deg", y: "3%" },
  { char: "M", rotate: "-3deg", y: "-2%" },
  { char: "B", rotate: "4deg", y: "2%" },
  { char: "A", rotate: "-2deg", y: "-1%" },
  { char: "A", rotate: "3deg", y: "3%" },
  { char: "Z", rotate: "-5deg", y: "-2%" },
];

export function HeroSection() {
  const webglSupported = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const check = () => setIsCompactViewport(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-x-clip bg-burgundy pt-18 pb-6 text-cream sm:pt-20 sm:pb-8"
    >
      {/* Subtle tonal background script watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="-rotate-12 whitespace-nowrap font-script text-[36vw] leading-none text-burgundy-deep/35 sm:text-[26vw]">
          dumbaaz
        </span>
      </div>

      {/* Top typographic bar */}
      <div className="relative z-30 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 text-center text-[11px] font-bold tracking-[0.22em] uppercase sm:px-10 sm:text-xs">
        <span className="text-cream/90">CHARCOAL DUM HOUSE</span>
        <span className="text-turmeric underline decoration-turmeric decoration-2 underline-offset-4">
          BY DUMBAAZ
        </span>
        <span className="text-cream/90">{BRAND.neighborhood}</span>
      </div>

      {/* Center poster wordmark behind live 3D copper handi */}
      <div className="relative z-10 mx-auto my-auto flex min-h-[380px] w-full max-w-[1440px] flex-1 items-start justify-center px-2 pt-8 sm:min-h-[450px] sm:items-center sm:px-6 sm:pt-2 lg:min-h-[490px]">
        {/* Giant tilted cream display typography sitting behind the 3D handi */}
        <h1
          aria-label="DUMBAAZ — Charcoal-Fired Copper Handi Biryani"
          className="pointer-events-none relative z-10 flex w-full select-none items-center justify-center font-display text-[23vw] leading-[0.8] tracking-[0.015em] text-cream drop-shadow-[0_14px_32px_rgba(43,7,14,0.38)] sm:text-[18.5vw] lg:text-[min(17.5vw,260px)]"
        >
          {HERO_LETTERS.map((item, idx) => (
            <span
              key={`${item.char}-${idx}`}
              aria-hidden="true"
              className="inline-block px-[0.02em]"
              style={{
                transform: `rotate(${item.rotate}) translateY(${item.y})`,
              }}
            >
              {item.char}
            </span>
          ))}
        </h1>

        {/* Live 3D handi + floating spices sitting in front of center letters */}
        <div
          aria-label="Interactive 3D copper biryani handi — drag to rotate"
          className="absolute inset-x-0 bottom-0 top-6 z-20 mx-auto flex h-[360px] w-full max-w-[780px] self-center sm:inset-0 sm:h-[450px] lg:h-[490px]"
        >
          <HeroScene3D
            webglSupported={webglSupported}
            reducedMotion={reducedMotion}
            isCompactViewport={isCompactViewport}
          />
        </div>

        {/* Rotating circular stamp badge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-5 z-30 hidden sm:block lg:top-8 lg:right-12"
        >
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg
              viewBox="0 0 120 120"
              className="h-full w-full animate-spin-slow text-cream"
            >
              <defs>
                <path
                  id="hero-stamp-ring"
                  d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                />
              </defs>
              <text
                fill="currentColor"
                fontSize="8.5"
                fontWeight="700"
                letterSpacing="2.4"
              >
                <textPath href="#hero-stamp-ring" startOffset="0%">
                  DUMBAAZ • DUM BIRYANI • SLOW CHARCOAL •
                </textPath>
              </text>
            </svg>
            {/* Central brass handi pictogram */}
            <svg
              viewBox="0 0 36 36"
              className="absolute h-8 w-8 text-turmeric"
              fill="none"
            >
              <path
                d="M11 11c0-1.5 1.8-2.5 1.8-4M18 10c0-1.7 1.8-2.8 1.8-4.5M25 11c0-1.5 1.8-2.5 1.8-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M7 16h22c0 7.5-4.5 12-11 12S7 23.5 7 16Z"
                fill="currentColor"
                fillOpacity="0.22"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M9 14.5h18"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom editorial bar matching poster composition */}
      <div className="relative z-30 mx-auto grid w-full max-w-[1440px] grid-cols-1 items-end gap-5 px-5 sm:grid-cols-3 sm:px-10">
        <p className="font-display text-xl leading-[0.95] tracking-[0.02em] text-cream uppercase sm:text-2xl lg:text-[28px]">
          DISCOVER THE ROYAL
          <br />
          DUM-SEALED BIRYANI
          <br />
          HOUSE OF DUMBAAZ.
        </p>

        <div className="hidden flex-col items-center justify-end gap-2 sm:flex">
          <a
            href="#dum-craft"
            className="text-[11px] font-bold tracking-[0.28em] text-cream/90 uppercase transition-colors hover:text-turmeric"
          >
            SCROLL
          </a>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-turmeric shadow-[0_0_10px_#F8B612]"
          />
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] font-bold tracking-[0.16em] text-cream/85 uppercase">
            TUE–FRI FROM 18:00 &middot; SAT–SUN FROM 12:30
          </p>
          <p className="mt-1 font-display text-2xl leading-none text-turmeric uppercase">
            FRESH HANDI NOW
          </p>
          <p className="mt-1 font-display text-lg leading-none tracking-[0.03em] text-cream uppercase sm:text-xl">
            THIS EVENING FROM 18:30
          </p>
        </div>
      </div>
    </section>
  );
}
