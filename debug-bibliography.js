#!/usr/bin/env node

/**
 * Debug script to check bibliography records in Supabase
 * Usage: node debug-bibliography.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function debugBibliography() {
  console.log("🔍 Fetching bibliography records...\n");

  try {
    const { data, error } = await client
      .from("bibliography")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("❌ Error fetching data:", error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log("⚠️  No bibliography records found");
      process.exit(0);
    }

    console.log(`✅ Found ${data.length} record(s):\n`);

    data.forEach((record, index) => {
      console.log(`📚 Record ${index + 1}:`);
      console.log(`   Title: ${record.title}`);
      console.log(`   Year: ${record.publish_year || "N/A"}`);
      console.log(`   Publisher: ${record.publisher || "N/A"}`);
      console.log(`   Cover URL: ${record.cover_url || "❌ NO URL"}`);
      if (record.cover_url) {
        console.log(`   URL Valid: ${record.cover_url.startsWith("http") ? "✅" : "❌"}`);
      }
      console.log(`   Created: ${new Date(record.created_at).toLocaleString()}`);
      console.log();
    });

    // Check if we can access the storage bucket
    if (data[0]?.cover_url) {
      console.log("🔗 Testing image URL accessibility...");
      try {
        const response = await fetch(data[0].cover_url, { method: "HEAD" });
        console.log(`   Status: ${response.status} ${response.statusText}`);
        if (response.ok) {
          console.log("   ✅ Image is accessible!");
        } else {
          console.log("   ❌ Image not accessible (check Storage permissions)");
        }
      } catch (err) {
        console.log(`   ❌ Fetch error: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

debugBibliography();
