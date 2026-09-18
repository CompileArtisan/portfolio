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
    projects,
    openSource,
    blogs,
    publications,
    preprints,
    certifications,
    achievements,
  ] = await Promise.all([
    sanityFetch('*[_type == "siteSettings"][0]').catch(() => null),
    sanityFetch('*[_type == "experience"] | order(order asc)').catch(() => []),
    sanityFetch('*[_type == "project"] | order(order asc)').catch(() => []),
    sanityFetch('*[_type == "openSourceContribution"] | order(mergedAt desc)').catch(() => []),
    sanityFetch('*[_type == "blogPost"] | order(_createdAt desc)').catch(() => []),
    sanityFetch('*[_type == "publication"] | order(_createdAt desc)').catch(() => []),
    sanityFetch('*[_type == "preprint"] | order(_createdAt desc)').catch(() => []),
    sanityFetch('*[_type == "certification"] | order(order asc)').catch(() => []),
    sanityFetch('*[_type == "achievement"] | order(order asc)').catch(() => []),
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
        }
      : null,
    experience: (experience || []).map(normalizeExperience),
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

function renderNav() {
  return `
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-links">
        <a href="#about">About</a>
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#opensource">Open Source</a>
        <a href="#github">GitHub</a>
        <a href="#blogs">Blogs</a>
        <a href="#publications">Publications</a>
        <a href="#preprints">Preprints</a>
        <a href="#certifications">Certifications</a>
        <a href="#achievements">Achievements</a>
        <a href="#guestbook">Guestbook</a>
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
        .map((d) => `<a href="${d.url || d.file || '#'}" target="_blank" rel="noopener">${d.label}</a>`)
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
      return `
      <div class="project">
        <h3>${p.title || ''}</h3>
        ${tags ? `<div class="tags">${tags}</div>` : ''}
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
        `<li><a href="${o.url}" target="_blank" rel="noopener">${o.repo} — ${o.prLabel}</a></li>`
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
      ${emptyState('Add a "githubHandle" field to Site Settings to show your contribution graph here.')}
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
    .map(
      (c) => `
      <div class="entry">
        <h3>${c.title || ''}</h3>
        <div class="meta">${c.issuer || ''}${c.dateLabel ? ', ' + c.dateLabel : ''}${c.credentialUrl ? ' · <a href="' + c.credentialUrl + '" target="_blank" rel="noopener">credential</a>' : ''}</div>
      </div>`
    )
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
    .map(
      (a) => `
      <div class="entry">
        <h3>${a.title || ''}${a.tier ? ' <span class="meta" style="display:inline">(' + a.tier + ')</span>' : ''}</h3>
        <div class="meta">${a.issuer || ''}${a.dateLabel ? ', ' + a.dateLabel : ''}</div>
        ${a.descriptionText ? `<p>${a.descriptionText}</p>` : ''}
      </div>`
    )
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

async function main() {
    const app = document.getElementById('app');
    try {
        const data = await loadData();
        app.innerHTML = [
            renderNav(),
            '<main>',
            renderHero(data.settings),
            renderExperience(data.experience),
            renderProjects(data.projects),
            renderOpenSource(data.openSource),
            renderGithub(data.githubHandle),
            renderBlogs(data.blogs),
            renderPublications(data.publications),
            renderPreprints(data.preprints),
            renderCertifications(data.certifications),
            renderAchievements(data.achievements),
            renderGuestbook(),
            renderFooter(),
            '</main>',
        ].join('\n');
        initThemeToggle();
    } catch (e) {
        app.innerHTML = renderError(e.message);
    }
}

main();
