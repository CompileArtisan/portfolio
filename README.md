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
npx sanity login          # if you haven't already
npx sanity init --env     # links this folder to a Sanity project + dataset
                           # (or manually set projectId/dataset below)
npm run dev                # opens the Studio at localhost:3333
```

Open the Studio, and for each schema type create documents with your real
content (Site Settings is a singleton — create exactly one).

## 2. Point the frontend at your project

Edit `web/config.js`:

```js
window.SANITY_CONFIG = {
  projectId: 'your-project-id',   // from sanity.io/manage
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
};
```

Also update `studio/sanity.config.js` with the same `projectId`/`dataset`.

By default new Sanity datasets are private. Either make the dataset
public (Studio → API settings) or add a read token and pass it through a
small serverless proxy — don't ship a write token to the browser.

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
