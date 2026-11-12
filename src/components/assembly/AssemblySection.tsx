"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ASSEMBLY_STEPS } from "@/data/brand";
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

      // Stage 3 (2–3): Spicy roasted chicken drumstick falls & tilts onto rice mound
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

      // Stage 5 (4–5): Mint leaves crown the dish + final steaming dum reveal
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

  const currentStep = ASSEMBLY_STEPS[activeStepIndex] ?? ASSEMBLY_STEPS[0];

  return (
    <section
      ref={sectionRef}
      id="assembly"
      aria-label="Scroll-Controlled Dum Biryani Assembly"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-teal pt-20 pb-8 text-cream sm:pt-24 sm:pb-10"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-between px-5 sm:px-10">
        {/* Main 2-column stage matching unboxed editorial sequence */}
        <div className="my-auto grid grid-cols-1 items-center gap-6 py-4 lg:grid-cols-12">
          {/* Left editorial headline + unboxed numbered rail */}
          <div className="lg:col-span-5">
            <p className="text-[11px] font-bold tracking-[0.2em] text-turmeric uppercase sm:text-xs">
              COPPER HANDI &bull; DUM SEQUENCE &bull; STAGE {currentStep.step} / 05
              {reducedMotion ? " · REDUCED MOTION" : ""}
            </p>

            <h2 className="mt-3 font-display text-5xl leading-[0.86] tracking-[-0.01em] text-cream uppercase sm:text-6xl lg:text-[68px]">
              DUM BIRYANI,
              <br />
              BUILT LAYER
              <br />
              BY LAYER.
            </h2>

            <ol
              aria-label="Biryani assembly sequence"
              className="mt-7 space-y-2.5 sm:mt-9 sm:space-y-3"
            >
              {ASSEMBLY_STEPS.map((item, index) => {
                const isActive = reducedMotion
                  ? index === ASSEMBLY_STEPS.length - 1
                  : index === activeStepIndex;

                return (
                  <li key={item.step} className="flex items-start gap-4">
                    <span
                      className={`mt-1 w-6 shrink-0 text-xs font-bold tracking-[0.12em] uppercase transition-colors duration-200 ${
                        isActive ? "text-turmeric" : "text-turmeric/40"
                      }`}
                    >
                      {item.step}
                    </span>

                    <div>
                      <p
                        className={`font-display text-2xl leading-[0.95] uppercase transition-colors duration-200 sm:text-[32px] ${
                          isActive ? "text-cream" : "text-cream/35"
                        }`}
                      >
                        {item.ingredientLabel}
                      </p>
                      {isActive && (
                        <p className="mt-1 max-w-md text-xs leading-relaxed text-cream/85 sm:text-sm">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Right/Center real 3D assembly viewport (no artificial oval rings) */}
          <div className="relative h-[400px] w-full sm:h-[500px] lg:col-span-7 lg:h-[580px]">
            <AssemblyScene3D
              motionRef={motionRef}
              webglSupported={webglSupported}
              reducedMotion={reducedMotion}
              isCompactViewport={isCompactViewport}
            />
          </div>
        </div>

        {/* Minimal horizontal scroll progress track */}
        <div className="pt-4">
          <div className="h-[2px] w-full overflow-hidden bg-cream/20">
            <div
              ref={progressBarRef}
              className="h-full w-full origin-left bg-turmeric transition-transform duration-100"
              style={{ transform: reducedMotion ? "scaleX(1)" : "scaleX(0.06)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
