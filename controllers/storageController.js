const https = require("https");
const http = require("http");

/**
 * 图片代理端点 - 通过后端转发 Supabase Storage 的图片
 * 这避免了前端直接访问时的 CORS 问题
 */
async function getImage(req, res, next) {
  try {
    const { url } = req.query;

    // 验证 URL（防止恶意使用）
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing or invalid url parameter" });
    }

    // 只允许 Supabase Storage URL
    if (!url.includes("supabase.co") && !url.includes("localhost")) {
      return res.status(403).json({ error: "URL not allowed" });
    }

    // 使用 URL 对象解析
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    // 转发请求并返回图片
    return new Promise((resolve, reject) => {
      const request = client.get(url, (imageRes) => {
        // 转发响应头
        res.setHeader("Content-Type", imageRes.headers["content-type"] || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=3600"); // 缓存 1 小时
        res.setHeader("Access-Control-Allow-Origin", "*");

        // 转发流
        imageRes.pipe(res);
      });

      request.on("error", (err) => {
        console.error("Error fetching image:", err);
        res.status(502).json({ error: "Failed to fetch image" });
      });
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getImage };
