import React from "react";
import Image from "next/image";

interface WebGLFallbackProps {
  imageSrc: string;
  alt: string;
  caption?: string;
}

export function WebGLFallback({
  imageSrc,
  alt,
  caption = "Interactive 3D requires WebGL — showing studio render",
}: WebGLFallbackProps) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 640px) 256px, 320px"
          className="object-contain drop-shadow-[0_18px_28px_rgba(35,9,12,0.55)]"
          priority
        />
      </div>
      <p className="mt-3 border border-cream/30 bg-burgundy-deep/90 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cream">
        {caption}
      </p>
    </div>
  );
}
