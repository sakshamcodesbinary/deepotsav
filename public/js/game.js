/* Play page: night courtyard, drag-and-drop crackers, diya lighting, achievements. */
import { buildScene, WORLD } from './scene.js';
import * as fx from './fx.js';
import * as ck from './crackers.js';
import * as sound from './audio.js';
import * as ach from './ach.js';
import { t, apply, onLang } from './i18n.js';
import { initControls, initConnect, bindKharchi, toast, showAchievements } from './ui.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const scene = buildScene();
const { diyas, bulbs, lanterns } = scene;

let W = 0, H = 0, dpr = 1, scale = 1, ox = 0, oy = 0;
let bg = null; // pre-rendered sky + courtyard
let sceneImg = null;
let shake = 0, flash = 0, dimAmt = 0, dimUntil = 0;
const stars = Array.from({ length: 150 }, () => ({ x: -300 + Math.random() * 1880, y: -1500 + Math.random() * 1680, r: Math.random() * 1.2 + 0.4, s: 0.6 + Math.random() * 2, p: Math.random() * 6.28 }));

// ---- layout ----------------------------------------------------------------------------------------------------------------
const portrait = () => W < H * 0.9;
function layout() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  scale = portrait() ? W / 600 : Math.max(W / WORLD.w, H / 720);
  ox = W / 2 - 640 * scale;
  oy = H - 720 * scale;
  renderBackground();
}
const toWorld = (cx, cy) => ({ x: (cx - ox) / scale, y: (cy - oy) / scale });
const worldY = (sy) => (sy - oy) / scale;

function renderBackground() {
  bg = document.createElement('canvas'); bg.width = canvas.width; bg.height = canvas.height;
  const g = bg.getContext('2d');
  g.scale(dpr, dpr);
  const sky = g.createLinearGradient(0, 0, 0, oy + 560 * scale);
  sky.addColorStop(0, '#070320'); sky.addColorStop(0.55, '#1b0c52'); sky.addColorStop(1, '#4a2072');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // warm horizon haze behind the buildings
  const hz = g.createRadialGradient(W / 2, oy + 400 * scale, 10, W / 2, oy + 400 * scale, Math.max(W, 700 * scale) * 0.7);
  hz.addColorStop(0, 'rgba(255,128,70,.22)'); hz.addColorStop(1, 'rgba(255,128,70,0)');
  g.fillStyle = hz; g.fillRect(0, 0, W, H);
  // moon
  const mx = ox + (portrait() ? 880 : 1130) * scale, my = oy + (portrait() ? -150 : 120) * scale, mr = 38 * scale;
  const mg = g.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 4);
  mg.addColorStop(0, 'rgba(255,232,170,.35)'); mg.addColorStop(1, 'rgba(255,232,170,0)');
  g.fillStyle = mg; g.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  const md = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 2, mx, my, mr);
  md.addColorStop(0, '#fffbe8'); md.addColorStop(1, '#f2d896');
  g.fillStyle = md; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();
  if (sceneImg) g.drawImage(sceneImg, ox, oy, WORLD.w * scale, WORLD.h * scale);
}

// ---- state -------------------------------------------------------------------------------------------------------------------
let lit = 0;
const total = diyas.length;
const pending = {}; // counts not yet sent to the server
let sessionBursts = 0;
const chipLit = document.getElementById('diyaCount');
const chipTotal = document.getElementById('diyaTotal');
chipTotal.textContent = total;

function lightDiya(d) {
  if (d.lit) return false;
  d.lit = true; d.t = performance.now(); lit++;
  chipLit.textContent = lit;
  document.getElementById('diyaChip').classList.add('pulse');
  setTimeout(() => document.getElementById('diyaChip').classList.remove('pulse'), 350);
  announce(ach.bump('diya', 1));
  return true;
}
function announce(list) {
  list.forEach((a, i) => setTimeout(() => { toast(t(a.key), t('unlocked')); sound.sfx.chime(); }, i * 900));
}
const brightness = () => lit / total;

// ---- fireworks environment -----------------------------------------------------------------------------------------------
const env = {
  view: { left: 0, right: 1280 },
  band: { y0: 100, y1: 300, text: 200 },
  portrait,
  textWidth: () => Math.min((W / scale) * 0.84, 900),
  shake: (a) => { shake = Math.max(shake, a); },
  flash: (a) => { flash = Math.max(flash, a); },
  dim: (sec) => { dimUntil = performance.now() + sec * 1000; },
  haptic: (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (_) { /* unsupported */ } },
  onIgnite(type) {
    sessionBursts++;
    pending[type] = (pending[type] || 0) + 1;
    const fresh = ach.bump(type, 1).concat(ach.bump('total', 1));
    announce(fresh);
    const n = document.getElementById('crowdN'); n.textContent = String(Number(n.dataset.base || 0) + sessionBursts);
    document.getElementById('hint').classList.add('gone');
  }
};
function updateEnv() {
  env.view.left = -ox / scale; env.view.right = (W - ox) / scale;
  const top = worldY(Math.max(150, H * 0.2)); // keep bursts clear of the tray
  env.band.y0 = top; env.band.y1 = top + (560 - top) * 0.34;
  env.band.text = top + (560 - top) * (portrait() ? 0.22 : 0.23);
}

// ---- input: drag a cracker from the tray ---------------------------------------------------------------------------------------
const tray = document.getElementById('tray');
const MAX_ACTIVE = 14;
let drag = null;

tray.querySelectorAll('.cracker').forEach((b) => {
  b.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    sound.unlock();
    drag = { type: b.dataset.type, src: b, id: e.pointerId, sx: e.clientX, sy: e.clientY, ghost: null, touch: e.pointerType === 'touch' };
  });
});
window.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.ghost) {
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    // on touch, a mostly-horizontal swipe scrolls the tray instead of lifting the cracker
    if (Math.hypot(dx, dy) < 8 || (drag.touch && Math.abs(dx) > Math.abs(dy) * 1.2)) return;
    const g = drag.src.querySelector('svg').cloneNode(true);
    const ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.append(g); document.body.append(ghost);
    drag.ghost = ghost; drag.src.classList.add('lifted'); document.body.classList.add('dragging');
  }
  moveGhost(e.clientX, e.clientY);
  e.preventDefault();
});
function moveGhost(x, y) { drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -88%)`; }
function endDrag(e, cancelled) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  document.body.classList.remove('dragging');
  d.src.classList.remove('lifted');
  if (!d.ghost) return;
  const dropOnTray = tray.getBoundingClientRect().bottom + 6 > e.clientY;
  d.ghost.remove();
  if (cancelled || dropOnTray) return;
  if (ck.activeCount() >= MAX_ACTIVE) { toast(t('tooMany'), ''); return; }
  const w = toWorld(e.clientX, e.clientY);
  ck.spawn(d.type, Math.min(Math.max(w.x, env.view.left + 30), env.view.right - 30), w.y, env);
}
window.addEventListener('pointerup', (e) => endDrag(e, false));
window.addEventListener('pointercancel', (e) => endDrag(e, true));

// ---- input: light diyas by touching / swiping / hovering them ------------------------------------------------------------------
let pressing = false;
function probe(cx, cy) {
  const w = toWorld(cx, cy);
  let hit = false;
  for (const d of diyas) {
    if (d.lit) continue;
    const r = 15 + d.s * 8;
    if (Math.abs(d.x - w.x) < r && Math.abs(d.y - 8 - w.y) < r + 6) { if (lightDiya(d)) { hit = true; sound.sfx.chime(); } }
  }
  return hit;
}
canvas.addEventListener('pointerdown', (e) => { sound.unlock(); pressing = true; probe(e.clientX, e.clientY); });
canvas.addEventListener('pointermove', (e) => { if (pressing || e.pointerType === 'mouse') probe(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { pressing = false; });
document.getElementById('lightAll').addEventListener('click', () => {
  sound.unlock();
  const todo = diyas.filter((d) => !d.lit);
  todo.forEach((d, i) => setTimeout(() => { lightDiya(d); }, i * 18));
  if (todo.length) sound.sfx.bell();
});

// ---- drawing -------------------------------------------------------------------------------------------------------------------
function drawDiya(d, now) {
  const s = d.s;
  ctx.save(); ctx.translate(d.x, d.y); ctx.scale(s, s);
  ctx.fillStyle = d.lit ? '#c4521a' : '#7d3a22';
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, 14, 12, 0); ctx.fill();
  ctx.fillStyle = d.lit ? '#7a2e0e' : '#4b2012'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 3, 0, 0, 6.283); ctx.fill();
  if (d.lit) {
    const k = Math.min(1, (now - d.t) / 450);
    const fl = 0.85 + 0.15 * Math.sin(now / 90 + d.ph) + 0.08 * Math.sin(now / 37 + d.ph * 2);
    const h = 20 * k * fl;
    ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(-5, -h * 0.55, 0, -h); ctx.quadraticCurveTo(5, -h * 0.55, 0, -2); ctx.fill();
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(-2, -h * 0.4, 0, -h * 0.65); ctx.quadraticCurveTo(2, -h * 0.4, 0, -3); ctx.fill();
  } else {
    ctx.fillStyle = '#2a1208'; ctx.fillRect(-0.8, -5, 1.6, 5);
  }
  ctx.restore();
}

function frame(now, dt) {
  const b = brightness();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const sx = shake > 0.2 ? (Math.random() - 0.5) * shake : 0, sy = shake > 0.2 ? (Math.random() - 0.5) * shake : 0;
  ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
  ctx.drawImage(bg, 0, 0, W, H);

  // evening dimness that lifts as diyas are lit
  dimAmt += ((now < dimUntil ? 0.42 : 0) - dimAmt) * Math.min(1, dt * 3);
  const dark = 0.44 * (1 - Math.pow(b, 0.7)) + 0.04 + dimAmt;
  ctx.fillStyle = `rgba(8,3,32,${Math.max(0, dark - flash * 0.5)})`;
  ctx.fillRect(-20, -20, W + 40, H + 40);
  // stars above the rooftops
  for (const st of stars) {
    const x = ox + st.x * scale, y = oy + st.y * scale;
    if (x < -4 || x > W + 4 || y < -4 || y > oy + 190 * scale) continue;
    ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 1000 * st.s + st.p));
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, st.r * 1.6, st.r * 1.6);
  }
  ctx.globalAlpha = 1;

  // world space
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, (ox + sx) * dpr, (oy + sy) * dpr);

  // bulbs and lanterns twinkle; they get stronger with the diyas
  ctx.globalCompositeOperation = 'lighter';
  const bulbA = 0.35 + 0.65 * b + flash * 0.4;
  for (const bl of bulbs) {
    const tw = 0.6 + 0.4 * Math.sin(now / 420 + bl.ph);
    ctx.globalAlpha = Math.min(1, bulbA * tw * 0.35);
    ctx.fillStyle = bl.c; ctx.beginPath(); ctx.arc(bl.x, bl.y, 9, 0, 6.283); ctx.fill();
    ctx.globalAlpha = Math.min(1, bulbA * (0.55 + 0.45 * tw));
    ctx.beginPath(); ctx.arc(bl.x, bl.y, 3.2, 0, 6.283); ctx.fill();
  }
  for (const l of lanterns) { ck.drawGlow(ctx, l.x, l.y, 46, (0.25 + 0.45 * b) * (0.85 + 0.15 * Math.sin(now / 300 + l.ph))); }
  ctx.globalAlpha = 1;

  // diya glow, then diyas
  for (const d of diyas) if (d.lit) { const k = Math.min(1, (now - d.t) / 450); ck.drawGlow(ctx, d.x, d.y - 10 * d.s, 34 * d.s * k, 0.5 * (0.85 + 0.15 * Math.sin(now / 110 + d.ph))); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  for (const l of lanterns) {
    ctx.fillStyle = l.c; ctx.beginPath(); ctx.ellipse(l.x, l.y, 10, 13, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(l.x - 5, l.y - 15, 10, 3); ctx.fillRect(l.x - 4, l.y + 12, 8, 2);
  }
  for (const d of diyas) drawDiya(d, now);

  // crackers
  ck.updateAll(dt, env);
  fx.update(dt);
  ck.drawItems(ctx);
  fx.draw(ctx);
  ck.drawLights(ctx);

  // flash of light from big bursts
  if (flash > 0.01) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,214,160,${Math.min(0.5, flash)})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
  flash *= Math.pow(0.0008, dt); // fast decay
  shake *= Math.pow(0.002, dt);
}

let last = performance.now(), running = true;
function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  frame(now, dt);
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(loop); } });

// ---- boot --------------------------------------------------------------------------------------------------------------------------
let statsOn = false; // the global counter only exists when the Node server is used (not on Vercel)
function flushStats() {
  if (!statsOn) return;
  const counts = { ...pending };
  if (!Object.keys(counts).length) return;
  for (const k of Object.keys(pending)) delete pending[k];
  const body = JSON.stringify({ counts });
  if (navigator.sendBeacon) { if (navigator.sendBeacon('/api/burst', new Blob([body], { type: 'application/json' }))) return; }
  fetch('/api/burst', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}
setInterval(flushStats, 10000);
window.addEventListener('pagehide', flushStats);

async function loadScene() {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([scene.svg], { type: 'image/svg+xml' }));
  try { await img.decode(); } catch (_) { await new Promise((r) => { img.onload = r; img.onerror = r; }); }
  sceneImg = img;
}

async function boot() {
  initControls(document.getElementById('controls'), { onAchievements: () => showAchievements(ach.all()) });
  initConnect(); bindKharchi(); apply();
  onLang(() => { const n = document.getElementById('crowdN'); n.textContent = n.textContent; });
  sound.preloadSpecial();
  await Promise.all([loadScene(), fx.warmFonts()]);
  layout(); updateEnv();
  window.addEventListener('resize', () => { layout(); updateEnv(); });
  window.addEventListener('orientationchange', () => setTimeout(() => { layout(); updateEnv(); }, 250));
  document.body.classList.add('ready');
  fetch('/api/stats').then((r) => r.ok ? r.json() : null).then((s) => { if (s && typeof s.total === 'number') { statsOn = true; const n = document.getElementById('crowdN'); n.dataset.base = s.total; n.textContent = s.total + sessionBursts; document.querySelector('.crowd').hidden = false; } }).catch(() => {});
  requestAnimationFrame(loop);
}
boot();
