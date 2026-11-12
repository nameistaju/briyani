import React from "react";
import Image from "next/image";
import { BRAND } from "@/data/brand";

const FLAVOR_CALLOUTS = [
  "AGED BASMATI",
  "KASHMIRI SAFFRON",
  "CRISP BIRISTA",
  "RAW A2 GHEE",
  "WILD MACE",
  "FRESH PUDINA",
];

// Deterministic radial sunburst spokes inspired by gourouindianfood.fr without third-party text
const SUNBURST_RAYS = Array.from({ length: 36 }, (_, idx) => idx * 10);

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

      {/* Sunburst Heritage Interlude (inspired by Screenshot 6 gourouindianfood.fr) */}
      <section
        aria-label="DUMBAAZ Indian Handi House Emblem"
        className="relative overflow-hidden bg-cream px-5 py-20 text-center text-burgundy sm:px-10 sm:py-28"
      >
        {/* Pure geometric conic sunburst spokes behind center lockup */}
        <svg
          aria-hidden="true"
          viewBox="-200 -200 400 400"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
        >
          {SUNBURST_RAYS.map((angle) => (
            <polygon
              key={angle}
              points="0,0 -10,-280 10,-280"
              fill="#FFFFFF"
              transform={`rotate(${angle})`}
            />
          ))}
        </svg>

        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
          <Image
            src="/images/dumbaaz-crest.png"
            alt="DUMBAAZ lifting handi lid crest"
            width={160}
            height={160}
            className="h-28 w-28 object-contain drop-shadow-[0_10px_20px_rgba(43,7,14,0.16)] sm:h-36 sm:w-36"
          />

          <h2 className="mt-5 font-display text-5xl leading-[0.88] tracking-[0.01em] text-chilli uppercase sm:text-7xl">
            INDIAN HANDI
            <br />
            HOUSE
          </h2>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#hours"
              className="border border-chilli bg-cream/90 px-6 py-2.5 text-xs font-bold tracking-[0.18em] text-chilli uppercase transition-colors hover:bg-chilli hover:text-cream"
            >
              BOOK A TABLE
            </a>
            <a
              href="#menu"
              className="border border-chilli bg-cream/90 px-6 py-2.5 text-xs font-bold tracking-[0.18em] text-chilli uppercase transition-colors hover:bg-chilli hover:text-cream"
            >
              SEE THE PLATES
            </a>
          </div>

          <p className="mt-7 text-xs leading-relaxed font-semibold text-burgundy/80 sm:text-sm">
            <span className="font-bold text-chilli">Address:</span> {BRAND.location.addressLine1} &middot;{" "}
            {BRAND.location.city}
            <br />
            <span className="font-bold text-chilli">Hours:</span> {BRAND.location.hoursDinner} &middot;{" "}
            {BRAND.location.hoursWeekend}
          </p>
        </div>
      </section>

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

          <div className="mt-12 grid grid-cols-1 items-center gap-6 md:grid-cols-12 md:gap-8">
            <figure className="relative overflow-hidden rounded-3xl shadow-xl md:col-span-5 md:-rotate-[2deg]">
              <div className="relative h-72 w-full sm:h-96">
                <Image
                  src="/images/chef-tasting.webp"
                  alt="Chefs tasting herbs and warm handi spice stock in the DUMBAAZ kitchen"
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="bg-burgundy px-5 py-3 text-xs font-bold tracking-[0.14em] text-cream uppercase">
                01 &middot; Whole-spice tempering &amp; small-batch tasting before dinner service
              </figcaption>
            </figure>

            <figure className="relative overflow-hidden rounded-3xl shadow-xl md:col-span-4 md:translate-y-6 md:rotate-[1.8deg]">
              <div className="relative h-72 w-full sm:h-88">
                <Image
                  src="/images/dining-table.webp"
                  alt="Friends gathering around steaming brass platters and saffron rice at DUMBAAZ"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="bg-teal px-5 py-3 text-xs font-bold tracking-[0.14em] text-cream uppercase">
                02 &middot; Unsealed tableside for shared plates &amp; late evenings
              </figcaption>
            </figure>

            <figure className="relative overflow-hidden rounded-3xl bg-cream-muted p-6 text-center shadow-xl md:col-span-3 md:-rotate-[1.5deg]">
              <div className="relative mx-auto h-52 w-52 sm:h-60 sm:w-60">
                <Image
                  src="/3d-assets/previews/steaming-biryani-handi-hero.png"
                  alt="DUMBAAZ signature copper dum biryani handi"
                  fill
                  sizes="240px"
                  className="object-contain drop-shadow-[0_14px_20px_rgba(43,7,14,0.2)]"
                />
              </div>
              <figcaption className="mt-3 font-display text-2xl leading-none text-burgundy uppercase">
                CHARCOAL SEALED
              </figcaption>
              <p className="mt-1.5 text-xs font-medium text-burgundy/75">
                Every pot rests 35 minutes on dying embers so steam finishes the grains naturally.
              </p>
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
