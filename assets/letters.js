/* ===========================================================
   EDIT MODE

   The letters of the name become loose stock the arm can move around. Put
   the jaws on a letter and click to take it, move, click again to set it
   down. The jaws stay shut the whole time it is carried, so nothing is
   dropped by moving too quickly.

   Above 920px the stage is pinned to the whole viewport, so the arm's
   coordinates and the page's are the same and the tip can be compared with
   a letter's box directly.
   =========================================================== */
(() => {
  const glyphs = [...document.querySelectorAll('.hero h1 i')];
  const on = document.getElementById('editOn');
  const reset = document.getElementById('editReset');
  if(!glyphs.length || !on || typeof A === 'undefined') return;

  // Home is where a glyph sits when nothing has moved it. Everything after is
  // a transform, which does not reflow, so lifting one letter out of a word
  // leaves the rest of it exactly where it was.
  const stock = glyphs.map(el => ({ el, dx:0, dy:0, rot:0, home:null }));
  const measure = () => stock.forEach(g => {
    const keep = g.el.style.transform;
    g.el.style.transform = 'none';
    const r = g.el.getBoundingClientRect();
    g.home = { x:r.left + r.width/2, y:r.top + r.height/2, w:r.width, h:r.height };
    g.el.style.transform = keep;
  });
  measure();
  addEventListener('resize', () => requestAnimationFrame(measure));

  const REACH = 10;
  let editing = false, held = null, grab = null;

  const at = g => ({ x: g.home.x + g.dx, y: g.home.y + g.dy });
  const draw = g => {
    g.el.style.transform = (g.dx || g.dy || g.rot)
      ? `translate(${g.dx.toFixed(1)}px, ${g.dy.toFixed(1)}px) rotate(${g.rot.toFixed(2)}deg)`
      : '';
  };
  const over = (g, x, y) => Math.abs(x - at(g).x) < g.home.w/2 + REACH
                         && Math.abs(y - at(g).y) < g.home.h/2 + REACH;

  function release(){
    if(!held) return;
    held.el.classList.remove('held');
    held = grab = null;
    A.carry = false;
  }

  function take(){
    for(const g of stock){
      if(!over(g, A.tipx, A.tipy)) continue;
      held = g;
      grab = { ox: at(g).x - A.tipx, oy: at(g).y - A.tipy, pen: A.pen, rot: g.rot };
      g.el.classList.add('held');
      A.carry = true;
      return true;
    }
    return false;
  }

  function setEditing(v){
    editing = v;
    document.body.classList.toggle('editing', v);
    on.setAttribute('aria-pressed', String(v));
    on.textContent = v ? 'Done' : 'Edit';
    reset.hidden = !v;
    if(!v) release();
    measure_resize();
  }
  // the arm is sized from the sheet, so it has to be told to work itself out again
  function measure_resize(){ dispatchEvent(new Event('resize')); }

  on.addEventListener('click', () => setEditing(!editing));
  reset.addEventListener('click', () => {
    release();
    stock.forEach(g => { g.dx = g.dy = g.rot = 0; draw(g); });
  });

  /* One click does both: it takes whatever the jaws are sitting on, and if
     they are already holding something it sets that down instead. */
  addEventListener('click', e => {
    if(!editing || innerWidth < 920 || e.target.closest('.edit')) return;
    if(held) release(); else take();
  });

  function frame(){
    requestAnimationFrame(frame);
    if(!editing || innerWidth < 920 || !A.tool) return;

    const tx = A.tipx, ty = A.tipy;
    if(held){
      held.dx = tx + grab.ox - held.home.x;
      held.dy = ty + grab.oy - held.home.y;
      let turn = (A.pen - grab.pen) % 360;
      if(turn > 180) turn -= 360; if(turn < -180) turn += 360;
      held.rot = grab.rot + turn * 0.5;   // half, so it reads as a drag and not a spin
      draw(held);
    }
  }
  requestAnimationFrame(frame);
})();
