// Business details, reviews and FAQs. Everything here is drawn from the
// original site so the new design (and the chatbot) never invents facts.

export const site = {
  name: 'Glow With Chlo',
  handle: 'glow.with.chloxo',
  tagline: 'Skin, aesthetics & nail care',
  description:
    'Results-driven facials, dermaplaning, mesotherapy, Profhilo and nails across North Wales & Liverpool. Fully licensed, fully insured, mobile service available.',
  url: 'https://glow-with-chlo.com',
  area: 'North Wales & Liverpool',
  phone: '07376 228588',
  phoneHref: 'tel:+447376228588',
  email: 'glowwithchloinfo@gmail.com',
  booking: 'https://glowwithchloxo.booksy.com',
  web3formsKey: 'e4c6b92c-f1b8-4eae-87e3-dea96aed3df7',
  instagramReel: 'https://www.instagram.com/reel/DFFXrutNXwz/',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d161270.46650447472!2d-4.150463846609437!3d53.18551230486133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48654cbe7d37f9f5%3A0x62cd7091072d7390!2sNorth%20Wales%2C%20UK!5e0!3m2!1sen!2suk!4v1674744591983!5m2!1sen!2suk',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/glow_with_chloxo/', icon: 'instagram' },
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61566633030687', icon: 'facebook' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@glow_with_chlo', icon: 'tiktok' },
  ],
  mobileSurcharge: 5,
  yearsExperience: 5,
} as const;

export const credentials = [
  { value: 100, suffix: '%', label: 'Fully licensed' },
  { value: site.yearsExperience, suffix: '', label: 'Years’ experience' },
  { value: 100, suffix: '%', label: 'Fully insured' },
] as const;

export const reviews = [
  { quote: 'Unreal results from my last facial.', rating: 5 },
  { quote: 'Your treatments are amazing, my face feels fantastic — can’t wait for my next one.', rating: 5 },
  { quote: 'The best and most relaxing treatment.', rating: 5 },
] as const;

/** The client journey every facial and aesthetic treatment follows. */
export const journey = [
  {
    title: 'Consultation',
    text: 'A thorough review of your medical history, allergies and current skincare products to make sure the treatment is suitable and safe. We talk through your skin concerns and goals, and every recommendation is tailored to you.',
  },
  {
    title: 'Treatment',
    text: 'A single treatment delivers visible, effective results — performed with care in a calm, relaxing setting.',
  },
  {
    title: 'Aftercare',
    text: 'You’ll receive tailored aftercare instructions for optimal healing and the best possible results. Following them is essential for the treatment to work.',
  },
  {
    title: 'Follow-up',
    text: 'Follow-up appointments are key to long-term benefits that can’t be achieved with just one session.',
  },
] as const;

export const faqs = [
  {
    q: 'How do I book?',
    a: `Book online any time through Booksy, or call ${site.phone} / email ${site.email} and we’ll find a slot that suits you.`,
  },
  {
    q: 'Do you offer a mobile service?',
    a: `Yes — treatments can come to you across ${site.area} for an extra £${site.mobileSurcharge}.`,
  },
  {
    q: 'Are you licensed and insured?',
    a: 'Yes. Glow With Chlo is fully licensed and fully insured, with five years’ experience.',
  },
  {
    q: 'What happens at my first appointment?',
    a: 'Every treatment starts with a consultation: we review your medical history, allergies and current skincare, talk through your goals and confirm the treatment is right and safe for you.',
  },
  {
    q: 'What’s the difference between a standard and a Deluxe facial?',
    a: 'Deluxe facials upgrade the prep to a double cleanse, exfoliation, mask and relaxing scalp massage — for £10 more than the standard version.',
  },
  {
    q: 'How many sessions will I need?',
    a: 'One treatment gives visible results, but follow-up appointments are what deliver long-term benefits. Profhilo results are typically visible after two sessions.',
  },
  {
    q: 'Is there any downtime?',
    a: 'Dermaplaning has zero downtime, and mesotherapy and Profhilo have minimal downtime. You’ll get tailored aftercare advice after every treatment.',
  },
  {
    q: 'Does Profhilo hurt?',
    a: 'Your skin is cleansed and a topical numbing cream is applied before the injections to keep you comfortable.',
  },
] as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Facials', href: '/treatments' },
  { label: 'Skin Boosters', href: '/skin-boosters' },
  { label: 'Nails', href: '/nails' },
  { label: 'Prices', href: '/prices' },
  { label: 'Contact', href: '/contact' },
] as const;
