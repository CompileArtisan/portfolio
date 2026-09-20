// Reusable "link" field. Anywhere the schema used to have a plain
// `type: 'url'` field, it now uses `type: 'link'` instead — this object —
// so editors can EITHER paste an external URL OR upload a file (PDF,
// image, etc.) directly in the Studio and have it hosted on Sanity's CDN.
//
// Frontend contract: when both are queried, prefer the uploaded file over
// the URL (see the `coalesce(x.file.asset->url, x.url)` GROQ projections
// in web/app.js) — a file the editor deliberately uploaded should win over
// a stale/leftover external link.
export default {
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    {
      name: 'url',
      title: 'External URL',
      type: 'url',
      description: 'Link out to an external page (e.g. a GitHub repo, a Credly badge, an arXiv page).',
    },
    {
      name: 'file',
      title: 'Or upload a file',
      type: 'file',
      description:
        'Upload a file (PDF, image, etc.) to host it directly instead of linking out. If both are filled in, the uploaded file is used.',
    },
  ],
  options: {
    columns: 2,
  },
  preview: {
    select: { url: 'url', fileName: 'file.asset.originalFilename' },
    prepare({ url, fileName }) {
      if (fileName) return { title: `📎 ${fileName}`, subtitle: 'Uploaded file' };
      if (url) return { title: url, subtitle: 'External URL' };
      return { title: 'No link set' };
    },
  },
}
