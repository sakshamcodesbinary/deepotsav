/*
 * Builds the night courtyard. Everything static is returned as one SVG string (rasterised once per resize);
 * everything that glows or flickers (diyas, bulbs, lanterns) is returned as data and drawn live on the canvas.
 * Original artwork inspired by a pastel apartment compound - no show assets are used.
 */
export const WORLD = { w: 1280, ground: 560, h: 1100 };

const BULB_COLORS = ['#ffd34d', '#ff5d8f', '#6ee7ff', '#9dff7a', '#ff9f43'];
const BUILDINGS = [
  // x, width, roof y, wall, trim
  [40, 250, 250, '#d9669a', '#f2a6c6'],
  [290, 130, 200, '#e9a23b', '#f6cf7a'],
  [420, 270, 240, '#5aa6b8', '#9bd0dc'],
  [690, 150, 215, '#e0b23c', '#f3d57d'],
  [840, 260, 250, '#d9669a', '#f2a6c6'],
  [1100, 180, 270, '#5aa6b8', '#9bd0dc']
];

export function buildScene() {
  const diyas = [], bulbs = [], lanterns = [];
  let s = '';

  const swag = (x1, x2, y, sag, n) => {
    s += `<path d="M${x1} ${y}Q${(x1 + x2) / 2} ${y + sag * 2} ${x2} ${y}" stroke="#2a1530" stroke-width="1.5" fill="none"/>`;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      bulbs.push({ x: x1 + (x2 - x1) * t, y: y + sag * 4 * t * (1 - t), c: BULB_COLORS[i % 5], ph: Math.random() * 6.28 });
    }
  };

  s += '<defs>' +
    '<radialGradient id="gl"><stop offset="0" stop-color="#ffcf70" stop-opacity=".5"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#ffb347"/></linearGradient>' +
    '<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3034"/><stop offset="1" stop-color="#5e1c2c"/></linearGradient>' +
    '<pattern id="cb" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 0H40M0 10V20M20 0V10M20 20V10" stroke="#000" stroke-width="1" fill="none"/></pattern>' +
    '</defs>';

  // courtyard floor
  s += '<rect y="560" width="1280" height="540" fill="url(#gr)"/><rect y="560" width="1280" height="540" fill="url(#cb)" opacity=".13"/><rect y="560" width="1280" height="6" fill="#b04a44"/>';

  for (const [x, w, top, wall, trim] of BUILDINGS) {
    s += `<rect x="${x}" y="${top}" width="${w}" height="${560 - top}" fill="${wall}"/>` +
      `<rect x="${x + w - 14}" y="${top}" width="14" height="${560 - top}" fill="#000" opacity=".13"/>` +
      `<rect x="${x - 6}" y="${top - 10}" width="${w + 12}" height="12" fill="${trim}"/>` +
      `<rect x="${x}" y="${top + 14}" width="${w}" height="6" fill="${trim}" opacity=".7"/>`;
    const n = Math.max(1, Math.floor((w - 10) / 80));
    const span = (n - 1) * 80 + 30;
    const sx = x + (w - span) / 2 + 15;
    for (let y = top + 34; y + 50 <= 495; y += 100) {
      for (let i = 0; i < n; i++) {
        const cx = sx + i * 80;
        s += `<circle cx="${cx}" cy="${y + 22}" r="36" fill="url(#gl)"/>` +
          `<rect x="${cx - 15}" y="${y}" width="30" height="44" rx="3" fill="url(#wg)" stroke="#fff3c8" stroke-opacity=".6"/>` +
          `<path d="M${cx} ${y}V${y + 44}M${cx - 15} ${y + 22}H${cx + 15}" stroke="#a65a1a" stroke-width="1.5" opacity=".6"/>` +
          `<rect x="${cx - 24}" y="${y + 44}" width="48" height="6" fill="#f8e7c6" opacity=".92"/>`;
        diyas.push({ x: cx - 12, y: y + 44, s: 0.5 }, { x: cx + 12, y: y + 44, s: 0.5 });
      }
    }
    for (let i = 0; i < n; i++) {
      const cx = sx + i * 80;
      s += `<path d="M${cx - 22} 560V520Q${cx - 22} 498 ${cx} 498Q${cx + 22} 498 ${cx + 22} 520V560Z" fill="#3a1410"/>` +
        `<path d="M${cx - 16} 560V524Q${cx - 16} 508 ${cx} 508Q${cx + 16} 508 ${cx + 16} 524V560Z" fill="url(#wg)" opacity=".5"/>`;
      for (let k = 0; k < 7; k++) s += `<circle cx="${cx - 24 + k * 8}" cy="${494 + (k % 2 ? 3 : 0)}" r="4.5" fill="${k % 2 ? '#ff8c1a' : '#ffc21a'}"/>`;
    }
    swag(x + 6, x + w - 6, top + 4, 14, Math.max(4, Math.floor(w / 24)));
  }

  // roof water tank and a plain sign board (text-free on purpose)
  s += '<rect x="450" y="200" width="36" height="30" fill="#8a5a3a"/><rect x="446" y="194" width="44" height="8" fill="#5c3a22"/>';
  s += '<rect x="290" y="188" width="130" height="30" fill="#2f7f86"/><rect x="300" y="196" width="110" height="14" rx="3" fill="#ffe69a" opacity=".85"/>';

  // string of lights across the courtyard with lanterns hanging from it
  swag(290, 1100, 196, 40, 40);
  for (const [t, c] of [[0.12, '#ff5d3a'], [0.3, '#ffb02e'], [0.5, '#ff5d3a'], [0.7, '#ffb02e'], [0.88, '#ff5d3a']]) {
    lanterns.push({ x: Math.round(290 + 810 * t), y: Math.round(196 + 160 * t * (1 - t)) + 40, c, ph: Math.random() * 6.28 });
  }

  // rangoli
  for (const [rx, ry, c] of [[230, 44, '#e9c46a'], [190, 35, '#e76f51'], [150, 27, '#2a9d8f'], [110, 19, '#f4a261'], [70, 12, '#8338ec']]) {
    s += `<ellipse cx="640" cy="655" rx="${rx}" ry="${ry}" fill="${c}"/>`;
  }
  s += '<ellipse cx="640" cy="655" rx="210" ry="39" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 9"/>';

  // diyas on the ground: edge row, a lower row, and a ring around the rangoli
  for (let x = 30; x < 1280; x += 60) diyas.push({ x, y: 580, s: 0.8 });
  for (let x = 80; x < 1280; x += 140) diyas.push({ x, y: 712, s: 1 });
  for (let a = 0; a < 360; a += 30) {
    const r = a * Math.PI / 180;
    diyas.push({ x: 640 + 262 * Math.cos(r), y: 655 + 52 * Math.sin(r), s: 0.9 });
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WORLD.w} ${WORLD.h}" width="${WORLD.w}" height="${WORLD.h}">${s}</svg>`;
  diyas.forEach((d, i) => { d.lit = false; d.t = 0; d.ph = (i * 1.7) % 6.28; });
  return { svg, diyas, bulbs, lanterns };
}
