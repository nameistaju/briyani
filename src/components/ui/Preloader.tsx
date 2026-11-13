"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Preloader() {
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [shouldUnmount, setShouldUnmount] = useState(false);

  useEffect(() => {
    // If reduced motion is requested, dismiss almost immediately
    if (reducedMotion) {
      const timer = setTimeout(() => {
        setProgress(100);
        setIsDone(true);
        setTimeout(() => setShouldUnmount(true), 250);
      }, 50);
      return () => clearTimeout(timer);
    }

    // Lock body scrolling while the preloader is active to prevent scroll jank
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let heroReady = false;

    const onHeroReady = () => {
      heroReady = true;
    };

    window.addEventListener("dumbaaz:hero-ready", onHeroReady);

    // Smooth progress simulation that synchronizes with 3D engine warmup
    const startTime = Date.now();
    const minDuration = 1800; // minimum duration (ms) to show the brand lid animation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const naturalProgress = Math.min(85, (elapsed / minDuration) * 85);

      if (heroReady || elapsed > minDuration) {
        // Accelerate smoothly to 100% once 3D engine is ready
        setProgress((prev) => {
          const next = prev + (100 - prev) * 0.28 + 1.5;
          if (next >= 100) {
            clearInterval(interval);
            setIsDone(true);

            // Unlock body scroll once complete
            document.body.style.overflow = originalOverflow;

            // Unmount from DOM after smooth fade-out completes
            setTimeout(() => setShouldUnmount(true), 750);
            return 100;
          }
          return next;
        });
      } else {
        setProgress(naturalProgress);
      }
    }, 45);

    // Safety fallback: guaranteed dismissal after 3.2s even on slow networks
    const fallbackTimer = setTimeout(() => {
      setProgress(100);
      setIsDone(true);
      document.body.style.overflow = originalOverflow;
      setTimeout(() => setShouldUnmount(true), 750);
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
      window.removeEventListener("dumbaaz:hero-ready", onHeroReady);
      document.body.style.overflow = originalOverflow;
    };
  }, [reducedMotion]);

  if (shouldUnmount) return null;

  // Contextual cooking status message matching DUMBAAZ culinary heritage
  const getStatusMessage = () => {
    if (progress < 25) return "SEALING COPPER HANDI...";
    if (progress < 55) return "GENTLE CHARCOAL DUM...";
    if (progress < 82) return "TEMPERING WHOLE SPICES...";
    if (progress < 98) return "WARMING 3D HEARTH...";
    return "READY TO SERVE!";
  };

  return (
    <div
      role="progressbar"
      aria-label="Loading DUMBAAZ restaurant experience"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#2B070E] px-6 text-[#F5EBDD] select-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isDone ? "pointer-events-none -translate-y-4 opacity-0 scale-[1.03]" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 46%, #451219 0%, #2B070E 68%, #1A0307 100%)",
      }}
    >
      {/* Animated Pot & Lifting Lid GIF Seal */}
      <div className="relative flex items-center justify-center">
        {/* Ambient warm hearth glow */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 rounded-full bg-turmeric/20 blur-3xl animate-pulse"
        />

        <div className="relative z-10 flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border-2 border-turmeric/70 bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.7),0_0_40px_rgba(248,182,18,0.3)] sm:h-56 sm:w-56">
          <Image
            src="/images/dumbaaz-lid-animation.gif"
            alt="DUMBAAZ lifting handi lid animation"
            width={240}
            height={240}
            unoptimized
            priority
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Brand Wordmark & Tagline */}
      <div className="mt-5 flex flex-col items-center text-center">
        <h1 className="font-display text-3xl tracking-[0.08em] text-[#F5EBDD] uppercase sm:text-5xl">
          DUMBAAZ
        </h1>
        <p className="mt-1 text-[11px] font-bold tracking-[0.24em] text-turmeric uppercase sm:text-xs">
          CHARCOAL DUM HOUSE &middot; SLOW-COOKED HERITAGE
        </p>
      </div>

      {/* Progress Bar & Status Text */}
      <div className="mt-8 flex w-64 flex-col items-center sm:w-80">
        {/* Track */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-cream/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-turmeric to-[#E2341D] transition-all duration-100 ease-out shadow-[0_0_12px_rgba(248,182,18,0.7)]"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>

        {/* Live Status and Percentage Counter */}
        <div className="mt-3 flex w-full items-center justify-between text-[11px] font-bold tracking-wider text-cream/70 sm:text-xs">
          <span className="truncate pr-2 font-mono uppercase tracking-widest text-turmeric">
            {getStatusMessage()}
          </span>
          <span className="font-mono font-bold text-cream">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
