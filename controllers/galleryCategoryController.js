const { supabaseAnon } = require("../config/supabase");

// List all gallery categories
async function listCategories() {
  const { data, error } = await supabaseAnon
    .from("gallery_categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Create a new gallery category
async function createCategory(name) {
  if (!name || !name.trim()) {
    throw new Error("分类名称不能为空");
  }

  const { data, error } = await supabaseAnon
    .from("gallery_categories")
    .insert([{ name: name.trim() }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("该分类已存在");
    }
    throw error;
  }

  return data;
}

module.exports = { listCategories, createCategory };
