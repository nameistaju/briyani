"use client";

import React from "react";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-8 sm:pt-5">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-[1440px] items-center justify-between gap-3"
      >
        <a
          href="#hero"
          aria-label="DUMBAAZ home"
          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-cream/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
          style={{ padding: "2px" }}
        >
          <Image
            src="/images/dumbaaz-crest.png"
            alt="DUMBAAZ"
            width={52}
            height={52}
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
            priority
          />
        </a>

        <a
          href="#hours"
          className="pointer-events-auto hidden items-center gap-2.5 rounded-full border border-cream/35 bg-burgundy-deep/90 px-5 py-2 text-[11px] font-bold tracking-[0.16em] text-cream uppercase backdrop-blur-sm transition-colors hover:border-turmeric hover:bg-burgundy md:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-turmeric shadow-[0_0_8px_#F8B612]"
          />
          <span>THIS EVENING FROM 18:30</span>
        </a>

        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href="#menu"
            className="hidden rounded-full border border-cream/30 bg-burgundy-deep/80 px-4 py-2 text-[11px] font-bold tracking-[0.16em] text-cream uppercase backdrop-blur-sm transition-colors hover:border-cream hover:bg-burgundy lg:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
          >
            MENU
          </a>
          <a
            href="#assembly"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-cream px-4 py-2 text-[11px] font-bold tracking-[0.15em] text-burgundy uppercase shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-turmeric hover:text-ink sm:px-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
          >
            <span className="hidden sm:inline">DUMBAAZ</span>
            <span>HANDI</span>
            <span aria-hidden="true" className="text-xs leading-none">
              &#8599;
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}
