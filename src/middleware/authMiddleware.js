const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies.auth_token; // Ngambil dari cookie
  if (!token) return res.status(401).json({ error: 'Sesi habis, silakan login ulang!' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.userId; // Simpen ID buat dipake controller
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token tidak valid.' });
  }
};

module.exports = authMiddleware;