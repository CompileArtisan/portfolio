export default {
  name: 'certification',
  title: 'Certification',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    {
      name: 'issuer',
      title: 'Issuing organization (e.g. Google, AWS, MathWorks, Great Learning)',
      type: 'string',
    },
    { name: 'dateLabel', title: 'Display date (e.g. Jan 2026)', type: 'string' },
    { name: 'credentialUrl', title: 'Credential / badge URL', type: 'url' },
    {
      name: 'file',
      title: 'Certificate file (PDF/image, optional)',
      type: 'file',
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
