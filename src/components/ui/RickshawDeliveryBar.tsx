"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TICKER_WORDS = [
  "DUMBAAZ EXPRESS",
  "HOT CHARCOAL-SEALED HANDIS",
  "FROM THE HEARTH TO YOUR DOOR",
  "PIPING HOT DELIVERY",
  "CRACK THE DUM AT HOME",
  "DIRECT ON THREE WHEELS",
];

export function RickshawDeliveryBar() {
  const reducedMotion = usePrefersReducedMotion();
  const rickshawRef = useRef<HTMLDivElement>(null);
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let lastScrollY = window.scrollY;
    let velocity = 0;
    let currentAngle = 0;
    let targetAngle = 0;
    let animId: number;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;

      // Positive delta means scrolling down -> pop a wheelie!
      if (delta > 0) {
        velocity += delta * 0.45;
      } else {
        // Scrolling up gives gentle forward pitch or quick reset
        velocity += delta * 0.15;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      // Exponential velocity decay
      velocity *= 0.86;

      // Calculate target wheelie angle based on downward speed
      // Invert to negative degrees for counter-clockwise front-wheel lift
      const downwardSpeed = Math.max(0, velocity);
      targetAngle = -Math.min(22, downwardSpeed * 0.38);

      // Smooth lerp towards target angle
      currentAngle += (targetAngle - currentAngle) * 0.14;

      if (rickshawRef.current) {
        // Translate slightly up during high wheelie for realistic weight transfer
        const liftY = currentAngle * 0.55;
        rickshawRef.current.style.transform = `rotate(${currentAngle.toFixed(2)}deg) translateY(${liftY.toFixed(1)}px)`;
      }

      const wheelieIntensity = Math.min(1, Math.abs(currentAngle) / 12);

      if (cloud1Ref.current) {
        cloud1Ref.current.style.opacity = `${0.35 + wheelieIntensity * 0.65}`;
        cloud1Ref.current.style.transform = `scale(${0.85 + wheelieIntensity * 0.4}) translate3d(${
          -wheelieIntensity * 12
        }px, 0, 0)`;
      }

      if (cloud2Ref.current) {
        cloud2Ref.current.style.opacity = `${0.2 + wheelieIntensity * 0.7}`;
        cloud2Ref.current.style.transform = `scale(${0.75 + wheelieIntensity * 0.5}) translate3d(${
          -wheelieIntensity * 18
        }px, ${wheelieIntensity * 4}px, 0)`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animId);
    };
  }, [reducedMotion]);

  return (
    <div
      aria-label="DUMBAAZ Delivery Rickshaw Express Bar"
      className="relative flex h-44 w-full items-center overflow-hidden border-y-2 border-chilli bg-cream sm:h-52"
    >
      {/* Background continuous running marquee text */}
      <div className="pointer-events-none absolute inset-x-0 flex select-none overflow-hidden whitespace-nowrap">
        <div className="animate-marquee flex items-center">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {TICKER_WORDS.map((text, idx) => (
                <div key={`${dup}-${idx}`} className="flex items-center">
                  <span className="mx-6 font-display text-5xl tracking-[0.02em] text-chilli uppercase sm:mx-10 sm:text-7xl">
                    {text}
                  </span>
                  <div
                    aria-hidden="true"
                    className="mx-4 flex items-center justify-center sm:mx-8"
                  >
                    <Image
                      src="/images/briyanii.svg"
                      alt=""
                      width={100}
                      height={66}
                      className="h-10 w-auto object-contain drop-shadow-[0_4px_10px_rgba(43,7,14,0.18)] sm:h-16"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Foreground Driving Auto Rickshaw with Scroll-Driven Wheelie Physics */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-center px-4">
        <div className="relative flex items-center justify-center">
          {/* Exhaust Clouds behind rear wheel */}
          <div
            ref={cloud1Ref}
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 bottom-3 z-0 h-14 w-20 transition-opacity duration-75 sm:-left-14 sm:bottom-4 sm:h-20 sm:w-28"
          >
            <Image
              src="/images/cloud.webp"
              alt=""
              fill
              sizes="112px"
              className="object-contain"
            />
          </div>

          <div
            ref={cloud2Ref}
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 bottom-8 z-0 h-10 w-16 opacity-30 transition-opacity duration-75 sm:-left-24 sm:bottom-10 sm:h-16 sm:w-24"
          >
            <Image
              src="/images/cloud.webp"
              alt=""
              fill
              sizes="96px"
              className="object-contain"
            />
          </div>

          {/* DUMBAAZ Biryani Delivery Rickshaw */}
          <div
            ref={rickshawRef}
            className="relative z-10 w-48 transition-transform will-change-transform sm:w-64 md:w-72"
            style={{
              transformOrigin: "35% 84%",
            }}
          >
            <Image
              src="/images/DUMBAAZ Biryani Delivery Rickshaw.webp"
              alt="DUMBAAZ Biryani Delivery Auto-Rickshaw popping a wheelie on scroll"
              width={576}
              height={384}
              sizes="(max-width: 640px) 192px, 288px"
              className="h-auto w-full object-contain drop-shadow-[0_12px_20px_rgba(43,7,14,0.22)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
