// Single source of truth for every treatment, price and duration.
// Cards, detail pages, the price list, structured data and the chatbot all read
// from here. Prices match the printed menus (src/assets/menus/*).

export type Category = 'facials' | 'skin-boosters' | 'nails';
export type FacialTag = 'dermaplaning' | 'mesotherapy' | 'combination' | 'basic';

export interface Step {
  title: string;
  text: string;
}

export interface Service {
  slug: string;
  name: string;
  category: Category;
  tags: FacialTag[];
  price: number;
  duration?: string;
  summary: string;
  tagline?: string;
  intro?: string[];
  highlights?: string[];
  included?: Step[];
  benefits?: Step[];
  process?: Step[];
  /** Path relative to src/assets, resolved by src/lib/images.ts */
  image?: string;
  imageAlt?: string;
  /** Before/after photo, path relative to src/assets. */
  results?: string;
  resultsAlt?: string;
  /** Extra words the chatbot matches on. */
  aliases?: string[];
  detailPage: boolean;
  signature?: boolean;
  addOn?: boolean;
  /** Short qualifier shown next to the price (e.g. "Recommended between sets"). */
  note?: string;
  /** Value message shown on the treatment's detail page. */
  valueNote?: string;
}

const cleanse: Step = { title: 'Cleanse & prep', text: 'A refreshing double cleanse.' };
const cleanseDeluxe: Step = {
  title: 'Cleanse & prep',
  text: 'Double cleanse, exfoliation, mask and a relaxing scalp massage.',
};
const dermaplaning: Step = {
  title: 'Dermaplaning',
  text: 'Removes peach fuzz and dead skin for a smoother surface.',
};
const liquidPeel: Step = { title: 'Liquid peel', text: 'Buffs away excess dead skin.' };
const mesotherapy: Step = {
  title: 'Eye mask & mesotherapy',
  text: 'Hydrates under the eyes and rejuvenates the skin with mesotherapy.',
};
const aloeGuaSha: Step = {
  title: 'Aloe vera mask & gua sha',
  text: 'Deeply hydrates and helps drain away toxins.',
};
const handMassage: Step = {
  title: 'Hand massage',
  text: 'Finishes with a soothing hand massage and your glowing skin reveal.',
};

const dermaBenefits: Step[] = [
  { title: 'Improves', text: 'skin smoothness and texture' },
  { title: 'Reduces', text: 'peach fuzz and dead skin cells' },
  { title: 'Enhances', text: 'product absorption for better skincare results' },
  { title: 'Brightens', text: 'dull and tired-looking skin' },
  { title: 'Smooths', text: 'fine lines and uneven skin tone' },
  { title: 'Refines', text: 'your complexion for a flawless finish' },
  { title: 'Reveals', text: 'softer, glowing skin' },
  { title: 'Prepares', text: 'skin for makeup application' },
];

const mesoBenefits: Step[] = [
  { title: 'Improves', text: 'skin hydration and texture' },
  { title: 'Reduces', text: 'dark circles and puffiness' },
  { title: 'Enhances', text: 'collagen production for firmer skin' },
  { title: 'Brightens', text: 'uneven skin tone and pigmentation' },
  { title: 'Revitalises', text: 'tired and stressed skin' },
  { title: 'Rejuvenates', text: 'your overall skin appearance' },
  { title: 'Smooths', text: 'fine lines and wrinkles' },
  { title: 'Nourishes', text: 'skin with essential vitamins and nutrients' },
];

export const services: Service[] = [
  {
    slug: 'deluxe-mesotherapy-dermaplaning',
    name: 'Deluxe Mesotherapy & Dermaplaning',
    category: 'facials',
    tags: ['combination', 'dermaplaning', 'mesotherapy'],
    price: 70,
    duration: '1h 40m',
    signature: true,
    detailPage: true,
    summary: 'Our signature facial — premium exfoliation and deep hydration with extended pampering.',
    tagline: 'The Ultimate Glow',
    intro: [
      'Indulge in the luxury of flawless skin with this deluxe facial, designed to exfoliate, hydrate and deeply rejuvenate.',
      'Dermaplaning gently removes dead skin and peach fuzz for a silky-smooth finish, while mesotherapy infuses potent vitamins, antioxidants and hydrating serums deep into the skin.',
      'The result? A radiant, plump, youthful glow with an instantly refined texture.',
    ],
    highlights: ['Luxuriously smooth skin', 'Intense hydration & nourishment', 'Long-lasting radiance'],
    included: [
      cleanseDeluxe,
      dermaplaning,
      liquidPeel,
      { title: 'Eye mask & mesotherapy', text: 'Soothes the eyes and rejuvenates the skin with mesotherapy.' },
      aloeGuaSha,
      handMassage,
    ],
    benefits: [
      { title: 'Improves', text: 'skin smoothness and hydration' },
      { title: 'Reduces', text: 'peach fuzz, dead skin cells and congestion' },
      { title: 'Enhances', text: 'absorption of vitamins and nutrients for deeper rejuvenation' },
      { title: 'Brightens', text: 'dull, tired skin for a healthy, radiant glow' },
      { title: 'Smooths', text: 'fine lines and uneven texture' },
      { title: 'Refines', text: 'your complexion for an airbrushed finish' },
      { title: 'Reveals', text: 'softer, plumper, more youthful skin' },
      { title: 'Prepares', text: 'skin for seamless makeup application' },
    ],
    image: 'photos/facial-profile-dewy.jpg',
    imageAlt: 'Client in profile with dewy, glowing skin after a facial',
    results: 'results/deluxe-meso-derma.jpg',
    resultsAlt: 'Before and after a Deluxe Mesotherapy & Dermaplaning facial, showing smoother, brighter skin',
    aliases: ['deluxe combo', 'ultimate glow', 'signature'],
    valueNote: 'Better value than booking both deluxe treatments separately.',
  },
  {
    slug: 'mesotherapy-dermaplaning',
    name: 'Mesotherapy & Dermaplaning',
    category: 'facials',
    tags: ['combination', 'dermaplaning', 'mesotherapy'],
    price: 60,
    duration: '1h 20m',
    detailPage: true,
    summary: 'Combination treatment for deep hydration and smooth, bright skin.',
    tagline: 'The Perfect Glow Facial',
    intro: [
      'Combine the power of dermaplaning and mesotherapy for instantly smoother, brighter, deeply hydrated skin.',
      'The treatment gently exfoliates dead skin and removes peach fuzz, letting nutrient-rich serums penetrate deeper for enhanced hydration and rejuvenation.',
      'With minimal downtime, it boosts radiance, firmness and overall skin health, leaving you with a refreshed, youthful glow.',
    ],
    highlights: ['Smooth, refined skin', 'Deep hydration & nourishment', 'Instant brightness'],
    included: [cleanse, dermaplaning, liquidPeel, mesotherapy, aloeGuaSha, handMassage],
    benefits: [
      { title: 'Improves', text: 'skin texture, hydration and radiance' },
      { title: 'Reduces', text: 'fine lines, wrinkles and puffiness' },
      { title: 'Enhances', text: 'collagen production and skin firmness' },
      { title: 'Nourishes', text: 'skin with essential vitamins and nutrients' },
      { title: 'Fades', text: 'dark spots, uneven skin tone and blemishes' },
      { title: 'Smooths', text: 'fine lines, wrinkles and peach fuzz' },
      { title: 'Revitalises', text: 'stressed, tired and dull skin' },
    ],
    image: 'photos/facial-dewy-freckles.jpg',
    imageAlt: 'Freckled client with hydrated, dewy skin after a Mesotherapy & Dermaplaning facial',
    results: 'results/meso-derma.jpg',
    resultsAlt: 'Before and after a Mesotherapy & Dermaplaning facial, showing brighter, more hydrated skin',
    aliases: ['combo', 'combination', 'perfect glow'],
    valueNote: 'Better value than booking both treatments separately.',
  },
  {
    slug: 'deluxe-dermaplaning',
    name: 'Deluxe Dermaplaning',
    category: 'facials',
    tags: ['dermaplaning'],
    price: 50,
    duration: '1 hour',
    detailPage: true,
    summary: 'Advanced exfoliation with extended prep for ultra-smooth, luminous skin.',
    tagline: 'The Ultimate Glow Facial',
    intro: [
      'Experience the luxury of radiant, flawless skin with our Deluxe Dermaplaning Facial.',
      'This advanced treatment exfoliates, hydrates and nourishes, revealing a smoother, more luminous complexion.',
      'Gentle dermaplaning combined with deeply hydrating serums enhances texture, boosts radiance and preps your skin for maximum product absorption — all with minimal downtime.',
    ],
    highlights: ['Ultra-smooth skin', 'Deep hydration & nourishment', 'Instant glow & refinement'],
    included: [cleanseDeluxe, dermaplaning, liquidPeel, aloeGuaSha, handMassage],
    benefits: dermaBenefits,
    image: 'photos/facial-plump-mature.jpg',
    imageAlt: 'Client with plump, hydrated skin after a Deluxe Dermaplaning facial',
    results: 'results/deluxe-dermaplaning.jpg',
    resultsAlt: 'Before and after on mature skin, showing a plumper, smoother texture',
  },
  {
    slug: 'dermaplaning',
    name: 'Dermaplaning',
    category: 'facials',
    tags: ['dermaplaning'],
    price: 40,
    duration: '1 hour',
    detailPage: true,
    summary: 'Gentle exfoliation that removes peach fuzz for silky-smooth skin — zero downtime.',
    tagline: 'The Glow-Boosting Facial',
    intro: [
      'Reveal smoother, brighter skin with our Dermaplaning Facial, designed to gently exfoliate, remove peach fuzz and enhance your natural radiance.',
      'By lifting away dead skin cells and fine hair, it improves texture, boosts hydration and preps your skin for better product absorption — all with zero downtime.',
    ],
    highlights: ['Silky-smooth skin', 'Enhanced hydration', 'Instant brightness'],
    included: [cleanse, dermaplaning, liquidPeel, aloeGuaSha, handMassage],
    benefits: dermaBenefits,
    image: 'photos/dermaplaning-after.jpg',
    imageAlt: 'Client with bright, smooth, glowing skin after dermaplaning',
    results: 'results/dermaplaning.jpg',
    resultsAlt: 'Before and after dermaplaning, showing brighter, more even skin',
    aliases: ['peach fuzz', 'derma planing'],
  },
  {
    slug: 'deluxe-mesotherapy',
    name: 'Deluxe Mesotherapy',
    category: 'facials',
    tags: ['mesotherapy'],
    price: 40,
    duration: '1 hour',
    detailPage: true,
    summary: 'Intensive hydration with extended prep for plump, glowing skin.',
    tagline: 'The Ultimate Rejuvenation Facial',
    intro: [
      'Indulge in the Deluxe Mesotherapy Facial, designed to nourish, hydrate and rejuvenate your skin from within.',
      'A potent cocktail of vitamins, antioxidants and hydrating serums is infused deep into the skin, leaving you with a radiant, plump complexion.',
      'With minimal downtime, mesotherapy enhances elasticity, improves texture and boosts overall vitality for a truly youthful glow.',
    ],
    highlights: ['Deep nourishment & hydration', 'Enhanced radiance & firmness', 'Long-lasting rejuvenation'],
    included: [cleanseDeluxe, mesotherapy, aloeGuaSha, handMassage],
    benefits: mesoBenefits,
    image: 'photos/facial-rosy-deluxe.jpg',
    imageAlt: 'Client with luminous, rosy skin after a Deluxe Mesotherapy facial',
  },
  {
    slug: 'mesotherapy',
    name: 'Mesotherapy',
    category: 'facials',
    tags: ['mesotherapy'],
    price: 30,
    duration: '1 hour',
    detailPage: true,
    summary: 'A non-invasive hydration facial that infuses vitamins deep into the skin.',
    tagline: 'The Revitalising Mesotherapy Facial',
    intro: [
      'Refresh and rejuvenate your skin with our Mesotherapy Facial — a deeply hydrating treatment that infuses essential vitamins, minerals and antioxidants directly into the skin.',
      'This non-invasive treatment enhances texture, elasticity and overall vitality, with minimal downtime, instant hydration and long-lasting radiance.',
    ],
    highlights: ['Deep hydration', 'Improved texture & firmness', 'Instant radiance'],
    included: [cleanse, mesotherapy, aloeGuaSha, handMassage],
    benefits: mesoBenefits,
    image: 'photos/mesotherapy-procedure.jpg',
    imageAlt: 'Mesotherapy serum being delivered to the skin, with under-eye patches applied',
    aliases: ['meso'],
  },
  {
    slug: 'luxury-mini-facial',
    name: 'Luxury Mini Facial',
    category: 'facials',
    tags: ['basic'],
    price: 20,
    duration: '40 min',
    detailPage: true,
    summary: 'A quick refresh with cleansing, hydration and a soothing mask.',
    tagline: 'The Luxury Mini Facial',
    intro: [
      'A quick yet indulgent skincare experience, combining gentle exfoliation, hydration and a soothing mask to reveal smooth, glowing skin in just 40 minutes.',
      'Perfect when you’re short on time but crave instant radiance and relaxation — your skin feels revitalised and refreshed with minimal downtime.',
    ],
    highlights: ['Quick refresh & glow', 'Instant hydration', 'Radiant, smooth skin'],
    included: [
      { title: 'Cleanse & prep', text: 'A thorough double cleanse, exfoliation, mask and relaxing scalp massage.' },
      { title: 'Aloe vera mask & gua sha', text: 'Deeply hydrates while promoting detoxification and circulation.' },
      { title: 'Hand massage & glow reveal', text: 'Finishes with a soothing hand massage, leaving skin radiant and rejuvenated.' },
    ],
    benefits: [
      { title: 'Improves', text: 'skin hydration and overall radiance' },
      { title: 'Reduces', text: 'tension and puffiness in the face' },
      { title: 'Enhances', text: 'blood circulation and lymphatic drainage' },
      { title: 'Brightens', text: 'dull and tired-looking skin' },
      { title: 'Restores', text: 'a healthy, balanced complexion' },
      { title: 'Reveals', text: 'softer, plumper, more youthful skin' },
      { title: 'Prepares', text: 'skin for seamless makeup application' },
    ],
    image: 'photos/facial-glow-relaxed.jpg',
    imageAlt: 'Relaxed client with glowing skin during a Luxury Mini Facial',
    aliases: ['mini', 'quick facial', 'express'],
  },
  {
    slug: 'profhilo',
    name: 'Profhilo',
    category: 'skin-boosters',
    tags: [],
    price: 150,
    duration: '30 min',
    detailPage: true,
    summary: 'The injectable “face lift in a bottle” — deep hydration, firmer skin and a natural glow.',
    tagline: 'The “Face Lift in a Bottle”',
    intro: [
      'Hydrate, lift and smooth your skin with Profhilo, the injectable treatment that boosts collagen for a radiant, youthful glow.',
      'Fast, natural-looking results with minimal downtime. Glow from within.',
    ],
    highlights: ['Deep hydration', 'Firmer skin', 'Visible in 2 sessions'],
    process: [
      { title: 'Consultation', text: 'We review your medical history and goals to confirm Profhilo is right for you.' },
      {
        title: 'Preparation',
        text: 'The skin is thoroughly cleansed and disinfected, and a topical numbing cream is applied for comfort.',
      },
      {
        title: 'Procedure',
        text: 'Precise injection points are marked, then five carefully placed Profhilo injections are given on each side of the face for optimal distribution and results.',
      },
    ],
    benefits: [
      { title: 'Improves', text: 'skin hydration and firmness' },
      { title: 'Reduces', text: 'fine lines, wrinkles and crepey skin' },
      { title: 'Enhances', text: 'collagen and elastin production' },
      { title: 'Brightens', text: 'dull and tired-looking skin' },
      { title: 'Restores', text: 'your skin’s natural radiance' },
      { title: 'Boosts', text: 'overall skin quality and texture' },
      { title: 'Tightens', text: 'laxity for a more youthful appearance' },
      { title: 'Rejuvenates', text: 'the skin with deep hydration' },
    ],
    image: 'products/profhilo.jpg',
    imageAlt: 'Profhilo skin booster box and pre-filled syringe',
    aliases: ['profilo', 'face lift in a bottle', 'injectable', 'injection'],
  },
  {
    slug: 'skin-boosters',
    name: 'Skin Boosters',
    category: 'skin-boosters',
    tags: [],
    price: 70,
    detailPage: false,
    summary: 'Injectable hydration for plumper, dewier skin — tailored to you at consultation.',
    aliases: ['skin booster', 'booster'],
  },
  {
    slug: 'aqua-exosome',
    name: 'Aqua-Exosome',
    category: 'skin-boosters',
    tags: [],
    price: 30,
    duration: '30 min',
    detailPage: false,
    summary: 'A hydrating exosome skin treatment — ask about it at your consultation.',
    image: 'products/aqua-exosome.webp',
    imageAlt: 'Aqua-Exosome skin booster packaging',
    aliases: ['exosome', 'exosomes', 'aqua'],
  },

  // Nails — from the Glow Nail Menu
  {
    slug: 'gel-file-polish',
    name: 'Gel File & Polish',
    category: 'nails',
    tags: [],
    price: 15,
    detailPage: false,
    summary: 'Neat shaping and filing finished with a long-lasting gel polish.',
    aliases: ['gel polish', 'gel nails', 'shellac'],
  },
  {
    slug: 'acrylic-gel-polish',
    name: 'Acrylic with Gel Polish',
    category: 'nails',
    tags: [],
    price: 20,
    detailPage: false,
    summary: 'A full acrylic set finished in glossy gel polish.',
    aliases: ['acrylic', 'acrylics', 'full set', 'acrylic nails'],
  },
  {
    slug: 'manicure-pedicure-gel',
    name: 'Pedicure or Manicure with Gel Polish',
    category: 'nails',
    tags: [],
    price: 30,
    detailPage: false,
    summary: 'Nail and cuticle care for hands or feet, finished with gel polish.',
    aliases: ['manicure', 'pedicure', 'mani', 'pedi', 'toes', 'feet'],
  },
  {
    slug: 'nail-care',
    name: 'Nail Care Pedicure or Manicure',
    category: 'nails',
    tags: [],
    price: 15,
    detailPage: false,
    summary: 'Care for your natural nails — recommended between sets.',
    aliases: ['nail care', 'natural nails', 'between sets'],
    note: 'Recommended between sets',
  },
  {
    slug: 'gel-removal',
    name: 'Gel Removal',
    category: 'nails',
    tags: [],
    price: 10,
    detailPage: false,
    summary: 'Safe, gentle removal of gel polish.',
    aliases: ['remove gel', 'soak off'],
  },
  {
    slug: 'acrylic-removal',
    name: 'Acrylic Removal',
    category: 'nails',
    tags: [],
    price: 15,
    detailPage: false,
    summary: 'Careful removal of acrylic enhancements.',
    aliases: ['remove acrylic', 'acrylic off'],
  },
  {
    slug: 'nail-art',
    name: 'Nail Art',
    category: 'nails',
    tags: [],
    price: 5,
    detailPage: false,
    addOn: true,
    summary: 'Add hand-painted designs to any set.',
    aliases: ['design', 'designs', 'art'],
  },
  {
    slug: 'gems',
    name: 'Gems',
    category: 'nails',
    tags: [],
    price: 2,
    detailPage: false,
    addOn: true,
    summary: 'Sparkle with gem accents.',
    aliases: ['gem', 'rhinestones', 'diamantes', 'crystals'],
  },
  {
    slug: '3d-flowers',
    name: '3D Flowers',
    category: 'nails',
    tags: [],
    price: 5,
    detailPage: false,
    addOn: true,
    summary: 'Sculpted 3D flower details.',
    aliases: ['flowers', '3d'],
  },
];

export const facials = services.filter((s) => s.category === 'facials');
export const skinBoosters = services.filter((s) => s.category === 'skin-boosters');
export const nails = services.filter((s) => s.category === 'nails' && !s.addOn);
export const nailAddOns = services.filter((s) => s.category === 'nails' && s.addOn);
export const detailServices = services.filter((s) => s.detailPage);
export const signature = services.find((s) => s.signature)!;

export const facialFilters: { key: FacialTag | 'all'; label: string }[] = [
  { key: 'all', label: 'All facials' },
  { key: 'dermaplaning', label: 'Dermaplaning' },
  { key: 'mesotherapy', label: 'Mesotherapy' },
  { key: 'combination', label: 'Combination' },
  { key: 'basic', label: 'Express' },
];

export const categoryLabels: Record<Category, string> = {
  facials: 'Facials',
  'skin-boosters': 'Skin Boosters',
  nails: 'Nails',
};

export const formatPrice = (price: number) => `£${price}`;

export const serviceHref = (s: Service) =>
  s.detailPage ? `/treatments/${s.slug}` : s.category === 'nails' ? '/nails' : '/skin-boosters';

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}

/** Up to `n` other detail-page services sharing a tag or category. */
export function relatedServices(s: Service, n = 3) {
  const score = (o: Service) =>
    o.tags.filter((t) => s.tags.includes(t)).length * 2 + (o.category === s.category ? 1 : 0);
  return detailServices
    .filter((o) => o.slug !== s.slug)
    .sort((a, b) => score(b) - score(a))
    .slice(0, n);
}
