import type { Product } from "./types";

function img(slug: string, n: number) {
  return `/products/${slug}/${n}.jpg`;
}
function thumb(slug: string, n: number) {
  return `/products/${slug}/${n}-thumb.jpg`;
}

export const products: Product[] = [
  {
    id: "prod_imperial",
    slug: "imperial",
    name: "Imperial",
    fullName: "me. Imperial",
    tagline: "Amber gold, worn like a crown.",
    category: "Oriental",
    concentration: "Eau de Parfum",
    accent: "#D89A2B",
    description:
      "A dense, sunlit amber built for presence. Imperial opens with saffron and bergamot, settles into a rose-amber heart, and dries down into oud, vanilla and warm musk — the kind of scent that arrives in a room before you do.",
    story:
      "Imperial was built around a single idea: gold shouldn't whisper. Saffron threads and Kashmiri amber are layered until the scent reads less like a fragrance and more like a piece of jewellery — dense, warm, and unmistakably confident.",
    notes: {
      top: ["Saffron", "Bergamot", "Pink Pepper"],
      heart: ["Bulgarian Rose", "Amber", "Cinnamon"],
      base: ["Oud", "Vanilla", "White Musk"],
    },
    images: [img("imperial", 1), img("imperial", 2)],
    bestseller: true,
    sizes: [
      {
        id: "imperial-30",
        label: "30 ml",
        volumeMl: 30,
        sku: "SP-IMP-030",
        price: 2199,
        image: img("imperial", 1),
        thumb: thumb("imperial", 1),
      },
      {
        id: "imperial-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-IMP-050",
        price: 3299,
        compareAtPrice: 3799,
        image: img("imperial", 2),
        thumb: thumb("imperial", 2),
      },
    ],
  },
  {
    id: "prod_orchid",
    slug: "orchid",
    name: "Orchid",
    fullName: "me. Orchid",
    tagline: "A dark floral with a low, smoky pulse.",
    category: "Floral",
    concentration: "Eau de Parfum",
    accent: "#1B1917",
    description:
      "Orchid trades sweetness for shadow. Black pepper and jasmine sit over a black orchid heart, resting on patchouli, sandalwood and musk — floral, but built for after dark.",
    story:
      "Most florals lean bright. Orchid was made to do the opposite — a black-glass bottle for a scent that keeps the flower but removes the innocence, finished with a long patchouli-musk drydown.",
    notes: {
      top: ["Black Pepper", "Pink Pepper", "Bergamot"],
      heart: ["Black Orchid", "Jasmine Sambac", "Ylang-Ylang"],
      base: ["Patchouli", "Sandalwood", "Musk"],
    },
    images: [img("orchid", 1), img("orchid", 2)],
    bestseller: true,
    sizes: [
      {
        id: "orchid-30",
        label: "30 ml",
        volumeMl: 30,
        sku: "SP-ORC-030",
        price: 1999,
        image: img("orchid", 1),
        thumb: thumb("orchid", 1),
      },
      {
        id: "orchid-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-ORC-050",
        price: 2999,
        image: img("orchid", 2),
        thumb: thumb("orchid", 2),
      },
    ],
  },
  {
    id: "prod_akhdar",
    slug: "akhdar",
    name: "Akhdar",
    fullName: "me. Akhdar",
    tagline: "Green, sharp, and alive.",
    category: "Fresh",
    concentration: "Eau de Parfum",
    accent: "#1E8A4C",
    description:
      "Akhdar — Arabic for green — is built on crushed fig leaf, mint and bergamot over a green, slightly bitter heart, grounded by vetiver and oakmoss. Cold water and cut grass, worn as a scent.",
    story:
      "Akhdar was designed outdoors, not at a bench — the brief was 'the smell of a garden after rain.' Fig leaf and vetiver do the heavy lifting; everything else stays out of the way.",
    notes: {
      top: ["Green Apple", "Mint", "Bergamot"],
      heart: ["Fig Leaf", "Basil", "Green Accord"],
      base: ["Vetiver", "Oakmoss", "Musk"],
    },
    images: [img("akhdar", 1), img("akhdar", 2)],
    sizes: [
      {
        id: "akhdar-30",
        label: "30 ml",
        volumeMl: 30,
        sku: "SP-AKH-030",
        price: 1899,
        compareAtPrice: 2199,
        image: img("akhdar", 1),
        thumb: thumb("akhdar", 1),
      },
      {
        id: "akhdar-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-AKH-050",
        price: 2799,
        image: img("akhdar", 2),
        thumb: thumb("akhdar", 2),
      },
    ],
  },
  {
    id: "prod_oud_lavender",
    slug: "oud-lavender",
    name: "Oud Lavender",
    fullName: "me. Oud Lavender",
    tagline: "Smoke and lavender, held together by amber.",
    category: "Woody",
    concentration: "Eau de Parfum",
    accent: "#4B2E6B",
    description:
      "Lavender rarely gets to be smoky. Here it's paired with dark oud and iris, then rested on sandalwood and amber — a violet-black scent that reads as sharp herbal at first, and pure warmth by the end.",
    story:
      "Oud Lavender is the house's most deliberate contradiction — a barbershop note (lavender) rebuilt with a temple note (oud). The violet glass was chosen to match the exact tension the scent is built on.",
    notes: {
      top: ["Lavender", "Bergamot", "Elemi"],
      heart: ["Oud", "Iris", "Geranium"],
      base: ["Amber", "Sandalwood", "Musk"],
    },
    images: [img("oud-lavender", 1), img("oud-lavender", 2)],
    bestseller: true,
    sizes: [
      {
        id: "oud-lavender-30",
        label: "30 ml",
        volumeMl: 30,
        sku: "SP-OUL-030",
        price: 2499,
        image: img("oud-lavender", 1),
        thumb: thumb("oud-lavender", 1),
      },
      {
        id: "oud-lavender-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-OUL-050",
        price: 3699,
        image: img("oud-lavender", 2),
        thumb: thumb("oud-lavender", 2),
      },
    ],
  },
  {
    id: "prod_lather",
    slug: "lather",
    name: "Lather",
    fullName: "me. Lather",
    tagline: "Clean skin, right out of the shower.",
    category: "Musk",
    concentration: "Eau de Parfum",
    accent: "#B9C0C4",
    description:
      "Lather is the closest thing in the line to a second skin — aldehydes and bergamot over white musk and lily, finished with cedarwood. Almost no smell of 'perfume' at all, just clean.",
    story:
      "Lather started as a joke about the smell of a hotel bathroom done right, and ended as the house's most-repurchased scent. It's designed to be sprayed heavier than the others without going anywhere near loud.",
    notes: {
      top: ["Aldehydes", "Bergamot", "Neroli"],
      heart: ["White Musk", "Lily", "Iris"],
      base: ["Cedarwood", "Ambroxan", "Clean Musk"],
    },
    images: [img("lather", 1)],
    isNew: true,
    sizes: [
      {
        id: "lather-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-LAT-050",
        price: 2599,
        image: img("lather", 1),
        thumb: thumb("lather", 1),
      },
    ],
  },
  {
    id: "prod_latheer",
    slug: "latheer",
    name: "Latheer",
    fullName: "me. Latheer",
    tagline: "A soft gourmand, worn close.",
    category: "Musk",
    concentration: "Eau de Parfum",
    accent: "#E4D8BE",
    description:
      "Latheer softens everything it touches — pear and vanilla over tonka bean and heliotrope, closed with sandalwood and amber musk. Warm, quiet, and built to sit on skin rather than project.",
    story:
      "Where Lather is crisp, Latheer is soft-focus — same family, opposite mood. It's the scent the house recommends for anyone who wants to be asked 'what is that' rather than noticed from across the room.",
    notes: {
      top: ["Pear", "Vanilla", "Bergamot"],
      heart: ["Tonka Bean", "Heliotrope", "Orris"],
      base: ["Sandalwood", "Amber Musk", "Benzoin"],
    },
    images: [img("latheer", 1)],
    isNew: true,
    sizes: [
      {
        id: "latheer-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-LTH-050",
        price: 2699,
        image: img("latheer", 1),
        thumb: thumb("latheer", 1),
      },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(slug: string, count = 3): Product[] {
  return products.filter((p) => p.slug !== slug).slice(0, count);
}

export function priceRangeFor(product: Product): { min: number; max: number } {
  const prices = product.sizes.map((s) => s.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
