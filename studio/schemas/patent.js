// NEW schema — filed/granted patents are another common "important
// document" category (esp. for research-heavy profiles) that the
// previous schema had nowhere to record.
export default {
  name: 'patent',
  title: 'Patent',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    {
      name: 'status',
      title: 'Status (e.g. Filed, Published, Granted)',
      type: 'string',
    },
    { name: 'patentNumber', title: 'Patent / application number', type: 'string' },
    { name: 'dateLabel', title: 'Display date (e.g. 2026)', type: 'string' },
    {
      name: 'inventors',
      title: 'Inventors (in order; mark self)',
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
    {
      name: 'link',
      title: 'Patent link',
      type: 'link',
      description: 'Link to the patent filing (e.g. Google Patents), OR upload the filing document directly.',
    },
    { name: 'order', title: 'Sort order (lower = higher up)', type: 'number' },
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'status' },
  },
}
