/**
 * Google Places API Utility
 * Handles automatic discovery of Google Business Profile Place IDs
 * with caching and expiry management
 */

import { siteConfig } from '@/config/site';

const CACHE_DURATION_DAYS = 30;
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

interface PlaceIdCache {
  placeId: string | null;
  timestamp: number;
}

/**
 * Parse the cache string into a structured object
 */
function parseCache(cacheString: string | undefined): PlaceIdCache | null {
  if (!cacheString) return null;
  
  const [placeId, timestampStr] = cacheString.split('|');
  const timestamp = parseInt(timestampStr);
  
  if (isNaN(timestamp)) return null;
  
  return {
    placeId: placeId === 'null' ? null : placeId,
    timestamp
  };
}

/**
 * Check if the cache is still valid (within expiry period)
 */
function isCacheValid(cache: PlaceIdCache): boolean {
  const now = Date.now();
  const age = now - cache.timestamp;
  return age < CACHE_DURATION_MS;
}

/**
 * Format cache expiry for logging
 */
function getCacheExpiryInfo(cache: PlaceIdCache): string {
  const now = Date.now();
  const age = now - cache.timestamp;
  const daysRemaining = Math.floor((CACHE_DURATION_MS - age) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining > 0) {
    return `expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
  } else {
    return 'expired';
  }
}

/**
 * Discover a business's Google Place ID using the Places API
 * Note: This should be called at build time, not runtime
 */
export async function discoverBusinessPlaceId(
  businessName: string,
  address: string,
  apiKey: string
): Promise<string | null> {
  // Check cache first
  const cachedData = parseCache(siteConfig.googleMaps.discoveredCache);
  
  if (cachedData && isCacheValid(cachedData)) {
    console.log(`[Google Maps] Using cached Place ID (${getCacheExpiryInfo(cachedData)})`);
    return cachedData.placeId;
  }
  
  if (cachedData) {
    console.log('[Google Maps] Cache expired, discovering Place ID...');
  } else {
    console.log('[Google Maps] No cache found, discovering Place ID...');
  }
  
  // Use "place at" trick for better results
  // This helps Google find business places rather than just addresses
  const query = `${businessName} at ${address}`;
  const encodedQuery = encodeURIComponent(query);
  
  // Note: In a real implementation, this would need to be done server-side
  // or during build time since the Places API doesn't support CORS
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;
  
  try {
    // This would need to be implemented server-side or during build
    console.log(`[Google Maps] Would search for: "${query}"`);
    console.log('[Google Maps] Note: Places API discovery needs server-side implementation');
    
    // For now, return null to use address fallback
    // In production, this would make the actual API call
    return null;
  } catch (error) {
    console.warn('[Google Maps] Could not discover business Place ID:', error);
    return null;
  }
}

/**
 * Get the appropriate map embed configuration
 * Returns either iframe HTML, Place ID, or address for embedding
 */
export async function getMapEmbedConfig() {
  // Level 1: Full iframe provided
  if (siteConfig.googleMaps.embed) {
    console.log('[Google Maps] Using provided iframe embed');
    return {
      type: 'iframe' as const,
      content: siteConfig.googleMaps.embed
    };
  }
  
  // Level 2: Place ID provided
  if (siteConfig.googleMaps.placeId) {
    console.log('[Google Maps] Using provided Place ID');
    return {
      type: 'place' as const,
      placeId: siteConfig.googleMaps.placeId,
      apiKey: siteConfig.googleMaps.apiKey
    };
  }
  
  // Level 3: Try to discover Google Business Profile
  if (siteConfig.googleMaps.apiKey) {
    const discoveredPlaceId = await discoverBusinessPlaceId(
      siteConfig.businessName,
      siteConfig.fullAddress,
      siteConfig.googleMaps.apiKey
    );
    
    if (discoveredPlaceId) {
      console.log('[Google Maps] Using discovered Place ID');
      return {
        type: 'place' as const,
        placeId: discoveredPlaceId,
        apiKey: siteConfig.googleMaps.apiKey
      };
    }
  }
  
  // Level 4: Simple address pin fallback
  console.log('[Google Maps] Using address-based embed (fallback)');
  return {
    type: 'address' as const,
    address: siteConfig.fullAddress,
    businessName: siteConfig.businessName,
    apiKey: siteConfig.googleMaps.apiKey
  };
}

/**
 * Cached version of getMapEmbedConfig
 * This ensures the configuration is only computed once during the build process
 */
let cachedMapConfig: Awaited<ReturnType<typeof getMapEmbedConfig>> | null = null;

export async function getCachedMapEmbedConfig() {
  if (cachedMapConfig === null) {
    cachedMapConfig = await getMapEmbedConfig();
  }
  return cachedMapConfig;
}

/**
 * Generate the iframe URL based on the embed configuration
 */
export function generateEmbedUrl(config: Awaited<ReturnType<typeof getMapEmbedConfig>>): string {
  if (config.type === 'iframe') {
    // Extract src from iframe HTML if needed
    const srcMatch = config.content.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : '';
  }
  
  const baseUrl = 'https://www.google.com/maps/embed/v1/place';
  const params = new URLSearchParams();
  
  if (config.type === 'place') {
    params.set('q', `place_id:${config.placeId}`);
  } else {
    // Address-based embed
    const query = `${config.businessName}, ${config.address}`;
    params.set('q', query);
  }
  
  // Add API key if available
  if ('apiKey' in config && config.apiKey) {
    params.set('key', config.apiKey);
  }
  
  return `${baseUrl}?${params.toString()}`;
}