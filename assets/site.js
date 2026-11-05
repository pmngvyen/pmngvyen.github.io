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
      // leaving the screen always stops it, which is what takes the sound away
      // when you scroll off a clip you started
      if(!e.isIntersecting){ if(!v.paused) v.pause(); return; }
      // and only the silent ones start themselves: one with sound has to be
      // asked for, both because it should be and because no browser will
      // autoplay audio that nobody clicked for
      if(!reduced && !v.hasAttribute('data-tap')) v.play().catch(() => {});
    }), { threshold: .4 })
  : { observe(){}, unobserve(){} };

/* Two kinds of clip. The ordinary one is wallpaper: silent, looping, running
   by itself while it is on screen. A tap clip is something to watch instead,
   so it keeps its sound, starts only when it is clicked and stops on the next
   click. Interests are tap clips; a project's are the silent sort. */
const media = (src, alt, poster, tap) => CLIP.test(src)
  ? `<video src="${src}" aria-label="${esc(alt)}"${poster ? ` poster="${poster}"` : ''}${
      tap ? ' data-tap controls playsinline preload="metadata"'
          : ` muted loop playsinline preload="metadata"${reduced ? ' controls' : ''}`
    }></video>`
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
  /* The steps live inside each plate rather than once beside the strip. A
     plate is the only box whose edges are the picture's edges, so putting
     them there needs no measuring and lands them right however the sheet is
     sized. They are kept out of the tab order: the marks underneath are the
     real buttons, and the arrow keys do the same job. */
  const step = v.length > 1 ? `
          <button class="shots-b prev" type="button" tabindex="-1" aria-hidden="true">&#8249;</button>
          <button class="shots-b next" type="button" tabindex="-1" aria-hidden="true">&#8250;</button>` : '';
  const strip = v.map((s, k) => `
      <figure class="fig">
        <div class="plate">
          ${media(s.src, s.cap || p.title, s.poster, p.tap)}
          <span class="fn">${s.src}</span>${step}
        </div>
        <figcaption class="cap"><b>Fig ${no}.${k + 1}</b>${
          esc(s.cap || p.title)}</figcaption>
      </figure>`).join('');
  if(v.length < 2) return `<div class="shots lone">${strip}</div>`;
  return `
    <div class="shots" tabindex="0" role="group"
         aria-label="Photographs of ${esc(p.title)}">${strip}</div>
    <div class="shots-nav">
      <span class="shots-no"><i>01</i> / ${pad2(v.length)}</span>
      <div class="shots-dots">${v.map((_, k) =>
        `<button type="button" aria-label="View ${k + 1} of ${v.length}"></button>`
      ).join('')}</div>
    </div>`;
}

/* Projects still being worked on carry a stamp, on the tile beside the item
   number and in the sheet beside the date. Set wip: true on the entry to
   raise it, or wip: 'Some other words' to say something else. */
const wip = p => p.wip
  ? `<span class="wip">${esc(p.wip === true ? 'In progress' : p.wip)}</span>`
  : '';   // no space before it: the gap is the stamp's own margin, so it does
          // not grow with the big item number on a full width tile

/* A project can carry a piece of documentation, which sits under its gallery.
   doc is either a path or a URL, or { href, label } to say what it is called.
   The tag on the right is the file's own type, or LINK when it points away. */
const docKind = h => /^https?:/i.test(h)
  ? 'Link'
  : (h.split('.').pop() || 'file').toUpperCase();

function docref(p){
  if(!p.doc) return '';
  const d = typeof p.doc === 'string' ? { href: p.doc } : p.doc;
  if(!d.href) return '';
  return `<a class="docref" href="${d.href}" target="_blank" rel="noopener">
      <span>${esc(d.label || 'Documentation')}</span><i>${esc(docKind(d.href))}</i>
    </a>`;
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

function wireShots(root){
  clearTimeout(shotTimer);
  const sc = $('.shots', root || document);
  if(!sc || sc.classList.contains('lone')) return;
  const slides = [...sc.children];
  const nav = sc.nextElementSibling;
  const dots = nav ? $$('button', nav) : [];
  const no = nav ? $('.shots-no i', nav) : null;
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

  // the steps drawn on the plates are built with the markup, long before this
  // runs, so the strip leaves them a handle rather than them reaching in
  sc._step = d => { stop(); go((nearest() + d + slides.length) % slides.length); };

  sc.scrollLeft = 0;
  mark();
  plan(0);
}

/* Taken on the way down, like the clips, so a step is never also read as a
   click on the picture it is drawn over. */
document.addEventListener('click', e => {
  const b = e.target.closest('.shots-b');
  if(!b) return;
  const sc = b.closest('.shots');
  if(!sc || !sc._step) return;          // the lens pair have their own wiring
  e.stopPropagation();
  e.preventDefault();
  sc._step(b.classList.contains('next') ? 1 : -1);
}, true);

/* Any view inside a sheet opens as large as the window will take it. Nothing
   is drawn on the plate to say so: the pointer turns to a magnifier over it,
   which is how a picture has said there is more of me for twenty years. A
   plate still showing its placeholder has nothing to enlarge, so it is left
   alone. */
/* Caught on the way down rather than on the way up, so a clip that is there
   to be watched is played by a click instead of being treated as a plate to
   enlarge or a tile to open. */
document.addEventListener('click', e => {
  const v = e.target.closest('video[data-tap]');
  if(!v) return;
  e.stopPropagation();
  e.preventDefault();
  if(v.paused) v.play().catch(() => {}); else v.pause();
}, true);

let lensAt = 0, lensOf = [], lensStrip = null;

// the caption's parts are laid out with a gap rather than separated by a
// space, so they are read off one at a time and joined back up here
const capText = fig => {
  const c = fig && fig.querySelector('.cap');
  return c ? [...c.childNodes].map(n => n.textContent.trim()).filter(Boolean).join('   ') : '';
};

function lensShow(k){
  const v = lensOf[k];
  if(!v) return;
  lensAt = k;
  lensBox.innerHTML = CLIP.test(v.src)
    ? (v.tap
        ? `<video src="${esc(v.src)}" data-tap controls playsinline></video>`
        : `<video src="${esc(v.src)}" muted loop autoplay playsinline controls></video>`)
    : `<img src="${esc(v.src)}" alt="${esc(v.cap)}">`;
  lensCap.textContent = v.cap;
  if(window.lensNo) lensNo.textContent = pad2(k + 1) + ' / ' + pad2(lensOf.length);
  if(window.lensPrev) lensPrev.hidden = lensNext.hidden = lensOf.length < 2;
  // the strip underneath follows along, so closing the picture leaves the
  // sheet on the view you were actually looking at
  if(lensStrip && lensStrip.children[0] && v.fig)
    lensStrip.scrollTo({ left: v.fig.offsetLeft - lensStrip.children[0].offsetLeft,
                         behavior: 'auto' });
}

function lensStep(d){
  const n = lensOf.length;
  if(n) lensShow((lensAt + d + n) % n);
}

document.addEventListener('click', e => {
  const box = e.target.closest('.shots .plate.has');
  if(!box || !window.lens) return;
  // every view of this project that has something to show, so the enlargement
  // can be walked without going back to the sheet
  lensStrip = box.closest('.shots');
  lensOf = [];
  let start = 0;
  $$('.fig', lensStrip).forEach(f => {
    const pl = f.querySelector('.plate.has');
    const m = pl && pl.querySelector('img, video');
    if(!m) return;
    if(pl === box) start = lensOf.length;
    lensOf.push({ src: m.getAttribute('src'), cap: capText(f), fig: f,
                  tap: m.hasAttribute('data-tap') });
  });
  if(!lensOf.length) return;
  lensShow(start);
  if(!lens.open) lens.showModal();
  // the sheet's own steps sit behind the backdrop in roughly the same place as
  // the lens's, and two sets of chevrons reading through each other is a mess
  document.body.classList.add('lensing');
});

if(window.lens){
  // the backdrop and the picture itself both close it; the video does not, or
  // its own controls would be shutting the thing every time they were used
  lens.addEventListener('click', e => {
    if(e.target === lens || e.target.tagName === 'IMG') lens.close();
  });
  lens.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){ e.preventDefault(); lensStep(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); lensStep(1); }
  });
  lens.addEventListener('close', () => {
    lensBox.innerHTML = ''; lensOf = []; lensStrip = null;
    document.body.classList.remove('lensing');
  });
  if(window.lensX) lensX.addEventListener('click', () => lens.close());
  if(window.lensPrev) lensPrev.addEventListener('click', () => lensStep(-1));
  if(window.lensNext) lensNext.addEventListener('click', () => lensStep(1));
}

/* An interest opens the same way a project does, minus the writing: the name
   and the pictures, and nothing else in the sheet. */
let intAt = 0, intOpener = null;

function fillInt(i){
  const t = INTERESTS[i];
  if(!t) return;
  intAt = i;
  $$('video', intFig).forEach(v => { v.pause(); clips.unobserve(v); });
  intNo.textContent    = 'Item ' + pad2(i+1) + ' of ' + pad2(INTERESTS.length);
  intTitle.textContent = t.k;
  intFig.innerHTML     = gallery({ title: t.k, img: t.img, more: t.more, tap: true },
                                 pad2(i+1));
  wirePlates(intFig);
  wireShots(intFig);
  sheetTop(intDlg);
}
function openInt(i){
  if(!INTERESTS[i]) return;
  intOpener = document.activeElement;
  fillInt(i);
  intDlg.showModal();
  sheetTop(intDlg);
}
function stepInt(d){
  const n = INTERESTS.length;
  fillInt((intAt + d + n) % n);
}

if(window.interests) interests.addEventListener('click', e => {
  const t = e.target.closest('[data-int]');
  if(t) openInt(+t.dataset.int);
});
if(window.interests) interests.addEventListener('keydown', e => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const t = e.target.closest('[data-int]');
  if(!t) return;
  e.preventDefault();
  openInt(+t.dataset.int);
});
if(window.intPrev) intPrev.addEventListener('click', () => stepInt(-1));
if(window.intNext) intNext.addEventListener('click', () => stepInt(1));
if(window.intX) intX.addEventListener('click', () => intDlg.close());
if(window.intDlg){
  intDlg.addEventListener('click', e => { if(e.target === intDlg) intDlg.close(); });
  intDlg.addEventListener('keydown', e => {
    if(e.target.closest && e.target.closest('.shots')) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); stepInt(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); stepInt(1); }
  });
  intDlg.addEventListener('close', () => {
    clearTimeout(shotTimer);
    if(intOpener) intOpener.focus();
  });
}

if(window.aboutFigs) aboutFigs.innerHTML = ABOUT_FIGS.map((f,i) => plate(f.src, f.cap, pad2(i+1))).join('');

if(window.capability) capability.innerHTML = CAPABILITY.map((c,i) => `
  <div class="skill" data-target>
    <h4><i>${pad2(i+1)}</i>${c.k}</h4>
    <ul>${c.v.map(x => `<li>${x}</li>`).join('')}</ul>
  </div>`).join('');

if(window.interests) interests.innerHTML = INTERESTS.map((t,i) => `
  <figure class="tile ${t.shape || SHAPES[i % SHAPES.length]}" data-target
          data-int="${i}" role="button" tabindex="0"
          aria-label="Open the pictures for ${esc(t.k)}">
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
    <div class="jn">${pad2(i+1)}${wip(p)}</div>
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

const sheetTop = d => {
  if(!d) return;
  d.scrollTop = 0;
  const bd = $('.sheet-body', d);
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
  // who is optional: left out of an entry, the line goes rather than printing
  // the word undefined where the organisation should be
  dlgWho.textContent  = p.who || '';
  dlgWho.hidden       = !p.who;
  dlgWhen.innerHTML   = esc(p.when) + wip(p);
  dlgBody.textContent = p.body;
  dlgFig.innerHTML    = gallery(p, pad2(i+1)) + docref(p);
  wirePlates(dlgFig);
  wireShots(dlgFig);
  dlgSpec.innerHTML   = p.spec.map(x => `<span>${x}</span>`).join('');
  dlgOut.innerHTML    = p.repo
    ? `<a href="https://github.com/pmngvyen/${p.repo}" target="_blank" rel="noopener">Source</a>`
    : '';
  sheetTop(projDlg);
}

function openJob(i){
  if(!PROJECTS[i]) return;
  lastOpener = document.activeElement;
  fillJob(i);
  projDlg.showModal();
  sheetTop(projDlg);
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
  if(e.target.closest && e.target.closest('.shots')) return;
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
