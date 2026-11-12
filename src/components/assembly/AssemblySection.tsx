"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { WebGLFallback } from "@/components/three/WebGLFallback";
import {
  COMPLETED_ASSEMBLY_STATE,
  INITIAL_ASSEMBLY_STATE,
  type AssemblyMotionState,
} from "./AssemblyScene3D";

gsap.registerPlugin(ScrollTrigger);

const AssemblyScene3D = dynamic(
  () => import("./AssemblyScene3D").then((mod) => mod.AssemblyScene3D),
  {
    ssr: false,
    loading: () => (
      <WebGLFallback
        imageSrc="/3d-assets/previews/copper-handi-hero.png"
        alt="Loading interactive biryani assembly canvas"
        caption="Preparing assembly stage..."
      />
    ),
  }
);

const STEPS = [
  {
    num: "01",
    name: "THE HANDI",
    desc: "Heavy copper, charcoal hearth.",
  },
  {
    num: "02",
    name: "THE RICE",
    desc: "Aged basmati, saffron kissed.",
  },
  {
    num: "03",
    name: "THE CHICKEN",
    desc: "Tandoori spiced, succulent.",
  },
  {
    num: "04",
    name: "THE ONIONS",
    desc: "Golden birista, crispy.",
  },
  {
    num: "05",
    name: "THE DUM!",
    desc: "Aromatic herbs and steam.",
  },
];

export function AssemblySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const webglSupported = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const motionRef = useRef<AssemblyMotionState>({ ...INITIAL_ASSEMBLY_STATE });

  useEffect(() => {
    const checkWidth = () => setIsCompactViewport(window.innerWidth < 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    if (reducedMotion) {
      motionRef.current = { ...COMPLETED_ASSEMBLY_STATE };
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = "scaleX(1)";
      }
      return;
    }

    const state: AssemblyMotionState = { ...INITIAL_ASSEMBLY_STATE };
    motionRef.current = state;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=3200",
          pin: true,
          scrub: 0.2,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (progressBarRef.current) {
              progressBarRef.current.style.transform = `scaleX(${Math.max(0.04, p)})`;
            }
            const nextIndex = Math.min(4, Math.floor(p * 5));
            setActiveStepIndex((prev) => (prev === nextIndex ? prev : nextIndex));
          },
        },
      });

      // Stage 1 (0–1): Empty hammered copper handi drops & rotates into place
      tl.to(
        state,
        {
          handiY: 0,
          handiRotY: 0,
          handiRotZ: 0,
          handiScale: 1,
          duration: 1.0,
          ease: "power3.out",
        },
        0
      );

      // Stage 2 (1–2): Basmati saffron rice falls into the copper handi
      tl.to(
        state,
        {
          riceProgress: 1,
          turntableY: 0.2,
          duration: 1.0,
          ease: "power2.out",
        },
        1.0
      );

      // Stage 3 (2–3): Spicy roasted chicken drumstick falls & settles
      tl.to(
        state,
        {
          drumstickProgress: 1,
          turntableY: 0.3,
          duration: 1.0,
          ease: "back.out(1.15)",
        },
        2.0
      );

      // Stage 4 (3–4): Crispy birista fried onions rain down
      tl.to(
        state,
        {
          onionsProgress: 1,
          turntableY: 0.42,
          duration: 1.0,
          ease: "power2.out",
        },
        3.0
      );

      // Stage 5 (4–5): Mint leaves crown the dish + steaming dum reveal
      tl.to(
        state,
        {
          mintProgress: 1,
          duration: 0.65,
          ease: "power2.out",
        },
        4.0
      ).to(
        state,
        {
          steamIntensity: 1,
          turntableY: 0.62,
          duration: 0.8,
          ease: "sine.inOut",
        },
        4.2
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="assembly"
      aria-label="Scroll-Controlled Dum Biryani Assembly"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-teal px-6 py-10 sm:px-12 sm:py-14 text-cream"
    >
      {/* Semantic step & accessibility tracking */}
      <span className="sr-only">
        STAGE {String(activeStepIndex + 1).padStart(2, "0")} / 05
        {reducedMotion ? " · REDUCED MOTION" : ""}
      </span>

      <div className="relative z-10 mx-auto flex h-full min-h-[calc(100vh-6rem)] w-full max-w-[1440px] flex-col justify-between">
        {/* Top-left: Clean kicker & headline matching "A PINCHO IS SIMPLE." */}
        <div className="max-w-xl pt-10 sm:pt-14">
          <p className="font-sans text-xs sm:text-sm font-bold tracking-[0.2em] text-turmeric uppercase">
            DUM BIRYANI &bull; DUMBAAZ
          </p>

          <h2 className="mt-3 font-sans text-5xl sm:text-7xl lg:text-[84px] font-black uppercase tracking-tight leading-[0.92] text-cream">
            A BIRYANI
            <br />
            IS SIMPLE.
          </h2>
        </div>

        {/* Right side: 3D assembly canvas with generous breathing room */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-full items-center justify-center lg:w-[60%]">
          <div className="pointer-events-auto relative h-[380px] w-full sm:h-[480px] lg:h-[620px]">
            <AssemblyScene3D
              motionRef={motionRef}
              webglSupported={webglSupported}
              reducedMotion={reducedMotion}
              isCompactViewport={isCompactViewport}
            />
          </div>
        </div>

        {/* Bottom-left: Minimal 5-step rail & yellow progress bar */}
        <div className="relative z-20 mt-auto pb-4 sm:pb-6">
          <ol
            aria-label="Biryani assembly sequence"
            className="space-y-2 sm:space-y-3"
          >
            {STEPS.map((step, idx) => {
              const isActive = reducedMotion
                ? idx === STEPS.length - 1
                : idx === activeStepIndex;

              return (
                <li
                  key={step.num}
                  className={`flex flex-col transition-all duration-300 ${
                    isActive ? "opacity-100 translate-x-2" : "opacity-35"
                  }`}
                >
                  <div className="flex items-baseline gap-3 sm:gap-5">
                    <span className="font-sans text-sm sm:text-base font-extrabold text-turmeric tracking-wider w-6 shrink-0">
                      {step.num}
                    </span>
                    <span className="font-sans text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase leading-none tracking-tight text-cream">
                      {step.name}
                    </span>
                  </div>

                  {isActive && (
                    <p className="ml-9 sm:ml-11 mt-1 text-xs sm:text-sm text-cream/80 font-medium tracking-wide">
                      {step.desc}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Yellow progress line matching reference */}
          <div className="mt-6 sm:mt-8 h-1 w-64 sm:w-80 rounded-full bg-cream/20 overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full bg-turmeric rounded-full origin-left transition-transform duration-100"
              style={{ transform: reducedMotion ? "scaleX(1)" : "scaleX(0.06)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
