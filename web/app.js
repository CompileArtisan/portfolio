// ---- Sanity fetch helpers -------------------------------------------------

function sanityQueryUrl(groq) {
  const { projectId, dataset, apiVersion, useCdn } = window.SANITY_CONFIG;
  const host = useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
  return `https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(groq)}`;
}

async function sanityFetch(groq) {
  const { projectId } = window.SANITY_CONFIG;
  if (!projectId) throw new Error('No Sanity project configured — set projectId in config.js');
  const res = await fetch(sanityQueryUrl(groq));
  if (!res.ok) throw new Error('Sanity query failed: ' + res.status);
  const json = await res.json();
  return json.result;
}

function blocksToText(blocks) {
  if (!blocks) return '';
  if (typeof blocks === 'string') return blocks;
  return blocks
    .map((b) => (b.children ? b.children.map((c) => c.text).join('') : ''))
    .join('\n\n');
}

// ---- GROQ projections -------------------------------------------------
//
// `file` and `image` schema fields store an asset *reference*, not a
// usable URL. Fetching the document plain (`*[_type == "x"]`) gets you
// back `{ asset: { _ref: "file-abc123-pdf" } }` — not a link, and not an
// <img> src. `asset->url` (or `asset->{url, mimeType}`) dereferences the
// reference to the real, fetchable URL. Every query below that touches a
// file/image field does this explicitly; without it the field is
// effectively invisible on the page no matter what's uploaded in Studio.
//
// Fields whose schema type is `link` (an object with an `url` string OR
// an uploaded `file`) resolve the same way, via a small helper:
// `coalesce(x.file.asset->url, x.url)` — if an editor uploaded a file,
// that wins; otherwise fall back to the external URL they typed in.

function linkField(fieldName, alias) {
  return `"${alias || fieldName}": coalesce(${fieldName}.file.asset->url, ${fieldName}.url)`;
}

const EXPERIENCE_QUERY = `*[_type == "experience"] | order(order asc){
  organization,
  category,
  dateRange,
  lab,
  advisorName,
  ${linkField('advisorUrl')},
  bullets,
  order,
  "logo": logo.asset->url,
  documents[]{
    label,
    "url": file.asset->url
  }
}`;

const EDUCATION_QUERY = `*[_type == "education"] | order(order asc){
  institution,
  qualification,
  dateRange,
  scoreLabel,
  bullets,
  order
}`;

const SKILL_QUERY = `*[_type == "skill"] | order(order asc){
  category,
  items,
  order
}`;

const PROJECT_QUERY = `*[_type == "project"] | order(order asc){
  title,
  description,
  tags,
  ${linkField('linkGithub')},
  ${linkField('linkExtra')},
  linkExtraLabel,
  mediaAlt,
  order,
  "mediaUrl": media.asset->url,
  "mediaMimeType": media.asset->mimeType
}`;

const OPEN_SOURCE_QUERY = `*[_type == "openSourceContribution"] | order(mergedAt desc){
  repo,
  prLabel,
  organization,
  mergedAt,
  ${linkField('url')}
}`;

const PUBLICATION_QUERY = `*[_type == "publication"] | order(_createdAt desc){
  title,
  venue,
  dateLabel,
  presentationType,
  authors,
  ${linkField('paperUrl')}
}`;

const TALK_QUERY = `*[_type == "talk"] | order(order asc){
  title,
  venue,
  dateLabel,
  talkType,
  description,
  ${linkField('link')},
  order
}`;

const PATENT_QUERY = `*[_type == "patent"] | order(order asc){
  title,
  status,
  patentNumber,
  dateLabel,
  inventors,
  ${linkField('link')},
  order
}`;

const CERTIFICATION_QUERY = `*[_type == "certification"] | order(order asc){
  title,
  issuer,
  dateLabel,
  ${linkField('credentialUrl')},
  order,
  "fileUrl": file.asset->url
}`;

const ACHIEVEMENT_QUERY = `*[_type == "achievement"] | order(order asc){
  title,
  issuer,
  dateLabel,
  tier,
  description,
  order,
  documents[]{
    label,
    "url": file.asset->url
  }
}`;

const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  ...,
  "links": links[]{
    label,
    ${linkField('url')}
  }
}`;

// ---- Data loading -----------------------------------------------------
//
// No seed/demo fallback. Every field defaults to something empty and safe
// (null, '', or []) if Sanity has no data yet or the query fails — the
// render functions below all know how to show a graceful empty state
// instead of crashing.

async function loadData() {
  const [
    settings,
    experience,
    education,
    skills,
    projects,
    openSource,
    blogs,
    publications,
    preprints,
    talks,
    patents,
    certifications,
    achievements,
  ] = await Promise.all([
    sanityFetch(SITE_SETTINGS_QUERY).catch(() => null),
    sanityFetch(EXPERIENCE_QUERY).catch(() => []),
    sanityFetch(EDUCATION_QUERY).catch(() => []),
    sanityFetch(SKILL_QUERY).catch(() => []),
    sanityFetch(PROJECT_QUERY).catch(() => []),
    sanityFetch(OPEN_SOURCE_QUERY).catch(() => []),
    sanityFetch('*[_type == "blogPost"] | order(_createdAt desc)').catch(() => []),
    sanityFetch(PUBLICATION_QUERY).catch(() => []),
    sanityFetch('*[_type == "preprint"] | order(_createdAt desc)').catch(() => []),
    sanityFetch(TALK_QUERY).catch(() => []),
    sanityFetch(PATENT_QUERY).catch(() => []),
    sanityFetch(CERTIFICATION_QUERY).catch(() => []),
    sanityFetch(ACHIEVEMENT_QUERY).catch(() => []),
  ]);

  return {
    settings: settings
      ? {
          name: settings.name || '',
          eyebrow: settings.eyebrow || '',
          bioText: blocksToText(settings.bio),
          status: settings.status || '',
          funFact: settings.funFact || '',
          email: settings.email || '',
          links: settings.links || [],
          sectionVisibility: settings.sectionVisibility || {},
        }
      : null,
    experience: (experience || []).map(normalizeExperience),
    education: education || [],
    skills: skills || [],
    projects: (projects || []).map(normalizeProject),
    openSource: openSource || [],
    blogs: (blogs || []).map((b) => ({ ...b, url: b.slug ? `/blog/${b.slug.current}` : b.url || '#' })),
    publications: publications || [],
    preprints: preprints || [],
    talks: (talks || []).map(normalizeTalk),
    patents: patents || [],
    certifications: certifications || [],
    achievements: (achievements || []).map(normalizeAchievement),
    githubHandle: (settings && settings.githubHandle) || '',
  };
}

function normalizeExperience(e) {
  return { ...e, bullets: (e.bullets || []).map((b) => (typeof b === 'string' ? b : blocksToText([b]))) };
}
function normalizeProject(p) {
  return { ...p, description: typeof p.description === 'string' ? p.description : blocksToText(p.description) };
}
function normalizeAchievement(a) {
  return { ...a, descriptionText: blocksToText(a.description) };
}
function normalizeTalk(t) {
  return { ...t, descriptionText: blocksToText(t.description) };
}

// ---- Rendering ----------------------------------------------------------

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function emptyState(text) {
  return `<p class="block-sub" style="margin-top:1rem;">${text}</p>`;
}

// Every section this site can show, in display order. `key` matches a
// boolean field on siteSettings.sectionVisibility (Studio: "Section
// Visibility"); a section renders only when that field isn't `false`
// (so old Site Settings docs without the field yet still show everything).
const SECTIONS = [
  { key: 'about', anchor: 'about', label: 'About' },
  { key: 'experience', anchor: 'experience', label: 'Experience' },
  { key: 'education', anchor: 'education', label: 'Education' },
  { key: 'skills', anchor: 'skills', label: 'Skills' },
  { key: 'projects', anchor: 'projects', label: 'Projects' },
  { key: 'openSource', anchor: 'opensource', label: 'Open Source' },
  { key: 'github', anchor: 'github', label: 'GitHub' },
  { key: 'blogs', anchor: 'blogs', label: 'Blogs' },
  { key: 'publications', anchor: 'publications', label: 'Publications' },
  { key: 'preprints', anchor: 'preprints', label: 'Preprints' },
  { key: 'talks', anchor: 'talks', label: 'Talks' },
  { key: 'patents', anchor: 'patents', label: 'Patents' },
  { key: 'certifications', anchor: 'certifications', label: 'Certifications' },
  { key: 'achievements', anchor: 'achievements', label: 'Achievements' },
  { key: 'guestbook', anchor: 'guestbook', label: 'Guestbook' },
];

function isSectionVisible(visibility, key) {
  return !visibility || visibility[key] !== false;
}

function renderNav(visibility) {
  const links = SECTIONS.filter((sec) => isSectionVisible(visibility, sec.key))
    .map((sec) => `<a href="#${sec.anchor}">${sec.label}</a>`)
    .join('');
  return `
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-links">
        ${links}
      </div>
      <div class="nav-right">
        <span class="kbd">⌘K</span>
        <button class="theme-toggle" id="themeToggle" type="button">theme</button>
      </div>
    </div>
  </nav>`;
}

function renderHero(s) {
  if (!s) {
    return `
    <section class="hero" id="about">
      <div class="eyebrow">Site Settings</div>
      <h1>Add your details in the Studio</h1>
      <p class="status">No "Site Settings" document exists in Sanity yet — create one in the Studio (it's a singleton, so create exactly one) to fill in your name, bio, links and email.</p>
    </section>`;
  }
  const links = (s.links || [])
    .filter((l) => l.url)
    .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
    .join('');
  return `
  <section class="hero" id="about">
    ${s.eyebrow ? `<div class="eyebrow">${s.eyebrow}</div>` : ''}
    <h1>${s.name || 'Your name'}</h1>
    ${s.bioText ? `<p>${s.bioText}</p>` : ''}
    ${links ? `<div class="links-row">${links}</div>` : ''}
    ${s.status ? `<p class="status">${s.status}</p>` : ''}
    ${s.funFact ? `<p class="fun">${s.funFact}</p>` : ''}
    ${s.email ? `<p class="email-line">Reach me at ${s.email.replace(/@/g, ' [at] ').replace(/\./g, ' [dot] ')}</p>` : ''}
  </section>`;
}

function renderExperienceItem(e) {
  const docs = (e.documents || [])
    .filter((d) => d.url)
    .map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${d.label || 'document'}</a>`)
    .join(', ');
  const bullets = (e.bullets || []).map((b) => `<li>${b}</li>`).join('');
  return `
  <div class="exp-item">
    <div class="exp-logo">${e.logo ? `<img src="${e.logo}" alt="${e.organization} logo" />` : (e.organization || '').slice(0, 2).toUpperCase()}</div>
    <div>
      <div class="entry-head">
        <span class="entry-title">${e.organization || ''}</span>
        <span class="entry-date">${e.dateRange || ''}</span>
      </div>
      ${docs ? `<div class="exp-meta">${docs}</div>` : ''}
      ${e.advisorName ? `<div class="exp-advisor">${e.lab ? e.lab + ' · ' : ''}Advisor: <a href="${e.advisorUrl || '#'}" target="_blank" rel="noopener">${e.advisorName}</a></div>` : ''}
      ${bullets ? `<ul class="exp-bullets">${bullets}</ul>` : ''}
    </div>
  </div>`;
}

// Research/work experience and club/organizing roles render as two visibly
// separate groups (each with its own sub-heading), driven by the
// `category` field on the experience document ('research' | 'leadership').
// Anything with no category set (older documents) falls into "research" so
// nothing silently disappears.
function renderExperience(items) {
  if (!items.length) {
    return `
    <section class="block" id="experience">
      <h2>Experience</h2>
      ${emptyState('Nothing here yet — add "Experience" documents in the Studio.')}
    </section>`;
  }
  const research = items.filter((e) => e.category !== 'leadership');
  const leadership = items.filter((e) => e.category === 'leadership');

  const researchBlock = research.length
    ? `<h3 class="exp-subhead">Research &amp; Professional Experience</h3>${research.map(renderExperienceItem).join('')}`
    : '';
  const leadershipBlock = leadership.length
    ? `<h3 class="exp-subhead">Leadership &amp; Activities</h3>${leadership.map(renderExperienceItem).join('')}`
    : '';

  return `
  <section class="block" id="experience">
    <h2>Experience</h2>
    <p class="block-sub">Where I've worked.</p>
    ${researchBlock}
    ${leadershipBlock}
  </section>`;
}

function renderEducation(items) {
  if (!items.length) {
    return `
    <section class="block" id="education">
      <h2>Education</h2>
      ${emptyState('Nothing here yet — add "Education" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((ed) => {
      const bullets = (ed.bullets || []).map((b) => (typeof b === 'string' ? b : blocksToText([b])));
      return `
      <div class="entry">
        <div class="entry-head">
          <span class="entry-title">${ed.institution || ''}</span>
          <span class="entry-date">${ed.dateRange || ''}</span>
        </div>
        <div class="entry-sub">${ed.qualification || ''}${ed.scoreLabel ? ' — ' + ed.scoreLabel : ''}</div>
        ${bullets.length ? `<ul class="exp-bullets">${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>` : ''}
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="education">
    <h2>Education</h2>
    <p class="block-sub">Where I've studied.</p>
    ${rows}
  </section>`;
}

function renderSkills(items) {
  if (!items.length) {
    return `
    <section class="block" id="skills">
      <h2>Skills</h2>
      ${emptyState('Nothing here yet — add "Skill Category" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((s) => {
      const tags = (s.items || []).map((i) => `<span class="tag">${i}</span>`).join('');
      return `
      <div class="entry">
        <h3>${s.category || ''}</h3>
        ${tags ? `<div class="tags">${tags}</div>` : ''}
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="skills">
    <h2>Skills</h2>
    <p class="block-sub">Languages, frameworks, and tools.</p>
    ${rows}
  </section>`;
}

function renderProjects(items) {
  if (!items.length) {
    return `
    <section class="block" id="projects">
      <h2>Projects</h2>
      ${emptyState('Nothing here yet — add "Project" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((p) => {
      const tags = (p.tags || []).map((t) => `<span class="tag">${t}</span>`).join('');
      const links = [
        p.linkGithub ? `<a href="${p.linkGithub}" target="_blank" rel="noopener">GitHub</a>` : '',
        p.linkExtra ? `<a href="${p.linkExtra}" target="_blank" rel="noopener">${p.linkExtraLabel || 'Link'}</a>` : '',
      ]
        .filter(Boolean)
        .join('');
      const isVideo = (p.mediaMimeType || '').startsWith('video/');
      const media = p.mediaUrl
        ? isVideo
          ? `<video class="project-media" src="${p.mediaUrl}" controls playsinline></video>`
          : `<img class="project-media" src="${p.mediaUrl}" alt="${p.mediaAlt || p.title || ''}" />`
        : '';
      return `
      <div class="project">
        <h3>${p.title || ''}</h3>
        ${tags ? `<div class="tags">${tags}</div>` : ''}
        ${media}
        ${p.description ? `<p>${p.description}</p>` : ''}
        ${links ? `<div class="project-links">${links}</div>` : ''}
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="projects">
    <h2>Projects</h2>
    <p class="block-sub">Things I've built.</p>
    ${rows}
  </section>`;
}

function renderOpenSource(items) {
  if (!items.length) {
    return `
    <section class="block" id="opensource">
      <h2>Open Source</h2>
      ${emptyState('Nothing here yet — add "Open Source Contribution" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (o) =>
        `<li><a href="${o.url}" target="_blank" rel="noopener">${o.repo} — ${o.prLabel}</a>${o.organization ? `<span class="oss-org">${o.organization}</span>` : ''}</li>`
    )
    .join('');
  return `
  <section class="block" id="opensource">
    <h2>Open Source</h2>
    <p class="block-sub">Contributions I've made to open source projects.</p>
    <ul class="oss-list">${rows}</ul>
  </section>`;
}

function renderGithub(handle) {
  if (!handle) {
    return `
    <section class="block" id="github">
      <h2>GitHub</h2>
      ${emptyState('Add a GitHub username in Site Settings to show your contribution graph here.')}
    </section>`;
  }
  return `
  <section class="block" id="github">
    <h2>GitHub</h2>
    <p class="block-sub">A year of commits.</p>
    <a href="https://github.com/${handle}" target="_blank" rel="noopener">
      <img class="gh-chart" src="https://ghchart.rshah.org/${handle}" alt="${handle}'s GitHub contribution graph" />
    </a>
  </section>`;
}

function renderBlogs(items) {
  if (!items.length) {
    return `
    <section class="block" id="blogs">
      <h2>Blogs</h2>
      ${emptyState('Nothing here yet — add "Blog Post" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (b) => `
      <div class="entry">
        <h3><a href="${b.url}" target="_blank" rel="noopener">${b.title}</a></h3>
        <div class="meta">${b.dateLabel || ''}</div>
        <p>${b.summary || ''}</p>
      </div>`
    )
    .join('');
  return `
  <section class="block" id="blogs">
    <h2>Blogs</h2>
    <p class="block-sub">Things I've written.</p>
    ${rows}
  </section>`;
}

function authorsLine(authors) {
  return (authors || [])
    .map((a) => (a.isSelf ? `<b>${a.name}</b>` : a.name))
    .join(', ');
}

function renderPublications(items) {
  if (!items.length) {
    return `
    <section class="block" id="publications">
      <h2>Publications</h2>
      ${emptyState('Nothing here yet — add "Publication" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (p) => `
      <div class="entry">
        <h3>${p.title || ''}${p.presentationType ? ' <span class="meta" style="display:inline">(' + p.presentationType + ')</span>' : ''}</h3>
        ${authorsLine(p.authors) ? `<div class="authors">${authorsLine(p.authors)}</div>` : ''}
        <div class="meta">${p.venue || ''}${p.dateLabel ? ', ' + p.dateLabel : ''}${p.paperUrl ? ' · <a href="' + p.paperUrl + '" target="_blank" rel="noopener">link</a>' : ''}</div>
      </div>`
    )
    .join('');
  return `
  <section class="block" id="publications">
    <h2>Publications</h2>
    <p class="block-sub">Peer reviewed.</p>
    ${rows}
  </section>`;
}

function renderPreprints(items) {
  if (!items.length) {
    return `
    <section class="block" id="preprints">
      <h2>Preprints</h2>
      ${emptyState('Nothing here yet — add "Preprint" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (p) => `
      <div class="entry">
        <h3>${p.title || ''}${p.status ? ' <span class="meta" style="display:inline">(' + p.status + ')</span>' : ''}</h3>
        ${authorsLine(p.authors) ? `<div class="authors">${authorsLine(p.authors)}</div>` : ''}
        ${p.arxivId ? `<div class="meta">arXiv:<a href="https://arxiv.org/abs/${p.arxivId}" target="_blank" rel="noopener">${p.arxivId}</a></div>` : ''}
      </div>`
    )
    .join('');
  return `
  <section class="block" id="preprints">
    <h2>Preprints</h2>
    <p class="block-sub">Not yet peer reviewed.</p>
    ${rows}
  </section>`;
}

function renderTalks(items) {
  if (!items.length) {
    return `
    <section class="block" id="talks">
      <h2>Talks</h2>
      ${emptyState('Nothing here yet — add "Talk / Presentation" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (t) => `
      <div class="entry">
        <h3>${t.title || ''}${t.talkType ? ' <span class="meta" style="display:inline">(' + t.talkType + ')</span>' : ''}</h3>
        <div class="meta">${t.venue || ''}${t.dateLabel ? ', ' + t.dateLabel : ''}${t.link ? ' · <a href="' + t.link + '" target="_blank" rel="noopener">slides / recording</a>' : ''}</div>
        ${t.descriptionText ? `<p>${t.descriptionText}</p>` : ''}
      </div>`
    )
    .join('');
  return `
  <section class="block" id="talks">
    <h2>Talks</h2>
    <p class="block-sub">Invited talks, workshops, and panels.</p>
    ${rows}
  </section>`;
}

function renderPatents(items) {
  if (!items.length) {
    return `
    <section class="block" id="patents">
      <h2>Patents</h2>
      ${emptyState('Nothing here yet — add "Patent" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map(
      (p) => `
      <div class="entry">
        <h3>${p.title || ''}${p.status ? ' <span class="meta" style="display:inline">(' + p.status + ')</span>' : ''}</h3>
        ${authorsLine(p.inventors) ? `<div class="authors">${authorsLine(p.inventors)}</div>` : ''}
        <div class="meta">${p.patentNumber || ''}${p.dateLabel ? ', ' + p.dateLabel : ''}${p.link ? ' · <a href="' + p.link + '" target="_blank" rel="noopener">link</a>' : ''}</div>
      </div>`
    )
    .join('');
  return `
  <section class="block" id="patents">
    <h2>Patents</h2>
    <p class="block-sub">Filed and granted patents.</p>
    ${rows}
  </section>`;
}

function renderCertifications(items) {
  if (!items.length) {
    return `
    <section class="block" id="certifications">
      <h2>Certifications</h2>
      ${emptyState('Nothing here yet — add "Certification" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((c) => {
      const links = [
        c.credentialUrl ? `<a href="${c.credentialUrl}" target="_blank" rel="noopener">credential</a>` : '',
        c.fileUrl ? `<a href="${c.fileUrl}" target="_blank" rel="noopener">certificate</a>` : '',
      ]
        .filter(Boolean)
        .join(' · ');
      return `
      <div class="entry">
        <h3>${c.title || ''}</h3>
        <div class="meta">${c.issuer || ''}${c.dateLabel ? ', ' + c.dateLabel : ''}${links ? ' · ' + links : ''}</div>
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="certifications">
    <h2>Certifications</h2>
    <p class="block-sub">Courses and credentials.</p>
    ${rows}
  </section>`;
}

function renderAchievements(items) {
  if (!items.length) {
    return `
    <section class="block" id="achievements">
      <h2>Achievements</h2>
      ${emptyState('Nothing here yet — add "Achievement / Award" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((a) => {
      const docs = (a.documents || [])
        .filter((d) => d.url)
        .map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${d.label || 'document'}</a>`)
        .join(', ');
      return `
      <div class="entry">
        <h3>${a.title || ''}${a.tier ? ' <span class="meta" style="display:inline">(' + a.tier + ')</span>' : ''}</h3>
        <div class="meta">${a.issuer || ''}${a.dateLabel ? ', ' + a.dateLabel : ''}${docs ? ' · ' + docs : ''}</div>
        ${a.descriptionText ? `<p>${a.descriptionText}</p>` : ''}
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="achievements">
    <h2>Achievements</h2>
    <p class="block-sub">Awards and honors.</p>
    ${rows}
  </section>`;
}

function renderGuestbook() {
  return `
  <section class="block" id="guestbook">
    <h2>Guestbook</h2>
    <p class="block-sub">Say hi.</p>
    <div class="guestbook-box">Sign in to leave a note. (Wire this up to your own auth + a Sanity "guestbookEntry" document type to make it live.)</div>
  </section>`;
}

function renderFooter() {
  const year = new Date().getFullYear();
  return `
  <footer>
    <span>Last updated ${year}</span>
  </footer>`;
}

function renderError(message) {
  return `
  <div class="loading-note" style="color:#a33;">
    Couldn't load your content: ${message}.
    <br/>Check that your Sanity dataset is public, the CORS origin for this page is whitelisted, and config.js has the right projectId/dataset.
  </div>`;
}

// ---- Meta (title / description) -----------------------------------------
//
// index.html ships a generic placeholder title/description as a pre-JS
// fallback. Once Site Settings loads, this overwrites both from real
// data — no more hardcoded name baked into the HTML.

function setSiteMeta(s) {
  if (!s) return;
  document.title = s.name ? `${s.name}${s.eyebrow ? ' — ' + s.eyebrow : ''}` : document.title;
  const descText = s.bioText || s.status || '';
  if (descText) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descText);
  }
}

// ---- Boot -----------------------------------------------------------------

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// Maps each SECTIONS key to the render call that produces its markup.
// Kept separate from SECTIONS itself so the nav-link order and the
// render functions can't drift apart.
function renderersFor(data) {
  return {
    about: () => renderHero(data.settings),
    experience: () => renderExperience(data.experience),
    education: () => renderEducation(data.education),
    skills: () => renderSkills(data.skills),
    projects: () => renderProjects(data.projects),
    openSource: () => renderOpenSource(data.openSource),
    github: () => renderGithub(data.githubHandle),
    blogs: () => renderBlogs(data.blogs),
    publications: () => renderPublications(data.publications),
    preprints: () => renderPreprints(data.preprints),
    talks: () => renderTalks(data.talks),
    patents: () => renderPatents(data.patents),
    certifications: () => renderCertifications(data.certifications),
    achievements: () => renderAchievements(data.achievements),
    guestbook: () => renderGuestbook(),
  };
}

async function main() {
    const app = document.getElementById('app');
    try {
        const data = await loadData();
        setSiteMeta(data.settings);
        const visibility = (data.settings && data.settings.sectionVisibility) || {};
        const renderers = renderersFor(data);
        const body = SECTIONS.filter((sec) => isSectionVisible(visibility, sec.key))
            .map((sec) => renderers[sec.key]())
            .join('\n');
        app.innerHTML = [
            renderNav(visibility),
            '<main>',
            body,
            renderFooter(),
            '</main>',
        ].join('\n');
        initThemeToggle();
    } catch (e) {
        app.innerHTML = renderError(e.message);
    }
}

main();
