/* ===========================================================
   ROBOT ARM DIAL

   Every number that decides how big the machine is, how it is
   proportioned and how it sits when parked lives here. Change
   one, save the file, reload the page. Nothing else needs
   touching: the base reseats itself and the arm resizes to
   whatever still fits on the sheet, at every window width.
   =========================================================== */
const ARM = {

  // OVERALL SIZE. 1.00 is as big as the sheet will take without
  // the base crowding the text column. Below that it just gets
  // smaller in place. Try 0.95 to fill the margin, 0.70 for a
  // small tidy machine in the corner.
  scale: 0.849,

  // HOW MUCH OF THAT LENGTH IS THE CLAMP, the rest being the two
  // arm links. 0.10 is a stubby gripper, 0.22 a long one.
  // Phones get a proportionally bigger clamp automatically.
  clamp: 0.125,

  // SPLIT BETWEEN THE TWO LINKS. 0.50 makes them equal; above
  // that the upper arm is the longer one. Useful range 0.42
  // to 0.60. Equal links can reach their own shoulder, longer
  // upper arms look more like a real industrial arm.
  upperArm: 0.545,

  // HOW THICK THE CASTINGS ARE, as a fraction of the arm's
  // length. 0.055 is slender and drafting-like, 0.105 is heavy
  // machinery. Everything else scales off this.
  thickness: 0.078,

  // HOW BIG THE JOINT HUBS ARE relative to the castings they
  // join. 1.0 is as drawn, 1.3 gives big shouldered joints,
  // 0.8 makes them disappear into the limbs.
  joints: 1.00,

  // THE PARKED POSE, in degrees, as [shoulder, elbow]. This is
  // where it sits when the cursor is out of range or off to the
  // left. Shoulder: -100 stands it upright, -144 lays it right
  // back. Elbow: 60 leaves it open, 156 folds it shut. The two
  // together decide how tall the parked machine is, so -130 and
  // 130 give a low folded pose, -100 and 70 a tall open one.
  park: [-130, 130],

  // HOW FAR THE ELBOW CAN TRAVEL, in degrees, as [open, folded]. 0 would be
  // dead straight and 180 folded flat back on itself, so [6, 156] leaves a
  // stop at each end the way a real one has. Widen it to [2, 172] and it
  // reaches a little further out and folds a lot tighter. It only ever bends
  // the one way, which is deliberate: see the note on the solver below.
  elbow: [6, 156],

  // HOW FAST EACH JOINT CHASES THE CURSOR. Higher is snappier,
  // lower is heavier and more deliberate. Keeping the elbow
  // well above the shoulder is what gives the lead-and-follow
  // look, where the wrist swings first and the body comes after.
  shoulderRate: 5.4,
  elbowRate:    9.0,

  // HOW FAR THE CURSOR CAN GO past full stretch before the arm
  // gives up and parks, as [home, every other page]. 1.00 is the
  // dashed envelope arc drawn on the sheet, so at that setting the
  // arm works exactly the area the drawing says it can reach. Home
  // runs a little past its own arc; the pages with reading on them
  // stop at it. Above about 1.45 it barely parks at all.
  radius: [1.20, 1.00],

  // HOW LONG THE MOUSE HAS TO SIT STILL, in seconds, before the arm decides
  // nobody is driving it and sits back down. This is also the pose it starts
  // in on a fresh page load. Set it to 0 to leave it standing where it was.
  restAfter: 14,

  // HOW MUCH BIGGER THE ARM GETS IN EDIT MODE, where it has to be able to
  // reach every letter of the name rather than just work the margin. It is a
  // multiplier on scale above, so the two move together.
  editScale: 1.50,

  // CLEARANCE kept between the parked elbow and the left edge
  // of the sheet, in pixels. Raise it if you ever catch the arm
  // touching the edge after changing the numbers above.
  margin: 26
};

/* ===========================================================
   ARM
   =========================================================== */
const NS = 'http://www.w3.org/2000/svg';
const N = (t, a = {}) => { const n = document.createElementNS(NS, t); for(const k in a) n.setAttribute(k, a[k]); return n; };

const stage = $('#stage'), svg = $('#arm');
const gEnv = $('#gEnv'), gBase = $('#gBase'), gStrut = $('#gStrut'),
      gChain = $('#gChain');

const A = {
  W:0, H:0, sx:0, sy:0, L1:180, L2:150, tool:44,
  floor:0, foot:0, plinth:0, rise:0,
  fx:0, fy:0, pen:0, down:0, wx:0, wy:0,
  lock:null, target:null, items:[], mode:'idle', tipx:-1e4, tipy:-1e4, carry:false,
  ptr:{ x:0, y:0, live:false, t:0 },
  still:0, ja:null, mv:null, hold:0,
  plot:null, P:{}
};

/* The machine is dimensioned from the floor up, the way it would be installed:
   ground line, foot, plinth, riser, then the shoulder. Nothing is a fraction
   of the viewport height on its own, so the base always stands on the bottom
   of the sheet instead of floating somewhere up it. The reach is then whatever
   fits in the room left above and to the right of that shoulder. */
function measure(){
  const r = stage.getBoundingClientRect();
  A.W = Math.max(320, r.width); A.H = Math.max(110, r.height);
  svg.setAttribute('viewBox', `0 0 ${A.W} ${A.H}`);
  const wide = innerWidth >= 920;

  A.floor  = A.H - (wide ? 7 : 4);
  A.foot   = Math.max(8,  A.H * (wide ? 0.020 : 0.028));
  A.plinth = Math.max(26, A.H * (wide ? 0.115 : 0.090));
  A.rise   = Math.max(18, A.H * (wide ? 0.080 : 0.060));
  A.sy     = A.floor - A.foot - A.plinth - A.rise;

  // where the page's own text begins; the column stands in the margin beside
  // it rather than underneath it
  const sh = $('.shell');
  const textL = (sh && wide)
    ? sh.getBoundingClientRect().left - r.left + parseFloat(getComputedStyle(sh).paddingLeft)
    : A.W * 0.22;

  // Two things bound the size. Vertically, full stretch has to clear the top
  // of the sheet. Horizontally, the parked pose throws the elbow out past the
  // column, and that has to stay on the sheet while the foot itself stays
  // clear of the text, which together work back to a span and a place to
  // stand. On a narrow sheet there is no margin to speak of, so the second
  // bound is only allowed to take so much off before the arm gets silly.
  // How far the parked pose throws the elbow out to the left of the shoulder,
  // worked out from the park angles and the casting width rather than guessed,
  // so the base reseats itself whenever either of those is changed.
  const grip = ARM.clamp * (wide ? 1 : 1.6);
  const back = Math.abs(Math.cos(ARM.park[0] * Math.PI / 180)) * ARM.upperArm
             + ARM.thickness * 1.52 * ARM.joints;

  const upRoom = A.sy - A.H * 0.050;
  const sideRoom = (textL - ARM.margin + A.rise * 0.58) / ((back + 0.152) * (1 - grip));
  const grow = document.body.classList.contains('editing') ? ARM.editScale : 1;
  const span = Math.min(upRoom, Math.max(sideRoom, upRoom * 0.62)) * ARM.scale * grow;
  A.tool = span * grip;
  const arm = span - A.tool;
  A.sx = wide ? back * arm + ARM.margin : 54;
  // Whatever the park pose does with the arm, the base still has to stand its
  // own foot on the sheet. An upright park barely reaches back at all, which
  // would seat the column too far left for its own plinth, so this nudges it
  // back in. It costs nothing at the settings where the arm is what reaches
  // furthest left, which is most of them.
  if(wide) A.sx = Math.max(A.sx, ARM.margin + A.rise * 0.58 + arm * ARM.thickness * 2.58);
  A.L1 = arm * ARM.upperArm;          // upper arm, the longer of the two
  A.L2 = arm * (1 - ARM.upperArm);    // forearm
  // the deck allows for the casting's own half width, so it is the ink that
  // stops short of the floor line rather than the centreline
  A.deck = A.floor - A.tool * 0.62;
  build();
}

const INK = '#10151A', MARK = '#1B32C8', RULE = '#B4BABA', FILL = '#FFFFFF';

function build(){
  const { L1, L2, tool, sx, sy } = A, R = L1 + L2;
  const wide = innerWidth >= 920;

  // ---- working envelope, the arc the tool can sweep ----
  gEnv.innerHTML = '';
  const RT = R + tool;
  let run = [];
  const flush = () => {
    if(run.length > 1) gEnv.appendChild(N('path', { d:'M ' + run.join(' L '), fill:'none',
      stroke:RULE, 'stroke-width':1, 'stroke-dasharray':'9 3 1.5 3', opacity:.9 }));
    run = [];
  };
  for(let i = 0; i <= 64; i++){
    const a = (-176 + 200 * i / 64) * Math.PI / 180;
    const px = sx + Math.cos(a)*RT, py = sy + Math.sin(a)*RT;
    if(px > 24 && py > 24 && px < A.W - 24 && py < A.floor) run.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
    else flush();
  }
  flush();

  if(wide){
    const t = N('text', { x: sx + 14, y: sy - RT + 15, fill:'#6A737A', 'font-size':8.5,
      'font-family':'DM Mono, monospace' });
    t.textContent = 'R' + Math.round(RT);
    gEnv.appendChild(t);
  }

  // ---- outline and section line only, no rendering. Fills are paper so a
  // near limb reads in front of a far one. ----
  const w1 = R * ARM.thickness * (wide ? 1 : 1.41);
  const w2 = w1*0.87, w3 = w1*0.74;
  const J = ARM.joints;
  const r1 = w1*1.42*J, r2 = w2*1.52*J, r3 = w3*1.58*J;
  A.t = [r1, r2, r3];

  const PAPER = '#FFFFFF', GHOST = '#F3F5F5', TINT = '#E8ECEC';
  const TAU = Math.PI * 2, THICK = 1.5, THIN = 0.95, HAIR = 0.75;

  const bolts = (r, n, rad) => {
    const out = [];
    for(let i = 0; i < n; i++){
      const a = i / n * TAU + TAU / (n * 2);
      out.push(N('circle', { cx:Math.cos(a)*r, cy:Math.sin(a)*r, r:rad,
        fill:'none', stroke:INK, 'stroke-width':HAIR, opacity:.75 }));
    }
    return out;
  };

  // a casting is the hull of two circles: the outline every arm link has,
  // because the metal has to wrap a bearing at each end
  const shell = (x0, wa, x1, wb, n) => {
    n = n || 20;
    const L = x1 - x0;
    const t = Math.acos(Math.max(-1, Math.min(1, (wa - wb) / L)));
    const p = [];
    for(let i = 0; i <= n; i++){
      const a = -t + 2*t * i / n;
      p.push([x1 + Math.cos(a)*wb, Math.sin(a)*wb]);
    }
    for(let i = 0; i <= n; i++){
      const a = t + (TAU - 2*t) * i / n;
      p.push([x0 + Math.cos(a)*wa, Math.sin(a)*wa]);
    }
    return 'M ' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L ') + ' Z';
  };

  const centre = (x0, x1) => N('path', {
    d:`M ${x0.toFixed(1)} 0 L ${x1.toFixed(1)} 0`, fill:'none', stroke:MARK,
    'stroke-width':HAIR, 'stroke-dasharray':'11 3 1.5 3', opacity:.55 });

  const hub = rr => [
    N('circle', { r:rr, fill:PAPER, stroke:INK, 'stroke-width':THICK }),
    N('circle', { r:rr*0.80, fill:GHOST, stroke:INK, 'stroke-width':THIN }),
    ...bolts(rr*0.63, 8, Math.max(.9, rr*0.062)),
    N('circle', { r:rr*0.40, fill:PAPER, stroke:INK, 'stroke-width':THIN }),
    N('circle', { r:rr*0.17, fill:TINT, stroke:INK, 'stroke-width':HAIR }),
    N('path', { d:`M ${-rr*1.15} 0 L ${rr*1.15} 0 M 0 ${-rr*1.15} L 0 ${rr*1.15}`,
      stroke:MARK, 'stroke-width':HAIR, 'stroke-dasharray':'8 2.5 1 2.5', opacity:.6 })
  ];

  const link = (g, x0, wa, x1, wb, ribs) => {
    g.appendChild(N('path', { d:shell(x0, wa, x1, wb), fill:PAPER, stroke:INK, 'stroke-width':THICK }));
    g.appendChild(N('path', { d:shell(x0 + (x1-x0)*0.17, wa*0.56, x1 - (x1-x0)*0.15, wb*0.58),
      fill:'none', stroke:INK, 'stroke-width':THIN, opacity:.5 }));
    (ribs || []).forEach(f => {
      const xx = x0 + (x1 - x0) * f, ww = (wa + (wb - wa) * f) * 0.88;
      g.appendChild(N('path', { d:`M ${xx.toFixed(1)} ${(-ww).toFixed(1)} L ${xx.toFixed(1)} ${ww.toFixed(1)}`,
        stroke:INK, 'stroke-width':HAIR, opacity:.42 }));
    });
    g.appendChild(centre(x0 + (x1-x0)*0.10, x1 - (x1-x0)*0.10));
  };

  // ---- the stand, set out from the floor up ----
  gBase.innerHTML = '';
  const B = (t, a) => gBase.appendChild(N(t, a));
  const gnd = A.floor, ft = A.foot, ph = A.plinth, rh = A.rise;
  const topY = gnd - ft - ph;                 // plinth top, where the riser starts
  const bx = sx - rh * 0.58;                  // plinth centre, left of the shoulder
  const u = w1 * 1.05;

  B('rect', { x:bx-u*2.45, y:gnd, width:u*4.90, height:Math.max(6, u*0.30),
    fill:'url(#hatch)', stroke:INK, 'stroke-width':THIN, opacity:.55 });
  B('rect', { x:bx-u*2.05, y:gnd-ft, width:u*4.10, height:ft,
    fill:PAPER, stroke:INK, 'stroke-width':THICK });
  [-1.56, -0.88, 0.88, 1.56].forEach(f =>
    B('circle', { cx:bx+u*f, cy:gnd-ft*0.48, r:Math.max(1.3, ft*0.20),
      fill:'none', stroke:INK, 'stroke-width':HAIR, opacity:.75 }));

  // plinth, a plain box with a slight batter
  B('path', { d:`M ${(bx-u*1.30).toFixed(1)} ${topY.toFixed(1)} L ${(bx-u*1.62).toFixed(1)} ${(gnd-ft).toFixed(1)}`
    + ` L ${(bx+u*1.62).toFixed(1)} ${(gnd-ft).toFixed(1)} L ${(bx+u*1.30).toFixed(1)} ${topY.toFixed(1)} Z`,
    fill:PAPER, stroke:INK, 'stroke-width':THICK });
  B('path', { d:`M ${(bx-u*0.82).toFixed(1)} ${(topY+ph*0.14).toFixed(1)} L ${(bx-u*0.96).toFixed(1)} ${(gnd-ft-ph*0.10).toFixed(1)}`,
    fill:'none', stroke:INK, 'stroke-width':HAIR, opacity:.38 });
  B('path', { d:`M ${(bx-u*1.30).toFixed(1)} ${topY.toFixed(1)} L ${(bx+u*1.30).toFixed(1)} ${topY.toFixed(1)}`,
    stroke:INK, 'stroke-width':THIN, opacity:.55 });

  // the fixed riser, built at an angle, carrying the shoulder
  const riseD = Math.atan2(topY - sy, bx - sx) * 180 / Math.PI;
  const riseL = Math.hypot(sx - bx, sy - topY);
  const gFix = N('g', { transform:`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${riseD.toFixed(2)})` });
  gFix.appendChild(N('path', { d:shell(0, w1*1.00, riseL, w1*0.86),
    fill:PAPER, stroke:INK, 'stroke-width':THICK }));
  gFix.appendChild(N('path', { d:shell(riseL*0.18, w1*0.56, riseL*0.84, w1*0.46),
    fill:'none', stroke:INK, 'stroke-width':THIN, opacity:.5 }));
  gFix.appendChild(centre(riseL*0.08, riseL*1.02));
  gBase.appendChild(gFix);

  // the built angle, called out the way a drawing would
  const arcR = Math.max(16, u * 1.7);
  B('path', { d:`M ${bx.toFixed(1)} ${(topY - arcR).toFixed(1)}`
    + ` A ${arcR.toFixed(1)} ${arcR.toFixed(1)} 0 0 1 ${(bx + Math.cos((riseD+180)*Math.PI/180)*arcR).toFixed(1)}`
    + ` ${(topY + Math.sin((riseD+180)*Math.PI/180)*arcR).toFixed(1)}`,
    fill:'none', stroke:MARK, 'stroke-width':HAIR, opacity:.55 });
  B('path', { d:`M ${bx.toFixed(1)} ${(topY - arcR*1.25).toFixed(1)} L ${bx.toFixed(1)} ${gnd.toFixed(1)}`,
    stroke:MARK, 'stroke-width':HAIR, 'stroke-dasharray':'11 3 1.5 3', opacity:.45, fill:'none' });

  // ---- dress pack, a cable loop from the plinth to the back of the upper arm
  gStrut.innerHTML = '';
  const dress = { mx: bx + u*0.95, my: topY + ph*0.18, ax: L1*0.50, ay: -w1*0.95, sag: u*1.25 };
  dress.a = N('path', { fill:'none', stroke:INK, 'stroke-width':Math.max(1.2, u*0.12),
    'stroke-linecap':'round', opacity:.6 });
  dress.b = N('path', { fill:'none', stroke:INK, 'stroke-width':HAIR,
    'stroke-linecap':'round', opacity:.4 });
  gStrut.append(dress.a, dress.b);
  A.dress = dress;

  // ---- the chain: upper arm, forearm, wrist with the clamp on it ----
  gChain.innerHTML = '';
  const g1 = N('g'), g2 = N('g'), g3 = N('g');
  gChain.appendChild(g1); g1.appendChild(g2); g2.appendChild(g3);

  // upper arm, with the counterweight housing behind the shoulder
  g1.appendChild(N('path', { d:shell(-r1*1.24, w1*0.80, -r1*0.26, w1*0.98),
    fill:GHOST, stroke:INK, 'stroke-width':THIN }));
  link(g1, 0, w1, L1, w2, [0.34, 0.66]);
  g1.appendChild(N('path', { d:`M ${(L1*0.14).toFixed(1)} ${(w1*0.80).toFixed(1)}`
    + ` C ${(L1*0.30).toFixed(1)} ${(w1*1.62).toFixed(1)} ${(L1*0.66).toFixed(1)} ${(w1*1.56).toFixed(1)}`
    + ` ${(L1*0.86).toFixed(1)} ${(w2*0.76).toFixed(1)}`,
    fill:'none', stroke:INK, 'stroke-width':Math.max(1.3, w1*0.16), opacity:.5, 'stroke-linecap':'round' }));
  hub(r1).forEach(n => g1.appendChild(n));

  // forearm
  link(g2, 0, w2, L2, w3, [0.38, 0.70]);
  hub(r2).forEach(n => g2.appendChild(n));

  // ---- wrist: the clamp body on the joint, two flat jaws sliding on it ----
  const bodyX = r3*0.78, bodyW = tool*0.30, jx = bodyX + bodyW;
  const jl = tool*0.56, jt = w3*0.26;
  hub(r3).forEach(n => g3.appendChild(n));
  g3.appendChild(N('rect', { x:bodyX, y:-w3*1.00, width:bodyW, height:w3*2.00,
    rx:w3*0.14, fill:PAPER, stroke:INK, 'stroke-width':THICK }));
  g3.appendChild(N('path', { d:`M ${(bodyX + bodyW*0.52).toFixed(1)} ${(-w3*1.00).toFixed(1)} v ${(w3*2.00).toFixed(1)}`,
    stroke:INK, 'stroke-width':HAIR, opacity:.45 }));
  const claw = [];
  [-1, 1].forEach(dir => {
    const f = N('g');
    f.appendChild(N('rect', { x:0, y:-jt, width:jl, height:jt*2,
      fill:PAPER, stroke:INK, 'stroke-width':THIN }));
    for(let i = 0; i < 3; i++)
      f.appendChild(N('path', { d:`M ${(jl*(0.34 + 0.21*i)).toFixed(1)} ${(-jt).toFixed(1)} v ${(jt*2).toFixed(1)}`,
        stroke:INK, 'stroke-width':HAIR, opacity:.45 }));
    g3.appendChild(f);
    claw.push({ el:f, dir });
  });
  g3.appendChild(centre(bodyX, tool));
  const nib = N('circle', { cx:tool, cy:0, r:2.4, fill:MARK });
  g3.appendChild(nib);
  A.claw = claw; A.clawX = jx; A.clawY = w3 * 0.70;

  A.P = { g1, g2, g3, nib };
}

/* ---- which item the arm is reading ---- */
const VEILABLE = '[data-target], .lede, .band, .gname, .sub, .plain, .go, .hero .over, .hero h1, .hero p, .titleblock div';

function scan(){
  const view = $('.view.on');
  A.items = view ? $$('[data-target]', view) : [];
  // the title block sits outside the views, but the base passes behind it
  A.veil  = (view ? $$(VEILABLE, view) : []).concat($$('.titleblock div'));
  A.veil.forEach(e => e.classList.add('vl'));
  pick();
}

/* ---- does a link of the arm lie behind a block of text? ---- */
const side = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);

function crosses(ax, ay, bx, by, cx, cy, dx, dy){
  const a = side(cx, cy, dx, dy, ax, ay), b = side(cx, cy, dx, dy, bx, by);
  const c = side(ax, ay, bx, by, cx, cy), d = side(ax, ay, bx, by, dx, dy);
  return (a > 0) !== (b > 0) && (c > 0) !== (d > 0);
}

function overlaps(x1, y1, x2, y2, r, pad){
  const L = r.left - pad, Rt = r.right + pad, T = r.top - pad, B = r.bottom + pad;
  if(Math.max(x1,x2) < L || Math.min(x1,x2) > Rt || Math.max(y1,y2) < T || Math.min(y1,y2) > B) return false;
  if((x1 >= L && x1 <= Rt && y1 >= T && y1 <= B) || (x2 >= L && x2 <= Rt && y2 >= T && y2 <= B)) return true;
  return crosses(x1,y1,x2,y2, L,T, Rt,T) || crosses(x1,y1,x2,y2, Rt,T, Rt,B)
      || crosses(x1,y1,x2,y2, Rt,B, L,B) || crosses(x1,y1,x2,y2, L,B, L,T);
}

function veilTest(){
  if(!A.veil || !A.veil.length) return;
  if(innerWidth < 920 || !A.segs){
    A.veil.forEach(e => e.classList.remove('lit'));
    return;
  }
  const hit = [];
  for(const el of A.veil){
    const r = el.getBoundingClientRect();
    if(r.bottom < -60 || r.top > innerHeight + 60 || r.width < 4){ hit.push(false); continue; }
    let on = false;
    for(const g of A.segs){ if(overlaps(g[0], g[1], g[2], g[3], r, g[4])){ on = true; break; } }
    hit.push(on);
  }
  A.veil.forEach((el, i) => el.classList.toggle('lit', hit[i]));
}

function pick(){
  if(innerWidth < 920 || !A.items.length || !A.ptr.live){ A.target = null; return; }
  const mid = innerHeight * 0.44;
  let best = null, bd = 1e9;
  for(const el of A.items){
    const r = el.getBoundingClientRect();
    if(r.bottom < 60 || r.top > innerHeight - 40) continue;
    const d = Math.abs(r.top + Math.min(r.height, 220)/2 - mid);
    if(d < bd){ bd = d; best = el; }
  }
  // a hover only wins while the mouse is actually being used; otherwise the
  // item nearest the middle of the viewport is what the arm reads
  A.target = (A.ptr.live && A.lock) ? A.lock : best;
}

addEventListener('pointerover', e => {
  if(innerWidth < 920) return;
  const t = e.target.closest('[data-target]');
  A.lock = t || null;
  if(t) A.target = t;
});

addEventListener('pointermove', e => {
  if(innerWidth < 920 || e.pointerType === 'touch') return;
  const s = stage.getBoundingClientRect();
  const x = e.clientX - s.left, y = e.clientY - s.top;
  // ignore the sub-pixel events a scroll can synthesise
  if(A.ptr.live && Math.abs(x - A.ptr.x) < 1.5 && Math.abs(y - A.ptr.y) < 1.5) return;
  A.ptr.x = x; A.ptr.y = y; A.ptr.live = true; A.ptr.t = performance.now();
}, { passive:true });

document.addEventListener('mouseleave', () => { A.ptr.live = false; });
addEventListener('blur', () => { A.ptr.live = false; });

/* ---- load plot: the arm draws the rule under the name ---- */
function startPlot(){
  const path = $('#plotPath'), box = $('#plot');
  if(!path || !box) return;
  const r = box.getBoundingClientRect(), s = stage.getBoundingClientRect();
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  if(reduced || innerWidth < 920 || r.width < 40){ path.style.strokeDashoffset = 0; return; }
  path.style.strokeDashoffset = len;
  A.plot = {
    t0: performance.now() + 280, dur: 1500,
    y: r.top - s.top + r.height / 2,
    x0: r.left - s.left,
    x1: r.left - s.left + r.width,
    path, len
  };
}

/* ---- Posture, not search. The three bending joints turn together in fixed
   proportion, so the arm traces an arc and the tightness of that arc alone
   decides how far it reaches. One target gives exactly one pose, the pose
   slides smoothly as the target moves, and there is no second way to fold that
   the arm could flip into between frames. A free solver on a four link chain
   cannot promise any of that, and its flips were most of what read as jitter.
   ---- */
const nip = (v, a, b) => v < a ? a : v > b ? b : v;
const wrap = v => { while(v > Math.PI) v -= Math.PI*2; while(v < -Math.PI) v += Math.PI*2; return v; };
const D2R = Math.PI / 180;

/* ===========================================================
   KINEMATICS

   Two links and a wrist, solved in closed form. A two link planar
   chain has exactly two answers for any point it can reach, elbow
   up and elbow down. Taking the elbow up branch every time makes
   the pose a single valued, continuous function of the target:
   no search, no spare freedom to resolve, and no second solution
   for it to flip into halfway through a move. It also places the
   elbow above the line from shoulder to wrist, so as long as both
   of those are on the sheet the whole linkage is too, which is
   what keeps it off the floor without any correction at runtime.
   =========================================================== */
// The shoulder's backstop sits a few degrees past wherever the parked pose
// puts it, so the two can never disagree. Letting it swing further back than
// it parks only happens when a target close in forces a hard fold, and that
// pose throws the elbow off the left of the sheet for nothing in return.
const LIM = { s0: (ARM.park[0] - 4) * D2R, s1: 8*D2R,
              e0: ARM.elbow[0]*D2R, e1: ARM.elbow[1]*D2R, roll: 140*D2R };
const STOW = [ARM.park[0]*D2R, ARM.park[1]*D2R];   // the parked pose, from the dial
const JOINT_RATE = [ARM.shoulderRate, ARM.elbowRate];
const BITE = [0.42, 0.70, 9];          // how near the cursor has to be to the
                                      // jaws for them to take it, how far it
                                      // has to pull away before they let go,
                                      // and the same while carrying a letter,
                                      // which is only ever put down by a click

function solve(tx, ty){
  const { sx, sy, L1, L2 } = A;
  const dx = tx - sx, dy = ty - sy;
  const raw = Math.atan2(dy, dx);

  // The fan the arm can turn its wrist into. A target outside it cannot be
  // faced at all, and simply stretching toward the nearest edge of the fan
  // lays the arm out flat pointing away from where you are, so the further
  // behind the machine a target sits, the more the arm draws itself in. Both
  // terms are smooth in the target, so neither can snap.
  const nom = 0.55;                           // a typical shoulder to wrist offset
  const flo = LIM.s0, fhi = LIM.s1 + nom, fmid = (flo + fhi) / 2;
  const held = nip(fmid + wrap(raw - fmid), flo, fhi);

  // How far outside the fan the target lies, scaled so it reads exactly 1 at
  // the middle of the blind arc behind the machine. That matters: the nearer
  // edge of the fan changes there, and if the pose did not already agree with
  // itself at that point the shoulder would snap across as you crossed it.
  const gap = (Math.PI * 2 - (fhi - flo)) / 2;
  const over = Math.max(A.park || 0, nip(Math.abs(wrap(raw - held)) / gap, 0, 1));

  // the chord the chain spans shrinks as the elbow closes, so the elbow stops
  // set the ring of distances it can work in
  const span = q => Math.sqrt(L1*L1 + L2*L2 + 2*L1*L2*Math.cos(q));
  const d = nip(Math.hypot(dx, dy), span(LIM.e1), span(LIM.e0));

  const c2 = nip((d*d - L1*L1 - L2*L2) / (2*L1*L2), -1, 1);
  // acos only ever returns 0 to pi, so this is always the elbow up branch and
  // the elbow can never bend back the other way. That is the point: a two link
  // chain has two valid poses for every target, elbow up and elbow down, and
  // an arm free to use both will flip between them partway through a move.
  const q2r = Math.acos(c2);                  // always the elbow up branch
  const off = Math.atan2(L2*Math.sin(q2r), L1 + L2*c2);

  // Outside the fan there is nothing to aim at, so instead of committing to an
  // edge the arm eases back to a stowed pose. Both edges arrive at the same
  // stow, so the place where the choice between them flips is a place where
  // the pose is identical either way, and the flip is invisible.
  const a1 = nip(held - off, LIM.s0, LIM.s1) * (1 - over) + STOW[0] * over;
  const q2 = q2r * (1 - over) + STOW[1] * over;

  // When the shoulder meets a stop the chain no longer reaches the target, and
  // the elbow up guarantee goes with it, so the forearm could swing the wrist
  // through the floor. Hold it to the angle that puts the wrist on the deck
  // and no lower: asin of a clamped ratio, so it stays continuous.
  const ey = sy + Math.sin(a1) * L1;
  const flat = Math.asin(nip((A.deck - ey) / L2, -1, 1));
  return [a1, nip(q2, LIM.e0, Math.max(LIM.e0, flat - a1))];
}

/* ---- Motion. The arm is handed a point and runs a ramp to it: up to speed,
   back down, stopped on the point. The ramp is a quintic that starts from
   whatever speed the arm is already carrying, so a move can be re-aimed part
   way through with no step in speed, which is what lets it answer the cursor
   at once instead of finishing a stale move first. ---- */
function mvSeg(p0, v0, p1, T){
  const d = p1 - p0 - v0 * T;
  return { p0, v0, T, c3: 10*d + 4*v0*T, c4: -15*d - 7*v0*T, c5: 6*d + 3*v0*T };
}
const mvAt  = (q, t) => q.p0 + q.v0*q.T*t + q.c3*t*t*t + q.c4*t*t*t*t + q.c5*t*t*t*t*t;
const mvVel = (q, t) => (q.v0*q.T + 3*q.c3*t*t + 4*q.c4*t*t*t + 5*q.c5*t*t*t*t) / q.T;

function aim(now, gx, gy){
  const m = A.mv;
  let vx = 0, vy = 0;
  if(m){
    const t = Math.min(1, (now - m.t0) / (m.T * 1000));
    vx = mvVel(m.x, t); vy = mvVel(m.y, t);
  }
  const far = Math.hypot(gx - A.fx, gy - A.fy);
  const T = nip(0.17 + far * 0.00090, 0.26, 1.00);
  A.mv = { t0:now, T, ex:gx, ey:gy,
           x: mvSeg(A.fx, vx, gx, T), y: mvSeg(A.fy, vy, gy, T) };
}

/* ---- where the arm parks when it is not committing to the cursor ---- */
function park(now, wide){
  const rp = wide ? (REST[page] || REST.home) : REST_M;
  const ang = rp.ang * D2R;
  const ext = (A.L1 + A.L2) * rp.ext;
  return { x: A.sx + Math.sin(ang) * ext, y: A.sy - Math.cos(ang) * ext, pen: rp.pen };
}

/* ---- loop ---- */
let last = performance.now();

function tick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const wide = innerWidth >= 920;
  const { sx, sy, L1, L2 } = A, R = L1 + L2;

  // A mouse that has not moved in a long while is nobody at the controls, so
  // the arm hands itself back and sits down rather than holding a pose.
  if(A.ptr.live && ARM.restAfter > 0 && now - A.ptr.t > ARM.restAfter * 1000)
    A.ptr.live = false;

  let gx, gy, penG, downG = 0, mode, parkT = 0;

  if(A.plot && now >= A.plot.t0){
    const p = Math.min(1, (now - A.plot.t0) / A.plot.dur);
    const e = p < .5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2) / 2;
    gx = A.plot.x0 + (A.plot.x1 - A.plot.x0) * e - A.tool;
    gy = A.plot.y; penG = 0; downG = 1; mode = 'plotting';
    A.plot.path.style.strokeDashoffset = A.plot.len * (1 - e);
    if(p >= 1) A.plot = null;
  } else if(A.ptr.live && wide){
    const cx = A.ptr.x, cy = A.ptr.y;
    const d = Math.hypot(cx - sx, cy - sy);

    /* The radius the cursor can work in is wider than the arm is long. Full
       stretch is the shoulder out to the jaws; past that the arm stands at
       full reach and keeps pointing for another fifth of its length again
       before it gives up and draws back to the parked pose.

       Going left parks it too, but only down low. The shoulder swings back
       past the vertical, so everything above the height the parked elbow sits
       at is still inside the fan it can work in, even well to the left of the
       column. Below that line there is nothing on that side but its own base,
       so it draws back. Every edge here is a ramp, so it eases in and out of
       park rather than snapping between the two. */
    const full = R + A.tool;
    const elbowY = sy + Math.sin(STOW[0]) * L1;   // how high the parked elbow rides
    const over = nip((elbowY - cy) / (A.tool * 1.2), 0, 1);

    const reach = ARM.radius[page === 'home' ? 0 : 1];
    parkT = Math.max(nip((sx - cx) / (A.tool * 1.5), 0, 1) * (1 - over),
                     nip((d - full * reach) / (R * 0.26), 0, 1));

    // The clamp points at the cursor from wherever the wrist actually is, read
    // from the frame before. The wrist's own goal is set off the fixed
    // shoulder instead, so the clamp angle is purely an output and cannot feed
    // back into the pose that produced it.

    const base = Math.atan2(cy - sy, cx - sx);
    const dwx = cx - A.wx, dwy = cy - A.wy;
    penG = (Math.hypot(dwx, dwy) > A.tool * 0.5 ? Math.atan2(dwy, dwx) : base) / D2R;

    gx = cx - Math.cos(base) * A.tool;
    gy = cy - Math.sin(base) * A.tool;

    // The jaws shut once the cursor is actually sitting between them. Where
    // the tip finished the frame before is the honest answer to that, and
    // using it means closing cannot disturb the pose that did the closing.
    const gap = Math.hypot(cx - A.tipx, cy - A.tipy);
    const held = gap < A.tool * BITE[A.down > .5 ? 1 : 0];
    // carrying a letter clamps them shut until it is clicked down again
    downG = (A.carry || A.lock || held) ? 1 : 0;
    mode = d < full * Math.min(1, reach) ? 'follow' : 'aiming';
  } else {
    // Nothing is driving it, so it sits in the parked pose: on a fresh load,
    // once the pointer leaves, and after a long still spell. The rest angles
    // still set where the jaws face, which is all that is left to choose.
    const home = park(now, wide);
    const hp = home.pen * D2R;
    gx = home.x - Math.cos(hp) * A.tool;
    gy = home.y - Math.sin(hp) * A.tool;
    penG = home.pen; downG = 0;
    parkT = 1;
    mode = 'idle';
  }

  if(reduced || mode === 'plotting'){
    A.fx = gx; A.fy = gy; A.pen = penG; A.mv = null;
  } else {
    // the clamp turns to face the target first, ahead of the arm carrying it
    A.pen += (penG - A.pen) * (1 - Math.exp(-dt * 18));
    const m = A.mv;
    if(m){
      const t = Math.min(1, (now - m.t0) / (m.T * 1000));
      A.fx = mvAt(m.x, t); A.fy = mvAt(m.y, t);
      if(t >= 1){ A.mv = null; A.hold = now + 50 + Math.random() * 90; }
      else if(now - m.t0 > 80 && Math.hypot(gx - m.ex, gy - m.ey) > 26) aim(now, gx, gy);
    } else if(now >= A.hold && Math.hypot(gx - A.fx, gy - A.fy) > 10){
      aim(now, gx, gy);
    }
  }
  // Drawing back into park is brisk; coming out of it is not. When the cursor
  // comes back inside its reach the arm takes a moment to swing round and
  // pick the work up again, rather than snapping to attention.
  A.park = A.park || 0;
  A.park += (parkT - A.park) * (reduced ? 1 : 1 - Math.exp(-dt * (parkT > A.park ? 5.5 : 1.9)));

  A.down += (downG - A.down) * (reduced ? 1 : 1 - Math.exp(-dt * 9));
  A.still = mode === 'idle' ? A.still + dt : 0;
  A.mode = mode;

  // the wrist works anywhere on the sheet; with the elbow up branch that is
  // all it takes to keep the whole linkage on it
  let wantX = A.fx, wantY = A.fy;
  if(!A.plot){
    const mg = A.tool * 0.55 + 14;
    wantX = nip(wantX, mg, A.W - mg);
    wantY = nip(wantY, mg, A.floor - mg * 0.5);
  }

  const want = solve(wantX, wantY);
  if(!A.ja || A.ja.length !== 2) A.ja = want.slice();
  for(let i = 0; i < 2; i++)
    A.ja[i] += (want[i] - A.ja[i]) * (reduced ? 1 : 1 - Math.exp(-dt * JOINT_RATE[i]));

  const q1 = A.ja[0], q2 = A.ja[1], a2 = q1 + q2;
  const ex = sx + Math.cos(q1) * L1, ey = sy + Math.sin(q1) * L1;
  const wx = ex + Math.cos(a2) * L2, wy = ey + Math.sin(a2) * L2;

  // The clamp rolls to face the cursor, but not back along the limb it is
  // bolted to, and not so far down that its tip goes through the floor. The
  // second one matters because the roll stop itself can swing a tip downward
  // that was only ever trying to point sideways.
  let pr = a2 + nip(wrap(A.pen * D2R - a2), -LIM.roll, LIM.roll);
  const room = nip((A.deck - wy) / A.tool, -1, 1);
  const flr = Math.asin(room), back = Math.PI - flr;
  const pw = wrap(pr);
  if(pw > flr && pw < back) pr = (pw - flr) < (back - pw) ? flr : back;
  A.wx = wx; A.wy = wy;

  const tipx = wx + Math.cos(pr) * A.tool, tipy = wy + Math.sin(pr) * A.tool;
  A.tipx = tipx; A.tipy = tipy;
  const tk = A.t || [10, 8, 6];
  A.segs = [
    [sx, sy, ex,   ey,   tk[0]],
    [ex, ey, wx,   wy,   tk[1]],
    [wx, wy, tipx, tipy, tk[2]]
  ];
  if(now - (veilTest.t || 0) > 90){ veilTest.t = now; veilTest(); }

  const DEG = r => r * 180 / Math.PI;
  const { g1, g2, g3, nib } = A.P;
  g1.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${DEG(q1).toFixed(2)})`);
  g2.setAttribute('transform', `translate(${L1.toFixed(1)} 0) rotate(${DEG(q2).toFixed(2)})`);
  g3.setAttribute('transform', `translate(${L2.toFixed(1)} 0) rotate(${DEG(pr - a2).toFixed(2)})`);
  nib.setAttribute('r', (2.2 + A.down * 1.6).toFixed(2));

  // dress pack, drawn in world space so it hangs as the arm moves
  const dp = A.dress;
  if(dp){
    const ca = Math.cos(q1), sa = Math.sin(q1);
    const px = sx + dp.ax*ca - dp.ay*sa, py = sy + dp.ax*sa + dp.ay*ca;
    const mid = Math.min(dp.mx, px) - dp.sag * 0.95;
    const arc = (k, w) => `M ${dp.mx.toFixed(1)} ${(dp.my + w).toFixed(1)}`
      + ` C ${(mid - w).toFixed(1)} ${(dp.my + dp.sag*k*0.2).toFixed(1)}`
      + ` ${(mid - w*1.4).toFixed(1)} ${(py + dp.sag*k).toFixed(1)}`
      + ` ${px.toFixed(1)} ${py.toFixed(1)}`;
    dp.a.setAttribute('d', arc(0.80, 0));
    dp.b.setAttribute('d', arc(1.12, dp.sag * 0.18));
  }

  // parallel jaws slide apart on the clamp body, they do not pivot
  const open = A.clawY * (1 - A.down * 0.62);
  (A.claw || []).forEach(f =>
    f.el.setAttribute('transform', `translate(${A.clawX.toFixed(1)} ${(f.dir * open).toFixed(2)})`));

  if(now - (tick.t || 0) > 80){
    tick.t = now;
    nJ1.textContent = (-DEG(q1)).toFixed(1);
    nJ2.textContent = (-DEG(q2)).toFixed(1);
    nJ3.textContent = (-DEG(pr - a2)).toFixed(1);
    const ix = A.target ? A.items.indexOf(A.target) + 1 : 0;
    nI.textContent  = ix ? pad2(ix) + '/' + pad2(A.items.length) : '--';
    nP.textContent  = A.down > .5 ? 'SHUT' : 'OPEN';
    nR.textContent  = Math.round(Math.hypot(wx - sx, wy - sy) / R * 100) + '%';
    nMode.textContent = A.mode;
  }

  requestAnimationFrame(tick);
}

/* ---- boot ---- */
let raf;
addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { measure(); drawFrame(); scan(); });
});

measure();
drawFrame();
A.fx = A.sx + A.L1 * 0.9; A.fy = A.sy - A.L1 * 0.9;
scan();
startPlot();
requestAnimationFrame(tick);
