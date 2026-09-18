// seed-sanity.mjs
//
// Pushes your real content into the Sanity dataset, shaped exactly to the
// schemas in studio/schemas/ (siteSettings, experience, project,
// publication, openSourceContribution, blogPost, preprint).
//
// Merged from resume.tex AND cv.tex. Where they disagreed (GPA, wording),
// cv.tex was treated as the more recent/authoritative one.
//
// NOT included below because there's no matching schema type yet:
//   - Certifications (Google Cloud Cybersecurity, AWS Cloud Foundations,
//     MATLAB Image Processing Onramp, GL Computer Vision Essentials)
//   - Education (Amrita Vishwa Vidyapeetham B.Tech, + two prior schools)
// If you want these on the site, you'd need to add a schema type for one
// or both (e.g. studio/schemas/certification.js, .../education.js) and a
// matching render function in app.js — happy to write those if you want them.
//
// ---------------------------------------------------------------------
// SETUP
// ---------------------------------------------------------------------
//   npm install @sanity/client
//
// You need a Sanity API token with "Editor" (write) permissions:
//   sanity.io/manage → your project → API → Tokens → Add API token
//
// Then run (macOS/Linux):
//   SANITY_PROJECT_ID=your-project-id \
//   SANITY_DATASET=production \
//   SANITY_TOKEN=sk... \
//   node seed-sanity.mjs
//
// The script is idempotent — every document has a deterministic _id, so
// re-running it updates existing documents (including the ones from your
// first run) instead of duplicating them.
// ---------------------------------------------------------------------

import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error(
    'Missing env vars. Set SANITY_PROJECT_ID and SANITY_TOKEN (SANITY_DATASET defaults to "production").'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const textBlock = (text) => [
  {
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text }],
  },
];

// ---------------------------------------------------------------------
// DATA — edit freely before running
// ---------------------------------------------------------------------

const siteSettings = {
  _id: 'siteSettings', // singleton
  _type: 'siteSettings',
  name: 'Praanesh Balakrishnan Nair',
  eyebrow: 'B.Tech CSE (AI) · Research Intern, Samsung PRISM',
  bio: textBlock(
    'Computer Science and Engineering (AI) undergraduate at Amrita Vishwa Vidyapeetham, Bengaluru, with ' +
      'research and project experience spanning deep learning for agricultural computer vision, graph neural ' +
      'networks for next-generation wireless networks, decentralized systems, and full-stack web development.'
  ),
  status:
    'Currently a Research Intern at Samsung PRISM, working on graph neural network-based radio map modeling ' +
    'for 6G networks, and President of the CodeChef ASEB Club at Amrita Vishwa Vidyapeetham (CGPA 8.88).',
  funFact: '', // TODO: not stated in either document
  email: 'praanesh.b.nair@gmail.com',
  links: [
    { label: 'Portfolio', url: 'https://compileartisan.dev' },
    { label: 'GitHub', url: 'https://github.com/CompileArtisan' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/praanesh-nair' },
  ],
};

const experience = [
  {
    organization: 'Research Intern — Samsung PRISM (PReparing and Inspiring Student Minds)',
    dateRange: '2026 – Present',
    lab: '',
    advisorName: '',
    advisorUrl: '',
    documents: [],
    bullets: [
      'Project: Graph Neural Network Radio Map for 6G Networks.',
      'Modeling radio-signal propagation with graph neural networks to support coverage and interference prediction in next-generation (6G) wireless networks.',
    ],
    order: 1,
  },
  {
    organization: 'President, CodeChef ASEB Club — Amrita Vishwa Vidyapeetham',
    dateRange: '2025 – Present',
    lab: '',
    advisorName: '',
    advisorUrl: '',
    documents: [],
    bullets: ['Leading and organizing competitive programming initiatives, contests, and peer learning sessions.'],
    order: 2,
  },
  {
    organization:
      'Event Lead, "Write Your Own Programming Language" Workshop — Dastaan Multifest, Amrita Vishwa Vidyapeetham',
    dateRange: '2025',
    lab: '',
    advisorName: '',
    advisorUrl: '',
    documents: [],
    bullets: ['Organized and conducted a technical workshop on programming language design and implementation concepts for a national student audience.'],
    order: 3,
  },
];

const projects = [
  {
    title: 'CompileArtisan: Personal Portfolio & Blog',
    tags: ['Astro.js', 'React.js', 'JavaScript', 'CSS', 'Cloudflare Pages'],
    description: textBlock(
      'Personal website with a dynamic routing system for Markdown-powered blog posts and optimized content delivery, deployed on Cloudflare Pages.'
    ),
    linkGithub: '', // TODO: add repo URL if public
    linkExtra: 'https://compileartisan.dev',
    linkExtraLabel: 'Live site',
    order: 1,
  },
  {
    title: 'Weed Growth Stage Classification',
    tags: ['Python', 'TensorFlow', 'Keras', 'OpenCV', 'Jupyter Notebook', 'Kaggle'],
    description: textBlock(
      'A DenseNet121 + Triplet Attention architecture reaching 95.43% accuracy across 43 weed growth-stage ' +
        'classes with only 8.79M parameters, using adaptive data augmentation and balanced sampling to address ' +
        'class imbalance. Benchmarked against 9 CNN architectures and 8 attention mechanisms; Triplet Attention cut ' +
        'validation loss by 18.4% and raised recall by 3.25 points while adding just 297 parameters. Trained on a ' +
        'curated, augmented 35,847-image dataset across 6 weed species from the CWD30 benchmark. Presented as ' +
        'original research at IEEE ICSSCNA 2026.'
    ),
    linkGithub: '', // TODO
    linkExtra: '',
    linkExtraLabel: '',
    order: 2,
  },
  {
    title: 'Blockchain-Based Communicator with Multicast Transmission',
    tags: ['Java', 'RSA', 'SHA-256', 'Multicast Sockets'],
    description: textBlock(
      'A decentralized peer-to-peer communication system using RSA encryption and SHA-256 hashing over multicast ' +
        'sockets to eliminate centralized servers, with a lightweight blockchain architecture for tamper-proof ' +
        'communication logs.'
    ),
    linkGithub: '', // TODO
    linkExtra: '',
    linkExtraLabel: '',
    order: 3,
  },
];

const publications = [
  {
    title: 'Weed Growth Stage Classification',
    venue: 'IEEE ICSSCNA 2026 — International Conference on Signal, Systems, and Computing for Next-Gen Automation (Paper ID: 403)',
    dateLabel: '2026',
    presentationType: 'Presenter',
    authors: [{ name: 'Praanesh Balakrishnan Nair', isSelf: true }],
    certificateUrl: '',
  },
];

// Nothing in either document maps to these — left empty so the Studio
// sections exist but stay blank until you add real entries.
const openSourceContributions = [];
const blogPosts = [];
const preprints = [];

// ---------------------------------------------------------------------
// PUSH TO SANITY
// ---------------------------------------------------------------------

async function upsert(doc, idPrefix) {
  const _id = doc._id || `${idPrefix}-${slugify(doc.title || doc.organization || doc.repo)}`;
  const { _id: _ignore, ...rest } = doc;
  const result = await client.createOrReplace({ _id, ...rest });
  console.log(`✓ ${result._type}: ${_id}`);
  return result;
}

async function run() {
  await upsert(siteSettings);

  for (const doc of experience) await upsert({ _type: 'experience', ...doc }, 'experience');
  for (const doc of projects) await upsert({ _type: 'project', ...doc }, 'project');
  for (const doc of publications) await upsert({ _type: 'publication', ...doc }, 'publication');
  for (const doc of openSourceContributions) await upsert({ _type: 'openSourceContribution', ...doc }, 'oss');
  for (const doc of blogPosts) await upsert({ _type: 'blogPost', ...doc }, 'blog');
  for (const doc of preprints) await upsert({ _type: 'preprint', ...doc }, 'preprint');

  console.log('\nDone. Open the Studio to review/edit, or check your live site once deployed.');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
