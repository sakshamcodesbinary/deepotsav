/* The seven crackers: how they look on the ground and how each one behaves once lit. */
import * as fx from './fx.js';
import { sfx, playSpecial } from './audio.js';

const { C } = fx;
export const TYPES = ['rocket', 'skyshot', 'fuljhari', 'charkhi', 'anaar', 'bomb', 'jethelal'];
const FUSE = { rocket: 0.9, skyshot: 0.9, fuljhari: 0.7, charkhi: 0.8, anaar: 0.8, bomb: 1.1, jethelal: 0.6 };
const TIP = { rocket: [0, -52], skyshot: [0, -52], fuljhari: [0, -60], charkhi: [0, -8], anaar: [0, -38], bomb: [7, -31], jethelal: [0, -46] };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const items = [];
export const rings = [];
const smoke = [];

// ---- shared glow sprite ---------------------------------------------------------------------------------------------
let glow = null;
function glowSprite() {
  if (glow) return glow;
  glow = document.createElement('canvas'); glow.width = glow.height = 128;
  const g = glow.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,244,200,1)'); r.addColorStop(0.25, 'rgba(255,190,90,.55)'); r.addColorStop(1, 'rgba(255,150,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return glow;
}
export function drawGlow(ctx, x, y, radius, alpha) {
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(glowSprite(), x - radius, y - radius, radius * 2, radius * 2);
}

// ---- spawning -------------------------------------------------------------------------------------------------------
export const activeCount = () => items.length;

export function spawn(type, x, y, env) {
  const onGround = y >= 560;
  const gy = onGround ? clamp(y, 592, 705) : 592 + Math.random() * 90;
  const c = {
    type, x, gy, y: onGround ? gy - 26 : y, vy: 0, s: 0.75 + ((gy - 592) / 113) * 0.45,
    state: 'fall', t: 0, ang: Math.random() * 6.28, acc: 0, beat: 0, dur: 0, apex: 0, from: 0, T: 1, hissed: false
  };
  items.push(c);
  return c;
}

function tip(c) { const [tx, ty] = TIP[c.type]; return [c.x + tx * c.s, c.y + ty * c.s]; }

function ignite(c, env) {
  c.t = 0;
  env.onIgnite(c.type);
  const [x, y] = tip(c);
  switch (c.type) {
    case 'rocket':
    case 'skyshot': {
      c.state = 'fly'; c.from = c.y; c.T = rnd(0.95, 1.2);
      c.apex = c.type === 'rocket' ? rnd(env.band.y0, env.band.y1) + 52 * c.s : env.band.text + 52 * c.s;
      sfx.whistle(c.T);
      break;
    }
    case 'fuljhari': c.state = 'burn'; c.dur = 8; sfx.hiss(8, true); break;
    case 'charkhi': c.state = 'burn'; c.dur = 6.5; sfx.whirr(6.5); break;
    case 'anaar': c.state = 'burn'; c.dur = 7; sfx.hiss(7, false); break;
    case 'bomb': {
      c.state = 'done';
      const bx = c.x, by = c.y - 12 * c.s;
      sfx.bang(true); env.shake(16); env.flash(0.55); env.haptic([70, 40, 120]);
      rings.push({ x: bx, y: by, r: 10, max: 230, life: 0.55, t: 0, color: '255,214,150', sides: 0, w: 5 });
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * 6.283, s = rnd(60, 440);
        fx.emit(bx, by, Math.cos(a) * s, Math.sin(a) * s - 90, rnd(0.6, 1.4), pick([C.orange, C.white, C.gold, C.red]), rnd(1.6, 3), 380, 0.94);
      }
      for (let i = 0; i < 12; i++) smoke.push({ x: bx + rnd(-16, 16), y: by + rnd(-10, 6), vx: rnd(-30, 30), vy: rnd(-70, -20), r: rnd(14, 26), t: 0, life: rnd(1.1, 1.8) });
      break;
    }
    case 'jethelal': {
      c.state = 'burn';
      c.dur = Math.min(playSpecial() || 10.8, 45);
      c.beat = 0;
      break;
    }
  }
}

// ---- per-frame update -----------------------------------------------------------------------------------------------
export function updateAll(dt, env) {
  for (const c of items) {
    c.t += dt;
    switch (c.state) {
      case 'fall':
        c.vy += 1600 * dt; c.y += c.vy * dt;
        if (c.y >= c.gy) { c.y = c.gy; c.state = 'fuse'; c.t = 0; sfx.fuse(FUSE[c.type]); }
        break;
      case 'fuse': {
        const [x, y] = tip(c);
        for (let i = 0; i < 2; i++) fx.emit(x, y, rnd(-70, 70), rnd(-130, -20), rnd(0.15, 0.35), pick([C.gold, C.orange, C.white]), 1.8, 320, 0.95);
        if (c.t >= FUSE[c.type]) ignite(c, env);
        break;
      }
      case 'fly': {
        const u = Math.min(1, c.t / c.T), e = 1 - (1 - u) * (1 - u);
        c.y = c.from + (c.apex - c.from) * e;
        c.x += Math.sin(c.t * 14) * 14 * dt;
        for (let i = 0; i < 3; i++) fx.emit(c.x, c.y - 50 * c.s, rnd(-26, 26), rnd(70, 160), rnd(0.4, 0.8), pick([C.orange, C.gold, C.cream]), 2.2, 140, 0.97);
        if (u >= 1) { burstUp(c, env); c.state = 'done'; }
        break;
      }
      case 'burn': burn(c, dt, env); break;
    }
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].state === 'done') items.splice(i, 1);
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t >= rings[i].life) rings.splice(i, 1); }
  for (let i = smoke.length - 1; i >= 0; i--) {
    const s = smoke[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += 18 * dt;
    if (s.t >= s.life) smoke.splice(i, 1);
  }
}

function burstUp(c, env) {
  const bx = c.x, by = c.y - 76 * c.s;
  if (c.type === 'rocket') {
    fx.randomBurst(bx, by); sfx.burst(); env.flash(0.12);
    return;
  }
  // skyshot: a small flash of gold, then the greeting
  sfx.burst(); env.flash(0.22);
  fx.sphere(bx, by, C.gold, 34, 150, 1.0);
  const w = env.textWidth();
  env.dim(5.4);
  const cx = clamp(bx, env.view.left + w / 2 + 8, env.view.right - w / 2 - 8);
  fx.skyText(cx, by, w, env.portrait() ? ['HAPPY', 'DIWALI'] : ['HAPPY DIWALI']);
}

function burn(c, dt, env) {
  const u = c.t / c.dur;
  const [x, y] = tip(c);
  c.acc += dt;
  switch (c.type) {
    case 'fuljhari': {
      c.acc = 0;
      const n = Math.round(420 * dt + Math.random());
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, s = rnd(50, 175);
        fx.emit(x, y, Math.cos(a) * s, Math.sin(a) * s - 20, rnd(0.45, 0.9), pick([C.gold, C.cream, C.orange, C.gold]), 1.6, 260, 0.955);
      }
      break;
    }
    case 'charkhi': {
      c.acc = 0;
      const w = 4 + 15 * Math.sin(Math.PI * Math.min(1, u));
      c.ang += w * dt;
      const R = 22 * c.s, cy = c.y - 8 * c.s;
      for (let k = 0; k < 3; k++) {
        const a = c.ang + k * 2.094, ex = c.x + Math.cos(a) * R, ey = cy + Math.sin(a) * R * 0.35;
        const n = Math.round(60 * dt * (0.6 + w / 12) + Math.random());
        for (let i = 0; i < n; i++) {
          const sp = rnd(110, 190);
          fx.emit(ex, ey, -Math.sin(a) * sp + Math.cos(a) * 40, Math.cos(a) * sp * 0.4 - rnd(10, 70), rnd(0.35, 0.75), pick([C.gold, C.orange, C.lime, C.pink, C.gold]), 1.8, 300, 0.94);
        }
      }
      break;
    }
    case 'anaar': {
      c.acc = 0;
      const phase = Math.floor(c.t / 1.2) % 4;
      const sets = [[C.gold, C.cream], [C.lime, C.mint], [C.pink, C.violet], [C.cyan, C.blue]];
      const n = Math.round(520 * dt + Math.random());
      for (let i = 0; i < n; i++) {
        const a = -1.5708 + rnd(-0.24, 0.24), s = rnd(280, 440) * c.s;
        fx.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.9, 1.5), pick(sets[phase]), 1.8, 430, 0.985);
      }
      if (Math.random() < dt * 1.4) { sfx.pop(); fx.sphere(x + rnd(-14, 14), y - rnd(120, 190) * c.s, pick(sets[phase]), 14, 90, 0.8); }
      break;
    }
    case 'jethelal': {
      const by = c.y - 24 * c.s;
      // a steady upward shower from the hexagon's top
      const n = Math.round(160 * dt + Math.random());
      for (let i = 0; i < n; i++) {
        const a = -1.5708 + rnd(-0.5, 0.5), s = rnd(120, 260);
        fx.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(0.5, 1), pick([C.gold, C.pink, C.cyan, C.lime, C.orange]), 1.8, 380, 0.985);
      }
      // a beat every ~0.54 s: hexagon ring + starburst
      if (c.acc >= 0.54) {
        c.acc -= 0.54; c.beat++;
        sfx.pop();
        rings.push({ x: c.x, y: by, r: 18, max: 210, life: 1.0, t: 0, color: pick(['255,93,143', '255,211,77', '110,231,255', '157,255,122']), sides: 6, w: 4 });
        fx.sphere(c.x, by - 10, fx.randomColor(), 24, 170, 1.0);
        if (c.beat % 3 === 0) {
          const bx = clamp(c.x + rnd(-260, 260), env.view.left + 30, env.view.right - 30);
          fx.randomBurst(bx, rnd(env.band.y0, env.band.y1)); sfx.burst(); env.flash(0.1);
        }
      }
      if (u >= 1) {
        fx.peony(c.x, by - 40, C.gold, C.pink); fx.ring(c.x, by - 40, C.cyan); sfx.burst(); env.flash(0.2);
        c.state = 'done'; return;
      }
      return;
    }
  }
  if (u >= 1) { if (c.type === 'anaar') sfx.pop(); c.state = 'done'; }
}

// ---- drawing ---------------------------------------------------------------------------------------------------------
function hex(ctx, r) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = -1.5708 + i * 1.0472; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }

const SPRITES = {
  rocket(ctx, c, body = '#d8283a', tipc = '#ffd34d') {
    ctx.fillStyle = '#a9743c'; ctx.fillRect(-1, -62, 2, 62);
    ctx.fillStyle = body; ctx.fillRect(-6, -92, 12, 40);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-6, -92, 4, 40);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(-6, -80, 12, 4); ctx.fillRect(-6, -60, 12, 3);
    ctx.fillStyle = tipc; ctx.beginPath(); ctx.moveTo(-6, -92); ctx.lineTo(0, -108); ctx.lineTo(6, -92); ctx.fill();
    ctx.fillStyle = '#8f1c28'; ctx.beginPath(); ctx.moveTo(-6, -56); ctx.lineTo(-12, -46); ctx.lineTo(-6, -46); ctx.moveTo(6, -56); ctx.lineTo(12, -46); ctx.lineTo(6, -46); ctx.fill();
  },
  skyshot(ctx) {
    SPRITES.rocket(ctx, null, '#2b5fd6', '#dfe6f5');
    ctx.fillStyle = '#ffd34d'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.2 : 5, a = -1.5708 + i * 0.6283; ctx.lineTo(Math.cos(a) * r, -70 + Math.sin(a) * r); }
    ctx.fill();
  },
  fuljhari(ctx, c) {
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(-0.8, -60, 1.6, 60);
    ctx.fillStyle = '#34343f'; ctx.fillRect(-2.6, -62, 5.2, 28);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-2.6, -62, 1.8, 28);
  },
  charkhi(ctx, c) {
    ctx.save(); ctx.translate(0, -8); ctx.scale(1, 0.35); ctx.rotate(c.ang);
    const cols = ['#d8283a', '#ffd34d', '#2a9d8f'];
    for (let k = 0; k < 3; k++) { ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22, k * 2.094, (k + 1) * 2.094); ctx.fill(); }
    ctx.strokeStyle = '#2b0f05'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.283); ctx.stroke();
    ctx.fillStyle = '#2b0f05'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.283); ctx.fill();
    ctx.restore();
  },
  anaar(ctx) {
    ctx.fillStyle = '#b5532a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-9, -38); ctx.lineTo(9, -38); ctx.lineTo(12, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-9, -38); ctx.lineTo(-4, -38); ctx.lineTo(-5, 0); ctx.fill();
    ctx.fillStyle = '#d8283a'; ctx.beginPath(); ctx.moveTo(-10.6, -18); ctx.lineTo(-9.8, -26); ctx.lineTo(9.8, -26); ctx.lineTo(10.6, -18); ctx.fill();
    ctx.fillStyle = '#2a1208'; ctx.beginPath(); ctx.ellipse(0, -38, 9, 3, 0, 0, 6.283); ctx.fill();
  },
  bomb(ctx, c) {
    const g = ctx.createRadialGradient(-4, -15, 1, 0, -11, 13); g.addColorStop(0, '#6a6a72'); g.addColorStop(1, '#101014');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -11, 11, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#8a8a92'; ctx.fillRect(-4, -23, 8, 4);
    ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, -23); ctx.quadraticCurveTo(2, -30, 7, -31); ctx.stroke();
  },
  jethelal(ctx, c) {
    const g = ctx.createLinearGradient(-20, -44, 20, -4); g.addColorStop(0, '#ff6fa3'); g.addColorStop(1, '#ffc94d');
    ctx.save(); ctx.translate(0, -24); hex(ctx, 20); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff3c8'; ctx.stroke();
    hex(ctx, 14); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke();
    ctx.fillStyle = '#fff6c0'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8, a = -1.5708 + i * 0.6283; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(-2, -48, 4, 4);
  }
};

export function drawItems(ctx) {
  for (const c of items) {
    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(c.x, c.gy + 1, 15 * c.s, 4.5 * c.s, 0, 0, 6.283); ctx.fill();
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.s, c.s);
    if (c.type === 'jethelal' && c.state === 'burn') { const p = 1 + 0.07 * Math.sin(c.t * 11.6); ctx.scale(p, p); }
    SPRITES[c.type](ctx, c);
    ctx.restore();
  }
}

/** Additive extras: glows around lit tips and expanding rings. Call after particles, in world space. */
export function drawLights(ctx) {
  ctx.globalCompositeOperation = 'lighter';
  for (const c of items) {
    if (c.state === 'fuse') { const [x, y] = tip(c); drawGlow(ctx, x, y, 14 * c.s, 0.7); }
    else if (c.state === 'burn') {
      const [x, y] = tip(c);
      const flick = 0.75 + 0.25 * Math.sin(c.t * 40) * Math.random();
      if (c.type === 'charkhi') drawGlow(ctx, c.x, c.y - 8 * c.s, 60 * c.s, 0.55 * flick);
      else if (c.type === 'anaar') drawGlow(ctx, x, y, 90 * c.s, 0.7 * flick);
      else if (c.type === 'jethelal') drawGlow(ctx, c.x, c.y - 24 * c.s, 90 * c.s, 0.6 * flick);
      else drawGlow(ctx, x, y, 42 * c.s, 0.8 * flick);
    } else if (c.state === 'fly') drawGlow(ctx, c.x, c.y - 50 * c.s, 34 * c.s, 0.8);
  }
  ctx.globalAlpha = 1;
  for (const r of rings) {
    const u = r.t / r.life, rad = r.r + (r.max - r.r) * (1 - Math.pow(1 - u, 2.2));
    ctx.save(); ctx.translate(r.x, r.y);
    ctx.strokeStyle = `rgba(${r.color},${1 - u})`; ctx.lineWidth = Math.max(0.5, r.w * (1 - u));
    if (r.sides === 6) hex(ctx, rad); else { ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.283); }
    ctx.stroke(); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const s of smoke) {
    const u = s.t / s.life; ctx.globalAlpha = 0.28 * (1 - u);
    ctx.fillStyle = '#5b4a63'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function clearAll() { items.length = 0; rings.length = 0; smoke.length = 0; }
