const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

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
    const { title, publish_year, publisher, cover_url } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("bibliography")
      .insert([
        {
          title: title.trim(),
          publish_year: publish_year?.trim() || null,
          publisher: publisher?.trim() || null,
          cover_url: cover_url?.trim() || null,
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
    const { error } = await admin
      .from("bibliography")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(502).json({ error: error.message });
    }

    return res.json({ message: "Bibliography record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, add, remove };
