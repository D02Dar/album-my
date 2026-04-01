const https = require("https");
const http = require("http");

/**
 * 图片代理端点 - 通过后端转发 Supabase Storage 的图片
 * 这避免了前端直接访问时的 CORS 问题
 */
function getImage(req, res, next) {
  try {
    let { url } = req.query;

    // 验证 URL（防止恶意使用）
    if (!url || typeof url !== "string") {
      console.warn("❌ Missing or invalid url parameter");
      return res.status(400).json({ error: "Missing or invalid url parameter" });
    }

    // 解码URL（如果前端编码过）
    try {
      url = decodeURIComponent(url);
    } catch (e) {
      console.warn("⚠️  URL decode error:", e.message);
    }

    console.log("🔗 Proxying image from:", url.substring(0, 100));

    // 验证URL来源
    const isSupabaseUrl = url.includes("supabase.co");
    const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
    
    if (!isSupabaseUrl && !isLocalhost) {
      console.warn("❌ URL not allowed:", url.substring(0, 100));
      return res.status(403).json({ error: "URL not allowed" });
    }

    // 解析URL
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      console.warn("❌ Invalid URL format:", url.substring(0, 100));
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    // 转发请求并返回图片（支持redirect和超时）
    const options = {
      timeout: 30000, // 30秒超时（增加以应对部署环境的网络延迟）
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)"
      }
    };

    const request = client.get(url, options, (imageRes) => {
      // 处理重定向
      if (imageRes.statusCode >= 300 && imageRes.statusCode < 400 && imageRes.headers.location) {
        imageRes.destroy(); // 确保销毁原始响应
        console.log("➡️  Redirect to:", imageRes.headers.location.substring(0, 100));
        // 递归调用以跟随重定向
        req.query.url = imageRes.headers.location;
        return getImage(req, res, next);
      }

      // 检查HTTP错误
      if (imageRes.statusCode !== 200) {
        imageRes.destroy();
        console.warn(`❌ Remote server returned ${imageRes.statusCode}`);
        if (!res.headersSent) {
          return res.status(imageRes.statusCode).json({ 
            error: `Remote server returned ${imageRes.statusCode}` 
          });
        }
        return;
      }

      // 设置响应头
      res.setHeader("Content-Type", imageRes.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 缓存24小时，加快后续请求
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("X-Proxy-Cache", "HIT"); // 标识代理服务器
      
      // 如果remote有ETag，转发它用于缓存验证
      if (imageRes.headers.etag) {
        res.setHeader("ETag", imageRes.headers.etag);
      }

      const contentLength = imageRes.headers["content-length"];
      console.log("✅ Proxied image successfully, size:", contentLength || "unknown", "bytes");

      // 处理流错误
      imageRes.on("error", (err) => {
        console.error("❌ Error streaming image from remote:", err.code, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Error streaming image" });
        }
      });

      res.on("error", (err) => {
        console.error("❌ Error writing image to response:", err.message);
        imageRes.destroy();
      });

      // 转发流
      imageRes.pipe(res);
    });

    request.on("timeout", () => {
      console.error("⏱️  Request timeout after 30s for:", url.substring(0, 100));
      request.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: "Image load timeout" });
      }
    });

    request.on("error", (err) => {
      console.error("❌ Proxy error:", err.code, "-", err.message, "for URL:", url.substring(0, 100));
      if (!res.headersSent) {
        const statusCode = err.code === 'ENOTFOUND' ? 404 : 502;
        res.status(statusCode).json({ error: "Failed to fetch image: " + err.message });
      }
    });

    request.on("abort", () => {
      console.warn("⚠️  Request aborted for:", url.substring(0, 100));
      if (!res.headersSent) {
        res.status(502).json({ error: "Request aborted" });
      }
    });

  } catch (err) {
    console.error("❌ Image proxy error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = { getImage };
