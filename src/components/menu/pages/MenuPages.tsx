import React from "react";
import Image from "next/image";
import { MENU_BOOK_DATA } from "@/data/menuBook";
import { BRAND } from "@/data/brand";

// Common page frame wrapper providing authentic paper texture, fine border rules, and folio headers
function PageFrame({
  children,
  pageNumber,
  side = "right",
  className = "",
}: {
  children: React.ReactNode;
  pageNumber?: string;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#F5EBDD] p-6 text-[#33231D] sm:p-9 lg:p-10 select-none ${
        side === "left"
          ? "border-r border-[#33231D]/15 shadow-[inset_-18px_0_30px_rgba(51,35,29,0.06)]"
          : "border-l border-[#33231D]/15 shadow-[inset_18px_0_30px_rgba(51,35,29,0.06)]"
      } ${className}`}
    >
      {/* Subtle paper grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#762D35_0.5px,transparent_0.5px)] opacity-[0.035] [background-size:12px_12px]"
      />

      {/* Editorial Folio Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#762D35]/20 pb-3 text-[10px] font-bold tracking-[0.2em] text-[#762D35] uppercase sm:text-[11px]">
        {side === "left" ? (
          <>
            <span>{pageNumber || "DUMBAAZ"}</span>
            <span className="text-[#762D35]/60">THE RITUAL OF SLOW DUM</span>
          </>
        ) : (
          <>
            <span className="text-[#762D35]/60">ESTD. 2026 &bull; DUMBAAZ</span>
            <span>{pageNumber || "COLLECTION"}</span>
          </>
        )}
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col justify-between py-4 sm:py-5">
        {children}
      </div>

      {/* Subtle Folio Footer */}
      <footer className="relative z-10 flex items-center justify-between border-t border-[#762D35]/15 pt-2.5 text-[9px] font-semibold tracking-[0.16em] text-[#33231D]/60 uppercase">
        <span>AUTHENTIC COPPER HANDI</span>
        <span>A2 COW GHEE &bull; SAFFRON</span>
      </footer>
    </div>
  );
}

// 1. FRONT COVER (Outside)
export function FrontCoverPage() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-[#762D35] p-8 text-center text-[#F5EBDD] sm:p-12 shadow-2xl select-none">
      {/* Realistic leatherette grain texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(#F5EBDD_0.8px,transparent_0.8px)] [background-size:8px_8px]"
      />

      {/* Embossed Double Gold Rule */}
      <div className="pointer-events-none absolute inset-4 border border-[#B47A50]/40 sm:inset-6">
        <div className="absolute inset-1 border border-[#B47A50]/20" />
      </div>

      {/* Cover Header */}
      <div className="relative z-10 pt-4 sm:pt-6">
        <span className="font-display text-xs tracking-[0.32em] text-[#B47A50] uppercase sm:text-sm">
          CULINARY ARCHIVE &bull; VOL. I
        </span>
        <div className="mx-auto mt-2 h-0.5 w-16 bg-[#B47A50]/60" />
      </div>

      {/* Center Crest & Hero Wordmark */}
      <div className="relative z-10 my-auto flex flex-col items-center">
        <div className="relative h-28 w-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] sm:h-36 sm:w-36">
          <Image
            src="/images/dumbaaz-crest.png"
            alt="DUMBAAZ gold embossed emblem"
            fill
            sizes="160px"
            className="object-contain"
            priority
          />
        </div>

        <h1 className="mt-6 font-display text-5xl tracking-[0.04em] text-[#F5EBDD] uppercase sm:text-7xl lg:text-8xl">
          DUMBAAZ
        </h1>

        <p className="mt-3 font-serif text-base tracking-[0.18em] text-[#B47A50] uppercase italic sm:text-xl">
          Slow-Fired Charcoal Dum Biryani
        </p>

        <div className="mt-8 flex items-center gap-3 text-[10px] font-bold tracking-[0.24em] text-[#F5EBDD]/70 uppercase sm:text-xs">
          <span>THE MENU</span>
          <span>&bull;</span>
          <span>AUTUMN / WINTER 2026</span>
        </div>
      </div>

      {/* Cover Footer Note */}
      <div className="relative z-10 pb-4 text-[10px] tracking-[0.2em] text-[#B47A50]/80 uppercase sm:text-xs">
        DOUGH-SEALED IN HAMMERED COPPER &bull; NEVER RUSHED
      </div>
    </div>
  );
}

// 2. INSIDE FRONT COVER (The Story of Dum)
export function InsideFrontCoverPage() {
  return (
    <PageFrame pageNumber="01" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            FOREWORD &bull; THE HEARTH
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            THE RITUAL OF
            <br />
            PROPER DUM.
          </h2>
          <p className="mt-4 font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            At DUMBAAZ, biryani is neither cooked in batches nor rushed in pressure cookers. Each copper pot is lined with aged, long-grain basmati, marinated country cuts, sweet caramelized onions, and cold-churned A2 cow ghee.
          </p>
          <p className="mt-3 font-serif text-sm leading-relaxed text-[#33231D]/80 sm:text-base">
            The handi is crimped by hand with pliable whole-wheat dough. Placed over glowing charcoal with dying embers laid atop its lid, the ingredients steam in their own sacred vapour for thirty-five minutes.
          </p>
        </div>

        <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#762D35]/20 shadow-md">
          <Image
            src="/images/chef-tasting.webp"
            alt="Chefs inspecting copper handi"
            fill
            sizes="400px"
            className="object-cover"
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#762D35]/15 pt-3">
          <span className="font-script text-2xl text-[#762D35]">Taju &amp; Team Dumbaaz</span>
          <span className="text-[10px] font-bold tracking-widest text-[#762D35]/80 uppercase">
            MASTER KHANSAMA
          </span>
        </div>
      </div>
    </PageFrame>
  );
}

// 3. CHAPTER INDEX & PHILOSOPHY
export function PhilosophyIndexPage() {
  const chapters = [
    { num: "I", name: "SHAHI STARTERS", page: "03" },
    { num: "II", name: "CHICKEN DUM BIRYANI", page: "05" },
    { num: "III", name: "MUTTON DUM BIRYANI", page: "07" },
    { num: "IV", name: "GRAND HANDIS & VEGETARIAN", page: "09" },
    { num: "V", name: "TANDOOR & CHARCOAL GRILLS", page: "11" },
    { num: "VI", name: "SLOW CURRIES & TANDOORI BREADS", page: "13" },
    { num: "VII", name: "ROYAL SWEETS & REFRESHMENTS", page: "15" },
  ];

  return (
    <PageFrame pageNumber="02" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            TABLE OF CONTENTS
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            THE CHAPTERS.
          </h2>
          <div className="mt-4 space-y-2.5">
            {chapters.map((ch) => (
              <div
                key={ch.num}
                className="flex items-baseline justify-between border-b border-[#33231D]/10 pb-1.5 text-xs font-semibold sm:text-sm"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[#762D35]">{ch.num}.</span>
                  <span className="tracking-wide text-[#33231D] uppercase">{ch.name}</span>
                </div>
                <span className="font-display text-[#762D35]">{ch.page}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spice Box Callout */}
        <div className="mt-5 rounded-xl border border-[#B47A50]/30 bg-[#F5EBDD]/60 p-4 shadow-sm">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#B47A50] uppercase">
            OUR SACRED SPICE VAULT
          </span>
          <p className="mt-1 text-xs leading-relaxed text-[#33231D]/80">
            Kashmiri Saffron &bull; Green Cardamom &bull; Wild Mace &bull; Star Anise &bull; Black Stone Flower &bull; Shah Jeera &bull; Ceylon Cinnamon.
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

// 4. STARTERS FEATURE (Left page)
export function StartersFeaturePage() {
  const data = MENU_BOOK_DATA.starters;
  const dish = data.featuredDish;

  return (
    <PageFrame pageNumber="03" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; FEATURE
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {dish.name}
          </h2>
          <span className="mt-1 block font-display text-xl text-[#B47A50] sm:text-2xl">
            {dish.formattedPrice}
          </span>
        </div>

        <div className="relative my-3 aspect-square w-full max-w-[320px] mx-auto overflow-hidden">
          {dish.image && (
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              sizes="320px"
              className="object-contain drop-shadow-[0_16px_28px_rgba(51,35,29,0.35)]"
            />
          )}
        </div>

        <div>
          <p className="font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            {dish.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold tracking-wider text-[#762D35] uppercase">
            <span className="rounded bg-[#762D35]/10 px-2 py-0.5">{dish.serving}</span>
            <span className="rounded bg-[#B47A50]/15 px-2 py-0.5 text-[#33231D]">
              {dish.pairing}
            </span>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

// 5. STARTERS LISTINGS (Right page)
export function StartersListPage() {
  const data = MENU_BOOK_DATA.starters;

  return (
    <PageFrame pageNumber="04" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.title}
          </span>
          <p className="mt-1 font-serif text-xs italic text-[#33231D]/75">
            {data.subtitle}
          </p>
          <div className="mt-4 space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      aria-label={item.isVegetarian ? "Vegetarian" : "Non-Vegetarian"}
                      className={`inline-block h-2 w-2 rounded-full ${
                        item.isVegetarian ? "bg-emerald-600" : "bg-[#762D35]"
                      }`}
                    />
                    <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                      {item.name}
                    </h3>
                  </div>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80 sm:text-[13px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded border border-dashed border-[#762D35]/30 p-2.5 text-center text-[10px] font-semibold text-[#762D35] uppercase">
          Fresh Chutneys &amp; Laccha Onion served complimentary with all grills.
        </div>
      </div>
    </PageFrame>
  );
}

// 6. CHICKEN BIRYANI FEATURE (Left page)
export function ChickenBiryaniFeaturePage() {
  const data = MENU_BOOK_DATA.chickenBiryani;
  const dish = data.featuredDish;

  return (
    <PageFrame pageNumber="05" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; HOUSE SPECIAL
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {dish.name}
          </h2>
          <span className="mt-1 block font-display text-xl text-[#B47A50] sm:text-2xl">
            {dish.formattedPrice}
          </span>
        </div>

        <div className="relative my-3 aspect-square w-full max-w-[320px] mx-auto overflow-hidden">
          {dish.image && (
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              sizes="320px"
              className="object-contain drop-shadow-[0_18px_30px_rgba(51,35,29,0.38)]"
            />
          )}
        </div>

        <div>
          <p className="font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            {dish.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold tracking-wider text-[#762D35] uppercase">
            <span className="rounded bg-[#762D35]/10 px-2 py-0.5">{dish.serving}</span>
            <span className="rounded bg-[#B47A50]/15 px-2 py-0.5 text-[#33231D]">
              {dish.pairing}
            </span>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

// 7. CHICKEN BIRYANI LIST (Right page)
export function ChickenBiryaniListPage() {
  const data = MENU_BOOK_DATA.chickenBiryani;

  return (
    <PageFrame pageNumber="06" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            REGIONAL DUM STYLES
          </span>
          <p className="mt-1 font-serif text-xs italic text-[#33231D]/75">
            {data.description}
          </p>
          <div className="mt-5 space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                    {item.name}
                  </h3>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80 sm:text-[13px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#762D35]/10 p-3 text-center">
          <p className="text-[11px] font-bold tracking-wider text-[#762D35] uppercase">
            SERVED IN DOUGH-SEALED COPPER HANDI WITH BURANI RAITA &amp; MIRCHI SALAN
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

// 8. MUTTON BIRYANI FEATURE (Left page)
export function MuttonBiryaniFeaturePage() {
  const data = MENU_BOOK_DATA.muttonBiryani;
  const dish = data.featuredDish;

  return (
    <PageFrame pageNumber="07" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; CROWN JEWEL
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {dish.name}
          </h2>
          <span className="mt-1 block font-display text-xl text-[#B47A50] sm:text-2xl">
            {dish.formattedPrice}
          </span>
        </div>

        <div className="relative my-3 aspect-square w-full max-w-[320px] mx-auto overflow-hidden">
          {dish.image && (
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              sizes="320px"
              className="object-contain drop-shadow-[0_18px_30px_rgba(51,35,29,0.38)]"
            />
          )}
        </div>

        <div>
          <p className="font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            {dish.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold tracking-wider text-[#762D35] uppercase">
            <span className="rounded bg-[#762D35]/10 px-2 py-0.5">{dish.serving}</span>
            <span className="rounded bg-[#B47A50]/15 px-2 py-0.5 text-[#33231D]">
              {dish.pairing}
            </span>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

// 9. MUTTON BIRYANI LIST (Right page)
export function MuttonBiryaniListPage() {
  const data = MENU_BOOK_DATA.muttonBiryani;

  return (
    <PageFrame pageNumber="08" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            GOAT &amp; YAKHNI TRADITIONS
          </span>
          <p className="mt-1 font-serif text-xs italic text-[#33231D]/75">
            {data.description}
          </p>
          <div className="mt-5 space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                    {item.name}
                  </h3>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80 sm:text-[13px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[#F5EBDD] border border-[#762D35]/30 p-3 text-center">
          <p className="text-[11px] font-bold tracking-wider text-[#762D35] uppercase">
            SLOW-SIMMERED SHANKS &bull; WILD MACE &bull; CRUSHED CARDAMOM
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

// 10. SPECIAL HANDIS & DAWAT (Left page)
export function SpecialHandisPage() {
  const data = MENU_BOOK_DATA.specialHandis;
  const dish = data.featuredDish;

  return (
    <PageFrame pageNumber="09" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; CELEBRATION
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {dish.name}
          </h2>
          <span className="mt-1 block font-display text-xl text-[#B47A50] sm:text-2xl">
            {dish.formattedPrice}
          </span>
        </div>

        <div className="relative my-3 aspect-square w-full max-w-[300px] mx-auto overflow-hidden">
          {dish.image && (
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              sizes="300px"
              className="object-contain drop-shadow-[0_16px_28px_rgba(51,35,29,0.35)]"
            />
          )}
        </div>

        <div>
          <p className="font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            {dish.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold tracking-wider text-[#762D35] uppercase">
            <span className="rounded bg-[#762D35]/10 px-2 py-0.5">{dish.serving}</span>
            <span className="rounded bg-[#B47A50]/15 px-2 py-0.5 text-[#33231D]">
              {dish.pairing}
            </span>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

// 11. KEBABS & VEGETARIAN HANDIS (Right page)
export function KebabsListPage() {
  const data = MENU_BOOK_DATA.kebabsAndGrills;

  return (
    <PageFrame pageNumber="10" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.title}
          </span>
          <p className="mt-1 font-serif text-xs italic text-[#33231D]/75">
            {data.subtitle}
          </p>
          <div className="mt-4 space-y-3.5">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                    {item.name}
                  </h3>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] font-semibold text-[#762D35]/80 uppercase">
          CHARCOAL SKEWERS &bull; BRUSHED WITH CULTURED GHEE &amp; LEMON
        </div>
      </div>
    </PageFrame>
  );
}

// 12. CURRIES & BREADS (Left page)
export function CurriesBreadsPage() {
  const data = MENU_BOOK_DATA.curriesAndBreads;

  return (
    <PageFrame pageNumber="11" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; SLOW POTS
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {data.title}
          </h2>
          <div className="mt-4 space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                    {item.name}
                  </h3>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80 sm:text-[13px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded border border-dashed border-[#762D35]/30 p-2.5 text-center text-[10px] font-semibold text-[#762D35] uppercase">
          Naan baked fresh to order &bull; Served steaming hot from the clay wall.
        </div>
      </div>
    </PageFrame>
  );
}

// 13. DESSERTS & REFRESHMENTS (Right page)
export function DessertsDrinksPage() {
  const data = MENU_BOOK_DATA.dessertsAndDrinks;

  return (
    <PageFrame pageNumber="12" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            {data.chapterNumber} &bull; SWEET ENDINGS
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            {data.title}
          </h2>
          <div className="mt-4 space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="border-b border-[#33231D]/10 pb-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base tracking-wide text-[#33231D] uppercase sm:text-lg">
                    {item.name}
                  </h3>
                  <span className="font-display text-sm text-[#762D35] sm:text-base">
                    {item.formattedPrice}
                  </span>
                </div>
                <p className="mt-1 font-serif text-xs leading-relaxed text-[#33231D]/80 sm:text-[13px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-[10px] font-semibold text-[#762D35]/80 uppercase">
          TERRACOTTA CHILLED &bull; KASHMIRI KESAR &bull; PISTACHIO SLIVERS
        </div>
      </div>
    </PageFrame>
  );
}

// 14. PRIVATE DINING & CELEBRATIONS (Left page)
export function PrivateDiningPage() {
  return (
    <PageFrame pageNumber="13" side="left">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            DAWAT &amp; GATHERINGS
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            CELEBRATE
            <br />
            TOGETHER.
          </h2>
          <p className="mt-3 font-serif text-sm leading-relaxed text-[#33231D]/90 sm:text-base">
            For grand birthdays, intimate family dawat ceremonies, and private corporate banquets, our private dining salon seats up to thirty guests around brass service platters.
          </p>
        </div>

        <div className="relative my-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#762D35]/20 shadow-md">
          <Image
            src="/images/community/image-13.webp"
            alt="Family celebrating around grand biryani table"
            fill
            sizes="400px"
            className="object-cover"
          />
        </div>

        <div className="rounded-lg bg-[#762D35]/10 p-3 text-center">
          <p className="text-[11px] font-bold tracking-wider text-[#762D35] uppercase">
            CUSTOM CURATED DEG PACKAGES AVAILABLE UPON REQUEST
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

// 15. INSIDE BACK COVER (Reservations & Locations)
export function InsideBackCoverPage() {
  return (
    <PageFrame pageNumber="14" side="right">
      <div className="flex flex-col justify-between h-full">
        <div>
          <span className="text-[10px] font-bold tracking-[0.28em] text-[#762D35] uppercase sm:text-xs">
            RESERVATIONS &amp; VISITS
          </span>
          <h2 className="mt-2 font-display text-3xl leading-[0.9] text-[#762D35] uppercase sm:text-4xl lg:text-5xl">
            JOIN THE
            <br />
            TABLE.
          </h2>

          <div className="mt-5 space-y-3 text-xs leading-relaxed text-[#33231D]/90 sm:text-sm font-medium">
            <div>
              <p className="font-bold text-[#762D35] uppercase">FLAGSHIP ADDRESS</p>
              <p>{BRAND.location.addressLine1}</p>
              <p>{BRAND.location.city}</p>
            </div>

            <div>
              <p className="font-bold text-[#762D35] uppercase">SERVICE HOURS</p>
              <p>{BRAND.location.hoursDinner}</p>
              <p>{BRAND.location.hoursWeekend}</p>
            </div>

            <div>
              <p className="font-bold text-[#762D35] uppercase">TABLE CONCIERGE</p>
              <p>{BRAND.location.phone}</p>
              <p>{BRAND.location.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded border border-[#762D35]/25 p-3 text-center">
          <p className="text-[10px] font-bold tracking-widest text-[#762D35] uppercase">
            DIRECT ORDERS RECEIVE 25% COMPLIMENTARY PRIVILEGE
          </p>
        </div>
      </div>
    </PageFrame>
  );
}

// 16. BACK COVER (Outside)
export function BackCoverPage() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-[#762D35] p-8 text-center text-[#F5EBDD] sm:p-12 shadow-2xl select-none">
      {/* Leatherette grain texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(#F5EBDD_0.8px,transparent_0.8px)] [background-size:8px_8px]"
      />

      {/* Embossed Double Gold Rule */}
      <div className="pointer-events-none absolute inset-4 border border-[#B47A50]/40 sm:inset-6">
        <div className="absolute inset-1 border border-[#B47A50]/20" />
      </div>

      <div className="relative z-10 pt-6">
        <span className="font-display text-xs tracking-[0.32em] text-[#B47A50] uppercase sm:text-sm">
          END OF THE REPAST
        </span>
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center">
        <div className="relative h-24 w-24 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] sm:h-32 sm:w-32">
          <Image
            src="/images/dumbaaz-crest.png"
            alt="DUMBAAZ emblem crest"
            fill
            sizes="128px"
            className="object-contain"
          />
        </div>

        <p className="mt-6 font-display text-3xl tracking-wider text-[#F5EBDD] uppercase sm:text-4xl">
          DUMBAAZ
        </p>

        <p className="mt-2 font-serif text-sm tracking-widest text-[#B47A50] uppercase italic">
          Until We Meet Across The Embers
        </p>
      </div>

      <div className="relative z-10 pb-6 text-[10px] tracking-[0.2em] text-[#B47A50]/80 uppercase sm:text-xs">
        &copy; 2026 DUMBAAZ CHARCOAL DUM HOUSE &bull; ALL RIGHTS RESERVED
      </div>
    </div>
  );
}
