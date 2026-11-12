import type { HeroFloatingSpiceSpec } from "./brand";

export interface HeroAssemblyTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

/**
 * Metric coordinates (1 unit = 1 meter) verified against copper-handi's
 * `rice-cavity` (`[0, 0.075, 0]`) and `rim-top` (`[0, 0.160, 0]`) sockets.
 * Inside R3F scenes we wrap the assembly in a parent `<group scale={11.5}>`.
 */
export const HERO_MODELS = {
  copperHandi: {
    slug: "copper-handi",
    label: "Hammered Copper Handi",
    url: "/3d-assets/optimized/hero/copper-handi.glb",
    originalUrl: "/3d-assets/hero/copper-handi.glb",
    previewUrl: "/3d-assets/previews/copper-handi-hero.png",
    assembled: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: 1,
    } satisfies HeroAssemblyTransform,
  },
  biryaniRiceMound: {
    slug: "biryani-rice-mound",
    label: "Basmati Biryani Rice Mound",
    url: "/3d-assets/optimized/hero/biryani-rice-mound.glb",
    originalUrl: "/3d-assets/hero/biryani-rice-mound.glb",
    previewUrl: "/3d-assets/previews/biryani-rice-mound-hero.png",
    assembled: {
      position: [0, 0.068, 0],
      rotation: [0, 0, 0],
      scale: 1,
    } satisfies HeroAssemblyTransform,
  },
  chickenDrumstick: {
    slug: "chicken-drumstick",
    label: "Spicy Masala Chicken Drumstick",
    url: "/3d-assets/optimized/hero/chicken-drumstick.glb",
    originalUrl: "/3d-assets/hero/chicken-drumstick.glb",
    previewUrl: "/3d-assets/previews/chicken-drumstick-hero.png",
    assembled: {
      position: [0.012, 0.175, 0.016],
      rotation: [0.45, 0.65, -0.92],
      scale: 0.86,
    } satisfies HeroAssemblyTransform,
  },
  friedOnions: {
    slug: "fried-onions",
    label: "Crispy Fried Onions",
    url: "/3d-assets/optimized/hero/fried-onions.glb",
    originalUrl: "/3d-assets/hero/fried-onions.glb",
    previewUrl: "/3d-assets/previews/fried-onions-hero.png",
    assembled: {
      position: [-0.022, 0.176, -0.01],
      rotation: [0.08, 0.42, -0.06],
      scale: 0.54,
    } satisfies HeroAssemblyTransform,
  },
  mintLeaves: {
    slug: "mint-leaves",
    label: "Dewy Mint Leaves",
    url: "/3d-assets/optimized/hero/mint-leaves.glb",
    originalUrl: "/3d-assets/hero/mint-leaves.glb",
    previewUrl: "/3d-assets/previews/mint-leaves-hero.png",
    assembled: {
      position: [-0.015, 0.208, 0.018],
      rotation: [0.12, -0.35, 0.08],
      scale: 0.58,
    } satisfies HeroAssemblyTransform,
  },
} as const;

export const HERO_FLOATING_SPICES: HeroFloatingSpiceSpec[] = [
  {
    id: "star-anise-left",
    label: "Star Anise",
    hindi: "Chakra Phool",
    glbPath: "/3d-assets/optimized/ingredients/star-anise.glb",
    previewPath: "/3d-assets/previews/star-anise-hero.png",
    position: [-2.45, 1.35, -0.5],
    rotation: [0.7, 0.4, -0.3],
    scale: 13,
    floatSpeed: 1.5,
    floatIntensity: 0.42,
    rotationIntensity: 0.35,
  },
  {
    id: "cardamom-top-right",
    label: "Green Cardamom",
    hindi: "Elaichi",
    glbPath: "/3d-assets/optimized/ingredients/cardamom-pods.glb",
    previewPath: "/3d-assets/previews/cardamom-pods-hero.png",
    position: [2.25, 1.55, 0.35],
    rotation: [-0.35, 0.85, 0.4],
    scale: 11,
    floatSpeed: 1.8,
    floatIntensity: 0.36,
    rotationIntensity: 0.45,
  },
  {
    id: "cinnamon-right-low",
    label: "Cassia Cinnamon",
    hindi: "Dalchini",
    glbPath: "/3d-assets/optimized/ingredients/cinnamon-sticks.glb",
    previewPath: "/3d-assets/previews/cinnamon-sticks-hero.png",
    position: [2.65, -0.65, -0.45],
    rotation: [0.5, -0.6, 0.35],
    scale: 8.2,
    floatSpeed: 1.25,
    floatIntensity: 0.35,
    rotationIntensity: 0.25,
  },
  {
    id: "chili-duo-left-low",
    label: "Kashmiri & Green Chili",
    hindi: "Mirchi",
    glbPath: "/3d-assets/optimized/ingredients/chili-duo.glb",
    previewPath: "/3d-assets/previews/chili-duo-hero.png",
    position: [-2.55, -0.82, 0.25],
    rotation: [-0.25, 0.5, -0.4],
    scale: 7.5,
    floatSpeed: 1.65,
    floatIntensity: 0.4,
    rotationIntensity: 0.3,
  },
  {
    id: "saffron-top-left",
    label: "Kashmiri Saffron",
    hindi: "Kesar",
    glbPath: "/3d-assets/optimized/ingredients/saffron-threads.glb",
    previewPath: "/3d-assets/previews/saffron-threads-hero.png",
    position: [-1.45, 2.05, 0.6],
    rotation: [0.3, 0.2, 0.45],
    scale: 9.5,
    floatSpeed: 2.0,
    floatIntensity: 0.32,
    rotationIntensity: 0.25,
  },
  {
    id: "cloves-bottom-right",
    label: "Whole Cloves",
    hindi: "Laung",
    glbPath: "/3d-assets/optimized/ingredients/cloves.glb",
    previewPath: "/3d-assets/previews/cloves-hero.png",
    position: [1.55, -1.35, 0.75],
    rotation: [0.55, 0.3, -0.5],
    scale: 11.5,
    floatSpeed: 1.7,
    floatIntensity: 0.3,
    rotationIntensity: 0.4,
  },
  {
    id: "bay-leaves-back",
    label: "Bay Leaves",
    hindi: "Tej Patta",
    glbPath: "/3d-assets/optimized/ingredients/bay-leaves.glb",
    previewPath: "/3d-assets/previews/bay-leaves-hero.png",
    position: [0.35, 2.15, -1.15],
    rotation: [0.4, -0.55, 0.2],
    scale: 7.8,
    floatSpeed: 1.3,
    floatIntensity: 0.38,
    rotationIntensity: 0.25,
  },
];
