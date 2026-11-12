"use client";

import React, { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const DEFINITION_PARAGRAPH = [
  "A", "small", "place", "where", "you", "come", "“just", "for", "a", "quick", "plate,”",
  "before", "ordering", "a", "handi,", "then", "a", "second,", "then", "something", "to",
  "share,", "and", "finally", "staying", "much", "longer", "than", "planned.", "A", "place",
  "known", "for", "causing", "a", "sudden", "increase", "in", "appetite,", "“Come", "on,", "one",
  "more”", "and", "evenings", "that", "rarely", "end", "on", "time."
];

export function EditorialIntroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion || !textRef.current) return;

    const words = textRef.current.querySelectorAll<HTMLSpanElement>(".split-word");
    if (!words.length) return;

    const ctx = gsap.context(() => {
      // Progressive scroll-darkening reveal: words scrub from opacity 0.12 to 1.0
      gsap.fromTo(
        words,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 76%",
            end: "bottom 44%",
            scrub: 0.35,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={containerRef}
      id="dum-craft"
      className="relative overflow-hidden bg-cream px-5 pt-24 pb-28 text-burgundy sm:px-10 sm:pt-32 sm:pb-40"
    >
      <div className="relative mx-auto max-w-4xl">
        {/* Top-left peeking photograph matching bar-topas */}
        <figure
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -left-2 z-0 h-48 w-40 -rotate-[7deg] overflow-hidden rounded-[20px] shadow-[rgba(96,21,13,0.45)_0px_24px_50px_-20px] sm:-top-14 sm:-left-12 sm:h-64 sm:w-52 md:h-72 md:w-60"
        >
          <Image
            src="/images/asset-012.webp"
            alt="Authentic handmade delicacy"
            fill
            sizes="(max-width: 640px) 160px, 240px"
            className="object-cover"
          />
        </figure>

        {/* Bottom-right peeking photograph matching bar-topas */}
        <figure
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -bottom-10 z-0 h-44 w-52 rotate-[5deg] overflow-hidden rounded-[20px] shadow-[rgba(96,21,13,0.45)_0px_24px_50px_-20px] sm:-right-10 sm:-bottom-12 sm:h-56 sm:w-72 md:h-64 md:w-80"
        >
          <Image
            src="/images/asset-013.webp"
            alt="Charcoal-smoked skewers and sides"
            fill
            sizes="(max-width: 640px) 208px, 320px"
            className="object-cover"
          />
        </figure>

        {/* Exact postage-stamp perforated golden card matching bar-topas.ch */}
        <article
          ref={cardRef}
          className="stamp-card relative z-10 mx-auto -rotate-[2deg] md:-rotate-[3.5deg]"
        >
          <header className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b-2 border-burgundy/80 pb-4">
            <h2 className="font-display text-6xl leading-[0.85] tracking-[-0.01em] text-burgundy uppercase sm:text-8xl">
              DUMBAAZ
            </h2>

            <p className="text-xs font-bold tracking-[0.16em] text-burgundy uppercase sm:text-sm">
              <span className="font-bold">[D&#652;M-BAAZ]</span> MASCULINE NOUN &bull;{" "}
              <em className="text-saffron italic">ALMOST A RITUAL</em>
            </p>
          </header>

          {/* Progressive scroll-darkening paragraph */}
          <p
            ref={textRef}
            aria-label={DEFINITION_PARAGRAPH.join(" ")}
            className="mt-7 text-xl leading-[1.32] font-medium text-burgundy sm:text-[28px] sm:leading-[1.36]"
          >
            {DEFINITION_PARAGRAPH.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="split-word inline-block mr-[0.25em]"
                style={{ opacity: reducedMotion ? 1 : 0.12 }}
              >
                {word}
              </span>
            ))}
          </p>

          <p className="mt-6 text-sm font-semibold text-burgundy sm:text-base">
            <strong className="font-bold">Synonyms:</strong>{" "}
            <mark className="bg-transparent font-bold text-saffron">delicious trap</mark>
            {" "}Hey guys, sudden hunger pangs!
          </p>

          {/* Red hand-lettered brush script signature matching bar-topas */}
          <div className="ml-auto mt-6 -mb-4 w-[min(70%,320px)] -rotate-6 select-none pointer-events-none">
            <Image
              src="/images/asset-014.webp"
              alt="Una más y nos vamos"
              width={1800}
              height={815}
              className="h-auto w-full drop-shadow-sm"
            />
          </div>
        </article>
      </div>
    </section>
  );
}
