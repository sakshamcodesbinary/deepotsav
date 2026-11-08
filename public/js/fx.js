/* Pooled particle system, drawn additively in world coordinates. */
const MAX = 5400;
export const PAL = ['#ffd34d', '#ff5d8f', '#6ee7ff', '#9dff7a', '#ff9f43', '#ffffff', '#c77dff', '#ff3b3b', '#ffe9a8', '#4dffb8', '#7aa2ff'];
export const C = { gold: 0, pink: 1, cyan: 2, lime: 3, orange: 4, white: 5, violet: 6, red: 7, cream: 8, mint: 9, blue: 10 };

const px = new Float32Array(MAX), py = new Float32Array(MAX), vx = new Float32Array(MAX), vy = new Float32Array(MAX);
const life = new Float32Array(MAX), maxLife = new Float32Array(MAX), size = new Float32Array(MAX);
const grav = new Float32Array(MAX), drag = new Float32Array(MAX), age = new Float32Array(MAX);
const tx = new Float32Array(MAX), ty = new Float32Array(MAX), ph = new Float32Array(MAX);
const col = new Uint8Array(MAX), mode = new Uint8Array(MAX), alive = new Uint8Array(MAX);
let cursor = 0, count = 0;

export const activeCount = () => count;
export function clear() { alive.fill(0); count = 0; }

/** mode 0 = ballistic spark, mode 1 = text point (explodes, then springs to its target). */
export function emit(x, y, ax, ay, lifeS, color, sz = 2, g = 260, d = 0.985, m = 0) {
  let i = cursor;
  for (let n = 0; n < MAX && alive[i]; n++) i = (i + 1) % MAX;
  if (alive[i]) return -1; // pool full: skip silently
  cursor = (i + 1) % MAX;
  alive[i] = 1; count++;
  px[i] = x; py[i] = y; vx[i] = ax; vy[i] = ay; life[i] = lifeS; maxLife[i] = lifeS;
  col[i] = color; size[i] = sz; grav[i] = g; drag[i] = d; mode[i] = m; age[i] = 0; ph[i] = Math.random() * 6.28;
  return i;
}

export function update(dt) {
  const f60 = dt * 60;
  for (let i = 0; i < MAX; i++) {
    if (!alive[i]) continue;
    life[i] -= dt; age[i] += dt;
    if (life[i] <= 0) { alive[i] = 0; count--; continue; }
    if (mode[i] === 1 && age[i] > 0.3 && life[i] > 1.1) {
      vx[i] += (tx[i] - px[i]) * 36 * dt; vy[i] += (ty[i] - py[i]) * 36 * dt;
      const k = Math.pow(0.84, f60); vx[i] *= k; vy[i] *= k;
    } else {
      const k = Math.pow(drag[i], f60);
      vx[i] *= k; vy[i] = vy[i] * k + grav[i] * dt;
    }
    px[i] += vx[i] * dt; py[i] += vy[i] * dt;
  }
}

export function draw(ctx) {
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < MAX; i++) {
    if (!alive[i]) continue;
    const l = life[i], ml = maxLife[i];
    let a = l < 0.9 ? l / 0.9 : 1;
    if (mode[i] === 0) a = Math.min(1, (l / ml) * 1.6);
    else a *= 0.78 + 0.22 * Math.sin(age[i] * 18 + ph[i]);
    ctx.globalAlpha = a;
    ctx.strokeStyle = PAL[col[i]];
    ctx.lineWidth = size[i];
    ctx.beginPath();
    const tr = mode[i] === 0 ? 0.03 : 0.012;
    ctx.moveTo(px[i] - vx[i] * tr, py[i] - vy[i] * tr + 0.01);
    ctx.lineTo(px[i], py[i]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const BRIGHT = [C.gold, C.pink, C.cyan, C.lime, C.orange, C.violet, C.mint, C.cream];
export const randomColor = () => pick(BRIGHT);

export function sphere(x, y, color, n = 70, speed = 250, life = 1.5) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, s = speed * Math.sqrt(Math.random());
    emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(life * 0.7, life * 1.2), Math.random() < 0.18 ? C.white : color, rnd(1.6, 2.6), 150, 0.965);
  }
}
export function ring(x, y, color, n = 48, speed = 260, life = 1.5) {
  const tilt = rnd(0.45, 1);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283;
    emit(x, y, Math.cos(a) * speed, Math.sin(a) * speed * tilt, rnd(life * 0.85, life * 1.1), color, 2.2, 120, 0.96);
  }
}
export function peony(x, y, c1, c2) { sphere(x, y, c1, 60, 260); sphere(x, y, c2, 36, 150, 1.3); }
export function willow(x, y, color) {
  for (let i = 0; i < 56; i++) {
    const a = Math.random() * 6.283, s = rnd(120, 230);
    emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(1.8, 2.6), color, 1.8, 170, 0.95);
  }
}
export function randomBurst(x, y) {
  const c = randomColor(), c2 = randomColor(), r = Math.random();
  if (r < 0.34) peony(x, y, c, c2); else if (r < 0.62) { ring(x, y, c); sphere(x, y, c2, 28, 130); } else if (r < 0.82) willow(x, y, C.gold); else sphere(x, y, c, 90, 300);
}
export function fan(x, y, ang, spread, n, spd0, spd1, life, colors, sz = 2, g = 380) {
  for (let i = 0; i < n; i++) {
    const a = ang + rnd(-spread, spread), s = rnd(spd0, spd1);
    emit(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(life * 0.6, life), pick(colors), sz, g, 0.99);
  }
}

// ---- "HAPPY DIWALI" -----------------------------------------------------------------------------------------------
const textCache = {};
function textPoints(lines) {
  const key = lines.join('|');
  if (textCache[key]) return textCache[key];
  const fs = 150, lh = fs * 1.05, pad = 20;
  const c = document.createElement('canvas');
  const x = c.getContext('2d', { willReadFrequently: true });
  const font = `${fs}px "Yatra One", Georgia, serif`;
  x.font = font;
  const wmax = Math.max(...lines.map((l) => x.measureText(l).width));
  c.width = Math.ceil(wmax + pad * 2); c.height = Math.ceil(lh * lines.length + pad * 2);
  x.font = font; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => x.fillText(l, c.width / 2, pad + lh * (i + 0.5)));
  const data = x.getImageData(0, 0, c.width, c.height).data;
  const cand = [];
  for (let yy = 0; yy < c.height; yy += 3) for (let xx = 0; xx < c.width; xx += 3) if (data[(yy * c.width + xx) * 4 + 3] > 140) cand.push([xx - c.width / 2, yy - c.height / 2]);
  for (let i = cand.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [cand[i], cand[j]] = [cand[j], cand[i]]; }
  return (textCache[key] = { pts: cand.slice(0, 1900), w: c.width });
}

/** Explodes from (cx, cy) and settles into lines of text whose width is `targetW` world units. */
export function skyText(cx, cy, targetW, lines) {
  const { pts, w } = textPoints(lines);
  const k = targetW / w;
  const warm = [C.gold, C.cream, C.orange, C.gold, C.white];
  for (const [ox, oy] of pts) {
    const a = Math.random() * 6.283, s = rnd(90, 330);
    const i = emit(cx, cy, Math.cos(a) * s, Math.sin(a) * s, rnd(4.6, 5.2), pick(warm), rnd(2.4, 3.4), 0, 0.93, 1);
    if (i >= 0) { tx[i] = cx + ox * k; ty[i] = cy + oy * k; }
  }
}
export async function warmFonts() {
  try { if (document.fonts && document.fonts.load) await document.fonts.load('150px "Yatra One"', 'HAPPY DIWALI'); } catch (_) { /* fallback font is fine */ }
}
