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
      name: 'githubHandle',
      title: 'GitHub username',
      description: 'Used to render the contribution graph in the GitHub section (via ghchart.rshah.org — no token needed, works for any public profile).',
      type: 'string',
    },
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
    {
      name: 'sectionVisibility',
      title: 'Section Visibility',
      description: 'Turn any section of the site on or off without deleting its content. Off = hidden from the page and from the nav.',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        { name: 'about', title: 'Show About / Hero', type: 'boolean', initialValue: true },
        { name: 'experience', title: 'Show Experience', type: 'boolean', initialValue: true },
        { name: 'education', title: 'Show Education', type: 'boolean', initialValue: true },
        { name: 'projects', title: 'Show Projects', type: 'boolean', initialValue: true },
        { name: 'openSource', title: 'Show Open Source', type: 'boolean', initialValue: true },
        { name: 'github', title: 'Show GitHub', type: 'boolean', initialValue: true },
        { name: 'blogs', title: 'Show Blogs', type: 'boolean', initialValue: true },
        { name: 'publications', title: 'Show Publications', type: 'boolean', initialValue: true },
        { name: 'preprints', title: 'Show Preprints', type: 'boolean', initialValue: true },
        { name: 'certifications', title: 'Show Certifications', type: 'boolean', initialValue: true },
        { name: 'achievements', title: 'Show Achievements', type: 'boolean', initialValue: true },
        { name: 'guestbook', title: 'Show Guestbook', type: 'boolean', initialValue: true },
      ],
    },
  ],
}
