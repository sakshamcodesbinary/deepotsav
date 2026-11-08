// Vercel serverless function: GET /api/config
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    upiId: process.env.UPI_ID || 'sakshamsingh1331@oksbi',
    payeeName: process.env.PAYEE_NAME || 'Saksham',
    presets: [11, 21, 51, 101]
  });
};
