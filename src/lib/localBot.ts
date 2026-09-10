// In-browser answer engine for the chat widget. Used when no Groq key is
// configured or the API is unavailable, so the assistant always works.
// It only ever answers from src/data — it never invents prices or facts.

import {
  services,
  facials,
  skinBoosters,
  nails,
  nailAddOns,
  formatPrice,
  serviceHref,
  getService,
  type Service,
} from '../data/services';
import { site, faqs } from '../data/site';

export interface BotReply {
  text: string;
  chips?: string[];
}

export const starterChips = ['Price list', 'Which facial suits me?', 'Book an appointment', 'Mobile service?'];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9£' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s: string) => norm(s).split(' ').filter(Boolean);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True if any cue appears in `text` at a word start (so "firm" won't match "confirm"). */
const matchAny = (text: string, cues: string[]) =>
  cues.some((c) => new RegExp(`\\b${escapeRe(c)}`).test(text));

// ---------------------------------------------------------------- service matching

const NAME_STOP = new Set(['and', 'with', 'or', 'the', 'facial']);

function tokenMatches(user: string, name: string) {
  if (user === name) return true;
  if (user.length >= 4 && name.startsWith(user)) return true; // "derma" → "dermaplaning"
  if (name.length >= 4 && user.startsWith(name)) return true; // "nails" → "nail"
  return false;
}

function scoreService(s: Service, text: string, toks: string[]) {
  const nameToks = tokens(s.name).filter((t) => !NAME_STOP.has(t));
  const hits = nameToks.filter((nt) => toks.some((ut) => tokenMatches(ut, nt))).length;
  let score = hits * 2;
  if (hits > 0 && hits === nameToks.length) score += 3;
  for (const alias of s.aliases ?? []) {
    if (new RegExp(`\\b${escapeRe(norm(alias))}\\b`).test(text)) score += 3;
  }
  const wantsDeluxe = /\bdeluxe\b/.test(text);
  const isDeluxe = /deluxe/i.test(s.name);
  if (isDeluxe && !wantsDeluxe) score -= 2;
  if (!isDeluxe && wantsDeluxe) score -= 1.5;
  return score;
}

function rankServices(text: string) {
  const toks = text.split(' ');
  return services
    .map((s) => ({ s, score: scoreService(s, text, toks) }))
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------- formatting helpers

const priceLine = (s: Service) =>
  `- **${s.name}** — ${formatPrice(s.price)}${s.duration ? ` · ${s.duration}` : ''}`;

const bookLink = `[Book on Booksy](${site.booking})`;

function serviceReply(s: Service, text: string): BotReply {
  const lines: string[] = [
    `**${s.name}** — ${formatPrice(s.price)}${s.duration ? ` · ${s.duration}` : ''}`,
    s.summary,
  ];
  const wantsIncluded = matchAny(text, ['includ', 'what happens', 'involve', 'steps', 'what do you do']);
  const wantsBenefits = matchAny(text, ['benefit', 'good for', 'help with', 'results', 'does it do', 'why']);

  if (wantsIncluded && (s.included || s.process)) {
    lines.push('', 'What’s included:', ...(s.included ?? s.process)!.map((i) => `- **${i.title}** — ${i.text}`));
  } else if (wantsBenefits && s.benefits) {
    lines.push('', 'Benefits:', ...s.benefits.slice(0, 5).map((b) => `- **${b.title}** ${b.text}`));
  } else if (s.highlights) {
    lines.push('', ...s.highlights.map((h) => `- ${h}`));
  }
  if (s.category === 'skin-boosters') {
    lines.push('', 'Injectable treatments always begin with a consultation to confirm they’re right for you.');
  }
  if (s.addOn) lines.push('', 'Add-ons can be added to any nail set.');
  lines.push('', s.detailPage ? `[View details](${serviceHref(s)}) · ${bookLink}` : bookLink);

  const chips = s.detailPage
    ? ['What’s included?', 'Book an appointment', 'Price list']
    : ['Book an appointment', 'Price list', 'Mobile service?'];
  return { text: lines.join('\n'), chips };
}

function listReply(intro: string, list: Service[], outro?: string, chips?: string[]): BotReply {
  const lines = [intro, ...list.map(priceLine)];
  if (outro) lines.push('', outro);
  return { text: lines.join('\n'), chips: chips ?? ['Which facial suits me?', 'Book an appointment'] };
}

const byPrice = (a: Service, b: Service) => a.price - b.price;

// ---------------------------------------------------------------- intents

const faq = (start: string) => faqs.find((f) => f.q.toLowerCase().startsWith(start.toLowerCase()))!.a;

const CUES = {
  medical: [
    'pregnan', 'breastfeed', 'breast feed', 'nursing', 'allerg', 'medication', 'medicine', 'roaccutane',
    'accutane', 'isotretinoin', 'blood thinner', 'warfarin', 'diabet', 'rosacea', 'eczema', 'psoriasis',
    'acne', 'infect', 'cold sore', 'herpes', 'keloid', 'cancer', 'chemo', 'is it safe', 'side effect',
    'contraindicat', 'medical condition',
  ],
  notOffered: [
    'botox', 'anti wrinkle injection', 'filler', 'lip ', 'lips', 'microneedl', 'laser', 'lash', 'brow',
    'wax', 'spray tan', 'tanning', 'hair cut', 'haircut', 'hair colour', 'hifu', 'chemical peel',
  ],
  booking: ['book', 'appointment', 'booksy', 'reserve', 'slot', 'schedule'],
  greeting: ['hi', 'hello', 'hey', 'hiya', 'good morning', 'good afternoon', 'good evening', 'yo'],
  thanks: ['thank', 'thanks', 'cheers', 'ta ', 'appreciate'],
  bye: ['bye', 'goodbye', 'see you', 'see ya'],
  mobile: ['mobile', 'come to me', 'come to my', 'home visit', 'my house', 'my home', 'travel', 'at home', 'visit me'],
  recommend: [
    'recommend', 'suggest', 'which facial', 'which treatment', 'best for', 'right for me', 'suit', 'should i',
    'help me choose', 'advice', 'advise', 'my skin', 'skin type', 'what would you', 'not sure which',
  ],
  licensed: ['licen', 'insur', 'qualif', 'certif', 'experience', 'trained', 'accredit'],
  downtime: ['downtime', 'down time', 'recovery', 'red after', 'redness', 'back to work'],
  sessions: ['how many session', 'how often', 'how many treatment', 'how many times', 'course of', 'sessions'],
  pain: ['hurt', 'pain', 'painful', 'sore', 'numb', 'uncomfortable'],
  aftercare: ['aftercare', 'after care', 'after the treatment', 'afterwards'],
  firstVisit: ['first appointment', 'first time', 'first visit', 'consultation', 'what to expect', 'what happens'],
  location: ['where', 'location', 'based', 'area', 'address', 'near', 'liverpool', 'wales', 'postcode', 'directions'],
  hours: ['open', 'opening', 'hours', 'available', 'availability', 'today', 'tomorrow', 'weekend', 'saturday', 'sunday', 'evening', 'when can'],
  payment: ['pay', 'payment', 'card', 'cash', 'deposit', 'cancel', 'refund', 'voucher', 'gift', 'discount', 'offer', 'deal', 'student'],
  nails: ['nail', 'acrylic', 'gel', 'manicure', 'pedicure', 'mani', 'pedi', 'french tip', 'extensions'],
  boosters: ['skin booster', 'booster', 'injectable', 'injection', 'inject', 'profhilo', 'exosome'],
  facials: ['facial', 'facials', 'face treatment', 'skincare', 'skin care'],
  price: ['price', 'prices', 'cost', 'how much', 'menu', '£', 'charge', 'expensive', 'cheap'],
  contact: ['phone', 'number', 'call', 'email', 'contact', 'text', 'whatsapp', 'instagram', 'dm', 'message', 'speak to', 'talk to'],
};

const concerns: { label: string; cues: string[]; slugs: string[] }[] = [
  { label: 'dry or dehydrated skin', cues: ['dry', 'dehydrat', 'hydrat', 'flaky', 'plump', 'moistur'], slugs: ['mesotherapy', 'deluxe-mesotherapy', 'profhilo'] },
  { label: 'dull or tired skin', cues: ['dull', 'glow', 'radian', 'bright', 'tired', 'lifeless', 'grey'], slugs: ['mesotherapy-dermaplaning', 'deluxe-mesotherapy-dermaplaning', 'dermaplaning'] },
  { label: 'peach fuzz and texture', cues: ['peach fuzz', 'fuzz', 'facial hair', 'texture', 'rough', 'bumpy', 'makeup', 'make up', 'foundation', 'smooth'], slugs: ['dermaplaning', 'deluxe-dermaplaning', 'mesotherapy-dermaplaning'] },
  { label: 'fine lines and firmness', cues: ['fine line', 'wrinkl', 'ageing', 'aging', 'sagging', 'saggy', 'laxity', 'crepey', 'firm', 'lift', 'collagen', 'mature', 'anti age', 'anti-age'], slugs: ['profhilo', 'deluxe-mesotherapy', 'mesotherapy-dermaplaning'] },
  { label: 'dark circles and puffiness', cues: ['dark circle', 'puffy', 'puffiness', 'eye bag', 'under eye', 'bags under'], slugs: ['mesotherapy', 'deluxe-mesotherapy'] },
  { label: 'pigmentation and uneven tone', cues: ['pigment', 'dark spot', 'uneven', 'sun spot', 'blemish', 'scar', 'marks'], slugs: ['mesotherapy-dermaplaning', 'deluxe-mesotherapy'] },
  { label: 'a quick refresh', cues: ['quick', 'short on time', 'lunch', 'budget', 'cheap', 'affordable', 'beginner', 'new to facials', 'fast'], slugs: ['luxury-mini-facial', 'mesotherapy'] },
  { label: 'a real pamper', cues: ['pamper', 'relax', 'luxur', 'special', 'occasion', 'wedding', 'event', 'birthday', 'the best'], slugs: ['deluxe-mesotherapy-dermaplaning', 'deluxe-dermaplaning'] },
];

const concernChips = ['Dry, dehydrated skin', 'Dull, tired skin', 'Fine lines', 'Peach fuzz & texture', 'Short on time'];

function recommend(text: string): BotReply | null {
  const scores = new Map<string, number>();
  const labels: string[] = [];
  for (const c of concerns) {
    if (!matchAny(text, c.cues)) continue;
    labels.push(c.label);
    c.slugs.forEach((slug, i) => scores.set(slug, (scores.get(slug) ?? 0) + (3 - i)));
  }
  if (!scores.size) return null;
  const picks = [...scores]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => getService(slug)!);
  const lines = [
    `For ${labels.slice(0, 2).join(' and ')}, I’d suggest:`,
    ...picks.map((s) => `- **[${s.name}](${serviceHref(s)})** — ${formatPrice(s.price)}. ${s.summary}`),
    '',
    'Chlo will confirm the best option for your skin at your consultation.',
  ];
  return { text: lines.join('\n'), chips: ['Book an appointment', 'What’s the difference with Deluxe?', 'Price list'] };
}

// ---------------------------------------------------------------- canned replies

const replies = {
  greet: (): BotReply => ({
    text: `Hi, I’m Glow — the ${site.name} assistant ✨\nI can help with treatments, prices, choosing the right facial and booking. What can I help you with?`,
    chips: starterChips,
  }),
  thanks: (): BotReply => ({
    text: `You’re so welcome! Anything else I can help with? When you’re ready, ${bookLink}.`,
    chips: ['Price list', 'Mobile service?'],
  }),
  bye: (): BotReply => ({ text: 'Thanks for stopping by — have a glowing day! 💕', chips: ['Book an appointment'] }),
  medical: (): BotReply => ({
    text: [
      'That’s an important question, and I’m not able to give medical advice here.',
      `Every treatment starts with a consultation where Chlo reviews your medical history, allergies and medication to make sure it’s suitable and safe for you. Please mention it when you book, or get in touch first on [${site.phone}](${site.phoneHref}) or [${site.email}](mailto:${site.email}).`,
    ].join('\n\n'),
    chips: ['Book an appointment', 'What happens at a consultation?'],
  }),
  notOffered: (): BotReply => ({
    text: `That isn’t on the current menu, sorry! ${site.name} offers **facials** (dermaplaning, mesotherapy and combinations), **skin boosters** (including Profhilo) and **nails**. [See the full price list](/prices).`,
    chips: ['Price list', 'Which facial suits me?'],
  }),
  booking: (s?: Service): BotReply => ({
    text: [
      s
        ? `Lovely choice! You can book **${s.name}** (${formatPrice(s.price)}${s.duration ? `, ${s.duration}` : ''}) online through Booksy, where you can see live availability.`
        : 'You can book online through Booksy, where you can see live availability.',
      `[Book on Booksy](${site.booking})`,
      `Prefer to chat first? Call [${site.phone}](${site.phoneHref}) or email [${site.email}](mailto:${site.email}).`,
    ].join('\n\n'),
    chips: ['Mobile service?', 'Price list'],
  }),
  mobile: (): BotReply => ({
    text: `Yes! Mobile appointments are available across ${site.area} for an extra **£${site.mobileSurcharge}**. Mention it when you book, or get in touch on [${site.phone}](${site.phoneHref}).`,
    chips: ['Book an appointment', 'Price list'],
  }),
  licensed: (): BotReply => ({ text: faq('Are you licensed'), chips: ['Which facial suits me?', 'Book an appointment'] }),
  downtime: (): BotReply => ({ text: faq('Is there any downtime'), chips: ['Aftercare', 'Book an appointment'] }),
  sessions: (): BotReply => ({ text: faq('How many sessions'), chips: ['Tell me about Profhilo', 'Book an appointment'] }),
  pain: (): BotReply => ({
    text: `${faq('Does Profhilo hurt')} Facials like dermaplaning and mesotherapy are gentle and relaxing — most clients find them a real treat.`,
    chips: ['Tell me about Profhilo', 'Book an appointment'],
  }),
  aftercare: (): BotReply => ({
    text: 'You’ll receive tailored aftercare instructions after every treatment for optimal healing and the best results — following them is key to getting the most from your treatment.',
    chips: ['Is there any downtime?', 'Book an appointment'],
  }),
  firstVisit: (): BotReply => ({ text: faq('What happens at my first'), chips: ['Which facial suits me?', 'Book an appointment'] }),
  deluxe: (): BotReply => ({
    text: faq('What’s the difference'),
    chips: ['Tell me about Deluxe Dermaplaning', 'Tell me about Deluxe Mesotherapy', 'Price list'],
  }),
  location: (): BotReply => ({
    text: `${site.name} covers **${site.area}**, with a mobile service available for an extra £${site.mobileSurcharge}. For the exact location of your appointment, get in touch on [${site.phone}](${site.phoneHref}) or check your Booksy confirmation.`,
    chips: ['Mobile service?', 'Book an appointment'],
  }),
  hours: (): BotReply => ({
    text: `Live availability is shown on Booksy, so you can pick a time that suits you. [Check availability](${site.booking})`,
    chips: ['Price list', 'Mobile service?'],
  }),
  payment: (): BotReply => ({
    text: `For payment, deposit, cancellation or gift questions, please check the details on [Booksy](${site.booking}) or ask directly on [${site.phone}](${site.phoneHref}) / [${site.email}](mailto:${site.email}).`,
    chips: ['Book an appointment', 'Price list'],
  }),
  contact: (): BotReply => ({
    text: [
      `- Phone: [${site.phone}](${site.phoneHref})`,
      `- Email: [${site.email}](mailto:${site.email})`,
      ...site.socials.map((s) => `- ${s.label}: [${s.href.replace(/^https:\/\/(www\.)?/, '')}](${s.href})`),
    ].join('\n'),
    chips: ['Book an appointment', 'Mobile service?'],
  }),
  askConcern: (): BotReply => ({
    text: 'Happy to help you choose! What’s your main skin goal right now?',
    chips: concernChips,
  }),
  nails: (): BotReply =>
    listReply(
      '**Glow Nail Menu**',
      nails,
      `Add-ons: ${nailAddOns.map((a) => `${a.name} ${formatPrice(a.price)}`).join(' · ')}\n\n[See nails](/nails) · ${bookLink}`,
      ['Book an appointment', 'Facials'],
    ),
  boosters: (): BotReply =>
    listReply(
      '**Skin boosters & injectables**',
      skinBoosters,
      `Every injectable treatment begins with a consultation. [Explore skin boosters](/skin-boosters)`,
      ['Tell me about Profhilo', 'Book an appointment'],
    ),
  facials: (): BotReply =>
    listReply(
      '**Facials**',
      [...facials].sort(byPrice),
      'Deluxe versions add exfoliation, a mask and a scalp massage. [Explore facials](/treatments)',
      ['Which facial suits me?', 'What’s the difference with Deluxe?'],
    ),
  priceList: (): BotReply => ({
    text: [
      '**Facials**',
      ...[...facials].sort(byPrice).map(priceLine),
      '',
      '**Skin boosters**',
      ...skinBoosters.map(priceLine),
      '',
      '**Nails**',
      ...nails.map(priceLine),
      `Add-ons: ${nailAddOns.map((a) => `${a.name} ${formatPrice(a.price)}`).join(' · ')}`,
      '',
      `Mobile service +£${site.mobileSurcharge}. [Full price list](/prices)`,
    ].join('\n'),
    chips: ['Which facial suits me?', 'Book an appointment'],
  }),
  fallback: (): BotReply => ({
    text: `I’m not quite sure about that one — but I can help with treatments, prices, choosing a facial, nails, mobile appointments and booking. For anything else, Chlo is happy to help on [${site.phone}](${site.phoneHref}).`,
    chips: starterChips,
  }),
};

// ---------------------------------------------------------------- entry point

export function localReply(input: string): BotReply {
  const text = norm(input);
  if (!text) return replies.greet();
  const toks = text.split(' ');

  if (matchAny(text, CUES.medical)) return replies.medical();
  if (matchAny(` ${text} `, CUES.notOffered)) return replies.notOffered();

  const ranked = rankServices(text);
  const strong = ranked[0] && ranked[0].score >= 5 ? ranked[0].s : undefined;

  if (matchAny(text, CUES.booking)) return replies.booking(strong);
  if (!strong && toks.length <= 4 && matchAny(text, CUES.greeting)) return replies.greet();
  if (!strong && matchAny(`${text} `, CUES.thanks)) return replies.thanks();
  if (!strong && matchAny(text, CUES.bye)) return replies.bye();
  if (/\bdeluxe\b/.test(text) && matchAny(text, ['differen', 'vs', 'versus', 'compar', 'worth', 'what is deluxe', 'whats deluxe', 'what does deluxe'])) {
    return replies.deluxe();
  }
  if (matchAny(text, CUES.mobile)) return replies.mobile();
  if (matchAny(text, CUES.pain)) return replies.pain();
  if (matchAny(text, CUES.downtime)) return replies.downtime();
  if (matchAny(text, CUES.sessions)) return replies.sessions();
  if (matchAny(text, CUES.aftercare)) return replies.aftercare();

  if (strong) {
    const ties = ranked.filter((r) => r.score === ranked[0].score);
    if (ties.length > 1) return listReply('Here are the closest matches:', ties.map((r) => r.s).slice(0, 4), bookLink);
    return serviceReply(strong, text);
  }

  const wantsNails = matchAny(text, CUES.nails);
  if (matchAny(text, CUES.recommend) && !wantsNails) return recommend(text) ?? replies.askConcern();
  const concern = !wantsNails && recommend(text);
  if (concern) return concern;

  if (matchAny(text, CUES.licensed)) return replies.licensed();
  if (matchAny(text, CUES.firstVisit)) return replies.firstVisit();
  if (matchAny(text, CUES.location)) return replies.location();
  if (matchAny(text, CUES.hours)) return replies.hours();
  if (matchAny(text, CUES.payment)) return replies.payment();
  if (wantsNails) return replies.nails();
  if (matchAny(text, CUES.boosters)) return replies.boosters();
  if (matchAny(text, CUES.facials)) return replies.facials();
  if (matchAny(text, CUES.price)) return replies.priceList();
  if (ranked.length) return listReply('Did you mean one of these?', ranked.slice(0, 3).map((r) => r.s), bookLink);
  if (matchAny(text, CUES.contact)) return replies.contact();
  return replies.fallback();
}
