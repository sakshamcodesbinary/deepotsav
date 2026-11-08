/* Shared chrome: language + sound controls, connect icons, Diwali Ki Kharchi panel, toasts, achievements panel. */
import { t, apply, toggleLang, onLang } from './i18n.js';
import * as sound from './audio.js';

const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const svg = (inner, extra = '') => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;

const ICON = {
  speaker: svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>'),
  muted: svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>'),
  trophy: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4"/>'),
  connect: svg('<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>', 'width="26" height="26"'),
  instagram: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>'),
  linkedin: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="3" y="9" width="4" height="12" rx=".6"/><circle cx="5" cy="5" r="2.2"/><path d="M10 9h3.8v1.8c.7-1.3 2.1-2.1 3.9-2.1 3.1 0 4.3 2 4.3 5.2V21h-4v-6.1c0-1.5-.5-2.5-1.9-2.5S14 13.4 14 15v6h-4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>'
};

// ---- controls (language, optional achievements, sound) -------------------------------------------------------------
export function initControls(host, { onAchievements = null } = {}) {
  host.innerHTML = '';
  if (onAchievements) {
    const b = el('button', 'ctrl icon', ICON.trophy); b.type = 'button'; b.dataset.i18nAria = 'achAria'; b.title = '';
    b.addEventListener('click', onAchievements); host.append(b);
  }
  const lang = el('button', 'ctrl lang'); lang.type = 'button'; lang.dataset.i18nAria = 'langAria';
  lang.innerHTML = '<span data-i18n="langBtn"></span>';
  lang.addEventListener('click', () => { sound.unlock(); toggleLang(); });
  host.append(lang);

  const wrap = el('div', 'sound');
  const btn = el('button', 'ctrl icon'); btn.type = 'button'; btn.dataset.i18nAria = 'soundAria'; btn.setAttribute('aria-expanded', 'false');
  const pop = el('div', 'pop');
  pop.innerHTML = '<button type="button" class="switch" role="switch"><i></i><span></span></button><label class="vol"><span data-i18n="volume"></span><input type="range" min="0" max="100" step="1" aria-label="Volume"></label>';
  wrap.append(btn, pop); host.append(wrap);
  const sw = pop.querySelector('.switch'), range = pop.querySelector('input'), swText = sw.querySelector('span');
  const paint = () => {
    const s = sound.getState();
    btn.innerHTML = s.muted || s.volume === 0 ? ICON.muted : ICON.speaker;
    sw.setAttribute('aria-checked', String(!s.muted)); swText.textContent = s.muted ? t('soundOff') : t('soundOn');
    range.value = Math.round(s.volume * 100);
    range.style.setProperty('--v', range.value + '%');
  };
  btn.addEventListener('click', () => { sound.unlock(); const o = wrap.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
  sw.addEventListener('click', () => { sound.unlock(); sound.toggleMuted(); });
  range.addEventListener('input', () => { sound.unlock(); sound.setVolume(range.value / 100); });
  document.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  sound.onChange(paint); onLang(paint); paint(); apply(host);
}

// ---- connect (Instagram / LinkedIn / X) ------------------------------------------------------------------------------
const LINKS = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/sakshamcodesbinary', icon: ICON.linkedin, cls: 'li' },
  { name: 'Instagram', href: 'https://www.instagram.com/sakshammsinghh', icon: ICON.instagram, cls: 'ig' },
  { name: 'X', href: 'https://x.com/sakshhhhham', icon: ICON.x, cls: 'xx' }
];
export function initConnect() {
  const box = el('div', 'connect');
  const list = el('div', 'links');
  LINKS.forEach((l, i) => {
    const a = el('a', 'link ' + l.cls, l.icon + `<em>${l.name}</em>`);
    a.href = l.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', l.name); a.style.setProperty('--i', i);
    list.append(a);
  });
  const main = el('button', 'main', ICON.connect); main.type = 'button'; main.dataset.i18nAria = 'connectAria'; main.setAttribute('aria-expanded', 'false');
  box.append(list, main); document.body.append(box);
  const set = (o) => { box.classList.toggle('open', o); main.setAttribute('aria-expanded', String(o)); };
  main.addEventListener('click', () => set(!box.classList.contains('open')));
  document.addEventListener('pointerdown', (e) => { if (!box.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  apply(box);
}

// ---- modal helper ------------------------------------------------------------------------------------------------------
function makeModal(id, labelledBy) {
  const m = el('div', 'modal'); m.id = id; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', labelledBy);
  const sheet = el('div', 'sheet'); m.append(sheet); document.body.append(m);
  let opener = null, onClose = null;
  const open = () => { opener = document.activeElement; m.classList.add('open'); document.documentElement.classList.add('modal-open'); const f = sheet.querySelector('.x'); if (f) f.focus(); };
  const close = (silent) => { if (!m.classList.contains('open')) return; m.classList.remove('open'); document.documentElement.classList.remove('modal-open'); if (opener && opener.focus) opener.focus(); if (!silent && onClose) onClose(); };
  m.addEventListener('pointerdown', (e) => { if (e.target === m) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  return { m, sheet, open, close, setOnClose: (fn) => { onClose = fn; } };
}

// ---- Diwali Ki Kharchi (always English, per the brief) ------------------------------------------------------------------
let kharchi = null, cfg = { upiId: 'sakshamsingh1331@oksbi', payeeName: 'Saksham', presets: [11, 21, 51, 101] };
async function loadConfig() { try { const r = await fetch('/api/config'); if (r.ok) cfg = Object.assign(cfg, await r.json()); } catch (_) { /* offline: defaults */ } }

function buildKharchi() {
  const k = makeModal('kharchi', 'kh-title');
  k.sheet.innerHTML = `
    <button class="x" type="button" aria-label="Close">&times;</button>
    <h2 id="kh-title" class="khtitle">Diwali Ki Kharchi</h2>
    <p class="khsub">Pick an amount, or type your own.</p>
    <div class="presets" role="group" aria-label="Amount"></div>
    <label class="custom"><span>Other amount</span><b>&#8377;</b><input type="number" inputmode="numeric" min="1" max="100000" placeholder="Amount" aria-label="Other amount in rupees"></label>
    <div class="qrbox"><img alt="UPI QR code" width="190" height="190"><p class="qrnote"></p></div>
    <div class="upi"><code></code><button type="button" class="copybtn">Copy UPI ID</button></div>
    <a class="pay" href="#">Pay via UPI app</a>`;
  const presetsBox = k.sheet.querySelector('.presets'), input = k.sheet.querySelector('input');
  const img = k.sheet.querySelector('img'), note = k.sheet.querySelector('.qrnote'), code = k.sheet.querySelector('code');
  const pay = k.sheet.querySelector('.pay'), copy = k.sheet.querySelector(".copybtn");
  let amount = 0, timer = null;

  const link = () => `upi://pay?pa=${encodeURIComponent(cfg.upiId)}&pn=${encodeURIComponent(cfg.payeeName)}&cu=INR&tn=${encodeURIComponent('Diwali Ki Kharchi')}` + (amount ? `&am=${amount}` : '');
  const refresh = () => {
    code.textContent = cfg.upiId; pay.href = link();
    note.textContent = amount ? `Scan with any UPI app to pay \u20B9${amount}` : 'Scan with any UPI app';
    img.classList.add('loading');
    img.onload = () => img.classList.remove('loading');
    img.onerror = () => { img.onerror = null; img.src = '/assets/upi-qr.jpg'; note.textContent = amount ? `Scan, then enter \u20B9${amount} in your UPI app` : 'Scan with any UPI app'; img.classList.remove('loading'); };
    img.src = '/api/qr' + (amount ? `?amount=${amount}` : '');
  };
  const select = (n) => {
    amount = n;
    presetsBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === n)));
    refresh();
  };
  const drawPresets = () => {
    presetsBox.innerHTML = '';
    cfg.presets.forEach((v) => { const b = el('button', 'chip', '\u20B9' + v); b.type = 'button'; b.dataset.v = v; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => { input.value = ''; select(amount === v ? 0 : v); }); presetsBox.append(b); });
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { const n = Math.floor(Number(input.value)); select(Number.isFinite(n) && n >= 1 && n <= 100000 ? n : 0); }, 350);
  });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(cfg.upiId); copy.textContent = 'Copied'; } catch (_) { copy.textContent = 'Press and hold to copy'; }
    setTimeout(() => { copy.textContent = 'Copy UPI ID'; }, 1600);
  });
  k.sheet.querySelector('.x').addEventListener('click', () => k.close());
  k.setOnClose(showShukriya);
  k.show = async () => { await loadConfig(); drawPresets(); input.value = ''; select(0); k.open(); };
  return k;
}
export function openKharchi() { sound.unlock(); if (!kharchi) kharchi = buildKharchi(); kharchi.show(); }
export function bindKharchi(root = document) { root.querySelectorAll('[data-open-kharchi]').forEach((b) => b.addEventListener('click', openKharchi)); }

// ---- Shukriya + sweets ------------------------------------------------------------------------------------------------
const SWEETS = [
  // ladoo
  '<svg viewBox="0 0 48 48"><defs><radialGradient id="ld" cx=".35" cy=".3"><stop offset="0" stop-color="#ffc94d"/><stop offset="1" stop-color="#e8851a"/></radialGradient></defs><circle cx="24" cy="25" r="18" fill="url(#ld)"/><g fill="#c76a10" opacity=".6"><circle cx="16" cy="20" r="1.6"/><circle cx="27" cy="15" r="1.6"/><circle cx="31" cy="27" r="1.6"/><circle cx="19" cy="31" r="1.6"/><circle cx="24" cy="24" r="1.6"/></g><path d="M14 17q4-6 11-6" stroke="#fff3b0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/></svg>',
  // jalebi
  '<svg viewBox="0 0 48 48"><path d="M24 24m-3 0a3 3 0 1 1 6 0a7 7 0 1 1-14 0a11 11 0 1 1 22 0a15 15 0 1 1-30 0" fill="none" stroke="#f08a1c" stroke-width="4.4" stroke-linecap="round"/><path d="M24 24m-3 0a3 3 0 1 1 6 0a7 7 0 1 1-14 0a11 11 0 1 1 22 0" fill="none" stroke="#ffd36b" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></svg>',
  // barfi
  '<svg viewBox="0 0 48 48"><path d="M6 20l22-10 14 8-22 14z" fill="#f6efe0"/><path d="M6 20v8l14 8v-8z" fill="#d9c9a6"/><path d="M20 28l22-10v8L20 36z" fill="#c7b58f"/><g fill="#7aa84a"><circle cx="20" cy="19" r="2"/><circle cx="29" cy="17" r="2"/><circle cx="25" cy="23" r="2"/></g><path d="M14 17l9-4" stroke="#d8d8e0" stroke-width="2" opacity=".8"/></svg>',
  // gulab jamun
  '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="38" rx="16" ry="4" fill="#e8b04a" opacity=".6"/><ellipse cx="24" cy="25" rx="14" ry="16" fill="#6b2a14"/><ellipse cx="18" cy="18" rx="4" ry="6" fill="#a4522a" opacity=".8" transform="rotate(20 18 18)"/></svg>',
  // peda
  '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="28" rx="18" ry="11" fill="#d9b888"/><ellipse cx="24" cy="24" rx="18" ry="11" fill="#f2dcb0"/><g fill="#e8731a"><circle cx="19" cy="22" r="1.1"/><circle cx="26" cy="20" r="1.1"/><circle cx="30" cy="25" r="1.1"/><circle cx="22" cy="27" r="1.1"/></g><circle cx="24" cy="24" r="4" fill="none" stroke="#c9a46a" stroke-width="1.4"/></svg>'
];
function showShukriya() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const o = el('div', 'shukriya'); o.setAttribute('role', 'status');
  o.innerHTML = '<div class="word">Shukriya</div>';
  if (!reduce) {
    for (let i = 0; i < 28; i++) {
      const s = el('span', 'sweet', SWEETS[i % SWEETS.length]);
      const size = 34 + Math.random() * 34;
      s.style.cssText = `left:${Math.random() * 96}%;width:${size}px;height:${size}px;--d:${2.4 + Math.random() * 1.8}s;--dl:${Math.random() * 1.1}s;--r:${(Math.random() * 720 - 360) | 0}deg`;
      o.append(s);
    }
  }
  document.body.append(o);
  sound.sfx.chime();
  const end = () => { o.classList.add('out'); setTimeout(() => o.remove(), 450); };
  o.addEventListener('pointerdown', end);
  setTimeout(end, reduce ? 1800 : 4200);
}

// ---- toasts + achievements panel -------------------------------------------------------------------------------------
let toasts = null;
export function toast(titleHtml, subHtml) {
  if (!toasts) { toasts = el('div', 'toasts'); toasts.setAttribute('aria-live', 'polite'); document.body.append(toasts); }
  const n = el('div', 'toast', `${ICON.star}<div><small>${subHtml}</small><b>${titleHtml}</b></div>`);
  toasts.append(n);
  setTimeout(() => n.classList.add('out'), 3400); setTimeout(() => n.remove(), 3900);
}
let achPanel = null;
export function showAchievements(list) {
  if (!achPanel) {
    achPanel = makeModal('ach', 'ach-title');
    achPanel.sheet.innerHTML = '<button class="x" type="button" aria-label="Close">&times;</button><h2 id="ach-title" class="khtitle"></h2><ul class="achlist"></ul>';
    achPanel.sheet.querySelector('.x').addEventListener('click', () => achPanel.close(true));
    onLang(() => { if (achPanel.m.classList.contains('open') && achPanel.last) paintAch(achPanel.last); });
  }
  achPanel.last = list; paintAch(list); achPanel.open();
}
function paintAch(list) {
  achPanel.sheet.querySelector('#ach-title').textContent = t('achTitle');
  const ul = achPanel.sheet.querySelector('.achlist'); ul.innerHTML = '';
  list.forEach((a) => {
    const li = el('li', a.unlocked ? 'on' : '', `${ICON.star}<div><b>${t(a.key)}</b><small>${t(a.desc)}</small><i style="--p:${(a.value / a.goal) * 100}%"></i></div><em>${a.value}/${a.goal}</em>`);
    ul.append(li);
  });
}
