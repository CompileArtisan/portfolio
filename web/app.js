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

const EXPERIENCE_QUERY = `*[_type == "experience"] | order(order asc){
  organization,
  dateRange,
  lab,
  advisorName,
  advisorUrl,
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

const PROJECT_QUERY = `*[_type == "project"] | order(order asc){
  title,
  description,
  tags,
  linkGithub,
  linkExtra,
  linkExtraLabel,
  mediaAlt,
  order,
  "mediaUrl": media.asset->url,
  "mediaMimeType": media.asset->mimeType
}`;

const CERTIFICATION_QUERY = `*[_type == "certification"] | order(order asc){
  title,
  issuer,
  dateLabel,
  credentialUrl,
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
    projects,
    openSource,
    blogs,
    publications,
    preprints,
    certifications,
    achievements,
  ] = await Promise.all([
    sanityFetch('*[_type == "siteSettings"][0]').catch(() => null),
    sanityFetch(EXPERIENCE_QUERY).catch(() => []),
    sanityFetch(EDUCATION_QUERY).catch(() => []),
    sanityFetch(PROJECT_QUERY).catch(() => []),
    sanityFetch('*[_type == "openSourceContribution"] | order(mergedAt desc)').catch(() => []),
    sanityFetch('*[_type == "blogPost"] | order(_createdAt desc)').catch(() => []),
    sanityFetch('*[_type == "publication"] | order(_createdAt desc)').catch(() => []),
    sanityFetch('*[_type == "preprint"] | order(_createdAt desc)').catch(() => []),
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
    projects: (projects || []).map(normalizeProject),
    openSource: openSource || [],
    blogs: (blogs || []).map((b) => ({ ...b, url: b.slug ? `/blog/${b.slug.current}` : b.url || '#' })),
    publications: publications || [],
    preprints: preprints || [],
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
  { key: 'projects', anchor: 'projects', label: 'Projects' },
  { key: 'openSource', anchor: 'opensource', label: 'Open Source' },
  { key: 'github', anchor: 'github', label: 'GitHub' },
  { key: 'blogs', anchor: 'blogs', label: 'Blogs' },
  { key: 'publications', anchor: 'publications', label: 'Publications' },
  { key: 'preprints', anchor: 'preprints', label: 'Preprints' },
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
    ${s.email ? `<p class="email-line">Reach me at ${s.email.replace('@', ' [at] ').replace('.', ' [dot] ')}</p>` : ''}
  </section>`;
}

function renderExperience(items) {
  if (!items.length) {
    return `
    <section class="block" id="experience">
      <h2>Experience</h2>
      ${emptyState('Nothing here yet — add "Experience" documents in the Studio.')}
    </section>`;
  }
  const rows = items
    .map((e) => {
      const docs = (e.documents || [])
        .filter((d) => d.url)
        .map((d) => `<a href="${d.url}" target="_blank" rel="noopener">${d.label || 'document'}</a>`)
        .join(', ');
      const bullets = (e.bullets || []).map((b) => `<li>${b}</li>`).join('');
      return `
      <div class="exp-item">
        <div class="exp-logo">${e.logo ? `<img src="${e.logo}" alt="${e.organization} logo" />` : (e.organization || '').slice(0, 2).toUpperCase()}</div>
        <div>
          <div class="exp-head"><span class="exp-org">${e.organization || ''}</span></div>
          <div class="exp-meta">${e.dateRange || ''}${docs ? ' · [' + docs + ']' : ''}</div>
          ${e.advisorName ? `<div class="exp-advisor">${e.lab ? e.lab + ' · ' : ''}Advisor: <a href="${e.advisorUrl || '#'}" target="_blank" rel="noopener">${e.advisorName}</a></div>` : ''}
          ${bullets ? `<ul class="exp-bullets">${bullets}</ul>` : ''}
        </div>
      </div>`;
    })
    .join('');
  return `
  <section class="block" id="experience">
    <h2>Experience</h2>
    <p class="block-sub">Where I've worked.</p>
    ${rows}
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
        <h3>${ed.institution || ''}</h3>
        <div class="meta">${ed.qualification || ''}${ed.dateRange ? ', ' + ed.dateRange : ''}${ed.scoreLabel ? ' · ' + ed.scoreLabel : ''}</div>
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
        <div class="meta">${p.venue || ''}${p.dateLabel ? ', ' + p.dateLabel : ''}${p.certificateUrl ? ' · <a href="' + p.certificateUrl + '" target="_blank" rel="noopener">certificate</a>' : ''}</div>
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
    <span><a href="#" >other stuff</a></span>
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
    projects: () => renderProjects(data.projects),
    openSource: () => renderOpenSource(data.openSource),
    github: () => renderGithub(data.githubHandle),
    blogs: () => renderBlogs(data.blogs),
    publications: () => renderPublications(data.publications),
    preprints: () => renderPreprints(data.preprints),
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



