export default {
  name: 'experience',
  title: 'Experience',
  type: 'document',
  fields: [
    { name: 'organization', title: 'Organization', type: 'string' },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Research & Professional Experience', value: 'research' },
          { title: 'Leadership & Activities', value: 'leadership' },
        ],
        layout: 'radio',
      },
      initialValue: 'research',
    },
    { name: 'logo', title: 'Logo', type: 'image' },
    { name: 'dateRange', title: 'Date range', type: 'string' },
    {
      name: 'documents',
      title: 'Attached documents (offer letter, certificate...)',
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
    { name: 'lab', title: 'Lab / group', type: 'string' },
    { name: 'advisorName', title: 'Advisor name', type: 'string' },
    { name: 'advisorUrl', title: 'Advisor URL', type: 'url' },
    {
      name: 'bullets',
      title: 'Technical detail bullets',
      type: 'array',
      of: [{ type: 'block' }],
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
    select: { title: 'organization', subtitle: 'category' },
  },
}
