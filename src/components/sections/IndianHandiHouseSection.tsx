"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BRAND } from "@/data/brand";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// 36 geometric sunburst rays radiating from the center
const SUNBURST_RAYS = Array.from({ length: 36 }, (_, idx) => idx * 10);

interface ZoomItemConfig {
  id: string;
  name: string;
  src: string;
  // Starting position near center (px relative to center)
  startX: number;
  startY: number;
  startScale: number;
  startRotate: number;
  // Target position at full zoom (vw / vh relative to center, scale, rotation)
  endXvw: number;
  endYvh: number;
  endScale: number;
  endRotate: number;
  // Visual layer ordering and custom drop shadow
  zIndex: number;
}

const ZOOM_ITEMS: ZoomItemConfig[] = [
  // 1. Left Foreground Hero (like the giant Chai cup in Gourou)
  {
    id: "hero-biryani-copper",
    name: "Hammered Copper Bowl of Mixed Biryani",
    src: "/images/zoom/Hammered Copper Bowl of Mixed Biryani.png",
    startX: -42,
    startY: 8,
    startScale: 0.17,
    startRotate: -6,
    endXvw: -40,
    endYvh: 6,
    endScale: 3.5,
    endRotate: -34,
    zIndex: 25,
  },
  // 2. Right Foreground Hero (like the giant Samosa in Gourou)
  {
    id: "hero-drumstick",
    name: "Glossy Grilled Chicken Drumstick",
    src: "/images/zoom/Glossy Grilled Chicken Drumstick.png",
    startX: 40,
    startY: -16,
    startScale: 0.16,
    startRotate: 12,
    endXvw: 39,
    endYvh: -8,
    endScale: 3.3,
    endRotate: 58,
    zIndex: 25,
  },
  // 3. Top-Left: Smoky Tandoori Skewers
  {
    id: "tandoori-skewers",
    name: "Grilled Tandoori Chicken Skewers",
    src: "/images/zoom/Grilled Tandoori Chicken Skewers.png",
    startX: -28,
    startY: -34,
    startScale: 0.14,
    startRotate: -16,
    endXvw: -34,
    endYvh: -33,
    endScale: 3.0,
    endRotate: -72,
    zIndex: 22,
  },
  // 4. Top-Right: Spicy Masala Prawns
  {
    id: "masala-prawns",
    name: "Spicy Masala Prawns with Lime and Herbs",
    src: "/images/zoom/Spicy Masala Prawns with Lime and Herbs.png",
    startX: 32,
    startY: -32,
    startScale: 0.15,
    startRotate: 18,
    endXvw: 35,
    endYvh: -30,
    endScale: 3.1,
    endRotate: 78,
    zIndex: 22,
  },
  // 5. Bottom-Left: Rustic Nalli Gosht Shank
  {
    id: "nalli-gosht",
    name: "Rustic Copper Bowl of Nalli Gosht",
    src: "/images/zoom/Rustic Copper Bowl of Nalli Gosht.png",
    startX: -32,
    startY: 38,
    startScale: 0.15,
    startRotate: -10,
    endXvw: -32,
    endYvh: 34,
    endScale: 3.0,
    endRotate: -46,
    zIndex: 24,
  },
  // 6. Bottom-Right: Spiced Crispy Fish
  {
    id: "crispy-fish",
    name: "Crispy Spiced Fish on Banana Leaf",
    src: "/images/zoom/Crispy Spiced Fish on Banana Leaf.png",
    startX: 32,
    startY: 36,
    startScale: 0.15,
    startRotate: 14,
    endXvw: 34,
    endYvh: 32,
    endScale: 2.9,
    endRotate: 52,
    zIndex: 24,
  },
  // 7. Top Center: Steaming Clay Bowl Biryani
  {
    id: "clay-bowl-biryani",
    name: "Steaming Chicken Biryani in Clay Bowl",
    src: "/images/zoom/Steaming Chicken Biryani in Clay Bowl.png",
    startX: -8,
    startY: -48,
    startScale: 0.14,
    startRotate: -8,
    endXvw: -10,
    endYvh: -38,
    endScale: 2.7,
    endRotate: -24,
    zIndex: 21,
  },
  // 8. Bottom Center: Rich Mutton Biryani
  {
    id: "mutton-biryani",
    name: "Copper Bowl of Mutton Biryani",
    src: "/images/zoom/Copper Bowl of Mutton Biryani.png",
    startX: 8,
    startY: 50,
    startScale: 0.14,
    startRotate: 8,
    endXvw: 8,
    endYvh: 38,
    endScale: 2.8,
    endRotate: 32,
    zIndex: 21,
  },
  // 9. Floating Mid-Right Accent: Pepper Skewer
  {
    id: "pepper-skewer",
    name: "Grilled Chicken and Colorful Pepper Skewer",
    src: "/images/zoom/Grilled Chicken and Colorful Pepper Skewer.png",
    startX: 16,
    startY: 12,
    startScale: 0.16,
    startRotate: 10,
    endXvw: 19,
    endYvh: 16,
    endScale: 2.2,
    endRotate: -38,
    zIndex: 23,
  },
  // 10. Floating Mid-Left Accent: Herb Glazed Chicken
  {
    id: "glazed-chicken",
    name: "Glazed Grilled Chicken with Herbs and Salsa",
    src: "/images/zoom/Glazed Grilled Chicken with Herbs and Salsa.png",
    startX: -18,
    startY: -12,
    startScale: 0.15,
    startRotate: -12,
    endXvw: -21,
    endYvh: -16,
    endScale: 2.3,
    endRotate: 42,
    zIndex: 23,
  },
];

export function IndianHandiHouseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sunburstRef = useRef<SVGSVGElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Mouse parallax state for interactive floating tilt
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Only compute when section is active in viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      setMouseParallax({ x: normX * 24, y: normY * 24 });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useLayoutEffect(() => {
    if (!sectionRef.current || reducedMotion) return;

    const ctx = gsap.context(() => {
      const items = itemsContainerRef.current?.querySelectorAll<HTMLDivElement>(".zoom-food-item");
      if (!items || items.length === 0) return;

      // Master scroll-scrubbed timeline pinned for 1.8 screen heights
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=180%",
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });

      // 1. Subtle centrifugal rotation of the sunburst rays
      if (sunburstRef.current) {
        tl.to(
          sunburstRef.current,
          {
            rotation: 24,
            ease: "none",
            duration: 1,
          },
          0
        );
      }

      // 2. Animate each food element from tiny center position to dramatic foreground zoom
      items.forEach((el, index) => {
        const config = ZOOM_ITEMS[index];
        if (!config) return;

        // Initial state: small scale near center, distinct offset so elements are clearly visible
        gsap.set(el, {
          x: config.startX,
          y: config.startY,
          scale: config.startScale,
          rotation: config.startRotate,
          opacity: 0.85,
          transformPerspective: 1000,
          transformOrigin: "center center",
        });

        // Scrub animation: elements fly radially outward towards user's face, rotating and scaling up
        tl.to(
          el,
          {
            x: `${config.endXvw}vw`,
            y: `${config.endYvh}vh`,
            scale: config.endScale,
            rotation: config.endRotate,
            opacity: 1,
            ease: "power1.inOut",
            duration: 0.85,
          },
          0
        );

        // Near the end of scroll, elements pass by the camera edges with a gentle fade
        tl.to(
          el,
          {
            opacity: 0.15,
            scale: config.endScale * 1.15,
            ease: "power2.in",
            duration: 0.15,
          },
          0.85
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="handi-house"
      aria-label="DUMBAAZ Indian Handi House — Interactive Food Experience"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cream px-5 py-12 text-center text-burgundy sm:px-10"
    >
      {/* Dynamic Sunburst Rays Background */}
      <svg
        ref={sunburstRef}
        aria-hidden="true"
        viewBox="-200 -200 400 400"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 will-change-transform"
      >
        {SUNBURST_RAYS.map((angle) => (
          <polygon
            key={angle}
            points="0,0 -12,-320 12,-320"
            fill="#FFFFFF"
            transform={`rotate(${angle})`}
          />
        ))}
      </svg>

      {/* Zooming Food Elements Stage (Preserves 3D perspective) */}
      <div
        ref={itemsContainerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          transform: `translate3d(${mouseParallax.x}px, ${mouseParallax.y}px, 0)`,
          transition: "transform 0.18s ease-out",
        }}
      >
        {ZOOM_ITEMS.map((item) => (
          <div
            key={item.id}
            className="zoom-food-item absolute h-80 w-80 will-change-transform select-none sm:h-96 sm:w-96"
            style={{
              zIndex: item.zIndex,
              // Fallback position for reduced-motion users
              transform: reducedMotion
                ? `translate(${item.startX * 4}px, ${item.startY * 4}px) scale(0.65)`
                : undefined,
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={item.src}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 320px, 420px"
                className="object-contain drop-shadow-[0_20px_35px_rgba(43,7,14,0.35)]"
                priority
              />
            </div>
          </div>
        ))}
      </div>

      {/* Central Content Card & Information (Always crisp and interactive) */}
      <div className="relative z-30 mx-auto flex max-w-2xl flex-col items-center">
        {/* Open Status Indicator Pill matching Bar-Topas & Gourou */}
        <div className="inline-flex items-center gap-2 rounded-full border border-burgundy/20 bg-burgundy px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-cream uppercase shadow-md sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-turmeric opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-turmeric" />
          </span>
          <span>THIS EVENING FROM 18:30</span>
        </div>

        {/* DUMBAAZ Handi Lid Crest */}
        <div className="mt-5 flex items-center justify-center">
          <Image
            src="/images/dumbaaz-crest.png"
            alt="DUMBAAZ lifting handi lid crest"
            width={160}
            height={160}
            className="h-28 w-28 object-contain drop-shadow-[0_12px_24px_rgba(43,7,14,0.18)] transition-transform duration-300 hover:scale-105 sm:h-36 sm:w-36"
            priority
          />
        </div>

        {/* Hero Title */}
        <h2 className="mt-4 font-display text-5xl leading-[0.88] tracking-[0.01em] text-chilli uppercase select-none sm:text-7xl md:text-8xl">
          INDIAN HANDI
          <br />
          HOUSE
        </h2>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#hours"
            className="border-2 border-chilli bg-cream/95 px-7 py-3 text-xs font-bold tracking-[0.18em] text-chilli uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-chilli hover:text-cream hover:shadow-lg sm:text-sm"
          >
            BOOK A TABLE
          </a>
          <a
            href="#menu"
            className="border-2 border-chilli bg-cream/95 px-7 py-3 text-xs font-bold tracking-[0.18em] text-chilli uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-chilli hover:text-cream hover:shadow-lg sm:text-sm"
          >
            SEE THE PLATES
          </a>
        </div>

        {/* Address and Hours */}
        <p className="mt-7 text-xs leading-relaxed font-semibold text-burgundy/85 sm:text-sm">
          <span className="font-bold text-chilli uppercase">Address:</span>{" "}
          {BRAND.location.addressLine1} &middot; {BRAND.location.city}
          <br />
          <span className="font-bold text-chilli uppercase">Hours:</span>{" "}
          {BRAND.location.hoursDinner} &middot; {BRAND.location.hoursWeekend}
        </p>

        {/* Subtle Scroll Hint */}
        <div className="mt-6 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-chilli/70 uppercase">
          <span>SCROLL TO EXPLORE DISHES</span>
          <span className="animate-bounce">&#8595;</span>
        </div>
      </div>
    </section>
  );
}
