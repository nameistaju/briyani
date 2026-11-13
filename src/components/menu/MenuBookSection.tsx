"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

// Dynamically import the browser-only Grabfold flipbook with a luxury fallback skeleton
const MenuBookFlipbook = dynamic(
  () => import("./MenuBookFlipbook").then((m) => m.MenuBookFlipbook),
  {
    ssr: false,
    loading: () => (
      <div className="relative mx-auto flex h-[580px] w-full max-w-[960px] items-center justify-center rounded-2xl bg-[#762D35] p-8 text-[#F5EBDD] shadow-2xl sm:h-[680px]">
        <div className="flex flex-col items-center text-center">
          <BookOpen className="h-12 w-12 animate-pulse text-[#B47A50]" />
          <p className="mt-4 font-display text-2xl tracking-widest text-[#F5EBDD] uppercase">
            OPENING THE DUMBAAZ MENU
          </p>
          <span className="mt-1 text-xs tracking-widest text-[#B47A50] uppercase">
            Preparing hand-pressed paper sheets...
          </span>
        </div>
      </div>
    ),
  }
);

const CHAPTER_LABELS: Record<number, string> = {
  [-2]: "COVER (CLOSED)",
  [-1]: "FOREWORD & CHAPTER INDEX",
  [0]: "CHAPTER I: SHAHI STARTERS",
  [1]: "CHAPTER II: CHICKEN DUM BIRYANI",
  [2]: "CHAPTER III: MUTTON DUM BIRYANI",
  [3]: "CHAPTER IV: GRAND HANDIS & SKEWERS",
  [4]: "CHAPTER V: SLOW CURRIES & BREADS",
  [5]: "CHAPTER VI: SWEETS & RESERVATIONS",
  [6]: "BACK COVER (CLOSED)",
};

const CHAPTER_JUMPS = [
  { label: "COVER", pos: -2 },
  { label: "STARTERS", pos: 0 },
  { label: "CHICKEN", pos: 1 },
  { label: "MUTTON", pos: 2 },
  { label: "GRAND HANDIS", pos: 3 },
  { label: "CURRIES", pos: 4 },
  { label: "SWEETS", pos: 5 },
  { label: "BACK", pos: 6 },
];

export function MenuBookSection() {
  const [position, setPosition] = useState(-2);
  const soundEnabled = true;

  const canPrev = position > -2;
  const canNext = position < 6;

  const handlePrev = () => {
    if (canPrev) setPosition((prev) => Math.max(-2, prev - 1));
  };

  const handleNext = () => {
    if (canNext) setPosition((prev) => Math.min(6, prev + 1));
  };

  return (
    <section
      id="menu"
      aria-label="DUMBAAZ Interactive Menu Book"
      className="relative overflow-hidden bg-[#292421] px-4 pb-40 pt-16 text-[#F5EBDD] sm:px-8 sm:pb-64 sm:pt-24 lg:pb-80 lg:pt-28 select-none"
    >
      {/* Background radial warmth lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(118,45,53,0.32),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14">
          <h2 className="font-display text-4xl leading-[0.88] tracking-tight text-[#F5EBDD] uppercase sm:text-6xl lg:text-7xl">
            OUR MENU
          </h2>
        </div>

        {/* The Interactive Menu Flipbook */}
        <div>
          <MenuBookFlipbook
            position={position}
            onPositionChange={setPosition}
            soundEnabled={soundEnabled}
          />
        </div>

        {/* Discreet Bottom Controls Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-[#B47A50]/20 pt-6 sm:mt-10 md:flex-row">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all ${
              canPrev
                ? "border-[#B47A50] bg-[#33231D] text-[#F5EBDD] hover:bg-[#762D35] hover:border-[#762D35]"
                : "border-[#B47A50]/20 text-[#F5EBDD]/30 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>PREV PAGE</span>
          </button>

          {/* Current Spread Indicator */}
          <div className="text-center">
            <span className="block font-display text-sm tracking-widest text-[#B47A50] uppercase sm:text-base">
              {CHAPTER_LABELS[position] || "THE MENU"}
            </span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#F5EBDD]/60 uppercase">
              SPREAD {Math.max(1, position + 3)} OF 9
            </span>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-all ${
              canNext
                ? "border-[#B47A50] bg-[#33231D] text-[#F5EBDD] hover:bg-[#762D35] hover:border-[#762D35]"
                : "border-[#B47A50]/20 text-[#F5EBDD]/30 cursor-not-allowed"
            }`}
          >
            <span>NEXT PAGE</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Chapter Quick Jump Navigation Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold tracking-wider uppercase sm:text-[11px]">
          <span className="mr-2 text-[#B47A50]/70">JUMP TO:</span>
          {CHAPTER_JUMPS.map((ch) => {
            const isActive = position === ch.pos;
            return (
              <button
                key={ch.label}
                onClick={() => setPosition(ch.pos)}
                className={`rounded-full px-3.5 py-1.5 transition-all ${
                  isActive
                    ? "bg-[#762D35] text-[#F5EBDD] shadow-md border border-[#B47A50]"
                    : "bg-[#33231D]/80 text-[#F5EBDD]/70 hover:bg-[#33231D] hover:text-[#F5EBDD]"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
