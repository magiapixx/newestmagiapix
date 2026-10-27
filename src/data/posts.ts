// Blog posts (/blog/ and /blog/<slug>/), newest first. Dummy content until the real articles are written.
// `body` is a list of blocks: paragraphs, sub-headings, quotes and bullet lists.

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO date
  readTime: number; // minutes
  author: string;
  cover: string;
  body: Block[];
}

const body = (topic: string): Block[] => [
  { type: 'p', text: `Every project starts with a question, and ${topic} is no exception. Before a single pixel moves, we sit with the brief, the people behind it and the audience it has to reach. The answers shape everything that follows: the structure, the tone and the pace of the work.` },
  { type: 'p', text: 'What we look for first is tension: the gap between where a brand is today and where it wants to be seen tomorrow. Naming that gap clearly gives the whole team one direction to push in, and it keeps decisions honest when the deadlines start to bite.' },
  { type: 'h2', text: 'Structure before style' },
  { type: 'p', text: 'A strong visual system is built on a grid that can take a beating. We set the proportions, the type scale and the rhythm of the spacing early, so every later decision sits on solid ground instead of taste alone.' },
  { type: 'quote', text: 'Precision is not the opposite of expression. It is what lets expression land.' },
  { type: 'p', text: 'With the structure in place, style becomes a set of deliberate choices rather than decoration. Colour, motion and imagery each get a job to do, and anything without a job is left out.' },
  { type: 'h2', text: 'What we take away' },
  { type: 'list', items: [
    'Write the problem down in one sentence before designing anything.',
    'Lock the grid and the type scale before choosing colours.',
    'Give motion a purpose: guide the eye, never distract it.',
    'Test on real devices early, not in the last week.',
  ] },
  { type: 'p', text: 'None of this is a formula. It is a habit of asking why before asking how, and it is the habit we bring to every studio, brand and small team we work with.' },
];

export const posts: Post[] = [
  {
    slug: 'designing-with-structural-precision',
    title: 'Designing with structural precision',
    excerpt: 'Why a rigorous grid is the most creative decision you can make, and how it frees a brand to be bold.',
    category: 'Design',
    date: '2026-10-14',
    readTime: 6,
    author: 'Magiapix Studio',
    cover: '/images/nPXcfgWdT5K8JbvlDs4VQhhws.jpg',
    body: body('designing with structure'),
  },
  {
    slug: 'the-new-rules-of-3d-for-brands',
    title: 'The new rules of 3D for brands',
    excerpt: 'Real-time 3D has left the lab. Here is how we use it to make brands feel tangible on every screen.',
    category: '3D',
    date: '2026-09-30',
    readTime: 8,
    author: 'Magiapix Studio',
    cover: '/images/RFdcBAQsIqs2cwSENiDPQN8xt8.jpg',
    body: body('bringing 3D into a brand'),
  },
  {
    slug: 'motion-that-earns-its-place',
    title: 'Motion that earns its place',
    excerpt: 'Animation should guide the eye, not perform for it. A short guide to purposeful motion on the web.',
    category: 'Motion',
    date: '2026-09-12',
    readTime: 5,
    author: 'Magiapix Studio',
    cover: '/images/bLvotkjf6dFGxyiS1gfV2zCoAI.jpg',
    body: body('designing motion'),
  },
  {
    slug: 'from-brief-to-launch-in-six-weeks',
    title: 'From brief to launch in six weeks',
    excerpt: 'A look inside our process: the rituals, checkpoints and tools that keep fast projects on course.',
    category: 'Process',
    date: '2026-08-21',
    readTime: 7,
    author: 'Magiapix Studio',
    cover: '/images/4zmvB84YdDqvaIgOFHPAk2SGOXI.jpg',
    body: body('a six-week launch'),
  },
  {
    slug: 'building-a-brand-that-scales',
    title: 'Building a brand that scales',
    excerpt: 'Identity systems that hold together from a favicon to a billboard, and the decisions that make it possible.',
    category: 'Branding',
    date: '2026-07-29',
    readTime: 6,
    author: 'Magiapix Studio',
    cover: '/images/rAJGys7D5In5EzOU3L5miGh8ks.jpg',
    body: body('a scalable identity'),
  },
  {
    slug: 'what-clients-ask-before-hiring-a-studio',
    title: 'What clients ask before hiring a studio',
    excerpt: 'Budgets, timelines and ownership: honest answers to the questions we hear in every first call.',
    category: 'Studio',
    date: '2026-07-08',
    readTime: 4,
    author: 'Magiapix Studio',
    cover: '/images/ZQqfSSYOzv1ENV9pRRJHAAy691Y.jpg',
    body: body('choosing a studio'),
  },
];

export const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
