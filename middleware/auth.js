const jwt = require("jsonwebtoken");

const COOKIE_NAME = "token";

function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, secret);
    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = { id: userId };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth, COOKIE_NAME };
