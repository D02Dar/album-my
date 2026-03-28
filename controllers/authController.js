const jwt = require("jsonwebtoken");
const { supabaseAnon } = require("../config/supabase");
const { COOKIE_NAME } = require("../middleware/auth");

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

function issueTokenCookie(res, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const e = new Error("JWT_SECRET not configured");
    e.status = 500;
    throw e;
  }
  const token = jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

async function signup(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    const user = data.user;
    if (!user?.id) {
      return res.status(400).json({ error: "Sign up did not return a user id" });
    }

    issueTokenCookie(res, user.id);
    return res.status(201).json({
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    const user = data.user;
    if (!user?.id) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    issueTokenCookie(res, user.id);
    return res.json({
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie(COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, logout };
