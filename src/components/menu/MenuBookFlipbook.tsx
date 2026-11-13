"use client";

import React, { useEffect, useRef, useState } from "react";
import { GrabfoldBook, type GrabfoldBookHandle, type PageRef } from "grabfold/react";
import { createPageTurnSound, type PageTurnSound } from "grabfold/sound";
import { defaultBoardTurnTakes, defaultPageTurnTakes } from "grabfold/sounds";
import {
  FrontCoverPage,
  InsideFrontCoverPage,
  PhilosophyIndexPage,
  StartersFeaturePage,
  StartersListPage,
  ChickenBiryaniFeaturePage,
  ChickenBiryaniListPage,
  MuttonBiryaniFeaturePage,
  MuttonBiryaniListPage,
  SpecialHandisPage,
  KebabsListPage,
  CurriesBreadsPage,
  DessertsDrinksPage,
  PrivateDiningPage,
  InsideBackCoverPage,
  BackCoverPage,
} from "./pages/MenuPages";
import { CustomCircularCursor, type CursorDirection } from "./CustomCircularCursor";

interface MenuBookFlipbookProps {
  position: number;
  onPositionChange: (pos: number) => void;
  soundEnabled: boolean;
}

export function MenuBookFlipbook({
  position,
  onPositionChange,
  soundEnabled,
}: MenuBookFlipbookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<GrabfoldBookHandle>(null);
  const soundRef = useRef<PageTurnSound | null>(null);

  const [cursorDirection, setCursorDirection] = useState<CursorDirection>("open");
  const [isFlipping, setIsFlipping] = useState(false);

  // Initialize Web Audio paper turn sounds
  useEffect(() => {
    if (typeof window !== "undefined" && !soundRef.current) {
      try {
        const soundInstance = createPageTurnSound({
          takes: defaultPageTurnTakes,
          boardTakes: defaultBoardTurnTakes,
          volume: 0.65,
          mirrorBack: true,
        });
        soundInstance.preload().catch(() => {});
        soundRef.current = soundInstance;
      } catch {
        // Fallback for restricted audio environments
      }
    }

    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  // Update sound mute status in the audio instance
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  // TurnSound adapter callback: called only during animation events, never during render
  const turnSound = React.useMemo(
    () => ({
      play: (event: import("grabfold/react").TurnEvent) => {
        if (soundEnabled && soundRef.current) {
          soundRef.current.play(event);
        }
      },
    }),
    [soundEnabled]
  );

  // Keyboard navigation (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (!isFlipping && bookRef.current?.canNext()) {
          bookRef.current.next();
        }
      } else if (e.key === "ArrowLeft") {
        if (!isFlipping && bookRef.current?.canPrev()) {
          bookRef.current.prev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipping]);

  // Dispatch page rendering based on PageRef model
  const renderMenuPage = (page: PageRef) => {
    if (page.kind === "cover") {
      if (page.side === "front") {
        return page.face === "outside" ? <FrontCoverPage /> : <InsideFrontCoverPage />;
      }
      if (page.side === "back") {
        return page.face === "inside" ? <InsideBackCoverPage /> : <BackCoverPage />;
      }
    }

    if (page.kind === "front") {
      switch (page.sheet) {
        case 0:
          return <PhilosophyIndexPage />;
        case 1:
          return <StartersListPage />;
        case 2:
          return <ChickenBiryaniListPage />;
        case 3:
          return <MuttonBiryaniListPage />;
        case 4:
          return <KebabsListPage />;
        case 5:
          return <DessertsDrinksPage />;
        default:
          return <InsideBackCoverPage />;
      }
    }

    if (page.kind === "back") {
      switch (page.sheet) {
        case 0:
          return <StartersFeaturePage />;
        case 1:
          return <ChickenBiryaniFeaturePage />;
        case 2:
          return <MuttonBiryaniFeaturePage />;
        case 3:
          return <SpecialHandisPage />;
        case 4:
          return <CurriesBreadsPage />;
        case 5:
          return <PrivateDiningPage />;
        default:
          return <InsideBackCoverPage />;
      }
    }

    return null;
  };

  // Mouse hover direction logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;

    if (position === -2) {
      setCursorDirection("open");
    } else if (position === 6) {
      setCursorDirection("prev");
    } else if (ratio < 0.5) {
      setCursorDirection(position === -1 ? "close-prev" : "prev");
    } else {
      setCursorDirection(position === 5 ? "close-next" : "next");
    }
  };

  // Click on book turns forward or back smoothly
  const handleBookClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipping || !containerRef.current || !bookRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;

    if (position === -2) {
      bookRef.current.next();
    } else if (position === 6) {
      bookRef.current.prev();
    } else if (ratio < 0.5) {
      if (bookRef.current.canPrev()) {
        bookRef.current.prev();
      }
    } else {
      if (bookRef.current.canNext()) {
        bookRef.current.next();
      }
    }
  };

  const isCover = position === -2;
  const isBackCover = position === 6;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleBookClick}
      className="relative mx-auto flex h-[580px] w-full max-w-[960px] items-center justify-center overflow-visible sm:h-[680px] lg:h-[720px] select-none [cursor:none]"
    >
      {/* Signature Custom Circular Cursor */}
      <CustomCircularCursor
        containerRef={containerRef}
        direction={cursorDirection}
        isCover={isCover}
        isBackCover={isBackCover}
        isFlipping={isFlipping}
      />

      {/* Realistic Deep Drop Shadow Underneath Book */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 h-12 w-[90%] rounded-full bg-black/45 blur-2xl"
      />

      {/* Grabfold Flipbook Instance */}
      <GrabfoldBook
        ref={bookRef}
        sheets={6}
        covers="hard"
        pageRatio={3 / 4}
        fit="contain"
        spreadQuery="(min-width: 768px)"
        duration={720}
        position={position}
        onPositionChange={onPositionChange}
        onTurnStart={() => setIsFlipping(true)}
        onTurn={() => setIsFlipping(false)}
        renderPage={renderMenuPage}
        sound={turnSound}
        className="h-full w-full"
      />
    </div>
  );
}
