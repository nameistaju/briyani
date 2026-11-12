import React from "react";

const TOP_ITEMS = [
  { text: "COPPER HANDI", icon: "handi" as const },
  { text: "KASHMIRI SAFFRON", icon: "flame" as const },
  { text: "AGED BASMATI", icon: "handi" as const },
  { text: "CHALO FEAST!", icon: "flame" as const },
];

const FRONT_ITEMS = [
  "A LITTLE OF EVERYTHING",
  "DUM COOKED ON CHARCOAL",
  "EK AUR HANDI, AUR CHALE",
  "SHARED AT THE TABLE",
];

function RibbonIcon({ type }: { type: "handi" | "flame" }) {
  if (type === "handi") {
    return (
      <svg viewBox="0 0 28 28" className="h-7 w-7 text-saffron" fill="none" aria-hidden="true">
        <path
          d="M5 12h18c0 5.5-3.6 9.5-9 9.5S5 17.5 5 12Z"
          stroke="currentColor"
          strokeWidth="2.2"
          fill="currentColor"
          fillOpacity="0.16"
        />
        <path d="M7.5 10h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M11 6.5c0-1.2 1.2-2 1.2-3M17 6.5c0-1.2 1.2-2 1.2-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7 text-saffron" fill="none" aria-hidden="true">
      <path
        d="M14.5 3.5c2 3.8 5.5 6.4 5.5 11a6 6 0 1 1-12 0c0-2.6 1.2-5 3.2-6.8.2 2 1.4 3.2 2.4 3.5-.7-2.6-.2-5.3.9-7.7Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.16"
      />
    </svg>
  );
}

export function TurmericMarquee() {
  return (
    <div
      aria-label="Culinary highlights marquee"
      className="relative overflow-x-clip py-12 sm:py-16"
      style={{
        background: "linear-gradient(180deg, #9E1228 0%, #9E1228 52%, #F5EFE0 52%, #F5EFE0 100%)",
      }}
    >
      {/* Back diagonal turmeric ribbon */}
      <div className="relative z-10 -mx-[8vw] -rotate-[2.4deg] overflow-hidden bg-turmeric py-3.5 shadow-sm sm:py-4">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {TOP_ITEMS.map((item, idx) => (
                <div key={`${dup}-${idx}`} className="flex items-center">
                  <span className="mx-6 font-display text-3xl tracking-[0.04em] text-burgundy uppercase sm:mx-8 sm:text-5xl">
                    {item.text}
                  </span>
                  <RibbonIcon type={item.icon} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Crossing foreground cream ribbon */}
      <div className="relative z-20 -mx-[8vw] -mt-3 rotate-[1.6deg] overflow-hidden bg-cream py-3 shadow-md sm:-mt-4 sm:py-3.5">
        <div className="animate-marquee-reverse flex w-max items-center whitespace-nowrap">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {FRONT_ITEMS.map((item, idx) => (
                <div key={`${dup}-${idx}`} className="flex items-center">
                  <span className="mx-5 font-display text-xl tracking-[0.05em] text-burgundy uppercase sm:mx-7 sm:text-3xl">
                    {item}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl leading-none text-saffron sm:text-4xl"
                  >
                    &#10035;
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
