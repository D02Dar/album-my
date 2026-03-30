const { supabaseAnon, getSupabaseAdmin } = require("../config/supabase");

async function listCategories(req, res, next) {
  try {
    const { data, error } = await supabaseAnon
      .from("biblio_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return res.status(502).json({ error: error.message });
    }

    return res.json({ categories: data || [] });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from("biblio_categories")
      .insert([{ name: name.trim() }])
      .select();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Category already exists" });
      }
      return res.status(502).json({ error: error.message });
    }

    return res.status(201).json({ category: data[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory };
