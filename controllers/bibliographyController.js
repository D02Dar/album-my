const path = require("path");
const sharp = require("sharp");
const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

const BUCKET = "bibliography_covers";

function safeBasename(originalname) {
  const base = path.basename(originalname || "cover").replace(/[^\w.\-]+/g, "_");
  return base.slice(0, 180) || "cover";
}

/**
 * Compress and convert a cover image buffer to WebP using sharp.
 *
 * Bibliography covers are typically scanned book jackets — detailed, high-
 * contrast artwork that benefits from the same grain-preserving settings used
 * for gallery photos.
 *
 *  - Width cap: 1200 px (covers are displayed at ≤ 300 px wide in the grid,
 *    2× for HiDPI screens, plus a bit of headroom for the detail modal)
 *  - Quality 85: retains texture and typography legibility
 *  - effort 6: better compression ratio without quality loss
 */
async function compressCover(inputBuffer) {
  return sharp(inputBuffer)
    .resize({
      width: 1200,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();
}

async function list(req, res, next) {
  try {
    const { data, error } = await supabaseAnon
      .from("bibliography")
      .select(
        `
        id,
        title,
        publish_year,
        publisher,
        cover_url,
        created_at,
        display_order,
        category_id,
        biblio_categories(id, name)
      `
      )
      .order("display_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(502).json({ error: error.message });
    }

    // Flatten the response for easier frontend consumption
    const flatData = (data || []).map((item) => ({
      ...item,
      category: item.biblio_categories,
    }));

    return res.json({ bibliography: flatData });
  } catch (err) {
    next(err);
  }
}

async function add(req, res, next) {
  try {
    const { title, publish_year, publisher, category_id } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const admin = getSupabaseAdmin();
    let cover_url = null;

    // Upload cover image if provided
    if (req.file?.buffer) {
      // ── Image compression ────────────────────────────────────────────────
      let optimizedBuffer;
      try {
        optimizedBuffer = await compressCover(req.file.buffer);
      } catch (sharpErr) {
        console.error("sharp compression failed, falling back to original buffer:", sharpErr);
        optimizedBuffer = req.file.buffer;
      }
      // ────────────────────────────────────────────────────────────────────

      const originalBase = safeBasename(req.file.originalname).replace(/\.[^.]+$/, "");
      const objectPath = `${Date.now()}-${originalBase}.webp`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(objectPath, optimizedBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        return res.status(502).json({ error: uploadError.message });
      }

      const supabaseUrl = process.env.SUPABASE_URL;
      cover_url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}`;

      console.log("Generated Cover URL:", cover_url);
    }

    // 获取现有书籍的最大 display_order，新书籍排在最前面
    const { data: maxOrderData } = await admin
      .from("bibliography")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const maxDisplayOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order : 0;
    const newDisplayOrder = maxDisplayOrder + 1;

    const { data, error } = await admin
      .from("bibliography")
      .insert([
        {
          title: title.trim(),
          publish_year: publish_year?.trim() || null,
          publisher: publisher?.trim() || null,
          cover_url: cover_url,
          category_id: category_id || null,
          display_order: newDisplayOrder,
        },
      ])
      .select();

    if (error) {
      return res.status(502).json({ error: error.message });
    }

    // Fetch with category info
    const itemWithCategory = data[0];
    if (category_id) {
      const { data: catData } = await supabaseAnon
        .from("biblio_categories")
        .select("id, name")
        .eq("id", category_id)
        .single();

      if (catData) {
        itemWithCategory.category = catData;
      }
    }

    return res.status(201).json({ bibliography: itemWithCategory });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || id.trim() === "") {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const admin = getSupabaseAdmin();

    // First, get the record to find the cover_url
    const { data: record, error: fetchError } = await admin
      .from("bibliography")
      .select("cover_url")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: "Bibliography record not found" });
    }

    // Delete the file from storage if it exists
    if (record.cover_url) {
      try {
        // Extract the file path from the URL
        const urlParts = record.cover_url.split("/object/public/");
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1].split("/").slice(1).join("/"));
          await admin.storage.from(BUCKET).remove([filePath]);
        }
      } catch (storageErr) {
        console.error("Error deleting file from storage:", storageErr);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await admin
      .from("bibliography")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(502).json({ error: deleteError.message });
    }

    return res.json({ message: "Bibliography record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { orders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: "Invalid orders array" });
    }

    const admin = getSupabaseAdmin();

    // 批量更新 display_order
    for (const { id, display_order } of orders) {
      const { error } = await admin
        .from("bibliography")
        .update({ display_order })
        .eq("id", id);

      if (error) {
        return res.status(502).json({ error: error.message });
      }
    }

    return res.json({ success: true, message: "Bibliography order updated successfully" });
  } catch (err) {
    next(err);
  }
}
// Add this function before module.exports:
async function transformImage(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'rotate-left' | 'rotate-right' | 'flip'

    if (!['rotate-left', 'rotate-right', 'flip'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const admin = getSupabaseAdmin();
    const { data: record, error: fetchError } = await admin
      .from('bibliography')
      .select('cover_url')
      .eq('id', id)
      .single();

    if (fetchError || !record?.cover_url) {
      return res.status(404).json({ error: 'Record or cover image not found' });
    }

    const response = await fetch(record.cover_url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const buffer = Buffer.from(await response.arrayBuffer());

    let sharpInstance = sharp(buffer);
    if (action === 'rotate-right') sharpInstance = sharpInstance.rotate(90);
    else if (action === 'rotate-left') sharpInstance = sharpInstance.rotate(-90);
    else if (action === 'flip') sharpInstance = sharpInstance.flop();

    const newBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer();
    const newObjectPath = `${Date.now()}_transformed.webp`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(newObjectPath, newBuffer, { contentType: 'image/webp', upsert: false });
    if (uploadError) return res.status(502).json({ error: uploadError.message });

    const newCoverUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${newObjectPath}`;

    const { error: updateError } = await admin
      .from('bibliography')
      .update({ cover_url: newCoverUrl })
      .eq('id', id);
    if (updateError) return res.status(502).json({ error: updateError.message });

    try {
      const oldParts = record.cover_url.split(`/object/public/${BUCKET}/`);
      if (oldParts.length > 1) {
        await admin.storage.from(BUCKET).remove([decodeURIComponent(oldParts[1])]);
      }
    } catch (e) { console.warn('Old file delete failed:', e.message); }

    return res.json({ cover_url: newCoverUrl });
  } catch (err) { next(err); }
}

module.exports = { list, add, remove, updateOrder, transformImage };
