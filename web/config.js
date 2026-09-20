// Fill these in with your own Sanity project details (sanity.io/manage).
window.SANITY_CONFIG = {
  projectId: 'hob493ap',
  dataset: 'production',
  apiVersion: '2024-01-01',
  // false = every query hits api.sanity.io directly, so edits/toggles you
  // publish in the Studio show up on the next page load, no delay.
  // true = queries go through apicdn.sanity.io (Sanity's edge cache),
  // which is faster and cheaper at scale but can serve stale data for a
  // while after a publish — this is why a toggle you just flipped can
  // still look "on" on the live site. Flip this back to true once you're
  // done actively editing content and want the CDN's speed again.
  useCdn: false,
};
