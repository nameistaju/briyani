import React from "react";
import Image from "next/image";

interface CommunityReview {
  id: string;
  avatar: string;
  name: string;
  tag: string;
  quote: string;
}

const COMMUNITY_REVIEWS: CommunityReview[] = [
  {
    id: "review-1",
    avatar: "/images/community/image-7.webp",
    name: "RAHUL M.",
    tag: "VERIFIED DINE-IN",
    quote:
      "THE FLAVOR PROFILE IS OUT OF THIS WORLD. THE SMOKY CHARCOAL FINISH AND SEED-TO-GRAIN AROMA MAKES THIS THE BEST DUM BIRYANI IN TOWN.",
  },
  {
    id: "review-2",
    avatar: "/images/community/image-8.webp",
    name: "PRIYA S.",
    tag: "WEEKEND REGULAR",
    quote:
      "THE TEXTURE AND MOISTNESS OF THE MEAT IS UNMATCHED. YOU CAN TASTE THE DUM-SEALED STEAM IN EVERY SINGLE BITE.",
  },
  {
    id: "review-3",
    avatar: "/images/community/image-9.webp",
    name: "ANANYA K.",
    tag: "HANDI CONNOISSEUR",
    quote:
      "FINALLY, A DUM BIRYANI THAT DOESN'T COMPROMISE ON HERITAGE. THE RICE GRAINS ARE SEPARATE, FLUFFY, AND DEEPLY FLAVORFUL.",
  },
];

export function BiryaniCultureSection() {
  return (
    <section
      id="community"
      aria-label="Biryani Culture and Community"
      className="overflow-x-clip"
    >
      {/* 1. HERO BANNER: "BIRYANI DONE THE RIGHT WAY." */}
      <div className="relative flex min-h-[580px] w-full items-end justify-center overflow-hidden bg-burgundy-deep px-5 py-24 text-center sm:min-h-[720px] sm:py-32">
        <Image
          src="/images/community/image-2.webp"
          alt="DUMBAAZ chefs in the kitchen tasting freshly prepared handi biryani"
          fill
          sizes="100vw"
          className="object-cover object-[center_22%]"
        />
        {/* Soft bottom vignette preserving the chefs while giving strong text contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/95 via-black/35 to-black/10"
        />

        <div className="relative z-10 mx-auto max-w-4xl pb-4">
          <p className="text-xs font-bold tracking-[0.28em] text-cream uppercase sm:text-sm drop-shadow-md">
            OUR SACRED STANDARD
          </p>
          <h2 className="mt-3 font-display text-5xl leading-[0.88] tracking-[0.01em] text-turmeric uppercase sm:text-7xl lg:text-8xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)]">
            BIRYANI DONE
            <br />
            THE RIGHT WAY.
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-48 rounded-full bg-turmeric shadow-[0_0_16px_#F8B612] sm:w-72" />
        </div>
      </div>

      {/* 2. THREE PILL CARDS: ANYWHERE, ANYTIME (image-3, image-5, image-4) */}
      <div className="bg-burgundy px-5 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 text-center">
            <p className="text-[11px] font-bold tracking-[0.24em] text-turmeric uppercase sm:text-xs">
              LATE NIGHTS &bull; BALCONIES &bull; ON THE GO
            </p>
            <h3 className="mt-2 font-display text-4xl text-cream uppercase sm:text-6xl">
              ANYWHERE. ANYTIME.
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {/* Card 1: image-3 (Girls sharing biryani on floor by fairy lights) */}
            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[32px] bg-burgundy-deep shadow-2xl transition-transform duration-300 hover:-translate-y-1.5">
              <Image
                src="/images/community/image-3.webp"
                alt="Friends enjoying biryani together on the floor surrounded by warm fairy lights"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/70 via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <span className="rounded-full bg-cream/90 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-burgundy uppercase">
                  HOME COMFORT
                </span>
              </div>
            </div>

            {/* Card 2: image-5 (Girl savoring biryani with fork) */}
            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[32px] bg-burgundy-deep shadow-2xl transition-transform duration-300 hover:-translate-y-1.5 md:-translate-y-4">
              <Image
                src="/images/community/image-5.webp"
                alt="Savoring tender basmati grains and juicy chicken piece with fork"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/70 via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <span className="rounded-full bg-turmeric px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
                  FIRST BITE BLISS
                </span>
              </div>
            </div>

            {/* Card 3: image-4 (Girl enjoying late-night car biryani) */}
            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[32px] bg-burgundy-deep shadow-2xl transition-transform duration-300 hover:-translate-y-1.5">
              <Image
                src="/images/community/image-4.webp"
                alt="Late night drive-through biryani takeout in car"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/70 via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <span className="rounded-full bg-cream/90 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-burgundy uppercase">
                  MIDNIGHT CRAVING
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SPLIT SECTION: "BIRYANI, ON POINT." (image-6 on cream) */}
      <div id="on-point" className="bg-cream px-5 py-20 text-burgundy sm:px-10 sm:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Feast overhead image-6 */}
          <div className="relative aspect-square w-full overflow-hidden rounded-[36px] shadow-2xl lg:col-span-7">
            <Image
              src="/images/community/image-6.webp"
              alt="Complete overhead DUMBAAZ feast with chicken dum biryani, kebabs, gulab jamun, chutney, and spicy raita"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>

          {/* Right Column: Bold Typography */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <p className="text-xs font-bold tracking-[0.24em] text-saffron uppercase sm:text-sm">
              THE COMPLETE SPREAD
            </p>
            <h3 className="mt-3 font-display text-6xl leading-[0.88] tracking-[-0.01em] text-[#C48400] uppercase sm:text-7xl lg:text-[84px]">
              BIRYANI,
              <br />
              ON POINT.
            </h3>
            <p className="mt-6 text-base leading-relaxed font-semibold text-burgundy/85 sm:text-lg">
              Long aged basmati grains parboiled with whole cardamom and clove, layered over rich
              charcoal-roasted chicken, finished with golden birista, and served alongside cold whipped
              raita and warm gulab jamuns.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="#menu"
                className="inline-flex items-center gap-2 rounded-full bg-burgundy px-7 py-3.5 text-xs font-bold tracking-[0.18em] text-cream uppercase transition-colors hover:bg-turmeric hover:text-ink"
              >
                EXPLORE MENU &#8599;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THE DUMBAAZ TRIBE (Community Reviews: image-7, image-8, image-9) */}
      <div id="tribe" className="bg-burgundy px-5 py-20 text-cream sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.24em] text-turmeric uppercase sm:text-xs">
              FROM THE HEARTH TO YOUR WORDS
            </p>
            <h3 className="mt-2 font-display text-5xl leading-none text-cream uppercase sm:text-7xl">
              THE DUMBAAZ TRIBE
            </h3>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
            {COMMUNITY_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="flex flex-col justify-between rounded-3xl bg-cream p-7 text-burgundy shadow-2xl sm:p-9"
              >
                <div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-turmeric shadow-md">
                      <Image
                        src={review.avatar}
                        alt={review.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-display text-xl leading-none text-burgundy">
                        {review.name}
                      </p>
                      <span className="text-[10px] font-bold tracking-[0.16em] text-saffron uppercase">
                        {review.tag}
                      </span>
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-relaxed font-bold tracking-[0.02em] text-burgundy/90 uppercase sm:text-base">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1 text-turmeric">
                  {[...Array(5)].map((_, starIdx) => (
                    <span key={starIdx} aria-hidden="true" className="text-lg">
                      &#9733;
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Indicator Dots */}
          <div className="mt-10 flex justify-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-turmeric shadow-[0_0_8px_#F8B612]"
            />
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-cream/35"
            />
          </div>
        </div>
      </div>

      {/* 5. BIRYANI, FOR EVERY OCCASION (image-10, image-11) */}
      <div id="occasions" className="bg-cream px-5 py-20 text-burgundy sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="text-center">
            <p className="text-[11px] font-bold tracking-[0.24em] text-saffron uppercase sm:text-xs">
              FROM FLOOR DAWAT TO GRAND DINING ROOMS
            </p>
            <h3 className="mt-2 font-display text-5xl leading-[0.88] text-[#C48400] uppercase sm:text-7xl lg:text-8xl">
              BIRYANI, FOR EVERY
              <br />
              OCCASION
            </h3>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {/* Left Pill: image-10 (Family on floor enjoying biryani) */}
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[36px] bg-burgundy-deep shadow-2xl">
              <Image
                src="/images/community/image-10.webp"
                alt="Family sitting together on the carpet sharing an authentic floor dawat"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/80 via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 text-cream">
                <span className="rounded-full bg-turmeric px-3.5 py-1 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                  TRADITIONAL DAWAT
                </span>
                <p className="mt-3 font-display text-3xl uppercase text-cream">
                  GROUNDED IN CELEBRATION
                </p>
              </div>
            </div>

            {/* Right Pill: image-11 (Family at dining table with biryani platters) */}
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[36px] bg-burgundy-deep shadow-2xl">
              <Image
                src="/images/community/image-11.webp"
                alt="Family gathered at a dining table serving hot chicken biryani onto plates"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/80 via-transparent to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 text-cream">
                <span className="rounded-full bg-cream px-3.5 py-1 text-xs font-bold tracking-[0.16em] text-burgundy uppercase">
                  SUNDAY FEASTS
                </span>
                <p className="mt-3 font-display text-3xl uppercase text-cream">
                  SERVED HOT AT THE TABLE
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. FULL-WIDTH KITCHEN TEAM BANNER (image-12) */}
      <div className="relative flex min-h-[50vh] w-full items-center justify-center overflow-hidden bg-burgundy-deep sm:min-h-[65vh]">
        <Image
          src="/images/community/image-12.webp"
          alt="The cheerful DUMBAAZ kitchen crew eating and tasting biryani together in hairnets and blue shirts"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/75 via-transparent to-burgundy-deep/50"
        />
        <div className="relative z-10 px-5 text-center text-cream">
          <span className="rounded-full border border-cream/40 bg-burgundy-deep/75 px-5 py-2 text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-sm">
            THE PASSION BEHIND EVERY GRAIN
          </span>
        </div>
      </div>

      {/* 7. WELCOME TO DUMBAAZ + FAMILY GRAND FEAST BANNER (image-13) */}
      <div id="welcome" className="bg-burgundy px-5 pt-16 pb-20 text-cream sm:px-10 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col items-center text-center">
            <h3 className="font-display text-5xl leading-none text-turmeric uppercase sm:text-7xl lg:text-8xl">
              WELCOME TO DUMBAAZ
            </h3>

            {/* Arched pill button matching reference */}
            <a
              href="#visit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-turmeric px-8 py-3.5 text-xs font-bold tracking-[0.2em] text-ink uppercase shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cream"
            >
              <span>JOIN THE TABLE</span>
              <span aria-hidden="true">&#8599;</span>
            </a>
          </div>

          {/* Grand Dining Feast Table (image-13) */}
          <div className="relative mt-12 aspect-[16/9] w-full overflow-hidden rounded-[36px] bg-burgundy-deep shadow-2xl sm:mt-16">
            <Image
              src="/images/community/image-13.webp"
              alt="Large multi-generational family celebrating around a festive dining table spread with steaming biryani platters"
              fill
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/60 via-transparent to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
