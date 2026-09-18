export default {
  name: 'education',
  title: 'Education',
  type: 'document',
  fields: [
    {
      name: 'institution',
      title: 'Institution (e.g. Amrita Vishwa Vidyapeetham, Bengaluru)',
      type: 'string',
    },
    {
      name: 'qualification',
      title: 'Qualification (e.g. B.Tech, Computer Science and Engineering with AI)',
      type: 'string',
    },
    { name: 'dateRange', title: 'Date range (e.g. 2023 – Present)', type: 'string' },
    {
      name: 'scoreLabel',
      title: 'Score (e.g. "CGPA: 8.88/10.0" or "94.0% (470/500)")',
      type: 'string',
    },
    {
      name: 'bullets',
      title: 'Additional detail bullets (coursework, etc.)',
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
    select: { title: 'institution', subtitle: 'qualification' },
  },
}
