require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const photosRoutes = require("./routes/photosRoutes");
const bibliographyRoutes = require("./routes/bibliographyRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 2026;

const corsOrigin = process.env.CORS_ORIGIN;
const defaultOrigins = [
  'https://album-oufj3ixgx-zer002s-projects-e483d688.vercel.app',
  'https://album-my.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  credentials: true,
  origin:
    corsOrigin && corsOrigin.length > 0
      ? corsOrigin.split(",").map((s) => s.trim().replace(/\/$/, ''))
      : defaultOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/bibliography", bibliographyRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  const base = `http://localhost:${PORT}`;
  console.log(`Photogallery API listening on ${PORT}`);
  console.log("");
  console.log("Available routes:");
  console.log(`  GET  ${base}/health`);
  console.log(`  POST ${base}/api/auth/signup`);
  console.log(`  POST ${base}/api/auth/login`);
  console.log(`  POST ${base}/api/auth/logout`);
  console.log(`  GET  ${base}/api/photos`);
  console.log(`  POST ${base}/api/photos/upload  (multipart field: image; optional: title)`);
  console.log(`  GET  ${base}/api/bibliography`);
  console.log(`  POST ${base}/api/bibliography (auth required)`);
  console.log(`  DELETE ${base}/api/bibliography/:id (auth required)`);
});
