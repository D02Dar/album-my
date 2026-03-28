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
      .select("*")
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

    const { data: row, error: insertError } = await admin
      .from("photos")
      .insert({
        url: publicUrl,
        title: title || null,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(502).json({ error: insertError.message });
    }

    return res.status(201).json({ photo: row });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upload };
