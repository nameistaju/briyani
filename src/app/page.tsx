import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { TurmericMarquee } from "@/components/ui/TurmericMarquee";
import { ScallopDivider } from "@/components/brand/ScallopDivider";
import { EditorialIntroSection } from "@/components/sections/EditorialIntroSection";
import { AssemblySection } from "@/components/assembly/AssemblySection";
import { SignatureMenuSection } from "@/components/sections/SignatureMenuSection";
import { KitchenStorySection } from "@/components/sections/KitchenStorySection";
import { BiryaniCultureSection } from "@/components/sections/BiryaniCultureSection";
import { VisitBannerFooter } from "@/components/sections/VisitBannerFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-burgundy text-cream">
      <Navbar />
      <main>
        <HeroSection />
        <TurmericMarquee />
        <EditorialIntroSection />
        <ScallopDivider topColor="#F5EFE0" bottomColor="#0E7D78" />
        <AssemblySection />
        <ScallopDivider topColor="#0E7D78" bottomColor="#F5EFE0" />
        <SignatureMenuSection />
        <ScallopDivider topColor="#F5EFE0" bottomColor="#9E1228" />
        <KitchenStorySection />
        <ScallopDivider topColor="#F5EFE0" bottomColor="#6E091A" />
        <BiryaniCultureSection />
        <ScallopDivider topColor="#9E1228" bottomColor="#F8B612" />
      </main>
      <VisitBannerFooter />
    </div>
  );
}
