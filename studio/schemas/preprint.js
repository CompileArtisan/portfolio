export default {
  name: 'preprint',
  title: 'Preprint',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'status', title: 'Status (e.g. "In preparation for X", "2025")', type: 'string' },
    {
      name: 'authors',
      title: 'Authors (in order; mark self)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'isSelf', type: 'boolean', title: 'This is me (bold)' },
          ],
        },
      ],
    },
    { name: 'arxivId', title: 'arXiv ID', type: 'string' },
  ],
}
