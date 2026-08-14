import type { Product } from "../src/lib/types";

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
    signature: true,
    bestseller: true,
    sizes: [
      {
        id: "imperial-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-IMP-020",
        price: 499,
        image: img("imperial", 1),
        thumb: thumb("imperial", 1),
      },
      {
        id: "imperial-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-IMP-050",
        price: 999,
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
    images: [img("orchid", 2), img("orchid", 1)],
    signature: true,
    bestseller: true,
    sizes: [
      {
        id: "orchid-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-ORC-020",
        price: 499,
        image: img("orchid", 2),
        thumb: thumb("orchid", 2),
      },
      {
        id: "orchid-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-ORC-050",
        price: 999,
        image: img("orchid", 1),
        thumb: thumb("orchid", 1),
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
    signature: true,
    bestseller: true,
    sizes: [
      {
        id: "akhdar-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-AKH-020",
        price: 499,
        image: img("akhdar", 1),
        thumb: thumb("akhdar", 1),
      },
      {
        id: "akhdar-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-AKH-050",
        price: 999,
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
    images: [img("oud-lavender", 2), img("oud-lavender", 1)],
    signature: true,
    bestseller: true,
    sizes: [
      {
        id: "oud-lavender-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-OUL-020",
        price: 499,
        image: img("oud-lavender", 2),
        thumb: thumb("oud-lavender", 2),
      },
      {
        id: "oud-lavender-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-OUL-050",
        price: 999,
        image: img("oud-lavender", 1),
        thumb: thumb("oud-lavender", 1),
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
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "lather-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-LAT-050",
        price: 999,
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
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "latheer-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-LTH-020",
        price: 499,
        image: img("latheer", 1),
        thumb: thumb("latheer", 1),
      },
    ],
  },

  // ---------------------------------------------------------------------
  // The August 2026 additions to the "me." line — Love, Blue, Oud, Sweet and
  // Kiano. Same line and same pricing as the six above (20 ml ₹499, 50 ml ₹999);
  // which sizes exist is read off the shoot, where the slim tube is the 20 ml
  // and the squat bottle is the 50 ml. Sweet and Kiano were only photographed
  // as the 50 ml, so that is all they carry until a 20 ml shot arrives.
  //
  // As with Privé below, the taglines, descriptions, stories and notes are
  // WRITTEN TO FIT THE NAME AND COLOUR rather than supplied by the client, and
  // should not be taken as accurate until the real fragrance briefs land. The
  // names, sizes and accents are the only part read off the bottles.
  // ---------------------------------------------------------------------
  {
    id: "prod_love",
    slug: "love",
    name: "Love",
    fullName: "me. Love",
    tagline: "Rose and skin, kept deliberately close.",
    category: "Floral",
    concentration: "Eau de Parfum",
    accent: "#A31A28",
    description:
      "Love leads with pink pepper and raspberry over a damask rose heart, settling into vanilla, benzoin and white musk. Sweet without ever turning sugary — a red scent that stays within arm's length.",
    story:
      "Red is the easiest colour to overdo, so Love was built to pull back. The rose is real and the vanilla under it is thin on purpose: it's meant to be noticed by one person, not by a room.",
    notes: {
      top: ["Pink Pepper", "Raspberry", "Bergamot"],
      heart: ["Damask Rose", "Peony", "Jasmine"],
      base: ["Vanilla", "Benzoin", "White Musk"],
    },
    images: [img("love", 1), img("love", 2)],
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "love-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-LOV-020",
        price: 499,
        image: img("love", 1),
        thumb: thumb("love", 1),
      },
      {
        id: "love-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-LOV-050",
        price: 999,
        image: img("love", 2),
        thumb: thumb("love", 2),
      },
    ],
  },
  {
    id: "prod_blue",
    slug: "blue",
    name: "Blue",
    fullName: "me. Blue",
    tagline: "Open water, cold and clean.",
    category: "Fresh",
    concentration: "Eau de Parfum",
    accent: "#1E2F73",
    description:
      "Blue opens on bergamot, sea salt and grapefruit, moves through lavender and violet leaf, and dries down on ambroxan, cedarwood and musk. Bright, saline and unfussy — the easiest thing in the line to wear.",
    story:
      "Blue is the house's answer to everyone who asks for 'something for every day'. Ambroxan does the lasting, the salt keeps it from reading generic, and nothing in it asks for a second thought.",
    notes: {
      top: ["Bergamot", "Sea Salt", "Grapefruit"],
      heart: ["Lavender", "Violet Leaf", "Juniper"],
      base: ["Ambroxan", "Cedarwood", "Musk"],
    },
    images: [img("blue", 1), img("blue", 2)],
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "blue-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-BLU-020",
        price: 499,
        image: img("blue", 1),
        thumb: thumb("blue", 1),
      },
      {
        id: "blue-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-BLU-050",
        price: 999,
        image: img("blue", 2),
        thumb: thumb("blue", 2),
      },
    ],
  },
  {
    id: "prod_oud",
    slug: "oud",
    name: "Oud",
    fullName: "me. Oud",
    tagline: "The wood, without the ceremony.",
    category: "Woody",
    concentration: "Eau de Parfum",
    accent: "#5C3320",
    description:
      "Oud keeps the name plain because the scent is — cardamom and saffron over oud, cedar and guaiac wood, closed with sandalwood, amber and vanilla. Dense and resinous, but sanded down enough to wear in daylight.",
    story:
      "Every house eventually makes an oud. This one was built to be the first oud someone owns rather than their fifth: the smoke is all there, the medicinal edge isn't, and the vanilla underneath is what makes it easy.",
    notes: {
      top: ["Cardamom", "Saffron", "Lemon"],
      heart: ["Oud", "Cedarwood", "Guaiac Wood"],
      base: ["Sandalwood", "Amber", "Vanilla"],
    },
    images: [img("oud", 1), img("oud", 2)],
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "oud-20",
        label: "20 ml",
        volumeMl: 20,
        sku: "SP-OUD-020",
        price: 499,
        image: img("oud", 1),
        thumb: thumb("oud", 1),
      },
      {
        id: "oud-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-OUD-050",
        price: 999,
        image: img("oud", 2),
        thumb: thumb("oud", 2),
      },
    ],
  },
  {
    id: "prod_sweet",
    slug: "sweet",
    name: "Sweet",
    fullName: "me. Sweet",
    tagline: "Caramel and orange peel, worn warm.",
    category: "Oriental",
    concentration: "Eau de Parfum",
    accent: "#E4661B",
    description:
      "Sweet is the gourmand of the line — blood orange and cinnamon over caramel and tonka bean, resting on vanilla, benzoin and amber. Rich, edible, and a good deal warmer than the bottle lets on.",
    story:
      "Sweet exists because the house kept being asked for something dessert-shaped that wasn't cloying. The orange peel at the top is what keeps the caramel honest — without it the whole thing collapses into sugar.",
    notes: {
      top: ["Blood Orange", "Cinnamon", "Pink Pepper"],
      heart: ["Caramel", "Tonka Bean", "Heliotrope"],
      base: ["Vanilla", "Benzoin", "Amber"],
    },
    images: [img("sweet", 1)],
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "sweet-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-SWT-050",
        price: 999,
        image: img("sweet", 1),
        thumb: thumb("sweet", 1),
      },
    ],
  },
  {
    id: "prod_kiano",
    slug: "kiano",
    name: "Kiano",
    fullName: "me. Kiano",
    tagline: "Green citrus over cool stone.",
    category: "Fresh",
    concentration: "Eau de Parfum",
    accent: "#178FA8",
    description:
      "Kiano sits between fresh and woody — lime, mint and bergamot over green tea and violet leaf, grounded by vetiver, cedarwood and ambrette. Cool, dry and faintly mineral.",
    story:
      "Kiano was the last name to settle and the first scent to finish. It's the driest thing in the line, built on tea and vetiver rather than fruit, so it reads cool where the rest of the fresh side reads sharp.",
    notes: {
      top: ["Lime", "Mint", "Bergamot"],
      heart: ["Green Tea", "Violet Leaf", "Cardamom"],
      base: ["Vetiver", "Cedarwood", "Ambrette"],
    },
    images: [img("kiano", 1)],
    signature: true,
    isNew: true,
    sizes: [
      {
        id: "kiano-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-KIA-050",
        price: 999,
        image: img("kiano", 1),
        thumb: thumb("kiano", 1),
      },
    ],
  },

  // ---------------------------------------------------------------------
  // Privé — the second line, branded "by Salman Perfumes France" rather than
  // "me.", so it carries its own category and its own filter on the shop.
  //
  // Names, colours and concentration are read off the bottles; the accents are
  // sampled from the glass itself. The taglines, descriptions, stories and
  // notes below are WRITTEN TO FIT THE NAME AND COLOUR, not supplied by the
  // client — they are placeholders awaiting the real fragrance briefs and
  // should not be taken as accurate until those land.
  // ---------------------------------------------------------------------
  {
    id: "prod_prive_black",
    slug: "prive-black",
    name: "Privé Black",
    fullName: "Privé Black by Salman Perfumes",
    tagline: "Smoke and leather, worn after dark.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#191713",
    description:
      "Privé Black opens sharp with bergamot and black pepper, then falls away into leather, incense and dark amber. The kind of scent that reads as a suit rather than a shirt — worn close to the skin, and always after dark.",
    story:
      "Black is the anchor of the Privé line: built to be unmistakable in a crowded room without ever raising its voice. Smoke and leather do the work, and the amber underneath is what keeps it from turning cold.",
    notes: {
      top: ["Bergamot", "Black Pepper", "Cardamom"],
      heart: ["Leather", "Incense", "Violet"],
      base: ["Dark Amber", "Vetiver", "Tonka Bean"],
    },
    images: [img("prive-black", 1)],
    isNew: true,
    bestseller: true,
    sizes: [
      {
        id: "prive-black-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVB-050",
        price: 999,
        image: img("prive-black", 1),
        thumb: thumb("prive-black", 1),
      },
    ],
  },
  {
    id: "prod_prive_yellow",
    slug: "prive-yellow",
    name: "Privé Yellow",
    fullName: "Privé Yellow by Salman Perfumes",
    tagline: "Sunlight, bottled at its brightest.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#F4BF27",
    description:
      "Privé Yellow leads with lemon, ginger and neroli, settling into orange blossom over warm cedar and musk. Bright, clean and immediate — a daylight scent that keeps its energy well past noon.",
    story:
      "Yellow was the easiest in the line to name and the hardest to balance. Citrus fades fast, and holding it up for hours meant building a cedar-musk floor strong enough to carry it without ever dulling the opening.",
    notes: {
      top: ["Sicilian Lemon", "Ginger", "Bergamot"],
      heart: ["Neroli", "Orange Blossom", "Jasmine"],
      base: ["Cedarwood", "White Musk", "Amber"],
    },
    images: [img("prive-yellow", 1)],
    isNew: true,
    sizes: [
      {
        id: "prive-yellow-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVY-050",
        price: 999,
        image: img("prive-yellow", 1),
        thumb: thumb("prive-yellow", 1),
      },
    ],
  },
  {
    id: "prod_prive_green",
    slug: "prive-green",
    name: "Privé Green",
    fullName: "Privé Green by Salman Perfumes",
    tagline: "Crushed herbs and cool air.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#3F6639",
    description:
      "Privé Green is built on stems rather than flowers — galbanum, basil and mint over a violet-leaf heart, resting on vetiver, oakmoss and musk. Crisp and a little bracing, like the first hour after rain.",
    story:
      "Green takes the most literal reading of its name in the line. The oakmoss base is what stops it reading as a cologne and gives it somewhere to go by the afternoon.",
    notes: {
      top: ["Galbanum", "Basil", "Mint"],
      heart: ["Violet Leaf", "Geranium", "Juniper"],
      base: ["Vetiver", "Oakmoss", "Musk"],
    },
    images: [img("prive-green", 1)],
    isNew: true,
    sizes: [
      {
        id: "prive-green-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVG-050",
        price: 999,
        image: img("prive-green", 1),
        thumb: thumb("prive-green", 1),
      },
    ],
  },
  {
    id: "prod_prive_white",
    slug: "prive-white",
    name: "Privé White",
    fullName: "Privé White by Salman Perfumes",
    tagline: "Clean linen, worn like a second skin.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#E0D9D4",
    description:
      "Privé White is the quietest in the line — aldehydes and bergamot over iris and white florals, closed with sandalwood, ambrette and soft musk. Barely a perfume at all, just the impression of something immaculate.",
    story:
      "White was made for the days when a scent shouldn't announce anything. It sits close, holds all day, and reads as clean skin rather than fragrance — the one people ask about without being able to place.",
    notes: {
      top: ["Aldehydes", "Bergamot", "Pear"],
      heart: ["Iris", "Lily of the Valley", "Jasmine"],
      base: ["Sandalwood", "Ambrette", "White Musk"],
    },
    images: [img("prive-white", 1)],
    isNew: true,
    sizes: [
      {
        id: "prive-white-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVW-050",
        price: 999,
        image: img("prive-white", 1),
        thumb: thumb("prive-white", 1),
      },
    ],
  },
  {
    id: "prod_prive_oud",
    slug: "prive-oud",
    name: "Privé Oud",
    fullName: "Privé Oud by Salman Perfumes",
    tagline: "Oud, smoked down to its warmest ember.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#4C3A2B",
    description:
      "Privé Oud puts real weight behind the name — saffron and rose over a dense oud and patchouli heart, finished with sandalwood, amber and leather. Deep, resinous, and built to last the night.",
    story:
      "Oud is the centre of the Privé line and the reason the rest of it exists. Rose and saffron are laid over the wood to keep it from turning medicinal, and the leather in the base is what makes it read as luxury rather than incense.",
    notes: {
      top: ["Saffron", "Bergamot", "Nutmeg"],
      heart: ["Oud", "Bulgarian Rose", "Patchouli"],
      base: ["Sandalwood", "Amber", "Leather"],
    },
    images: [img("prive-oud", 1)],
    isNew: true,
    bestseller: true,
    sizes: [
      {
        id: "prive-oud-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVO-050",
        price: 999,
        image: img("prive-oud", 1),
        thumb: thumb("prive-oud", 1),
      },
    ],
  },
  {
    id: "prod_prive_red",
    slug: "prive-red",
    name: "Privé Red",
    fullName: "Privé Red by Salman Perfumes",
    tagline: "Spice and heat, worn with intent.",
    category: "Prive",
    concentration: "Eau de Parfum",
    accent: "#BA1B16",
    description:
      "Privé Red opens hot with pink pepper, cinnamon and saffron, moves through a rose and tobacco heart, and settles on vanilla, benzoin and amber. Warm, sweet, and deliberately loud.",
    story:
      "Red is the extrovert of the Privé line. Where Black withholds, Red arrives — a spiced tobacco-vanilla built for cold evenings and short distances.",
    notes: {
      top: ["Pink Pepper", "Cinnamon", "Saffron"],
      heart: ["Rose", "Tobacco", "Clove"],
      base: ["Vanilla", "Benzoin", "Amber"],
    },
    images: [img("prive-red", 1)],
    isNew: true,
    sizes: [
      {
        id: "prive-red-50",
        label: "50 ml",
        volumeMl: 50,
        sku: "SP-PVR-050",
        price: 999,
        image: img("prive-red", 1),
        thumb: thumb("prive-red", 1),
      },
    ],
  },
];
