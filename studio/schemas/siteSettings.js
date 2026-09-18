export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    { name: 'name', title: 'Full name', type: 'string' },
    { name: 'eyebrow', title: 'Eyebrow (role line)', type: 'string' },
    { name: 'bio', title: 'Bio', type: 'array', of: [{ type: 'block' }] },
    { name: 'status', title: 'Current status line', type: 'text' },
    { name: 'funFact', title: 'Fun / side-project line', type: 'text' },
    { name: 'email', title: 'Email', type: 'string' },
    {
      name: 'links',
      title: 'Header links (Resume, GitHub, LinkedIn...)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string' },
            { name: 'url', type: 'url' },
          ],
        },
      ],
    },
  ],
}
