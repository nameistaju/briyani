export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  formattedPrice: string;
  image?: string;
  tags?: string[];
  isVegetarian: boolean;
  isSpicy?: boolean;
  serving?: string;
  pairing?: string;
  available: boolean;
}

export interface MenuSpreadData {
  id: string;
  chapterNumber: string;
  title: string;
  subtitle: string;
  description: string;
  featuredDish: MenuItem;
  items: MenuItem[];
}

export const MENU_BOOK_DATA: Record<string, MenuSpreadData> = {
  starters: {
    id: "starters",
    chapterNumber: "CHAPTER I",
    title: "SHAHI STARTERS",
    subtitle: "From The Clay Ovens & Tawa Griddles",
    description:
      "Tender cuts marinated in cold-pressed mustard oil, green cardamom, and hung curd, charred over fragrant charcoal embers.",
    featuredDish: {
      id: "galouti-kebab",
      name: "Mutton Galouti Kebab",
      category: "Starters",
      description:
        "Silken Awadhi minced lamb patties infused with raw papaya, rose petal essence, and 24 secret potli spices, griddled on iron tawa and served on saffron ulta tawa paratha.",
      price: 520,
      formattedPrice: "₹520",
      image: "/images/zoom/Grilled Tandoori Chicken Skewers.webp",
      tags: ["Signature", "Chef's Cut"],
      isVegetarian: false,
      isSpicy: false,
      serving: "4 Pieces & Paratha",
      pairing: "Mint-Coriander Chutney & Laccha Onion",
      available: true,
    },
    items: [
      {
        id: "samosa-chaat",
        name: "Purani Dilli Samosa Chaat",
        category: "Starters",
        description:
          "Hand-pinched spiced potato and green pea samosas crushed over slow-braised pindi chana, sweet sonth tamarind, and chilled sweet curd.",
        price: 280,
        formattedPrice: "₹280",
        tags: ["Vegetarian", "Old Delhi"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "murgh-malai-tikka",
        name: "Murgh Malai Tikka",
        category: "Starters",
        description:
          "Boneless chicken morsels steeped in processed cream cheese, crushed green cardamom, and white pepper, roasted gently on iron skewers.",
        price: 440,
        formattedPrice: "₹440",
        tags: ["Mild & Creamy"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "paneer-angara-tikka",
        name: "Paneer Angara Tikka",
        category: "Starters",
        description:
          "Fresh malai paneer cubes rubbed with smoky Mathania chili marinade, roasted bell peppers, and hung curd, finished with smoked ghee.",
        price: 380,
        formattedPrice: "₹380",
        tags: ["Vegetarian", "Smoked"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "amritsari-machhi",
        name: "Crispy Amritsari Machhi",
        category: "Starters",
        description:
          "Fresh river sole fillets tossed in coarse ajwain and yellow chili gram flour batter, flash fried to a crisp golden shell.",
        price: 490,
        formattedPrice: "₹490",
        image: "/images/zoom/Crispy Spiced Fish on Banana Leaf.webp",
        tags: ["Crisp Catch"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "dahi-ke-kebab",
        name: "Gilded Dahi Ke Kebab",
        category: "Starters",
        description:
          "Velvety hung yogurt dumplings blended with roasted cumin, finely chopped ginger, and pomegranate seeds, pan-seared in pure ghee.",
        price: 360,
        formattedPrice: "₹360",
        tags: ["Vegetarian", "Melt-in-mouth"],
        isVegetarian: true,
        available: true,
      },
    ],
  },

  chickenBiryani: {
    id: "chicken-biryani",
    chapterNumber: "CHAPTER II",
    title: "CHICKEN DUM BIRYANI",
    subtitle: "Sealed With Wheat Dough On Embers",
    description:
      "Aged 24-month basmati rice layered with bone-in country chicken, steeped in rich yakhni stock and natural Kashmiri saffron cream.",
    featuredDish: {
      id: "dumbaaz-signature-chicken",
      name: "DUMBAAZ Signature Chicken Dum Biryani",
      category: "Chicken Biryani",
      description:
        "Tender bone-in chicken thighs marinated overnight in A2 cow milk curd, shahi garam masala, and wild mint. Baked under a charcoal-topped copper handi with aged basmati and golden fried birista.",
      price: 480,
      formattedPrice: "₹480",
      image: "/images/zoom/Glossy Grilled Chicken Drumstick.webp",
      tags: ["House Signature", "Dough-Sealed"],
      isVegetarian: false,
      isSpicy: true,
      serving: "Serves 1–2 (with Burani Raita & Mirchi Ka Salan)",
      pairing: "Pairs with Roasted Papad & Pickled Baby Onions",
      available: true,
    },
    items: [
      {
        id: "awadhi-murgh-pukhtan",
        name: "Awadhi Murgh Pukhtan Biryani",
        category: "Chicken Biryani",
        description:
          "A delicate white gravy biryani inspired by the royal kitchens of Lucknow, infused with kewra essence, green cardamom, and edible silver vark.",
        price: 510,
        formattedPrice: "₹510",
        tags: ["Mild & Floral", "Nawabi"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "kolkata-chicken-biryani",
        name: "Kolkata Special Chicken Dum Biryani",
        category: "Chicken Biryani",
        description:
          "Fragrant, feather-light basmati steamed with sweet spices, featuring the legendary melt-in-the-mouth slow-braised golden potato and boiled farm egg.",
        price: 460,
        formattedPrice: "₹460",
        tags: ["Kolkata Heritage", "With Potato & Egg"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "hyderabadi-kachhi-murgh",
        name: "Hyderabadi Kachhi Gosht Murgh Biryani",
        category: "Chicken Biryani",
        description:
          "Spicy raw marinated chicken layered raw beneath semi-cooked fragrant rice, cooked slowly on low heat so the natural chicken juices steam through every grain.",
        price: 490,
        formattedPrice: "₹490",
        tags: ["Fiery & Aromatic"],
        isVegetarian: false,
        available: true,
      },
    ],
  },

  muttonBiryani: {
    id: "mutton-biryani",
    chapterNumber: "CHAPTER III",
    title: "MUTTON DUM BIRYANI",
    subtitle: "Tender Goat Shank & Yakhni Basmati",
    description:
      "Selected cuts of baby goat shoulder and marrow bone, slow-simmered in copper cauldrons with aromatic cinnamon bark and mace.",
    featuredDish: {
      id: "shahi-nalli-gosht-biryani",
      name: "Shahi Nalli Gosht Biryani",
      category: "Mutton Biryani",
      description:
        "Prime lamb shank with rich bone marrow, slow-braised for 5 hours in caramelized onion jus and layered with long-grain saffron rice, fresh mint, and cracked cardamom pods.",
      price: 680,
      formattedPrice: "₹680",
      image: "/images/zoom/Rustic Copper Bowl of Nalli Gosht.webp",
      tags: ["Crown Jewel", "Slow-Braised 5 Hrs"],
      isVegetarian: false,
      isSpicy: true,
      serving: "Serves 1–2 (with Burani Raita & Mirchi Ka Salan)",
      pairing: "Marrow Spoon & Garlic Laccha Paratha",
      available: true,
    },
    items: [
      {
        id: "kacche-gosht-mutton",
        name: "Kacche Gosht Ki Dum Biryani",
        category: "Mutton Biryani",
        description:
          "Tender goat pieces steeped in raw green papaya paste, dark roasted onions, and whole spices, sealed with a dough rim on dying embers.",
        price: 640,
        formattedPrice: "₹640",
        tags: ["Traditional Nizami"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "lucknowi-mutton-biryani",
        name: "DUMBAAZ Lucknowi Mutton Biryani",
        category: "Mutton Biryani",
        description:
          "Rice cooked directly in spiced mutton stock (yakhni), fragrant with rose water and crushed mace, with succulent boneless goat cubes.",
        price: 620,
        formattedPrice: "₹620",
        image: "/images/zoom/Copper Bowl of Mutton Biryani.webp",
        tags: ["Royal Awadh"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "bohri-smoked-mutton",
        name: "Bohri Charcoal Smoked Mutton Biryani",
        category: "Mutton Biryani",
        description:
          "Community recipe smoked with red-hot coal and clove infusion, enriched with dried prunes, whole black peppercorns, and pure clarified butter.",
        price: 650,
        formattedPrice: "₹650",
        tags: ["Clove-Smoked"],
        isVegetarian: false,
        available: true,
      },
    ],
  },

  specialHandis: {
    id: "special-handis",
    chapterNumber: "CHAPTER IV",
    title: "GRAND HANDIS & VEGETARIAN",
    subtitle: "Celebration Feasts & Garden Harvests",
    description:
      "Handcrafted sharing portions served inside traditional hand-hammered copper vessels, accompanied by our signature table sides.",
    featuredDish: {
      id: "royal-grand-dawat-handi",
      name: "Royal Grand Dawat Handi",
      category: "Special Handis",
      description:
        "A lavish feast for family tables: slow-roasted chicken drumsticks, tender braised mutton shanks, spiced quail eggs, and golden saffron rice topped with cashews, raisins, and crisp birista.",
      price: 1850,
      formattedPrice: "₹1,850",
      image: "/images/zoom/Hammered Copper Bowl of Mixed Biryani.webp",
      tags: ["Feast For 4–5", "Family Platter"],
      isVegetarian: false,
      isSpicy: true,
      serving: "Serves 4–5 Guests",
      pairing: "Double portion of Raita, Salan, and Choice of Breads",
      available: true,
    },
    items: [
      {
        id: "subz-dum-biryani",
        name: "Subz Tarkari Dum Biryani",
        category: "Special Handis",
        description:
          "Seasonal farm vegetables, baby potatoes, green peas, and fresh malai paneer cubes simmered in spiced brown gravy and layered with basmati.",
        price: 410,
        formattedPrice: "₹410",
        image: "/images/zoom/Steaming Chicken Biryani in Clay Bowl.webp",
        tags: ["Vegetarian", "Clay Pot"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "kathal-dum-biryani",
        name: "Raw Jackfruit (Kathal) Dum Biryani",
        category: "Special Handis",
        description:
          "Tender young green jackfruit cooked exactly like goat meat, absorbing the rich roasted spices and caramelized onion sweetness.",
        price: 430,
        formattedPrice: "₹430",
        tags: ["Vegetarian", "Meat-like Texture"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "tawa-prawn-biryani",
        name: "Coastal Masala Prawn Biryani",
        category: "Special Handis",
        description:
          "Fresh sea prawns flash-tossed on an iron tawa with crushed curry leaves, black pepper, and lime, layered with fragrant saffron rice.",
        price: 690,
        formattedPrice: "₹690",
        image: "/images/zoom/Spicy Masala Prawns with Lime and Herbs.webp",
        tags: ["Seafood Special"],
        isVegetarian: false,
        available: true,
      },
    ],
  },

  kebabsAndGrills: {
    id: "kebabs-and-grills",
    chapterNumber: "CHAPTER V",
    title: "TANDOOR & CHARCOAL GRILLS",
    subtitle: "Smoked Over Wood Embers & Iron Skewers",
    description:
      "Traditional charcoal grilling technique where high heat seals in succulence, brushed with lemon butter and fresh herb oil.",
    featuredDish: {
      id: "kakori-kebab",
      name: "Charcoal-Smoked Kakori Kebabs",
      category: "Kebabs & Grills",
      description:
        "The most delicate skewer kebab in Indian history. Finely pounded lamb kidney fat, roasted chana, saffron, and cloves, so tender it dissolves instantly on the palate.",
      price: 560,
      formattedPrice: "₹560",
      image: "/images/zoom/Grilled Chicken and Colorful Pepper Skewer.webp",
      tags: ["Heritage Recipe", "Legendary"],
      isVegetarian: false,
      isSpicy: false,
      serving: "4 Long Skewers",
      pairing: "Roomali Roti & Laccha Onions",
      available: true,
    },
    items: [
      {
        id: "bhatti-da-murgh",
        name: "Bhatti Da Murgh (Half / Full)",
        category: "Kebabs & Grills",
        description:
          "Bone-in chicken steeped in roasted coriander seed, black cardamom, and degi mirch marinade, roasted over live coals to a blistered finish.",
        price: 460,
        formattedPrice: "₹460",
        image: "/images/zoom/Glazed Grilled Chicken with Herbs and Salsa.webp",
        tags: ["Char-Grilled"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "tandoori-jhinga",
        name: "Tandoori Jumbo Jhinga",
        category: "Kebabs & Grills",
        description:
          "Fresh jumbo tiger prawns rubbed with yellow mustard oil, crushed carom seeds, and yogurt, clay-baked to smoky perfection.",
        price: 720,
        formattedPrice: "₹720",
        tags: ["Chef's Pick"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "chapli-kebab",
        name: "Peshawari Chapli Kebab",
        category: "Kebabs & Grills",
        description:
          "Crisp-edged minced meat patties studded with crushed dried pomegranate seeds, roasted coriander, green chilies, and ripe tomato slices.",
        price: 490,
        formattedPrice: "₹490",
        tags: ["Crisp & Tangy"],
        isVegetarian: false,
        available: true,
      },
    ],
  },

  curriesAndBreads: {
    id: "curries-and-breads",
    chapterNumber: "CHAPTER VI",
    title: "SLOW CURRIES & TANDOORI BREADS",
    subtitle: "Simmered In Degs & Baked On Clay Walls",
    description:
      "Rich gravies crafted with hand-ground spices and clarified butter, made for tearing hot artisan breads straight from the tandoor.",
    featuredDish: {
      id: "dal-dumbaaz",
      name: "Slow-Fired Dal DUMBAAZ",
      category: "Curries & Breads",
      description:
        "Whole black urad lentils and red kidney beans simmered continuously for 24 hours on slow charcoal embers, enriched with hand-churned white butter and vine-ripened tomatoes.",
      price: 390,
      formattedPrice: "₹390",
      image: "/images/zoom/Overhead Chicken Curry in Wooden Bowl.webp",
      tags: ["24-Hour Charcoal Simmer", "Vegetarian"],
      isVegetarian: true,
      isSpicy: false,
      serving: "Serves 2 Guests",
      pairing: "Tandoori Garlic Butter Naan",
      available: true,
    },
    items: [
      {
        id: "nalli-nihari",
        name: "Old City Nalli Nihari",
        category: "Curries & Breads",
        description:
          "Mughal morning stew of slow-cooked mutton shanks in a rich spiced marrow reduction, finished with julienned ginger, green chilies, and lime.",
        price: 610,
        formattedPrice: "₹610",
        tags: ["Marrow Stew"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "murgh-makhani-1947",
        name: "Murgh Makhani 1947",
        category: "Curries & Breads",
        description:
          "Shredded tandoori chicken cooked in a velvety tomato, cashew, and honey reduction, scented with sun-dried Kasuri methi and butter.",
        price: 480,
        formattedPrice: "₹480",
        tags: ["Classic Butter Chicken"],
        isVegetarian: false,
        available: true,
      },
      {
        id: "artisan-bread-basket",
        name: "Artisan Tandoori Bread Basket",
        category: "Curries & Breads",
        description:
          "Assortment of Khamiri Roti, Garlic Chur Chur Naan, and Laccha Paratha, baked fresh on the inner clay wall of our charcoal tandoor.",
        price: 240,
        formattedPrice: "₹240",
        tags: ["Fresh From Tandoor", "Vegetarian"],
        isVegetarian: true,
        available: true,
      },
    ],
  },

  dessertsAndDrinks: {
    id: "desserts-and-drinks",
    chapterNumber: "CHAPTER VII",
    title: "ROYAL SWEETS & REFRESHMENTS",
    subtitle: "Sweet Endings & Cooling Sips",
    description:
      "Centuries-old confectionary traditions made with whole milk, saffron, and edible floral waters to balance the warmth of dum spices.",
    featuredDish: {
      id: "shahi-tukda",
      name: "Royal Shahi Tukda with Rabri",
      category: "Desserts & Drinks",
      description:
        "Golden ghee-crisped milk bread soaked in green cardamom and saffron syrup, layered with slow-reduced malai rabri, roasted pistachios, and silver leaf.",
      price: 290,
      formattedPrice: "₹290",
      tags: ["Nawabi Sweet", "House Special"],
      isVegetarian: true,
      isSpicy: false,
      serving: "Platter For 2",
      pairing: "Served Warm with Cold Rabri",
      available: true,
    },
    items: [
      {
        id: "zafrani-matka-phirni",
        name: "Zafrani Matka Phirni",
        category: "Desserts & Drinks",
        description:
          "Creamy ground basmati rice pudding slowly simmered with full-fat milk and saffron, chilled in porous unglazed terracotta pots.",
        price: 240,
        formattedPrice: "₹240",
        tags: ["Chilled Terracotta", "Vegetarian"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "kashmiri-noon-chai",
        name: "Kashmiri Pink Noon Chai",
        category: "Desserts & Drinks",
        description:
          "Slow-brewed green tea leaves aerated with a pinch of baking soda, whole milk, crushed almonds, and a delicate touch of sea salt.",
        price: 180,
        formattedPrice: "₹180",
        tags: ["Pink Tea"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "saffron-mango-lassi",
        name: "Kesar Mango Malai Lassi",
        category: "Desserts & Drinks",
        description:
          "Thick hand-churned curd blended with Ratnagiri Alphonso mango pulp, saffron strands, and a thick dollop of clotted cream.",
        price: 210,
        formattedPrice: "₹210",
        tags: ["Chilled Cooler"],
        isVegetarian: true,
        available: true,
      },
      {
        id: "smoked-aam-panna",
        name: "Wood-Smoked Aam Panna",
        category: "Desserts & Drinks",
        description:
          "Charcoal-roasted raw green mango cooler infused with roasted black cumin, mint, and Himalayan pink rock salt.",
        price: 160,
        formattedPrice: "₹160",
        tags: ["Digestive Tonic"],
        isVegetarian: true,
        available: true,
      },
    ],
  },
};
