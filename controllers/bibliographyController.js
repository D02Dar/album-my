const path = require("path");
const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

const BUCKET = "bibliography_covers";

function safeBasename(originalname) {
  const base = path.basename(originalname || "cover").replace(/[^\w.\-]+/g, "_");
  return base.slice(0, 180) || "cover";
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
      const objectPath = `${Date.now()}-${safeBasename(req.file.originalname)}`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(objectPath, req.file.buffer, {
          contentType: req.file.mimetype || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        return res.status(502).json({ error: uploadError.message });
      }

      // Generate public URL using the Supabase URL pattern
      const supabaseUrl = process.env.SUPABASE_URL;
      cover_url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectPath}`;

      console.log("Generated Cover URL:", cover_url); // Debug log
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

module.exports = { list, add, remove, updateOrder };
