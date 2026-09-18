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
      name: 'linkGithub', title: 'GitHub URL', type: 'url',
    },
    { name: 'linkExtra', title: 'Extra link (Hugging Face, demo...)', type: 'url' },
    { name: 'linkExtraLabel', title: 'Extra link label', type: 'string' },
    { name: 'order', title: 'Sort order', type: 'number' },
  ],
  orderings: [
    { title: 'Display order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
}
