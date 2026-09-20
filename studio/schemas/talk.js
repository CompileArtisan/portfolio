// NEW schema — invited talks, workshops, panels, and podcast appearances
// don't fit the peer-reviewed "Publication" type, but are common and
// important resume content that the previous schema had no place for.
export default {
  name: 'talk',
  title: 'Talk / Presentation',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'venue', title: 'Venue / event', type: 'string' },
    { name: 'dateLabel', title: 'Display date (e.g. Mar 2026)', type: 'string' },
    {
      name: 'talkType',
      title: 'Type (e.g. Invited Talk, Workshop, Panel, Podcast)',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'link',
      title: 'Slides / recording link',
      type: 'link',
      description: 'Link to slides or a recording, OR upload the slides/recording file directly.',
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
    select: { title: 'title', subtitle: 'venue' },
  },
}
