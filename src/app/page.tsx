import React from "react";
import { Preloader } from "@/components/ui/Preloader";
import { Navbar } from "@/components/ui/Navbar";
import { HeroSection } from "@/components/hero/HeroSection";
import { RickshawDeliveryBar } from "@/components/ui/RickshawDeliveryBar";
import { ScallopDivider } from "@/components/brand/ScallopDivider";
import { EditorialIntroSection } from "@/components/sections/EditorialIntroSection";
import { AssemblySection } from "@/components/assembly/AssemblySection";
import { MenuBookSection } from "@/components/menu/MenuBookSection";
import { KitchenStorySection } from "@/components/sections/KitchenStorySection";
import { BiryaniCultureSection } from "@/components/sections/BiryaniCultureSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-burgundy text-cream">
      <Preloader />
      <Navbar />
      <main>
        <HeroSection />
        <RickshawDeliveryBar />
        <EditorialIntroSection />
        <ScallopDivider topColor="#F5EFE0" bottomColor="#0E7D78" />
        <AssemblySection />
        <ScallopDivider topColor="#0E7D78" bottomColor="#292421" />
        <MenuBookSection />
        <ScallopDivider topColor="#292421" bottomColor="#9E1228" />
        <KitchenStorySection />
        <ScallopDivider topColor="#F5EFE0" bottomColor="#183EF5" />
        <BiryaniCultureSection />
      </main>
    </div>
  );
}
