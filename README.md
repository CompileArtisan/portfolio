# Portfolio + Sanity CMS

- **`studio/`** — a Sanity Studio (v3) with a schema for every section of the
  page: Site Settings (hero), Experience, Projects, Open Source
  Contributions, Blog Posts, Publications, Preprints.
- **`web/`** — a plain HTML/CSS/JS frontend (no build step) that queries
  your Sanity dataset with GROQ and renders the page. Until you connect a
  real project, it renders from the bundled seed content in

## 1. Set up the Studio

```bash
cd studio
npm install
cp .env.example .env      # then fill in SANITY_STUDIO_PROJECT_ID/_DATASET
npx sanity login          # if you haven't already
npx sanity init --env     # links this folder to a Sanity project + dataset
                           # (or just edit .env manually)
npm run dev                # opens the Studio at localhost:3333
```

`studio/sanity.config.js` reads the project ID/dataset from `.env` (via
`SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`) so no project ID is
hardcoded in the source — `.env` is gitignored, only `.env.example` is
committed. When deploying the Studio itself (`npx sanity deploy`), set the
same two variables as build-time env vars on whatever CI/host runs the
build, or keep a local `.env` if you're deploying from your machine.

Open the Studio, and for each schema type create documents with your real
content (Site Settings is a singleton — create exactly one).

## 2. Point the frontend at your project

The frontend has no build step, so it can't read `.env` at request time —
instead it reads `web/config.js`, which is gitignored so your project ID
never ends up in the repo.

```bash
cd web
cp config.example.js config.js
```

Then edit `web/config.js`:

```js
window.SANITY_CONFIG = {
  projectId: 'your-project-id',   // from sanity.io/manage
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
};
```

When you deploy `web/` (Vercel, Netlify, GitHub Pages, Cloudflare Pages),
make sure `config.js` is actually present in the deployed output — since
it's gitignored, either upload it as part of your deploy step, or add it
as a build artifact/secret file on your hosting platform rather than
committing it.

By default new Sanity datasets are private. Either make the dataset
public (Studio → API settings) or add a read token and pass it through a
small serverless proxy — don't ship a write token to the browser. (The
project ID itself isn't a secret — Sanity's client-side API always needs
it in the URL — but keeping it out of the repo means anyone forking this
template starts from a clean slate instead of pointing at your dataset.)

## 3. Run the frontend

`web/` is fully static — open `web/index.html` directly, or serve it:

```bash
cd web
npx serve .
```

Deploy `web/` anywhere that serves static files (Vercel, Netlify, GitHub
Pages, Cloudflare Pages). Deploy the Studio separately with
`npx sanity deploy` from `studio/`, or run it locally only.

## Notes on the replica

- All text content below was taken from the current public page
  (arneshbanerjee.dev) and is included as seed/demo data — replace it with
  your own content in the Studio.
- PDFs, certificates, logos, and the project demo video referenced by the
  original site aren't included here (they're not part of the page's
  markup); the schema has fields ready for them (`file`/`image` types) —
  upload your own copies through the Studio.
- Visual design (colors, type, spacing) is a close, from-scratch
  recreation of the layout and structure — a single-column CV-style page,
  sticky anchor nav, light/dark theme — rather than a pixel-for-pixel copy
  of the original CSS, which wasn't accessible to fetch directly.
