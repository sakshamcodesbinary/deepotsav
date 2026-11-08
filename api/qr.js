// Vercel serverless function: GET /api/qr?amount=51  ->  UPI QR code as SVG
const QRCode = require('qrcode');

function upiLink(amount) {
  const p = new URLSearchParams({
    pa: process.env.UPI_ID || 'sakshamsingh1331@oksbi',
    pn: process.env.PAYEE_NAME || 'Saksham',
    cu: 'INR',
    tn: 'Diwali Ki Kharchi'
  });
  if (amount) p.set('am', String(amount));
  return 'upi://pay?' + p.toString().replace(/\+/g, '%20');
}

module.exports = async (req, res) => {
  const raw = req.query && req.query.amount;
  let amount = 0;
  if (raw) {
    amount = Math.floor(Number(raw));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
      return res.status(400).json({ error: 'Amount must be between 1 and 100000' });
    }
  }
  try {
    const svg = await QRCode.toString(upiLink(amount), {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a0c36', light: '#ffffff' }
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.status(200).send(svg);
  } catch (e) {
    res.status(500).json({ error: 'Could not build QR' });
  }
};
