/**
 * AI Response Cache
 * 
 * Simple in-memory cache for AI requests to reduce duplicate calls
 * and improve performance. Cache expires after 5 minutes.
 */

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map()

/**
 * Generate cache key from request parameters
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {string} - Cache key
 */
function generateCacheKey(endpoint, data) {
  const dataStr = JSON.stringify(data || {})
  return `${endpoint}:${dataStr}`
}

/**
 * Get cached response if available and not expired
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {object|null} - Cached response or null
 */
export function getCachedResponse(endpoint, data) {
  const key = generateCacheKey(endpoint, data)
  const cached = cache.get(key)

  if (!cached) return null

  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return cached.response
}

/**
 * Store response in cache
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @param {object} response - Response to cache
 */
export function setCachedResponse(endpoint, data, response) {
  const key = generateCacheKey(endpoint, data)
  cache.set(key, {
    response,
    timestamp: Date.now(),
  })

  // Clean up old entries if cache gets too large
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
}

/**
 * Clear entire cache
 */
export function clearCache() {
  cache.clear()
}

/**
 * Clear cache for specific endpoint
 * @param {string} endpoint - API endpoint to clear
 */
export function clearCacheForEndpoint(endpoint) {
  const keysToDelete = []
  for (const key of cache.keys()) {
    if (key.startsWith(endpoint)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
}

/**
 * Get cache stats for debugging
 * @returns {object} - Cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: 100,
    ttl: CACHE_TTL,
  }
}

export default {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  clearCacheForEndpoint,
  getCacheStats,
}
