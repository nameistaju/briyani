export interface HeroFloatingSpiceSpec {
  id: string;
  label: string;
  hindi: string;
  glbPath: string;
  previewPath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  floatSpeed: number;
  floatIntensity: number;
  rotationIntensity: number;
}

export interface AssemblyStepCopy {
  step: string;
  kicker: string;
  title: string;
  description: string;
  note: string;
  ingredientLabel: string;
}

export interface SignatureDishItem {
  id: string;
  name: string;
  hindi: string;
  category: string;
  price: string;
  description: string;
  image: string;
  tilt: string;
  surface: "photo" | "cutout";
}

export const BRAND = {
  name: "DUMBAAZ",
  neighborhood: "BRASS MARKET · COPPER HANDI",
  tagline: "Slow-Fired Saffron Dum Biryani",
  subTagline: "Charcoal-sealed copper handis, single-estate spices & toasted birista.",
  tickerItems: [
    "AGED BASMATI",
    "KASHMIRI SAFFRON",
    "COPPER HANDI",
    "24-HOUR MARINADE",
    "DOUGH-SEALED DUM",
    "CRISPY BIRISTA",
    "HOUSE RAITA",
  ],
  location: {
    city: "Old Quarter Flagship",
    addressLine1: "42 Saffron Alley, Brass Market District",
    addressLine2: "Open Tuesday – Sunday",
    hoursDinner: "Tue – Fri · 18:00 – 23:00",
    hoursWeekend: "Sat – Sun · 12:30 – 23:30",
    phone: "+1 (555) 014-8820",
    email: "table@dumbaaz.example",
  },
} as const;

export const ASSEMBLY_STEPS: AssemblyStepCopy[] = [
  {
    step: "01",
    kicker: "THE VESSEL",
    title: "Hammered copper meets glowing charcoal.",
    description:
      "A heavy-gauge tinned copper handi drops onto the hearth—storing steady thermal mass before the first grain lands.",
    note: "Calibrated cavity · 28.8 cm rim",
    ingredientLabel: "Copper Biryani Handi",
  },
  {
    step: "02",
    kicker: "THE FOUNDATION",
    title: "Aged long-grain basmati, saffron-kissed.",
    description:
      "Parboiled in whole-spice stock and layered with warm milk-infused Kashmiri saffron so every grain stays distinct and weightless.",
    note: "1,650+ individual baked grains",
    ingredientLabel: "Cooked Basmati Mound",
  },
  {
    step: "03",
    kicker: "THE HEART",
    title: "24-hour charred masala drumstick.",
    description:
      "Bone-in chicken marinated in hung curd, Kashmiri chilli, and roasted mace settles deep into the steamy rice pillow.",
    note: "Roast masala glaze & caramelized bone tip",
    ingredientLabel: "Spicy Chicken Drumstick",
  },
  {
    step: "04",
    kicker: "THE CRUNCH",
    title: "Slow-caramelized golden birista rain.",
    description:
      "Paper-thin red onion ribbons fried until shattering crisp shower across the vessel for bittersweet smoky crunch.",
    note: "Hand-torn onion spirals",
    ingredientLabel: "Crispy Fried Onions",
  },
  {
    step: "05",
    kicker: "THE AROMA",
    title: "Dewy garden mint & finishing steam.",
    description:
      "Fresh pudina leaves crowns the handi right before dough-sealing, releasing aromatic steam as the crust breaks tableside.",
    note: "Ready for the dum seal",
    ingredientLabel: "Fresh Mint & Dum Steam",
  },
];

export const SIGNATURE_DISHES: SignatureDishItem[] = [
  {
    id: "royal-feast",
    name: "SHAHI CHICKEN DUM HANDI",
    hindi: "शाही दम बिरयानी",
    category: "COPPER HANDI",
    price: "$24",
    description:
      "24-hour curd-marinated chicken, Kashmiri saffron aged basmati, golden birista & table-side dough break.",
    image: "/images/biryani-feast-overhead.webp",
    tilt: "-rotate-[1.5deg]",
    surface: "photo",
  },
  {
    id: "tandoori-char",
    name: "ANGARA TANDOORI HALF",
    hindi: "अंगारा तंदूरी",
    category: "CLAY OVEN",
    price: "$22",
    description:
      "Smoked on live white-oak embers with mustard oil, kasuri methi, and lime-pickled red onions.",
    image: "/images/dish-tandoori.webp",
    tilt: "rotate-[1.5deg]",
    surface: "cutout",
  },
  {
    id: "butter-makhani",
    name: "VELVET MURGH MAKHANI",
    hindi: "मुर्ग़ मखनी",
    category: "SLOW SIMMER",
    price: "$19",
    description:
      "Charred tandoor chicken simmered in sun-ripened heirloom tomato, churned butter & toasted fenugreek.",
    image: "/images/dish-butter-chicken.webp",
    tilt: "-rotate-[1deg]",
    surface: "cutout",
  },
  {
    id: "badami-korma",
    name: "SHAHI BADAMI KORMA",
    hindi: "बादामी कोरमा",
    category: "ROYAL GRAVY",
    price: "$21",
    description:
      "Silky blanched almond, green cardamom, and caramelized onion gravy fragrant with kewra water.",
    image: "/images/dish-korma.webp",
    tilt: "rotate-[1.2deg]",
    surface: "cutout",
  },
  {
    id: "saag-paneer",
    name: "GARHWAL SAAG PANEER",
    hindi: "साग पनीर",
    category: "HEARTH POT",
    price: "$18",
    description:
      "Pressed house cottage cheese folded into slow-wilted mustard greens, roasted garlic & whole cumin.",
    image: "/images/dish-paneer.webp",
    tilt: "-rotate-[1.2deg]",
    surface: "cutout",
  },
  {
    id: "punjabi-samosa",
    name: "KHUSHBOO PATTI SAMOSAS",
    hindi: "खस्ता समोसा",
    category: "CRISPY STARTER",
    price: "$11",
    description:
      "Flaky ajwain pastry parcels stuffed with spiced potato, green peas & mint-tamarind glaze.",
    image: "/images/dish-samosas.webp",
    tilt: "rotate-[1.6deg]",
    surface: "cutout",
  },
];
