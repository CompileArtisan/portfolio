export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }] },
    {
      name: 'tags',
      title: 'Tech tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    },
    { name: 'media', title: 'Demo image / video', type: 'file' },
    { name: 'mediaAlt', title: 'Media alt text', type: 'string' },
    {
      name: 'linkGithub',
      title: 'GitHub link',
      type: 'link',
      description: 'Link to the repo OR upload a source archive (zip) directly.',
    },
    {
      name: 'linkExtra',
      title: 'Extra link (Hugging Face, demo...)',
      type: 'link',
      description: 'Link out to a demo/write-up OR upload a file (report, slides, etc.) directly.',
    },
    { name: 'linkExtraLabel', title: 'Extra link label', type: 'string' },
    { name: 'order', title: 'Sort order', type: 'number' },
  ],
  orderings: [
    { title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
}
