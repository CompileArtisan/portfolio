// seed-sanity.mjs
//
// Pushes your real content into the Sanity dataset, shaped exactly to the
// schemas in studio/schemas/ (siteSettings, experience, education, project,
// publication, openSourceContribution, blogPost, preprint, certification,
// achievement).
//
// Merged from resume.tex AND cv.tex. Where they disagreed (GPA, wording),
// cv.tex was previously treated as authoritative for the "8.88" figure, but
// resume.tex (the most recently supplied copy) says 8.82 — went with 8.82
// here. Double check which is actually current.
//
// UPDATE from the previous version of this script:
//   - Education is now seeded (studio/schemas/education.js already existed
//     and was already wired into web/app.js — it just wasn't being filled).
//   - experience.js schema gained a `category` field ('research' vs
//     'leadership') so club/organizing roles are tagged separately from
//     research & work experience, matching the "Leadership and Activities"
//     section in resume.tex. You'll need a matching small update to
//     web/app.js (GROQ query + renderExperience) to group by it on the
//     live site — see the snippet Claude gave you alongside this file.
//   - Added two more projects: your Doom Emacs config repo, and the
//     notes.compileartisan.dev static-notes build.
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
    'for 6G networks, and President of the CodeChef ASEB Club at Amrita Vishwa Vidyapeetham (CGPA 8.82).',
  funFact: '', // TODO: not stated in either document
  email: 'praanesh.b.nair@gmail.com',
  links: [
    { label: 'Portfolio', url: 'https://compileartisan.dev' },
    { label: 'GitHub', url: 'https://github.com/CompileArtisan' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/praanesh-nair' },
  ],
};

// ---------------------------------------------------------------------
// EDUCATION — from resume.tex "Education" section
// ---------------------------------------------------------------------

const education = [
  {
    institution: 'Amrita Vishwa Vidyapeetham, Bengaluru',
    qualification: 'B.Tech, Computer Science and Engineering with Artificial Intelligence',
    dateRange: 'Aug 2023 – Present',
    scoreLabel: 'CGPA: 8.82/10.0',
    bullets: [],
    order: 1,
  },
  {
    institution: 'Sri Chaitanya Techno School, Bangalore',
    qualification: 'Senior Secondary Education (CBSE Board)',
    dateRange: '2021 – 2023',
    scoreLabel: '83.4% (417/500)',
    bullets: [],
    order: 2,
  },
  {
    institution: 'Jaigopal Garodia Rashtrotthana Vidya Kendra, Bengaluru',
    qualification: 'Secondary Education (CBSE Board)',
    dateRange: '2014 – 2021',
    scoreLabel: '94.0% (470/500)',
    bullets: [],
    order: 3,
  },
];

// ---------------------------------------------------------------------
// EXPERIENCE — `category` distinguishes research/work from club &
// organizing roles, matching resume.tex's separate "Leadership and
// Activities" section. Requires the `category` field added to
// studio/schemas/experience.js.
// ---------------------------------------------------------------------

const experience = [
  {
    organization: 'Research Intern — Samsung PRISM (PReparing and Inspiring Student Minds)',
    category: 'research',
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
    category: 'leadership',
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
    category: 'leadership',
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
  {
    title: 'Doom Emacs Configuration',
    tags: ['Emacs Lisp', 'Doom Emacs', 'Org-mode', 'Linux (Arch)'],
    description: textBlock(
      'Personal Doom Emacs configuration used as a daily-driver development environment — layout, keybindings, ' +
        'and package setup tuned for Org-mode-centric writing and coding workflows.'
    ),
    linkGithub: 'https://github.com/CompileArtisan/doom-emacs-configuration',
    linkExtra: '',
    linkExtraLabel: '',
    order: 4,
  },
  {
    title: 'notes.compileartisan.dev — Org-mode Notes Site',
    tags: ['Emacs Lisp', 'Org-mode', 'Shell', 'Static Site Generation'],
    description: textBlock(
      'A notes site built directly from subjectname/index.org files, converted to HTML via Emacs\u2019 native ' +
        'org-to-HTML export. A build-time script walks the repo, discovers every index.org, and generates the ' +
        'listing page (as seen on notes.compileartisan.dev) with no external static-site generator involved.'
    ),
    linkGithub: 'https://github.com/CompileArtisan/notes.compileartisan.dev',
    linkExtra: 'https://notes.compileartisan.dev',
    linkExtraLabel: 'Live site',
    order: 5,
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

// NEW — from cv.tex "Certifications" table.
const certifications = [
  {
    title: 'Google Cloud Cybersecurity Certificate',
    issuer: 'Google',
    dateLabel: '',
    credentialUrl: 'https://www.credly.com/badges/3e9613f0-bbe7-4874-9c66-4ae538e40ab3',
    order: 1,
  },
  {
    title: 'Academy Graduate, Cloud Foundations',
    issuer: 'AWS',
    dateLabel: '',
    credentialUrl: 'https://www.credly.com/badges/6407291d-da81-4619-bc2c-ec0824d1875c',
    order: 2,
  },
  {
    title: 'Image Processing Onramp',
    issuer: 'MATLAB (MathWorks)',
    dateLabel: 'Jan 2026',
    credentialUrl:
      'https://matlabacademy.mathworks.com/progress/share/certificate.html?id=1fa0de14-e555-4863-9e36-17d9577c656e',
    order: 3,
  },
  {
    title: 'Computer Vision Essentials',
    issuer: 'Great Learning (GL)',
    dateLabel: '',
    credentialUrl: 'https://www.mygreatlearning.com/certificate/VRJJEBWJ',
    order: 4,
  },
];

// NEW — from resume.tex "Honors and Awards" section.
const achievements = [
  {
    title: 'Amrita Vidyanidhi Scholarship',
    issuer: 'Amrita Vishwa Vidyapeetham — University Scholarship Committee',
    dateLabel: 'AY 2024–25',
    tier: 'Slab 1 (highest tier)',
    description: textBlock(
      'Fee-slab upgraded from Slab 2 to Slab 1 by the University Scholarship Committee for commendable academic performance.'
    ),
    documents: [],
    order: 1,
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
  const _id = doc._id || `${idPrefix}-${slugify(doc.title || doc.organization || doc.institution || doc.repo)}`;
  const { _id: _ignore, ...rest } = doc;
  const result = await client.createOrReplace({ _id, ...rest });
  console.log(`✓ ${result._type}: ${_id}`);
  return result;
}

async function run() {
  await upsert(siteSettings);

  for (const doc of education) await upsert({ _type: 'education', ...doc }, 'education');
  for (const doc of experience) await upsert({ _type: 'experience', ...doc }, 'experience');
  for (const doc of projects) await upsert({ _type: 'project', ...doc }, 'project');
  for (const doc of publications) await upsert({ _type: 'publication', ...doc }, 'publication');
  for (const doc of certifications) await upsert({ _type: 'certification', ...doc }, 'certification');
  for (const doc of achievements) await upsert({ _type: 'achievement', ...doc }, 'achievement');
  for (const doc of openSourceContributions) await upsert({ _type: 'openSourceContribution', ...doc }, 'oss');
  for (const doc of blogPosts) await upsert({ _type: 'blogPost', ...doc }, 'blog');
  for (const doc of preprints) await upsert({ _type: 'preprint', ...doc }, 'preprint');

  console.log('\nDone. Open the Studio to review/edit, or check your live site once deployed.');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
