export default {
  name: 'achievement',
  title: 'Achievement / Award',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title (e.g. Amrita Vidyanidhi Scholarship)',
      type: 'string',
    },
    {
      name: 'issuer',
      title: 'Awarding body / context (e.g. Amrita Vishwa Vidyapeetham, University Scholarship Committee)',
      type: 'string',
    },
    { name: 'dateLabel', title: 'Display date (e.g. AY 2024–25)', type: 'string' },
    {
      name: 'tier',
      title: 'Tier / level (e.g. "Slab 1 (highest tier)")',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'documents',
      title: 'Attached documents (certificate, letter...)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string' },
            { name: 'file', type: 'file' },
          ],
        },
      ],
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
    select: { title: 'title', subtitle: 'issuer' },
  },
}
