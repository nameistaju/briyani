import React from "react";
import Image from "next/image";
import { IndianHandiHouseSection } from "./IndianHandiHouseSection";

const FLAVOR_CALLOUTS = [
  "AGED BASMATI",
  "KASHMIRI SAFFRON",
  "CRISP BIRISTA",
  "RAW A2 GHEE",
  "WILD MACE",
  "FRESH PUDINA",
];


export function KitchenStorySection() {
  return (
    <>
      {/* Vibrant Crimson Spice Callout Band */}
      <section
        id="philosophy"
        aria-label="Slow Dum Cooking Philosophy"
        className="relative overflow-x-clip bg-burgundy px-5 py-16 text-cream sm:px-10 sm:py-20"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold tracking-[0.22em] text-turmeric uppercase sm:text-xs">
                SIXTEEN WHOLE SPICES &bull; ONE SEALED HANDI
              </p>
              <h2 className="mt-2 font-display text-5xl leading-[0.88] text-cream uppercase sm:text-7xl">
                DOUGH-SEALED,
                <br />
                NEVER RUSHED.
              </h2>
            </div>

            <a
              href="#assembly"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-turmeric px-6 py-3 text-xs font-bold tracking-[0.16em] text-ink uppercase transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cream"
            >
              <span>REPLAY 3D DUM ASSEMBLY</span>
              <span aria-hidden="true">&#8593;</span>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
            {FLAVOR_CALLOUTS.map((label, idx) => (
              <span
                key={label}
                className={`rounded-xl px-4 py-2 font-display text-2xl tracking-[0.03em] uppercase shadow-sm sm:text-4xl ${
                  idx % 3 === 0
                    ? "rotate-[-1.5deg] bg-cream text-burgundy"
                    : idx % 3 === 1
                      ? "rotate-[1.5deg] bg-chilli text-cream"
                      : "rotate-[-1deg] bg-turmeric text-ink"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sunburst Heritage Interlude with Rotating Food Zoom Explosion */}
      <IndianHandiHouseSection />

      {/* Editorial Kitchen & Table Collage */}
      <section
        id="story"
        aria-label="In the Kitchen & At the Table"
        className="overflow-x-clip bg-cream px-5 pt-6 pb-20 text-burgundy sm:px-10 sm:pb-28"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.22em] text-saffron uppercase sm:text-xs">
              THE DUMBAAZ WAY
            </p>
            <h2 className="mt-2 font-script text-5xl leading-[0.95] text-burgundy sm:text-7xl">
              a little of everything, a whole lot of soul
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-8">
            {/* Card 1: Chef Unveils Steaming Biryani Cauldron */}
            <figure className="relative overflow-hidden rounded-3xl shadow-xl transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] md:-rotate-[2deg]">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src="/images/Chef Unveils Steaming Biryani Cauldron.webp"
                  alt="DUMBAAZ master chef unveiling steaming biryani cauldron in the kitchen"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="bg-burgundy px-5 py-3 text-xs font-bold tracking-[0.14em] text-cream uppercase">
                01 &middot; Whole-spice dum cooking &amp; small-batch craftsmanship
              </figcaption>
            </figure>

            {/* Card 2: Joyful Friends Sharing a Feast */}
            <figure className="relative overflow-hidden rounded-3xl shadow-xl transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] md:translate-y-6 md:rotate-[1.8deg]">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src="/images/Joyful Friends Sharing a Feast.webp"
                  alt="Joyful friends gathering around steaming biryani feast at DUMBAAZ"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="bg-teal px-5 py-3 text-xs font-bold tracking-[0.14em] text-cream uppercase">
                02 &middot; Unsealed tableside for shared plates &amp; late evenings
              </figcaption>
            </figure>

            {/* Card 3: Steaming Copper Bowl Biryani */}
            <figure className="relative overflow-hidden rounded-3xl shadow-xl transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] md:-rotate-[1.5deg]">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src="/images/Steaming Copper Bowl Biryani.webp"
                  alt="Steaming copper bowl of DUMBAAZ signature dum biryani"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="bg-[#B47A50] px-5 py-3 text-xs font-bold tracking-[0.14em] text-cream uppercase">
                03 &middot; Charcoal-sealed copper handi rested on dying embers
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
