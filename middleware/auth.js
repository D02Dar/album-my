const jwt = require("jsonwebtoken");

const COOKIE_NAME = "token";

function requireAuth(req, res, next) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  // 先从 cookie 中获取 token，如果没有则从 Authorization 请求头中获取
  let token = req.cookies?.[COOKIE_NAME];
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

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
