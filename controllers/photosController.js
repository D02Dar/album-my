const path = require("path");
const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

const BUCKET = "gallery_images";

function safeBasename(originalname) {
  const base = path.basename(originalname || "image").replace(/[^\w.\-]+/g, "_");
  return base.slice(0, 180) || "image";
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

    const objectPath = `${userId}/${Date.now()}-${safeBasename(req.file.originalname)}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype || "application/octet-stream",
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
    // 这里简化处理：只允许上传者删除（可根据需要加入 admin 角色检查）
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

module.exports = { list, upload, deletePhoto, updatePhotoOrder };
