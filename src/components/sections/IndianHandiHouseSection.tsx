"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { BRAND } from "@/data/brand";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// 36 geometric sunburst rays radiating from the center
const SUNBURST_RAYS = Array.from({ length: 36 }, (_, idx) => idx * 10);

interface ZoomItemConfig {
  id: string;
  name: string;
  src: string;
}

const ZOOM_ITEMS: ZoomItemConfig[] = [
  {
    id: "mixed-biryani",
    name: "Hammered Copper Bowl of Mixed Biryani",
    src: "/images/zoom/Hammered Copper Bowl of Mixed Biryani.webp",
  },
  {
    id: "drumstick",
    name: "Glossy Grilled Chicken Drumstick",
    src: "/images/zoom/Glossy Grilled Chicken Drumstick.webp",
  },
  {
    id: "tandoori-skewers",
    name: "Grilled Tandoori Chicken Skewers",
    src: "/images/zoom/Grilled Tandoori Chicken Skewers.webp",
  },
  {
    id: "masala-prawns",
    name: "Spicy Masala Prawns with Lime and Herbs",
    src: "/images/zoom/Spicy Masala Prawns with Lime and Herbs.webp",
  },
  {
    id: "nalli-gosht",
    name: "Rustic Copper Bowl of Nalli Gosht",
    src: "/images/zoom/Rustic Copper Bowl of Nalli Gosht.webp",
  },
  {
    id: "crispy-fish",
    name: "Crispy Spiced Fish on Banana Leaf",
    src: "/images/zoom/Crispy Spiced Fish on Banana Leaf.webp",
  },
  {
    id: "clay-bowl-biryani",
    name: "Steaming Chicken Biryani in Clay Bowl",
    src: "/images/zoom/Steaming Chicken Biryani in Clay Bowl.webp",
  },
  {
    id: "mutton-biryani",
    name: "Copper Bowl of Mutton Biryani",
    src: "/images/zoom/Copper Bowl of Mutton Biryani.webp",
  },
  {
    id: "pepper-skewer",
    name: "Grilled Chicken and Colorful Pepper Skewer",
    src: "/images/zoom/Grilled Chicken and Colorful Pepper Skewer.webp",
  },
  {
    id: "glazed-chicken",
    name: "Glazed Grilled Chicken with Herbs and Salsa",
    src: "/images/zoom/Glazed Grilled Chicken with Herbs and Salsa.webp",
  },
  {
    id: "chicken-curry",
    name: "Overhead Chicken Curry in Wooden Bowl",
    src: "/images/zoom/Overhead Chicken Curry in Wooden Bowl.webp",
  },
];

interface DirectionZone {
  name: string;
  targetXvw: [number, number]; // vw range relative to center
  targetYvh: [number, number]; // vh range relative to center
  rotationDelta: [number, number]; // degrees spin
}

// 6 distinct radial trajectory zones so simultaneous items disperse evenly towards the face
const ZONES: DirectionZone[] = [
  // Upper-Left
  {
    name: "top-left",
    targetXvw: [-48, -34],
    targetYvh: [-42, -26],
    rotationDelta: [-75, -35],
  },
  // Upper-Right
  {
    name: "top-right",
    targetXvw: [34, 48],
    targetYvh: [-42, -26],
    rotationDelta: [35, 75],
  },
  // Mid-Left
  {
    name: "mid-left",
    targetXvw: [-54, -40],
    targetYvh: [-12, 14],
    rotationDelta: [-60, -25],
  },
  // Mid-Right
  {
    name: "mid-right",
    targetXvw: [40, 54],
    targetYvh: [-12, 14],
    rotationDelta: [25, 60],
  },
  // Lower-Left
  {
    name: "bottom-left",
    targetXvw: [-46, -32],
    targetYvh: [24, 40],
    rotationDelta: [-80, -40],
  },
  // Lower-Right
  {
    name: "bottom-right",
    targetXvw: [32, 46],
    targetYvh: [24, 40],
    rotationDelta: [40, 80],
  },
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function IndianHandiHouseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const sunburstRef = useRef<SVGSVGElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Mouse parallax state for interactive floating tilt
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  // Track active animating items to avoid duplicate launches
  const activeIdsRef = useRef<Set<string>>(new Set());
  const isVisibleRef = useRef(false);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subtle mouse parallax tilt across the section
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      setMouseParallax({ x: normX * 22, y: normY * 22 });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Ambient slow sunburst rotation
  useEffect(() => {
    if (!sunburstRef.current || reducedMotion) return;

    const tween = gsap.to(sunburstRef.current, {
      rotation: 360,
      duration: 80,
      repeat: -1,
      ease: "none",
    });

    return () => {
      tween.kill();
    };
  }, [reducedMotion]);

  // Autonomous food zoom animation: 1, 2, or 3 random items fly towards face & disappear
  useEffect(() => {
    const container = itemsContainerRef.current;
    const activeIds = activeIdsRef.current;
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const animateItem = (el: HTMLElement, item: ZoomItemConfig, zone: DirectionZone) => {
      const endX = randomBetween(zone.targetXvw[0], zone.targetXvw[1]);
      const endY = randomBetween(zone.targetYvh[0], zone.targetYvh[1]);
      const startRot = randomBetween(-16, 16);
      const rotDelta = randomBetween(zone.rotationDelta[0], zone.rotationDelta[1]);
      const endRot = startRot + rotDelta;
      const duration = randomBetween(2.6, 3.4);
      const endScale = randomBetween(3.0, 3.8);
      const startX = randomBetween(-15, 15);
      const startY = randomBetween(-15, 15);

      const tl = gsap.timeline({
        onComplete: () => {
          activeIdsRef.current.delete(item.id);
          gsap.set(el, { opacity: 0, scale: 0.15, x: 0, y: 0, rotation: 0 });
        },
      });

      // 1. Initial spawn: small near center, invisible
      tl.set(el, {
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        scale: 0.14,
        rotation: startRot,
        opacity: 0,
        zIndex: Math.floor(Math.random() * 6) + 32,
      });

      // 2. Quick fade in as item emerges
      tl.to(
        el,
        {
          opacity: 1,
          duration: 0.38,
          ease: "power1.out",
        },
        0
      );

      // 3. Zoom towards the user's face (scale up, travel outwards, rotate)
      tl.to(
        el,
        {
          x: `${endX}vw`,
          y: `${endY}vh`,
          scale: endScale,
          rotation: endRot,
          duration: duration,
          ease: "power2.inOut",
        },
        0
      );

      // 4. Disappear as it passes the user's face (fade out in final 32% of zoom)
      tl.to(
        el,
        {
          opacity: 0,
          scale: endScale * 1.22,
          duration: duration * 0.32,
          ease: "power2.in",
        },
        duration * 0.68
      );
    };

    const launchBatch = () => {
      if (!isVisibleRef.current || !itemsContainerRef.current) return;

      const available = ZOOM_ITEMS.filter((item) => !activeIdsRef.current.has(item.id));
      if (available.length === 0) return;

      // Random count: 1, 2, or 3 items at once
      const count = Math.min(
        available.length,
        Math.random() < 0.4 ? 1 : Math.random() < 0.78 ? 2 : 3
      );

      // Random selection without replacement
      const shuffledItems = [...available].sort(() => Math.random() - 0.5);
      const pickedItems = shuffledItems.slice(0, count);

      // Distinct directional zones for each picked item
      const shuffledZones = [...ZONES].sort(() => Math.random() - 0.5);

      pickedItems.forEach((item, idx) => {
        activeIdsRef.current.add(item.id);
        const zone = shuffledZones[idx % shuffledZones.length];
        const stagger = idx * randomBetween(90, 200);

        setTimeout(() => {
          if (!isVisibleRef.current || !itemsContainerRef.current) {
            activeIdsRef.current.delete(item.id);
            return;
          }
          const el = itemsContainerRef.current.querySelector<HTMLElement>(
            `[data-zoom-id="${item.id}"]`
          );
          if (el) {
            animateItem(el, item, zone);
          } else {
            activeIdsRef.current.delete(item.id);
          }
        }, stagger);
      });
    };

    const scheduleNext = () => {
      if (!isVisibleRef.current) return;
      const nextDelay = randomBetween(1300, 2400);
      spawnTimerRef.current = setTimeout(() => {
        launchBatch();
        scheduleNext();
      }, nextDelay);
    };

    // Intersection observer: only animate when in or near viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting && !wasVisible) {
          launchBatch();
          scheduleNext();
        } else if (!entry.isIntersecting && wasVisible) {
          if (spawnTimerRef.current) {
            clearTimeout(spawnTimerRef.current);
            spawnTimerRef.current = null;
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
      }
      activeIds.clear();
      // Reset all elements
      const items = container?.querySelectorAll<HTMLElement>(".zoom-food-item");
      if (items) {
        items.forEach((el) => {
          gsap.killTweensOf(el);
          gsap.set(el, { opacity: 0, scale: 0.15, x: 0, y: 0, rotation: 0 });
        });
      }
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="handi-house"
      aria-label="DUMBAAZ Indian Handi House — Interactive Food Experience"
      className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-cream px-5 py-20 text-center text-burgundy sm:px-10 lg:min-h-screen lg:py-28"
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

      {/* Autonomous Zooming Food Elements Stage (Preserves 3D perspective towards user) */}
      <div
        ref={itemsContainerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
          transform: `translate3d(${mouseParallax.x}px, ${mouseParallax.y}px, 0)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {ZOOM_ITEMS.map((item, idx) => (
          <div
            key={item.id}
            data-zoom-id={item.id}
            className="zoom-food-item pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 will-change-transform select-none sm:h-88 sm:w-88"
            style={{
              opacity: reducedMotion ? (idx < 3 ? 0.35 : 0) : 0,
              transform: reducedMotion
                ? `translate(-50%, -50%) translate(${((idx % 3) - 1) * 36}vw, ${(idx - 1) * 20}vh) scale(0.7)`
                : "translate(-50%, -50%) scale(0.15)",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={item.src}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 280px, 360px"
                className="object-contain drop-shadow-[0_24px_42px_rgba(43,7,14,0.4)]"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Central Content Card & Information (Always crisp, clear and uncluttered) */}
      <div className="relative z-20 mx-auto flex max-w-2xl flex-col items-center">
        {/* DUMBAAZ Handi Lid Crest */}
        <div className="flex items-center justify-center">
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
      </div>
    </section>
  );
}
