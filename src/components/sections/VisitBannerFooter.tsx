import React from "react";
import Image from "next/image";
import { BRAND } from "@/data/brand";

export function VisitBannerFooter() {
  return (
    <footer className="overflow-x-clip">
      {/* Golden Turmeric Opening Hours Band */}
      <section
        id="hours"
        aria-label="Opening Hours"
        className="relative bg-turmeric px-5 py-16 text-burgundy sm:px-10 sm:py-24"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="text-[11px] font-bold tracking-[0.22em] text-burgundy/80 uppercase sm:text-xs">
              THE FIRES ARE LIT
            </p>
            <h2 className="mt-2 font-display text-6xl leading-[0.86] text-chilli uppercase sm:text-8xl">
              HOURS
            </h2>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-burgundy/75 uppercase">
                  TUESDAY – FRIDAY
                </p>
                <p className="mt-1 font-display text-4xl leading-none text-burgundy sm:text-5xl">
                  18:00 — 23:00
                </p>
              </div>

              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-burgundy/75 uppercase">
                  SATURDAY – SUNDAY
                </p>
                <p className="mt-1 font-display text-4xl leading-none text-burgundy sm:text-5xl">
                  12:30 — 23:30
                </p>
              </div>
            </div>

            <p className="mt-8 font-script text-4xl leading-none text-chilli sm:text-5xl">
              the taste for proper dum
            </p>
          </div>

          <div className="flex items-center justify-center md:col-span-5">
            <div className="relative flex items-center justify-center">
              <Image
                src="/images/dumbaaz-crest.png"
                alt="DUMBAAZ emblem"
                width={280}
                height={280}
                className="h-52 w-52 rotate-[4deg] object-contain drop-shadow-[0_18px_32px_rgba(43,7,14,0.2)] sm:h-68 sm:w-68"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lush Teal Location & Neighborhood Card Band */}
      <section
        id="visit"
        aria-label="Location and Reservations"
        className="relative bg-teal px-5 py-16 text-cream sm:px-10 sm:py-24"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-[11px] font-bold tracking-[0.22em] text-turmeric uppercase sm:text-xs">
              COME HUNGRY &bull; LEAVE HAPPY
            </p>
            <h2 className="mt-2 font-display text-5xl leading-[0.88] text-cream uppercase sm:text-7xl">
              DUMBAAZ
              <br />
              HANDI HOUSE
            </h2>

            <div className="mt-7 space-y-2 text-sm leading-relaxed text-cream/90 sm:text-base">
              <p className="font-bold text-cream">{BRAND.location.addressLine1}</p>
              <p>{BRAND.location.city}</p>
              <p className="pt-2 font-semibold text-turmeric">{BRAND.location.phone}</p>
              <p className="text-cream/85">{BRAND.location.email}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${BRAND.location.email}?subject=DUMBAAZ%20Table%20Inquiry`}
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-xs font-bold tracking-[0.16em] text-burgundy uppercase transition-colors hover:bg-turmeric hover:text-ink"
              >
                RESERVE A TABLE &#8599;
              </a>
              <a
                href="#hero"
                className="inline-flex items-center gap-2 rounded-full border border-cream/40 px-5 py-3 text-xs font-bold tracking-[0.16em] text-cream uppercase transition-colors hover:border-turmeric hover:text-turmeric"
              >
                BACK TO TOP &#8593;
              </a>
            </div>
          </div>

          {/* Stylized minimalist street pin card matching bar-topas teal footer map */}
          <div className="md:col-span-7">
            <div className="relative overflow-hidden rounded-3xl bg-cream p-6 text-burgundy shadow-2xl sm:p-8">
              <div className="relative flex h-64 flex-col justify-between overflow-hidden rounded-2xl bg-[#EAE2CE] p-5 sm:h-72">
                {/* Stylized SVG district street grid */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 600 300"
                  preserveAspectRatio="xMidYMid slice"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  <path
                    d="M-20 75 L620 115 M-20 210 L620 165 M130 -10 L185 320 M390 -10 L355 320"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    fill="none"
                  />
                  <path
                    d="M250 -10 L290 320"
                    stroke="#F8B612"
                    strokeOpacity="0.45"
                    strokeWidth="8"
                    fill="none"
                  />
                </svg>

                <div className="relative z-10 flex items-center justify-between text-[10px] font-bold tracking-[0.18em] text-burgundy/75 uppercase">
                  <span>BRASS MARKET QUARTER</span>
                  <span>DOORS OPEN 18:00</span>
                </div>

                {/* Central DUMBAAZ pin pill */}
                <div className="relative z-10 m-auto inline-flex items-center gap-2.5 rounded-full bg-burgundy px-5 py-2.5 text-cream shadow-lg">
                  <span className="h-2.5 w-2.5 rounded-full bg-turmeric" />
                  <span className="font-display text-xl tracking-[0.06em] uppercase">
                    DUMBAAZ FLAGSHIP
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-burgundy">
                  <span>42 Saffron Alley</span>
                  <span className="text-saffron uppercase">Copper Handi Courtyard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Oversized Crimson Poster Footer */}
      <section
        aria-label="Brand Poster Footer"
        className="bg-burgundy px-5 pt-16 pb-8 text-cream sm:px-10 sm:pt-20"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/25 pb-6 text-xs font-bold tracking-[0.16em] uppercase">
            <span>{BRAND.tagline}</span>
            <div className="flex flex-wrap gap-6 text-cream/85">
              <a href="#dum-craft" className="hover:text-turmeric">
                THE CRAFT
              </a>
              <a href="#assembly" className="hover:text-turmeric">
                3D HANDI
              </a>
              <a href="#menu" className="hover:text-turmeric">
                MENU
              </a>
              <a href="#story" className="hover:text-turmeric">
                STORY
              </a>
            </div>
          </div>

          <p
            aria-label="DUMBAAZ"
            className="mt-8 text-center font-display text-[19vw] leading-[0.8] tracking-[-0.02em] text-cream uppercase select-none"
          >
            &iexcl;DUMBAAZ!
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.14em] text-cream/70 uppercase">
            <span>&copy; 2026 DUMBAAZ CHARCOAL DUM HOUSE</span>
            <span>{BRAND.location.addressLine1}</span>
          </div>
        </div>
      </section>
    </footer>
  );
}

export { VisitBannerFooter as PhaseCheckpointFooter };
