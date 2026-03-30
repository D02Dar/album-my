/**
 * Convert Supabase Storage URL to backend image proxy URL
 * This bypasses CORS restrictions when accessing images from the frontend
 * 
 * @param {string} url - The original image URL (Supabase or external)
 * @returns {string} - The proxy URL or original URL if not proxiable
 */
export function getProxyImageUrl(url) {
  if (!url) return url;

  // Check if URL is from Supabase Storage (needs proxy)
  const isSupabaseUrl = url.includes('supabase.co');

  if (isSupabaseUrl) {
    // Encode the original URL and pass to proxy endpoint
    const encodedUrl = encodeURIComponent(url);
    return `/api/storage/image?url=${encodedUrl}`;
  }

  // Return original URL for other sources (if they have proper CORS)
  return url;
}
