/**
 * Advanced image loading with exponential backoff retry and timeout
 * Handles network failures gracefully for deployment environments
 */

const DEFAULT_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1秒
const TIMEOUT = 20000; // 20秒

/**
 * Load image with automatic retry on failure
 * Uses exponential backoff: 1s, 1.5s, 2.25s, 3.38s, 5.06s
 * 
 * @param {string} src - Image URL to load
 * @param {object} options - Configuration options
 * @returns {Promise<HTMLImageElement>} - Resolves when image loads successfully
 */
export function loadImageWithRetry(src, options = {}) {
  const {
    maxRetries = DEFAULT_RETRIES,
    initialDelay = INITIAL_DELAY,
    timeout = TIMEOUT,
    backoffMultiplier = 1.5,
    onRetry = null,
  } = options;

  return new Promise((resolve, reject) => {
    let retryCount = 0;
    
    const attemptLoad = () => {
      const img = new Image();
      let timeoutId;
      let completed = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
        img.src = '';
        completed = true;
      };

      img.onload = () => {
        cleanup();
        console.log("✅ Image loaded successfully:", src.substring(0, 100));
        resolve(img);
      };

      img.onerror = () => {
        if (completed) return;
        cleanup();
        
        if (retryCount < maxRetries) {
          const nextDelay = initialDelay * Math.pow(backoffMultiplier, retryCount);
          retryCount++;
          
          console.warn(
            `🔄 Image load failed, retrying ` +
            `(${retryCount}/${maxRetries}) in ${Math.round(nextDelay)}ms:`,
            src.substring(0, 100)
          );
          
          if (onRetry) {
            onRetry(retryCount, maxRetries, nextDelay);
          }
          
          setTimeout(attemptLoad, nextDelay);
        } else {
          console.error(
            `❌ Failed to load image after ${maxRetries} retries:`,
            src.substring(0, 100)
          );
          reject(new Error(`Image load failed after ${maxRetries} retries`));
        }
      };

      // Set timeout for this attempt
      timeoutId = setTimeout(() => {
        if (!completed) {
          cleanup();
          
          if (retryCount < maxRetries) {
            const nextDelay = initialDelay * Math.pow(backoffMultiplier, retryCount);
            retryCount++;
            
            console.warn(
              `⏱️  Image load timeout, retrying ` +
              `(${retryCount}/${maxRetries}) in ${Math.round(nextDelay)}ms:`,
              src.substring(0, 100)
            );
            
            if (onRetry) {
              onRetry(retryCount, maxRetries, nextDelay);
            }
            
            setTimeout(attemptLoad, nextDelay);
          } else {
            console.error(
              `❌ Image load timeout after ${maxRetries} retries:`,
              src.substring(0, 100)
            );
            reject(new Error(`Image load timeout after ${maxRetries} retries`));
          }
        }
      }, timeout);

      // Start loading
      img.src = src;
    };

    attemptLoad();
  });
}

/**
 * Preload multiple images with concurrent retries
 * Useful for gallery performance optimization
 * 
 * @param {string[]} urls - Array of image URLs to preload
 * @param {object} options - Loading options
 * @returns {Promise<Map>} - Map of url -> load status (success/failed)
 */
export function preloadImages(urls, options = {}) {
  const results = new Map();
  
  const promises = urls.map(url => 
    loadImageWithRetry(url, options)
      .then(() => {
        results.set(url, { success: true });
      })
      .catch(err => {
        results.set(url, { success: false, error: err.message });
      })
  );

  return Promise.allSettled(promises).then(() => results);
}

/**
 * Cache image loading results to avoid redundant requests
 */
const loadCache = new Map();

export function getCachedImageLoader(options = {}) {
  return function loadImageCached(src) {
    if (loadCache.has(src)) {
      const cached = loadCache.get(src);
      return cached.promise;
    }

    const promise = loadImageWithRetry(src, options)
      .catch(err => {
        // Remove from cache on failure so it can be retried later
        loadCache.delete(src);
        throw err;
      });

    loadCache.set(src, { promise });
    return promise;
  };
}
