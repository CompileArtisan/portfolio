export default {
  name: 'openSourceContribution',
  title: 'Open Source Contribution',
  type: 'document',
  fields: [
    { name: 'repo', title: 'Repo (e.g. opencv/opencv)', type: 'string' },
    { name: 'prLabel', title: 'PR label (e.g. PR #29255)', type: 'string' },
    {
      name: 'url',
      title: 'PR link',
      type: 'link',
      description: 'Link to the PR/commit OR upload a saved copy (e.g. a patch file) directly.',
    },
    { name: 'organization', title: 'Organization', type: 'string' },
    { name: 'mergedAt', title: 'Date', type: 'date' },
  ],
}
