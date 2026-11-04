/* ===========================================================
   RENDER
   =========================================================== */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const pad2 = n => String(n).padStart(2,'0');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Which page this is comes off the body, so the markup is the single source
   of truth and nothing has to read the URL. */
const page = document.body.dataset.page || 'home';

tbYear.textContent = new Date().getFullYear();
tbSheet.textContent = pad2(TABS.findIndex(t => t.id === page) + 1);

tabs.innerHTML = TABS.map(t => `<a class="tab" href="${t.file}"${
  t.id === page ? ' aria-current="page"' : ''}>${t.label}</a>`).join('');

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* A plate holds a still or a clip, and works out which from the filename. An
   animated GIF is a still as far as the browser is concerned and needs nothing
   special. A video file becomes a <video> that runs silently, loops, carries
   no controls and plays only while it is actually on screen, so nothing runs
   behind a closed detail sheet or on a view you have scrolled past. Someone
   who has asked their system for less motion gets controls and no autoplay. */
const CLIP = /\.(mp4|webm|m4v|ogv)(\?.*)?$/i;

const clips = ('IntersectionObserver' in window)
  ? new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if(e.isIntersecting && !reduced) v.play().catch(() => {});
      else if(!v.paused) v.pause();
    }), { threshold: .4 })
  : { observe(){}, unobserve(){} };

const media = (src, alt, poster) => CLIP.test(src)
  ? `<video src="${src}" aria-label="${esc(alt)}"${poster ? ` poster="${poster}"` : ''
      } muted loop playsinline preload="metadata"${reduced ? ' controls' : ''}></video>`
  : `<img src="${src}" alt="${esc(alt)}" loading="lazy">`;

const plate = (src, cap, fig) => `
  <figure class="fig">
    <div class="plate">
      ${media(src, cap)}
      <span class="fn">${src}</span>
    </div>
    <figcaption class="cap"><b>Fig ${fig}</b>${esc(cap)}</figcaption>
  </figure>`;

/* The photographs of one project: the thumbnail off the tile first, then
   whatever else that entry lists. They run as a strip the reader pushes
   sideways, one view at a time, so a project can show more than the single
   picture a tile has room for. A list of one is simply that picture. */
const views = p => [p.img, ...(p.more || [])]
  .filter(Boolean)
  .map(v => typeof v === 'string' ? { src: v } : v);

function gallery(p, no){
  const v = views(p);
  if(!v.length) return '';
  const strip = v.map((s, k) => `
      <figure class="fig">
        <div class="plate">
          ${media(s.src, s.cap || p.title, s.poster)}
          <span class="fn">${s.src}</span>
        </div>
        <figcaption class="cap"><b>Fig ${no}.${k + 1}</b>${
          esc(s.cap || p.title)}</figcaption>
      </figure>`).join('');
  if(v.length < 2) return `<div class="shots lone">${strip}</div>`;
  return `
    <div class="shots" id="dlgShots" tabindex="0" role="group"
         aria-label="Photographs of ${esc(p.title)}">${strip}</div>
    <div class="shots-nav">
      <span class="shots-no"><i id="dlgShotN">01</i> / ${pad2(v.length)}</span>
      <div class="shots-dots">${v.map((_, k) =>
        `<button type="button" aria-label="View ${k + 1} of ${v.length}"></button>`
      ).join('')}</div>
    </div>`;
}

/* The count and the marks under the strip follow it, and the marks drive it.
   Left alone, the strip also walks itself forward, so the rest of a project is
   seen without being asked for and each view brings its own caption past with
   it. It gives way the moment the reader takes hold: it waits while the
   pointer is over it, and stops for good at the first wheel, touch, key or
   mark, because a strip that keeps moving under someone who is driving it is
   worse than one that never moved at all. A view holding a clip is held until
   the clip has run once rather than cut off part way. */
let shotTimer = null;

function wireShots(){
  clearTimeout(shotTimer);
  const sc = $('#dlgShots');
  if(!sc) return;
  const slides = [...sc.children];
  const dots = $$('.shots-dots button', dlgFig.parentNode);
  const no = $('#dlgShotN');
  let auto = !reduced, over = 0;

  const nearest = () => {
    let best = 0, gap = Infinity;
    slides.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft - slides[0].offsetLeft - sc.scrollLeft);
      if(d < gap){ gap = d; best = i; }
    });
    return best;
  };
  const mark = () => {
    const k = nearest();
    dots.forEach((d, i) => d.setAttribute('aria-current', i === k ? 'true' : 'false'));
    if(no) no.textContent = pad2(k + 1);
  };
  const go = k => sc.scrollTo({ left: slides[k].offsetLeft - slides[0].offsetLeft,
                                behavior: reduced ? 'auto' : 'smooth' });

  function dwell(k){
    const v = slides[k].querySelector('video');
    return v && isFinite(v.duration)
      ? Math.min(20000, Math.max(4600, v.duration * 1000 + 900))
      : 4600;
  }
  function plan(k){
    clearTimeout(shotTimer);
    if(auto && !over) shotTimer = setTimeout(step, dwell(k));
  }
  function step(){
    const k = (nearest() + 1) % slides.length;
    go(k);
    plan(k);
  }
  const stop = () => { auto = 0; clearTimeout(shotTimer); };

  sc.addEventListener('scroll', mark, { passive: true });
  ['wheel', 'touchstart', 'pointerdown', 'keydown', 'focusin'].forEach(t =>
    sc.addEventListener(t, stop, { passive: true }));
  sc.addEventListener('pointerenter', () => { over = 1; clearTimeout(shotTimer); });
  sc.addEventListener('pointerleave', () => { over = 0; plan(nearest()); });
  dots.forEach((d, i) => d.addEventListener('click', () => { stop(); go(i); }));

  sc.scrollLeft = 0;
  mark();
  plan(0);
}

if(window.aboutFigs) aboutFigs.innerHTML = ABOUT_FIGS.map((f,i) => plate(f.src, f.cap, pad2(i+1))).join('');

if(window.capability) capability.innerHTML = CAPABILITY.map((c,i) => `
  <div class="skill" data-target>
    <h4><i>${pad2(i+1)}</i>${c.k}</h4>
    <ul>${c.v.map(x => `<li>${x}</li>`).join('')}</ul>
  </div>`).join('');

if(window.interests) interests.innerHTML = INTERESTS.map((t,i) => `
  <figure class="tile ${t.shape || SHAPES[i % SHAPES.length]}" data-target>
    <div class="figwrap">
      <div class="plate">
        ${media(t.img, t.k)}
        <span class="fn">${t.img}</span>
      </div>
      <figcaption class="cap"><b>${pad2(i+1)}</b>${t.k}</figcaption>
    </div>
    <figcaption class="tnote">${t.v}</figcaption>
  </figure>`).join('');
if(window.interests && !INTERESTS.length)
  interests.previousElementSibling.hidden = interests.hidden = true;

// Layout cycles in threes: one full-width feature, then two halves side by side.
// Features alternate which side their plate sits on.
if(window.plan) plan.innerHTML = PROJECTS.map((p,i) => {
  const slot = i % 3;
  const cls = slot === 0
    ? 'job feat' + (Math.floor(i / 3) % 2 ? ' flip' : '')
    : 'job half' + (slot === 2 ? ' r' : '');
  return `
  <article class="${cls}" data-target data-job="${i}" role="button" tabindex="0"
           aria-label="Open the detail for ${p.title}">
    <div class="jn">${pad2(i+1)}</div>
    ${p.img ? plate(p.img, p.title, pad2(i+1)) : ''}
    <div class="jtx">
      <h3>${p.title}</h3>
      <div class="when">${p.when}</div>
      <p>${p.blurb || p.body}</p>
      <div class="spec">${p.spec.map(x=>`<span>${x}</span>`).join('')}</div>
      <div class="more">Read the detail <span aria-hidden="true">&rarr;</span></div>
    </div>
  </article>`;
}).join('');
if(window.pn) pn.textContent = PROJECTS.length + ' items';

const sheetTop = () => {
  projDlg.scrollTop = 0;
  const bd = $('.sheet-body');
  if(bd) bd.scrollTop = 0;
};

/* ---- the detail sheet. A tile carries a line; everything else is in here.
   Filling it is kept apart from opening it, so the step either side of the
   item number can swap one project for the next without the sheet itself
   going anywhere. It runs round the ends rather than stopping at them. ---- */
let lastOpener = null, openAt = 0;

function stepJob(d){
  const n = PROJECTS.length;
  fillJob((openAt + d + n) % n);
}

function fillJob(i){
  const p = PROJECTS[i];
  if(!p) return;
  openAt = i;
  // let go of the clips on the way out, so nothing plays on in the background
  $$('video', dlgFig).forEach(v => { v.pause(); clips.unobserve(v); });
  dlgNo.textContent   = 'Item ' + pad2(i+1) + ' of ' + pad2(PROJECTS.length);
  dlgTitle.textContent = p.title;
  dlgWho.textContent  = p.who;
  dlgWhen.textContent = p.when;
  dlgBody.textContent = p.body;
  dlgFig.innerHTML    = gallery(p, pad2(i+1));
  wirePlates(dlgFig);
  wireShots();
  dlgSpec.innerHTML   = p.spec.map(x => `<span>${x}</span>`).join('');
  dlgOut.innerHTML    = p.repo
    ? `<a href="https://github.com/pmngvyen/${p.repo}" target="_blank" rel="noopener">Source</a>`
    : '';
  sheetTop();
}

function openJob(i){
  if(!PROJECTS[i]) return;
  lastOpener = document.activeElement;
  fillJob(i);
  projDlg.showModal();
  sheetTop();
}

if(window.plan) plan.addEventListener('click', e => {
  const a = e.target.closest('[data-job]');
  if(a) openJob(+a.dataset.job);
});
if(window.plan) plan.addEventListener('keydown', e => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const a = e.target.closest('[data-job]');
  if(!a) return;
  e.preventDefault();
  openJob(+a.dataset.job);
});
if(window.dlgPrev) dlgPrev.addEventListener('click', () => stepJob(-1));
if(window.dlgNext) dlgNext.addEventListener('click', () => stepJob(1));

// left and right walk the projects, except inside the strip, which takes its
// own arrows to move between the views of the project already open
if(window.projDlg) projDlg.addEventListener('keydown', e => {
  if(e.target.closest && e.target.closest('#dlgShots')) return;
  if(e.key === 'ArrowLeft'){ e.preventDefault(); stepJob(-1); }
  if(e.key === 'ArrowRight'){ e.preventDefault(); stepJob(1); }
});

// clicking the paper around the sheet closes it, the same as Escape
if(window.projDlg) projDlg.addEventListener('click', e => { if(e.target === projDlg) projDlg.close(); });
if(window.dlgX) dlgX.addEventListener('click', () => projDlg.close());
if(window.projDlg) projDlg.addEventListener('close', () => {
  clearTimeout(shotTimer);
  if(lastOpener) lastOpener.focus();
});

if(window.cat) cat.innerHTML = GROUPS.map(g => {
  const l = APPS.filter(a => a.kind === g);
  if(!l.length) return '';
  return `<section class="group">
    <div class="gname">${g}<s>${l.length}</s></div>
    <div class="cat">${l.map(a => `
      <article class="item" data-target>
        ${a.shot ? plate(a.shot, a.name, a.name) : ''}
        <div class="head">
          <span class="ic">${ICONS[a.icon] || ''}</span>
          <h3><a href="${a.url}" target="_blank" rel="noopener">${a.name}</a></h3>
        </div>
        <p>${a.body}</p>
        <div class="out">
          <a href="${a.url}" target="_blank" rel="noopener">Open site</a>
          <a href="https://github.com/pmngvyen/${a.repo}" target="_blank" rel="noopener">Source</a>
        </div>
      </article>`).join('')}</div>
  </section>`;
}).join('');
if(window.an) an.textContent = APPS.length + ' live';

// A plate keeps its placeholder until its image actually loads. Called again
// for the detail sheet, whose plates are built when it opens rather than here.
function wirePlates(root){
  $$('.plate img, .plate video', root || document).forEach(m => {
    if(m.dataset.wired) return;
    m.dataset.wired = '1';
    const box = m.closest('.plate');
    const show = () => box.classList.add('has');
    const gone = () => m.remove();
    if(m.tagName === 'VIDEO'){
      if(m.readyState >= 1) show(); else m.addEventListener('loadedmetadata', show, { once:true });
      m.addEventListener('error', gone, { once:true });
      clips.observe(m);
      return;
    }
    if(m.complete && m.naturalWidth) { show(); return; }
    m.addEventListener('load',  show, { once:true });
    m.addEventListener('error', gone, { once:true });
  });
}
wirePlates();

if(window.plain) plain.innerHTML = REPOS.map(r => `
  <a href="https://github.com/pmngvyen/${r.name}" target="_blank" rel="noopener">
    <b>${r.name}</b><s>${r.desc}</s>
  </a>`).join('');

// Résumé is embedded so the links work anywhere. To serve it as a file instead,
// put the PDF at assets/resume.pdf and set href="assets/resume.pdf" below.
(function(){
  const raw = ($('#resumePdf')?.textContent || '').replace(/\s+/g,'');
  const ok  = raw.length > 200 && !raw.startsWith('__');
  if(!ok){ $$('[data-resume]').forEach(a => a.href = 'assets/resume.pdf'); return; }

  const bin = atob(raw), u8 = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const blob = new Blob([u8], { type:'application/pdf' });

  // A blob URL opens in a new tab and saves under the download attribute,
  // which a data: URL no longer does in Chrome. Works on any static host.
  const href = URL.createObjectURL(blob);
  $$('[data-resume]').forEach(a => a.href = href);

  // Inside the claude.ai artifact viewer a page cannot hand over a file on its
  // own, so route Download through the host when the capability is granted.
  if(!window.claude || typeof claude.use !== 'function') return;
  claude.use('downloads').then(dl => {
    const link = $('[data-resume="dl"]');
    if(!dl || !link) return;
    link.addEventListener('click', ev => {
      ev.preventDefault();
      dl.save({ filename:'Paul-Nguyen-Resume.pdf', data:blob }).catch(() => {});
    });
  }).catch(() => {});
})();

/* ===========================================================
   SHEET FRAME ZONE MARKS
   =========================================================== */
function drawFrame(){
  const f = $('#frame');
  f.innerHTML = '';
  if(innerWidth < 920) return;
  const w = f.clientWidth, h = f.clientHeight;
  const cols = Math.max(4, Math.round(w / 240)), rows = Math.max(3, Math.round(h / 240));
  const mk = st => { const d = document.createElement('span'); Object.assign(d.style, st); return d; };
  for(let i = 1; i < cols; i++){
    const x = w * i / cols;
    f.appendChild(mk({ position:'absolute', left:x+'px', top:'0', width:'1px', height:'7px', background:'var(--rule-2)' }));
    f.appendChild(mk({ position:'absolute', left:x+'px', bottom:'0', width:'1px', height:'7px', background:'var(--rule-2)' }));
  }
  for(let i = 1; i < rows; i++){
    const y = h * i / rows;
    f.appendChild(mk({ position:'absolute', top:y+'px', left:'0', height:'1px', width:'7px', background:'var(--rule-2)' }));
    f.appendChild(mk({ position:'absolute', top:y+'px', right:'0', height:'1px', width:'7px', background:'var(--rule-2)' }));
  }
  for(let i = 0; i < cols; i++){
    const el = document.createElement('i');
    el.textContent = i + 1;
    Object.assign(el.style, { left:(w*(i+.5)/cols - 3)+'px', bottom:'3px' });
    f.appendChild(el);
  }
  for(let i = 0; i < rows; i++){
    const el = document.createElement('i');
    el.textContent = String.fromCharCode(65 + i);
    Object.assign(el.style, { top:(h*(i+.5)/rows - 5)+'px', left:'4px' });
    f.appendChild(el);
  }

  /* A scale down the right edge, graduated in real millimetres. One CSS
     millimetre is a fixed 96dpi inch over 25.4, so the browser does the
     conversion and the rule measures true on a display that reports its
     size honestly. Ticks run inward from the frame line: every millimetre
     faint, every fifth a little longer, every centimetre longer again and
     numbered every five. */
  const MM = 96 / 25.4;
  for(let mm = 0; mm * MM <= h; mm++){
    const cm = mm % 10 === 0, half = mm % 5 === 0;
    const t = document.createElement('u');
    t.className = cm ? 'c' : half ? 'f' : 't';
    Object.assign(t.style, { top: Math.round(mm * MM) + 'px',
                             width: (cm ? 9 : half ? 6 : 3.5) + 'px' });
    f.appendChild(t);
    if(mm % 50 === 0 && mm > 0 && mm * MM < h - 14){
      const n = document.createElement('b');
      n.textContent = mm;
      n.style.top = (Math.round(mm * MM) - 4) + 'px';
      f.appendChild(n);
    }
  }
}

/* ===========================================================
   ROUTER
   =========================================================== */
// ang: degrees from straight up. ext: fraction of the working envelope.
const REST = {
  home:     { ang: 38, ext:.54, pen:-42 },
  about:    { ang: 47, ext:.47, pen: 10 },
  projects: { ang: 33, ext:.58, pen:  0 },
  docs:     { ang: 43, ext:.50, pen:-28 },
  apps:     { ang: 52, ext:.44, pen:-18 }
};
const REST_M = { ang: 52, ext:.82, pen:-10 };

/* Navigation is ordinary links between pages now, so there is no router left
   to speak of. */
