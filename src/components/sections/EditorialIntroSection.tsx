import React from "react";
import Image from "next/image";

export function EditorialIntroSection() {
  return (
    <section
      id="dum-craft"
      className="relative overflow-x-clip bg-cream px-5 pt-16 pb-20 text-burgundy sm:px-10 sm:pt-20 sm:pb-28"
    >
      <div className="relative mx-auto max-w-3xl">
        {/* Top-left peeking dish photograph */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -left-4 z-0 h-44 w-44 -rotate-[7deg] overflow-hidden rounded-2xl shadow-xl sm:-top-16 sm:-left-16 sm:h-56 sm:w-56"
        >
          <Image
            src="/images/biryani-feast-overhead.webp"
            alt=""
            fill
            sizes="(max-width: 640px) 176px, 224px"
            className="object-cover"
          />
        </div>

        {/* Bottom-right peeking dining table photograph */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -bottom-12 z-0 h-44 w-44 rotate-[6deg] overflow-hidden rounded-2xl shadow-xl sm:-right-16 sm:-bottom-14 sm:h-56 sm:w-56"
        >
          <Image
            src="/images/family-serving.webp"
            alt=""
            fill
            sizes="(max-width: 640px) 176px, 224px"
            className="object-cover"
          />
        </div>

        {/* Postage-stamp perforated golden frame */}
        <div className="stamp-frame relative z-10 mx-auto shadow-[0_24px_60px_rgba(43,7,14,0.14)] md:-rotate-[0.6deg]">
          <div className="stamp-frame-sides bg-cream px-6 py-10 sm:px-14 sm:py-14">
            <h2 className="font-display text-6xl leading-[0.88] tracking-[-0.01em] text-burgundy uppercase sm:text-8xl">
              DUMBAAZ
            </h2>

            <p className="mt-3 text-xs font-bold tracking-[0.14em] text-saffron uppercase sm:text-sm">
              [D&#652;M-BAAZ] MASCULINE NOUN &bull; ALMOST A RITUAL
            </p>

            <div className="my-5 h-[1.5px] w-full bg-burgundy/45 sm:my-7" />

            <p className="text-xl leading-[1.45] font-semibold text-burgundy sm:text-[26px]">
              Heavy copper pot where guests come &ldquo;just for a quick plate,&rdquo;{" "}
              <span className="text-burgundy/85">
                then order spiced raita, then tear warm flaky parotta for the masala at the rim,
              </span>{" "}
              <span className="text-burgundy/60">
                then crack open a second dough-sealed handi long past the hour anyone planned to leave.
              </span>{" "}
              <span className="text-burgundy/35">
                Known to awaken sudden cravings after midnight.
              </span>
            </p>

            <p className="mt-7 text-sm font-semibold text-saffron sm:text-base">
              Synonyms:{" "}
              <span className="text-burgundy/80">
                delicious trap, saffron coma, midnight handi alarm.
              </span>
            </p>

            <div className="mt-8 flex justify-end sm:mt-10">
              <p className="-rotate-2 text-right font-script text-4xl leading-[0.9] text-burgundy sm:text-5xl">
                ek aur handi,
                <br />
                aur chale
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
