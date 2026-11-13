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
      className="overflow-x-clip bg-[#183EF5]"
    >
      {/* 1. HERO BANNER: "BIRYANI DONE THE RIGHT WAY." (Full-Bleed Matching HOB) */}
      <div className="relative flex h-[60vh] min-h-[480px] w-full items-end justify-center overflow-hidden sm:h-[75vh] sm:min-h-[580px]">
        <Image
          src="/images/community/image-2.webp"
          alt="Two cheerful chefs in blue uniforms holding a freshly packed biryani container"
          fill
          sizes="100vw"
          className="object-cover object-[center_25%]"
          priority
        />
        {/* Subtle base vignette ensuring text readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#183EF5]/90 via-black/25 to-transparent"
        />

        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-10 text-center sm:pb-14">
          <h2 className="font-display text-5xl leading-none tracking-tight text-[#FDB913] uppercase sm:text-7xl lg:text-8xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            BIRYANI DONE THE RIGHT WAY.
          </h2>
          <div className="mx-auto mt-3 h-2 w-48 rounded-full bg-[#FDB913] shadow-[0_0_16px_#FDB913] sm:w-80" />
        </div>
      </div>

      {/* 2. THREE VERTICAL STADIUM PILL CARDS (Pure Photos on Electric Blue) */}
      <div className="bg-[#183EF5] px-5 py-12 sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 md:grid-cols-3 sm:gap-8">
          {/* Card 1: image-3 (Girls sharing biryani on floor by fairy lights) */}
          <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[50px] shadow-2xl transition-transform duration-300 hover:-translate-y-2 sm:rounded-[70px]">
            <Image
              src="/images/community/image-3.webp"
              alt="Friends enjoying biryani together on the floor surrounded by fairy lights"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Card 2: image-5 (Girl savoring biryani with fork) */}
          <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[50px] shadow-2xl transition-transform duration-300 hover:-translate-y-2 sm:rounded-[70px]">
            <Image
              src="/images/community/image-5.webp"
              alt="Savoring tender basmati grains and juicy chicken piece with fork"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Card 3: image-4 (Girl enjoying late-night car biryani) */}
          <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-[50px] shadow-2xl transition-transform duration-300 hover:-translate-y-2 sm:rounded-[70px]">
            <Image
              src="/images/community/image-4.webp"
              alt="Late night drive-through biryani takeout in car"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* 3. THE HOB TRIBE (Reviews on White Cards with Electric Blue Text) */}
      <div id="tribe" className="bg-[#183EF5] px-5 py-12 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1440px] text-center">
          <h3 className="font-display text-5xl leading-none tracking-wide text-[#FDB913] uppercase sm:text-7xl lg:text-8xl">
            THE HOB TRIBE
          </h3>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 sm:mt-14 sm:gap-8">
            {COMMUNITY_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="flex flex-col items-center justify-between rounded-[28px] bg-white p-7 text-center shadow-2xl sm:p-9"
              >
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#183EF5]/20 shadow-md">
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <p className="mt-6 font-display text-lg leading-snug tracking-wide text-[#183EF5] uppercase sm:text-xl">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 border-t border-[#183EF5]/15 pt-4">
                  <p className="text-xs font-bold tracking-widest text-[#183EF5]/80 uppercase">
                    {review.name} &bull; {review.tag}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Indicator Dots */}
          <div className="mt-8 flex justify-center gap-3">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-[#FDB913] shadow-[0_0_8px_#FDB913]"
            />
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-white/40"
            />
          </div>
        </div>
      </div>

      {/* 4. BIRYANI, FOR EVERY OCCASION (Two Stadium Capsule Cards on Electric Blue) */}
      <div id="occasions" className="bg-[#183EF5] px-5 py-14 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1440px]">
          <h3 className="text-center font-display text-5xl leading-none tracking-wide text-[#FDB913] uppercase sm:text-7xl lg:text-9xl">
            BIRYANI, FOR EVERY OCCASION
          </h3>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 sm:mt-16">
            {/* Left Capsule: image-10 (Kids eating in tent) */}
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[60px] shadow-2xl sm:rounded-[90px]">
              <Image
                src="/images/community/image-10.webp"
                alt="Children sitting inside a play tent happily sharing a bowl of biryani"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Right Capsule: image-11 (Elderly couple eating at dining table) */}
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[60px] shadow-2xl sm:rounded-[90px]">
              <Image
                src="/images/community/image-11.webp"
                alt="Smiling elderly couple enjoying a home feast with steaming biryani bowls"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. FULL-WIDTH KITCHEN TEAM BANNER (Edge-to-Edge Matching Screenshot 2 & 3) */}
      <div className="relative h-[55vh] min-h-[460px] w-full overflow-hidden sm:h-[75vh] sm:min-h-[580px]">
        <Image
          src="/images/community/image-12.webp"
          alt="The cheerful kitchen crew tasting fresh biryani together with wooden spoons"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* 6. WELCOME TO HOB CURVED DOWNWARD ARCH BANNER (Matching Screenshot 4) */}
      <div
        id="welcome"
        className="relative z-10 bg-[#183EF5] px-5 pt-16 pb-20 text-center rounded-b-[50%_35px] sm:rounded-b-[50%_65px] sm:pt-24 sm:pb-28"
      >
        <div className="mx-auto max-w-4xl">
          <h3 className="font-display text-5xl leading-none tracking-wide text-[#FDB913] uppercase sm:text-7xl lg:text-9xl">
            WELCOME TO HOB
          </h3>

          <div className="mt-8 flex justify-center">
            <a
              href="#visit"
              className="inline-flex items-center justify-center rounded-full bg-[#FDB913] px-12 py-3.5 font-display text-xl tracking-wider text-[#183EF5] uppercase shadow-xl transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 sm:px-16 sm:py-4 sm:text-2xl"
            >
              ORDER NOW
            </a>
          </div>
        </div>
      </div>

      {/* 7. FULL-WIDTH FAMILY DINING FEAST TABLE (Edge-to-Edge Underneath Curved Arch) */}
      <div className="relative -mt-6 h-[55vh] min-h-[460px] w-full overflow-hidden sm:-mt-10 sm:h-[75vh] sm:min-h-[580px]">
        <Image
          src="/images/community/image-13.webp"
          alt="Multi-generational family sitting together around a large feast table filled with biryani platters"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* 8. SOLID ELECTRIC BLUE FOOTER (Matching Screenshot 5 & 6) */}
      <div className="bg-[#183EF5] px-6 pt-16 pb-12 text-white sm:px-12 sm:pt-20 sm:pb-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
            {/* Column 1: Brand & Address */}
            <div className="md:col-span-5">
              <h4 className="font-display text-4xl tracking-wide text-[#FDB913] uppercase sm:text-5xl">
                <span className="inline-block border-b-4 border-[#FDB913] pb-1">
                  HOUSE OF BIRYAN
                </span>
              </h4>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/90 sm:text-base">
                511, 5th floor, Veena Killedar Industrial Estate, KK Marg, Jacob Circle, Mumbai, MH 400011
              </p>

              <a
                href="mailto:feedback@catbocriyan.com"
                className="mt-3 block text-sm text-white/90 underline hover:text-[#FDB913] sm:text-base"
              >
                feedback@catbocriyan.com
              </a>

              <div className="mt-4 flex gap-5 text-xs text-white/80 sm:text-sm">
                <a href="#" className="underline hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="underline hover:text-white">
                  Terms of Use
                </a>
              </div>
            </div>

            {/* Column 2: Order Now */}
            <div className="md:col-span-4">
              <h4 className="font-display text-3xl tracking-wide text-[#FDB913] uppercase sm:text-4xl">
                ORDER NOW
              </h4>

              <div className="mt-4 space-y-2 text-sm font-semibold text-white/90 sm:text-base">
                <p className="font-bold text-white">Order Direct</p>
                <p className="text-sm font-normal text-white/80">(FLAT 25%)</p>
                <a href="#visit" className="block transition-colors hover:text-[#FDB913]">
                  Zomato
                </a>
                <a href="#visit" className="block transition-colors hover:text-[#FDB913]">
                  Swiggy
                </a>
              </div>
            </div>

            {/* Column 3: Follow */}
            <div className="md:col-span-3">
              <h4 className="font-display text-3xl tracking-wide text-[#FDB913] uppercase sm:text-4xl">
                FOLLOW
              </h4>

              <div className="mt-4 space-y-2 text-sm font-semibold text-white/90 sm:text-base">
                <a href="#" className="block transition-colors hover:text-[#FDB913]">
                  Facebook
                </a>
                <a href="#" className="block transition-colors hover:text-[#FDB913]">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Copyright Line */}
          <div className="mt-14 border-t border-white/20 pt-8 text-center text-xs tracking-wider text-white/70">
            &copy; 2026 Prosperous Brands Private Limited. All Rights Reserved.
          </div>
        </div>
      </div>
    </section>
  );
}
