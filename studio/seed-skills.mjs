// seed-skills.mjs
//
// Pushes Skill Category documents into your Sanity dataset, shaped to
// studio/schemas/skill.js ({ category, items[], order }).
//
// Idempotent: each document gets a deterministic _id (skill-<slug>), so
// re-running this updates the existing docs instead of duplicating them.
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
//   node seed-skills.mjs
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

// ---------------------------------------------------------------------
// DATA — edit freely before running
// ---------------------------------------------------------------------

const skills = [
  {
    category: 'AI & Machine Learning',
    items: [
      'Deep Learning',
      'Machine Learning',
      'Neural Networks',
      'Computer Vision',
      'Graph Neural Networks',
      'Reinforcement Learning',
    ],
    order: 1,
  },
  {
    category: 'Web Development',
    items: ['React', 'Astro', 'Node.js', 'TypeScript', 'REST APIs', 'HTML/CSS'],
    order: 2,
  },
  {
    category: 'Data & Research',
    items: [
      'NumPy',
      'Pandas',
      'Data Visualization',
      'Experimental Design',
      'Statistical Analysis',
      'Literature Review',
      'Technical Writing',
    ],
    order: 3,
  },
  {
    category: 'DevOps & Systems',
    items: ['Linux', 'Git', 'GitHub', 'Docker', 'Kubernetes', 'Bash', 'Cloudflare'],
    order: 4,
  },
  {
    category: 'Blockchain & Security',
    items: [
      'Blockchain',
      'Cryptography',
      'SHA-256',
      'Merkle Trees',
      'Proof of Work',
      'Proof of Stake',
      'Forward Secrecy',
    ],
    order: 5,
  },
];

// ---------------------------------------------------------------------
// PUSH TO SANITY
// ---------------------------------------------------------------------

async function run() {
  for (const doc of skills) {
    const _id = `skill-${slugify(doc.category)}`;
    const result = await client.createOrReplace({ _id, _type: 'skill', ...doc });
    console.log(`✓ skill: ${_id}`);
  }
  console.log('\nDone. Open the Studio to review/edit, or check your live site once deployed.');
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
