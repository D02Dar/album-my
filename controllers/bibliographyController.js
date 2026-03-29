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
      .select("*")
      .order("publish_year", { ascending: false });

    if (error) {
      return res.status(502).json({ error: error.message });
    }
    return res.json({ bibliography: data || [] });
  } catch (err) {
    next(err);
  }
}

async function add(req, res, next) {
  try {
    const { title, publish_year, publisher } = req.body;

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

    const { data, error } = await admin
      .from("bibliography")
      .insert([
        {
          title: title.trim(),
          publish_year: publish_year?.trim() || null,
          publisher: publisher?.trim() || null,
          cover_url: cover_url,
        },
      ])
      .select();

    if (error) {
      return res.status(502).json({ error: error.message });
    }

    return res.status(201).json({ bibliography: data[0] });
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

module.exports = { list, add, remove };
