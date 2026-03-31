/**
 * Convert image URL to backend proxy URL
 * This bypasses CORS restrictions when accessing images from the frontend
 * 
 * @param {string} url - The original image URL (Supabase or external)
 * @returns {string} - The proxy URL or original URL if not proxiable
 */
export function getProxyImageUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn("⚠️  Invalid URL provided to getProxyImageUrl:", url);
    return "";
  }

  // Check if URL is from Supabase Storage (needs proxy)
  const isSupabaseUrl = url.includes('supabase.co');

  if (isSupabaseUrl) {
    // Encode the original URL and pass to proxy endpoint
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `/api/storage/image?url=${encodedUrl}`;
    console.log("🔗 Converting to proxy URL:", {
      original: url,
      proxy: proxyUrl
    });
    return proxyUrl;
  }

  // Return original URL for other sources (if they have proper CORS)
  console.log("✅ Using direct URL (non-Supabase):", url);
  return url;
}
