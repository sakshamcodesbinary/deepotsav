'use strict';
/*
 * Ek Diwali Sab Ke Saath - tiny Node.js server.
 * Serves /public, plus a handful of JSON endpoints:
 *   GET  /api/config   -> UPI id, payee name, preset amounts
 *   GET  /api/qr       -> UPI QR as SVG (?amount=51 optional)
 *   GET  /api/stats    -> total crackers burst by everyone
 *   POST /api/burst    -> add to those totals
 * The only npm dependency is `qrcode`; if it is missing the site still runs
 * and the Kharchi panel falls back to the static QR image.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---- tiny .env loader (no dependency) --------------------------------------
try {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (_) { /* no .env, use defaults */ }

const PORT = Number(process.env.PORT) || 3000;
const UPI_ID = process.env.UPI_ID || 'sakshamsingh1331@oksbi';
const PAYEE = process.env.PAYEE_NAME || 'Saksham';
const PRESETS = [11, 21, 51, 101];
const PUBLIC = path.join(__dirname, '..', 'public');
const DATA_FILE = path.join(__dirname, '..', 'data', 'stats.json');

let QRCode = null;
try { QRCode = require('qrcode'); } catch (_) { console.warn('[deepotsav] "qrcode" not installed - run `npm install` for generated QR codes.'); }

// ---- stats (JSON file, written at most every 5 s) ---------------------------
const TYPES = ['rocket', 'skyshot', 'fuljhari', 'charkhi', 'anaar', 'bomb', 'jethelal'];
let stats = { total: 0, byType: Object.fromEntries(TYPES.map(t => [t, 0])) };
try { stats = Object.assign(stats, JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))); } catch (_) { /* first run */ }
let dirty = false;
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  fs.mkdir(path.dirname(DATA_FILE), { recursive: true }, () => fs.writeFile(DATA_FILE, JSON.stringify(stats), () => {}));
}, 5000).unref();

// ---- helpers ----------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; " +
  "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

function baseHeaders(extra) {
  return Object.assign({
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CSP, 'X-Frame-Options': 'DENY'
  }, extra);
}
function json(res, code, body) {
  res.writeHead(code, baseHeaders({ 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' }));
  res.end(JSON.stringify(body));
}

// naive per-IP rate limit for /api (120 requests / minute)
const hits = new Map();
setInterval(() => hits.clear(), 60000).unref();
function limited(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  const n = (hits.get(ip) || 0) + 1;
  hits.set(ip, n);
  return n > 120;
}

function upiLink(amount) {
  const p = new URLSearchParams({ pa: UPI_ID, pn: PAYEE, cu: 'INR', tn: 'Diwali Ki Kharchi' });
  if (amount) p.set('am', String(amount));
  return 'upi://pay?' + p.toString().replace(/\+/g, '%20');
}
const qrCache = new Map();
async function qrSvg(amount) {
  const key = amount || 0;
  if (qrCache.has(key)) return qrCache.get(key);
  const svg = await QRCode.toString(upiLink(amount), {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a0c36', light: '#ffffff' }
  });
  if (qrCache.size > 60) qrCache.clear();
  qrCache.set(key, svg);
  return svg;
}

function readBody(req, limit = 2048) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// ---- API --------------------------------------------------------------------
async function api(req, res, url) {
  if (limited(req)) return json(res, 429, { error: 'Too many requests' });

  if (req.method === 'GET' && url.pathname === '/api/config') {
    return json(res, 200, { upiId: UPI_ID, payeeName: PAYEE, presets: PRESETS });
  }
  if (req.method === 'GET' && url.pathname === '/api/stats') {
    return json(res, 200, stats);
  }
  if (req.method === 'GET' && url.pathname === '/api/qr') {
    if (!QRCode) return json(res, 503, { error: 'qrcode package not installed' });
    const raw = url.searchParams.get('amount');
    let amount = 0;
    if (raw) {
      amount = Math.floor(Number(raw));
      if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return json(res, 400, { error: 'Amount must be between 1 and 100000' });
    }
    try {
      const svg = await qrSvg(amount);
      res.writeHead(200, baseHeaders({ 'Content-Type': MIME['.svg'], 'Cache-Control': 'public, max-age=86400' }));
      return res.end(svg);
    } catch (e) { return json(res, 500, { error: 'Could not build QR' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/burst') {
    try {
      const body = JSON.parse(await readBody(req) || '{}');
      const counts = body && typeof body.counts === 'object' && body.counts ? body.counts : {};
      for (const t of TYPES) {
        const n = Math.floor(Number(counts[t]));
        if (Number.isFinite(n) && n > 0) { const add = Math.min(n, 200); stats.byType[t] = (stats.byType[t] || 0) + add; stats.total += add; dirty = true; }
      }
      return json(res, 200, { total: stats.total });
    } catch (_) { return json(res, 400, { error: 'Bad request' }); }
  }
  return json(res, 404, { error: 'Not found' });
}

// ---- static files -----------------------------------------------------------
function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, baseHeaders({ Allow: 'GET, HEAD' })); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch (_) { res.writeHead(400, baseHeaders()); return res.end(); }
  if (rel === '/') rel = '/index.html';
  else if (rel === '/play') rel = '/play.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403, baseHeaders()); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, baseHeaders({ 'Content-Type': MIME['.html'] })); return res.end('<h1>404</h1><p><a href="/">Back to Diwali</a></p>'); }
    const ext = path.extname(file).toLowerCase();
    const isAsset = rel.startsWith('/assets/');
    res.writeHead(200, baseHeaders({
      'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size,
      'Cache-Control': isAsset ? 'public, max-age=86400' : 'no-cache'
    }));
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch (_) { res.writeHead(400); return res.end(); }
  if (url.pathname.startsWith('/api/')) return api(req, res, url).catch(() => json(res, 500, { error: 'Server error' }));
  serveStatic(req, res, url);
});

server.listen(PORT, () => console.log(`Deepotsav running on http://localhost:${PORT}`));
process.on('SIGINT', () => { if (dirty) { try { fs.writeFileSync(DATA_FILE, JSON.stringify(stats)); } catch (_) {} } process.exit(0); });
