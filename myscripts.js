/* myscripts.js — Bianca D'Alessandro Gallery */
/* Data is pre-embedded in exhibitions_data.js — no fetch/server required */
'use strict';

// ─────────────────────────────────────────────
// A. Data access
// ─────────────────────────────────────────────
// EXHIBITIONS_DATA is defined in exhibitions_data.js and loaded before this script.
// Shape: [{ num, artist, show, dates, year, images: [{url, caption}] }]

function getExhibitions() {
  if (typeof EXHIBITIONS_DATA === 'undefined') {
    throw new Error('EXHIBITIONS_DATA not found. Ensure exhibitions_data.js is loaded first.');
  }
  return EXHIBITIONS_DATA;
}

// ─────────────────────────────────────────────
// B. Build Sidebar Dynamically
// ─────────────────────────────────────────────
function buildSidebar(exhibitions) {
  const byYear = {};
  for (const ex of exhibitions) {
    const y = ex.year || 'Unknown';
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(ex);
  }
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = '';

  // Static links
  const staticSection = document.createElement('div');
  staticSection.className = 'mb-4';
  for (const lk of [{ label: 'Home', page: 'home' }, { label: 'Gallery', page: 'gallery' }]) {
    const btn = document.createElement('button');
    btn.className = 'nav-link-item';
    btn.textContent = lk.label;
    btn.dataset.page = lk.page;
    btn.addEventListener('click', () => navigate(lk.page));
    staticSection.appendChild(btn);
  }
  nav.appendChild(staticSection);

  // Year groups
  const yearSection = document.createElement('div');
  const label = document.createElement('span');
  label.className = 'nav-section-label';
  label.textContent = 'Exhibitions';
  yearSection.appendChild(label);

  for (const year of years) {
    const group = document.createElement('div');
    group.className = 'year-group';

    const toggle = document.createElement('button');
    toggle.className = 'year-toggle';
    toggle.textContent = year;

    const exList = document.createElement('div');
    exList.className = 'year-exhibitions';

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('collapsed');
      exList.style.display = toggle.classList.contains('collapsed') ? 'none' : 'block';
    });

    for (const ex of byYear[year]) {
      const btn = document.createElement('button');
      btn.className = 'ex-link';
      btn.textContent = ex.artist + (ex.show ? ` — ${ex.show}` : '');
      btn.dataset.exNum = ex.num;
      btn.addEventListener('click', () => navigate('exhibition', ex.num));
      exList.appendChild(btn);
    }

    group.appendChild(toggle);
    group.appendChild(exList);
    yearSection.appendChild(group);
  }

  nav.appendChild(yearSection);
}

// ─────────────────────────────────────────────
// C. Router / Navigation
// ─────────────────────────────────────────────
let _exhibitions = [];

function navigate(page, exNum) {
  document.querySelectorAll('.nav-link-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page && !exNum)
  );
  document.querySelectorAll('.ex-link').forEach(el =>
    el.classList.toggle('active', !!exNum && String(el.dataset.exNum) === String(exNum))
  );

  const main = document.getElementById('main');
  if (page === 'home') {
    main.innerHTML = renderHome();
    attachHomeEvents();
  } else if (page === 'gallery') {
    main.innerHTML = renderGalleryList(_exhibitions);
    attachGalleryEvents();
  } else if (page === 'exhibition' && exNum) {
    const ex = _exhibitions.find(e => e.num === Number(exNum));
    if (ex) { main.innerHTML = renderExhibition(ex); attachExhibitionEvents(); }
  }
  window.scrollTo(0, 0);
}

// ─────────────────────────────────────────────
// D. Render: Home
// ─────────────────────────────────────────────
function renderHome() {
  return `
  <div id="home-content">
    <div>
      <div class="home-logo-main">Bianca D'Alessandro</div>
      <div class="home-tagline">gallery — exhibitions</div>
      <div class="home-divider"></div>
      <button class="btn-gallery" data-action="go-gallery">View Gallery</button>
      <div class="home-info">
        Join our mailing list
        <a href="mailto:info@biancadalessandro.com">info@biancadalessandro.com</a><br>
        Frederiksholms Kanal 28A<br>
        1220 Copenhagen K<br>
        +45 22994301
      </div>
    </div>
  </div>`;
}

function attachHomeEvents() {
  document.querySelectorAll('[data-action="go-gallery"]').forEach(el =>
    el.addEventListener('click', () => navigate('gallery'))
  );
}

// ─────────────────────────────────────────────
// E. Render: Gallery List
// ─────────────────────────────────────────────
function renderGalleryList(exhibitions) {
  const sorted = [...exhibitions].sort((a, b) => {
    const yDiff = (b.year || 0) - (a.year || 0);
    return yDiff !== 0 ? yDiff : a.num - b.num;
  });

  const cards = sorted.map(ex => {
    const thumb = ex.images[0]?.url || '';
    const thumbHtml = thumb
      ? `<img src="${escHtml(thumb)}" alt="${escHtml(ex.artist)}" class="ex-card-thumb ms-4" onerror="this.style.display='none'">`
      : '';
    const showHtml = ex.show ? `<div class="ex-card-show">${escHtml(ex.show)}</div>` : '';
    const meta = [ex.year, ex.dates].filter(Boolean).join(' · ');
    return `
    <div class="exhibition-card d-flex align-items-start" data-ex-num="${ex.num}">
      <div class="flex-grow-1">
        <div class="ex-card-artist">${escHtml(ex.artist)}</div>
        ${showHtml}
        <div class="ex-card-meta">${escHtml(meta)} · ${ex.images.length} works</div>
      </div>
      ${thumbHtml}
    </div>`;
  }).join('');

  return `
  <div id="gallery-content">
    <div class="page-heading">All Exhibitions</div>
    ${cards}
  </div>`;
}

function attachGalleryEvents() {
  document.querySelectorAll('.exhibition-card').forEach(el =>
    el.addEventListener('click', () => navigate('exhibition', Number(el.dataset.exNum)))
  );
}

// ─────────────────────────────────────────────
// F. Render: Single Exhibition
// ─────────────────────────────────────────────
function renderExhibition(ex) {
  const showHtml = ex.show ? `<div class="ex-header-show">${escHtml(ex.show)}</div>` : '';
  const meta = [ex.year, ex.dates].filter(Boolean).join(' · ');

  const imagesHtml = ex.images.map(img => `
    <div class="image-frame">
      <img src="${escHtml(img.url)}" alt="${escHtml(img.caption)}" loading="lazy"
           onerror="this.closest('.image-frame').style.display='none'">
      ${img.caption ? `<p class="image-caption">${escHtml(img.caption)}</p>` : ''}
    </div>`).join('');

  return `
  <div id="exhibition-content">
    <button class="back-btn" data-action="back-gallery">← All exhibitions</button>
    <div class="ex-header">
      <div class="ex-header-artist">${escHtml(ex.artist)}</div>
      ${showHtml}
      <div class="ex-header-dates">${escHtml(meta)}</div>
    </div>
    <div class="image-grid">
      ${imagesHtml || '<p class="loading-msg">No images available.</p>'}
    </div>
  </div>`;
}

function attachExhibitionEvents() {
  document.querySelectorAll('[data-action="back-gallery"]').forEach(el =>
    el.addEventListener('click', () => navigate('gallery'))
  );
}

// ─────────────────────────────────────────────
// G. Utilities
// ─────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
// H. Init — synchronous, no fetch needed
// ─────────────────────────────────────────────
function init() {
  try {
    _exhibitions = getExhibitions();
    buildSidebar(_exhibitions);
    navigate('home');
  } catch (err) {
    console.error(err);
    document.getElementById('main').innerHTML =
      `<div class="loading-msg">Error loading data: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
