"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export type CursorDirection = "next" | "prev" | "open" | "close-prev" | "close-next" | "hidden";

interface CustomCircularCursorProps {
  containerRef: React.RefObject<HTMLElement | null>;
  direction: CursorDirection;
  isCover: boolean;
  isBackCover: boolean;
  isFlipping?: boolean;
}

export function CustomCircularCursor({
  containerRef,
  direction,
  isCover,
  isBackCover,
  isFlipping = false,
}: CustomCircularCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Lazy initialization of touch detection without setting state inside useEffect
  const [isTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  });

  // Position coordinates and target coordinates for smooth physics interpolation
  const posRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTouchDevice || reducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      posRef.current.targetX = x;
      posRef.current.targetY = y;

      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => {
      setIsVisible(false);
      setIsPressed(false);
    };
    const onMouseDown = () => setIsPressed(true);
    const onMouseUp = () => setIsPressed(false);

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseup", onMouseUp);

    // Smooth animation loop for silky pointer tracking
    const loop = () => {
      const p = posRef.current;
      const ease = 0.22; // Quick responsive follow without lag
      p.x += (p.targetX - p.x) * ease;
      p.y += (p.targetY - p.y) * ease;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${
          isPressed ? 0.92 : 1
        })`;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseup", onMouseUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [containerRef, isTouchDevice, reducedMotion, isVisible, isPressed]);

  if (isTouchDevice || reducedMotion) return null;

  // Determine dynamic badge text and arrow icon
  let text = "TURN PAGE";
  let arrow = "↗";

  if (isCover) {
    text = "OPEN MENU";
    arrow = "↗";
  } else if (isBackCover) {
    text = "GO BACK";
    arrow = "↖";
  } else if (direction === "prev" || direction === "close-prev") {
    text = direction === "close-prev" ? "CLOSE MENU" : "GO BACK";
    arrow = "↖";
  } else if (direction === "next" || direction === "close-next") {
    text = direction === "close-next" ? "CLOSE BOOK" : "TURN PAGE";
    arrow = "↗";
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 left-0 z-50 flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full border-[1.5px] border-[#762D35] bg-[#F5EBDD] text-[#762D35] shadow-[0_12px_30px_rgba(118,45,53,0.28)] transition-opacity duration-200 select-none ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        willChange: "transform, opacity",
      }}
    >
      <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase">
        {text}
      </span>
      <span className="mt-0.5 text-base leading-none font-bold text-[#762D35]">
        {isFlipping ? "..." : arrow}
      </span>
      <span className="mt-1 text-[8px] font-semibold tracking-[0.2em] text-[#762D35]/70 uppercase">
        DUMBAAZ
      </span>
    </div>
  );
}
