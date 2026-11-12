import React from "react";
import Image from "next/image";
import { SIGNATURE_DISHES } from "@/data/brand";

export function SignatureMenuSection() {
  return (
    <section
      id="menu"
      aria-label="Signature DUMBAAZ Menu"
      className="relative overflow-x-clip bg-cream px-5 py-20 text-burgundy sm:px-10 sm:py-28"
    >
      {/* Subtle ghost background typography inspired by bar-topas editorial rhythm */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-12 flex select-none justify-center overflow-hidden"
      >
        <span className="whitespace-nowrap font-display text-[22vw] leading-none text-burgundy/[0.045] uppercase">
          DELICIOUS
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px]">
        {/* Section header row */}
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-saffron uppercase sm:text-xs">
              DUMBAAZ &bull; KITCHEN &amp; TANDOOR ROSTER
            </p>
            <h2 className="mt-3 font-display text-6xl leading-[0.86] tracking-[-0.01em] text-burgundy uppercase sm:text-8xl">
              MUCH
              <br />
              DELICIOUSNESS.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:justify-end">
            <p className="max-w-sm text-sm leading-relaxed font-medium text-burgundy/80 sm:text-base">
              Heavy copper handis sealed with wheat dough alongside bone-in tandoor cuts and velvety
              slow-simmered gravies made for tearing hot naan.
            </p>

            {/* Circular crimson wax-seal badge */}
            <div className="flex h-24 w-24 shrink-0 rotate-[7deg] flex-col items-center justify-center rounded-full bg-burgundy px-2 text-center text-cream shadow-lg">
              <span className="font-display text-2xl leading-none text-turmeric">100%</span>
              <span className="mt-1 text-[9px] leading-tight font-bold tracking-[0.14em] uppercase">
                LIVE CHARCOAL
              </span>
            </div>
          </div>
        </div>

        {/* Staggered editorial dish gallery */}
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {SIGNATURE_DISHES.map((dish, idx) => {
            const isHeroTile = idx === 0;
            return (
              <article
                key={dish.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1.5 ${
                  dish.tilt
                } ${
                  isHeroTile
                    ? "bg-burgundy text-cream sm:col-span-2 lg:col-span-1"
                    : "bg-cream-muted/85 text-burgundy"
                }`}
              >
                <div
                  className={`relative flex items-center justify-center overflow-hidden p-5 ${
                    dish.surface === "photo" ? "h-64 sm:h-72" : "aspect-[4/3] w-full"
                  }`}
                >
                  {dish.surface === "photo" ? (
                    <>
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/85 via-burgundy/25 to-transparent"
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-5 pb-12">
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 28vw"
                        className="object-contain p-4 drop-shadow-[0_14px_20px_rgba(43,7,14,0.18)] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Subtle category tag & price cleanly pinned */}
                  <div className="relative z-10 mt-auto flex w-full items-center justify-between self-end">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase ${
                        dish.surface === "photo"
                          ? "bg-cream/95 text-burgundy"
                          : "bg-burgundy/10 text-burgundy"
                      }`}
                    >
                      {dish.category}
                    </span>
                    <span className="rounded-full bg-turmeric px-3 py-1 font-display text-lg leading-none text-ink">
                      {dish.price}
                    </span>
                  </div>
                </div>

                <div className="px-6 pt-2 pb-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3
                      className={`font-display text-3xl leading-[0.94] uppercase sm:text-[34px] ${
                        isHeroTile ? "text-cream" : "text-burgundy"
                      }`}
                    >
                      {dish.name}
                    </h3>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        isHeroTile ? "text-turmeric/90" : "text-saffron"
                      }`}
                    >
                      {dish.hindi}
                    </span>
                  </div>
                  <p
                    className={`mt-2.5 text-sm leading-relaxed ${
                      isHeroTile ? "text-cream/85" : "text-burgundy/75"
                    }`}
                  >
                    {dish.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
