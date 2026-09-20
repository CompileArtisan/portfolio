// NEW schema — most CVs/resumes have a "Skills" section (languages,
// frameworks, tools) and the previous schema had nowhere to put it.
export default {
  name: 'skill',
  title: 'Skill Category',
  type: 'document',
  fields: [
    {
      name: 'category',
      title: 'Category (e.g. Languages, Frameworks & Libraries, Tools & Platforms)',
      type: 'string',
    },
    {
      name: 'items',
      title: 'Skills in this category',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
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
    select: { title: 'category', subtitle: 'items' },
    prepare({ title, subtitle }) {
      return { title, subtitle: Array.isArray(subtitle) ? subtitle.join(', ') : subtitle };
    },
  },
}
