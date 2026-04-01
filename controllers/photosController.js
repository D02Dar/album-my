const path = require("path");
const sharp = require("sharp");
const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

const BUCKET = "gallery_images";

function safeBasename(originalname) {
  const base = path.basename(originalname || "image").replace(/[^\w.\-]+/g, "_");
  return base.slice(0, 180) || "image";
}

/**
 * Compress and convert an image buffer to WebP using sharp.
 *
 * Settings chosen for a film-grain photography portfolio:
 *  - Resize: cap at 2000px wide, keep aspect ratio, never upscale
 *  - WebP quality 85: high enough to preserve high-frequency noise (grain/texture)
 *    without the artefacts introduced by lower quality settings
 *  - effort 6: slower encoder pass that squeezes more bytes out without
 *    touching quality; safe to run server-side where latency matters less
 *    than file size
 */
async function compressImage(inputBuffer) {
  return sharp(inputBuffer)
    .resize({
      width: 2000,
      withoutEnlargement: true, // never blow up smaller images
      fit: "inside",            // preserve aspect ratio within the width cap
    })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();
}

async function list(req, res, next) {
  try {
    const { data, error } = await supabaseAnon
      .from("photos")
      .select(`
        id,
        url,
        title,
        category_id,
        created_at,
        display_order,
        uploaded_by,
        is_home_featured,
        gallery_categories:category_id (
          id,
          name
        )
      `)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(502).json({ error: error.message });
    }
    return res.json({ photos: data || [] });
  } catch (err) {
    next(err);
  }
}

async function upload(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Missing image file (field name: image)" });
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const categoryId = typeof req.body?.category_id === "string" ? req.body.category_id.trim() : null;
    const userId = req.user.id;
    const admin = getSupabaseAdmin();

    // ── Image compression ──────────────────────────────────────────────────
    // Convert to WebP and cap at 2000 px wide.  Quality 85 retains film grain
    // and high-contrast detail while giving meaningful size reduction vs. the
    // original JPEG/PNG/HEIC.
    let optimizedBuffer;
    try {
      optimizedBuffer = await compressImage(req.file.buffer);
    } catch (sharpErr) {
      console.error("sharp compression failed, falling back to original buffer:", sharpErr);
      // Graceful degradation: upload the original if sharp unexpectedly fails
      optimizedBuffer = req.file.buffer;
    }
    // ──────────────────────────────────────────────────────────────────────

    // Always store with .webp extension so the browser picks the right MIME type
    const originalBase = safeBasename(req.file.originalname).replace(/\.[^.]+$/, "");
    const objectPath = `${userId}/${Date.now()}-${originalBase}.webp`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(objectPath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      return res.status(502).json({ error: uploadError.message });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(objectPath);

    // 获取现有照片的最大 display_order，新照片排在最前面
    const { data: maxOrderData } = await admin
      .from("photos")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const maxDisplayOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order : 0;
    const newDisplayOrder = maxDisplayOrder + 1;

    const { data: row, error: insertError } = await admin
      .from("photos")
      .insert({
        url: publicUrl,
        title: title || null,
        category_id: categoryId || null,
        display_order: newDisplayOrder,
        uploaded_by: userId,
      })
      .select(`
        id,
        url,
        title,
        category_id,
        created_at,
        display_order,
        uploaded_by,
        is_home_featured,
        gallery_categories:category_id (
          id,
          name
        )
      `)
      .single();

    if (insertError) {
      return res.status(502).json({ error: insertError.message });
    }

    return res.status(201).json({ photo: row });
  } catch (err) {
    next(err);
  }
}

async function deletePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const admin = getSupabaseAdmin();

    // 获取照片信息
    const { data: photo, error: fetchError } = await admin
      .from("photos")
      .select("id, url, uploaded_by")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // 检查权限 - 只有上传者或 admin 可以删除
    if (photo.uploaded_by !== userId) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // 从 Storage 中删除文件（通过 URL 提取路径）
    // URL 格式: https://xxx.supabase.co/storage/v1/object/public/gallery_images/userId/filename
    const urlParts = photo.url.split("/");
    const objectPath = urlParts.slice(-2).join("/"); // 获取 userId/filename

    const { error: deleteStorageError } = await admin.storage
      .from(BUCKET)
      .remove([objectPath]);

    if (deleteStorageError) {
      console.error("Storage delete error:", deleteStorageError);
      // 继续执行，可能文件已不存在
    }

    // 从数据库中删除记录
    const { error: deleteDbError } = await admin
      .from("photos")
      .delete()
      .eq("id", id);

    if (deleteDbError) {
      return res.status(502).json({ error: deleteDbError.message });
    }

    return res.json({ success: true, message: "Photo deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function updatePhotoOrder(req, res, next) {
  try {
    const { orders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: "Invalid orders array" });
    }

    const admin = getSupabaseAdmin();

    // 批量更新 display_order
    const updates = orders.map(item => ({
      id: item.id,
      display_order: item.display_order
    }));

    for (const update of updates) {
      const { error } = await admin
        .from("photos")
        .update({ display_order: update.display_order })
        .eq("id", update.id);

      if (error) {
        return res.status(502).json({ error: error.message });
      }
    }

    return res.json({ success: true, message: "Photo order updated successfully" });
  } catch (err) {
    next(err);
  }
}

// 获取首页展示的照片
async function listFeatured(req, res, next) {
  try {
    const { data, error } = await supabaseAnon
      .from("photos")
      .select(`
        id,
        url,
        title,
        category_id,
        created_at,
        display_order,
        uploaded_by,
        is_home_featured,
        gallery_categories:category_id (
          id,
          name
        )
      `)
      .eq("is_home_featured", true)
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(502).json({ error: error.message });
    }
    return res.json({ photos: data || [] });
  } catch (err) {
    next(err);
  }
}

// 切换照片的首页展示状态
async function toggleFeatured(req, res, next) {
  try {
    const { id } = req.params;
    const admin = getSupabaseAdmin();

    // 获取当前照片的 is_home_featured 状态
    const { data: photo, error: fetchError } = await admin
      .from("photos")
      .select("id, is_home_featured")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // 切换状态
    const newStatus = !photo.is_home_featured;

    const { error: updateError } = await admin
      .from("photos")
      .update({ is_home_featured: newStatus })
      .eq("id", id);

    if (updateError) {
      return res.status(502).json({ error: updateError.message });
    }

    return res.json({ success: true, is_home_featured: newStatus });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upload, deletePhoto, updatePhotoOrder, listFeatured, toggleFeatured };