/**
 * Convert image URL to backend proxy URL
 * This bypasses CORS restrictions when accessing images from the frontend
 * 
 * @param {string} url - The original image URL (Supabase or external)
 * @returns {string} - The proxy URL or original URL if not proxiable
 */
export function getProxyImageUrl(url) {
  // 防御性检查：确保输入是字符串
  if (!url) {
    console.warn("⚠️  Empty or null URL provided to getProxyImageUrl");
    return "";
  }

  // 如果是对象（应该不会发生，但进行防御），尝试获取url属性
  if (typeof url === 'object') {
    console.warn("⚠️  Object passed to getProxyImageUrl instead of string:", url);
    // 尝试获取url属性（可能是photo对象）
    if (url.url && typeof url.url === 'string') {
      console.info("ℹ️  Extracted url property from object:", url.url.substring(0, 50));
      url = url.url;
    } else if (url.full_url && typeof url.full_url === 'string') {
      console.info("ℹ️  Extracted full_url property from object:", url.full_url.substring(0, 50));
      url = url.full_url;
    } else if (url.cover_url && typeof url.cover_url === 'string') {
      console.info("ℹ️  Extracted cover_url property from object:", url.cover_url.substring(0, 50));
      url = url.cover_url;
    } else {
      console.error("❌ Cannot extract URL from object:", url);
      return "";
    }
  }

  if (typeof url !== 'string') {
    console.error("⚠️  Invalid URL type provided to getProxyImageUrl:", typeof url, url);
    return "";
  }

  // If URL is already a proxy URL, return as-is
  if (url.includes('/api/storage/image')) {
    return url;
  }

  // Check if URL is from Supabase Storage (needs proxy)
  const isSupabaseUrl = url.includes('supabase.co');

  if (isSupabaseUrl) {
    // Encode the original URL and pass to proxy endpoint
    const encodedUrl = encodeURIComponent(url);
    
    // Use relative path to work with any deployment URL
    const proxyUrl = `/api/storage/image?url=${encodedUrl}`;
    
    console.log("🔗 Converting to proxy URL:", {
      original: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
      proxy: proxyUrl
    });
    return proxyUrl;
  }

  // Return original URL for other sources (if they have proper CORS)
  console.log("✅ Using direct URL (non-Supabase):", url.substring(0, 50) + (url.length > 50 ? '...' : ''));
  return url;
}
