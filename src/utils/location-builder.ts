/**
 * Location Page Builder Utilities
 * Handles build-time generation of location pages
 */

// Use static suburbs data if database is not configured or is localhost
import * as staticSuburbs from './static-suburbs';
import * as dynamicSuburbs from './locations';
import { siteConfig } from '../config/site';
import type { Suburb } from './locations';

// Check if we should use static data
const useStaticData = !import.meta.env.POSTGIS_HOST || 
                      import.meta.env.POSTGIS_HOST === 'localhost' ||
                      import.meta.env.USE_STATIC_SUBURBS === 'true';

// Select the appropriate module
const suburbsModule = useStaticData ? staticSuburbs : dynamicSuburbs;
const { getSuburbsWithinRadius, getNearbySuburbs, geocodeAddress } = suburbsModule;

console.log(`Using ${useStaticData ? 'static JSON' : 'PostGIS database'} for suburb data`);

export interface LocationPageData {
  suburb: Suburb;
  nearbySuburbs: Suburb[];
  slug: string;
  url: string;
}

/**
 * Get the center location for service area
 * Uses env variables if set, otherwise uses center from JSON data or geocodes address
 */
export async function getCenterLocation(): Promise<{ lat: number; lng: number }> {
  // Check for explicit center coordinates in env
  const envLat = import.meta.env.SERVICE_CENTER_LAT;
  const envLng = import.meta.env.SERVICE_CENTER_LNG;
  
  if (envLat && envLng) {
    return {
      lat: parseFloat(envLat),
      lng: parseFloat(envLng)
    };
  }
  
  // If using static data, use the center from the JSON file
  if (useStaticData) {
    try {
      const suburbsData = await import('../data/suburbs.json');
      if (suburbsData.default?.center) {
        return suburbsData.default.center;
      }
    } catch (error) {
      console.warn('Could not load center from suburbs.json:', error);
    }
  }
  
  // Otherwise, geocode the business address
  const address = siteConfig.fullAddress;
  const geocoded = await geocodeAddress(address);
  
  if (geocoded) {
    return geocoded;
  }
  
  // Default to Adelaide CBD if all else fails
  console.warn('Could not determine center location, using Adelaide CBD defaults');
  return { lat: -34.9285, lng: 138.6007 };
}

/**
 * Generate a URL-friendly slug from suburb data
 */
export function generateLocationSlug(suburb: Suburb): string {
  const namePart = suburb.name.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim();
  
  const statePart = suburb.state.toLowerCase();
  const postcodePart = suburb.postcode || '';
  
  // Create slug: suburb-name-state-postcode
  if (postcodePart) {
    return `${namePart}-${statePart}-${postcodePart}`;
  }
  return `${namePart}-${statePart}`;
}

/**
 * Generate the full URL path for a location
 * Returns homepage URL if suburb matches the main location
 */
export function generateLocationUrl(suburb: Suburb): string {
  // Check if this is the main location (e.g., Adelaide)
  const mainLocation = import.meta.env.PUBLIC_MAIN_LOCATION || '';
  if (mainLocation && suburb.name.toLowerCase() === mainLocation.toLowerCase()) {
    return '/';
  }
  
  const slug = generateLocationSlug(suburb);
  return `/locations/${slug}/`;
}

/**
 * Build all location page data at build time
 */
export async function buildLocationPages(): Promise<LocationPageData[]> {
  try {
    // Get center location
    const center = await getCenterLocation();
    
    // Get service radius from env
    const radiusKm = parseInt(import.meta.env.SERVICE_RADIUS_KM || '50');
    
    // Get max locations limit from env (default to 100 to prevent memory issues)
    const maxLocations = parseInt(import.meta.env.MAX_LOCATION_PAGES || '100');
    
    console.log(`Building location pages for suburbs within ${radiusKm}km of ${center.lat}, ${center.lng}`);
    
    // Query all suburbs within radius
    let suburbs = await getSuburbsWithinRadius(center.lat, center.lng, radiusKm);
    
    if (suburbs.length === 0) {
      console.warn('No suburbs found within service radius');
      return [];
    }
    
    // Limit suburbs to prevent memory issues
    if (suburbs.length > maxLocations) {
      console.log(`Limiting to ${maxLocations} closest suburbs (found ${suburbs.length} total)`);
      // Sort by distance and take only the closest ones
      suburbs = suburbs.slice(0, maxLocations);
    }
    
    // Filter out the main location if it exists (we'll redirect it to homepage)
    const mainLocation = import.meta.env.PUBLIC_MAIN_LOCATION || '';
    if (mainLocation) {
      const filteredSuburbs = suburbs.filter(
        suburb => suburb.name.toLowerCase() !== mainLocation.toLowerCase()
      );
      if (filteredSuburbs.length < suburbs.length) {
        console.log(`Skipping main location page for ${mainLocation} (will redirect to homepage)`);
        suburbs = filteredSuburbs;
      }
    }
    
    console.log(`Processing ${suburbs.length} suburbs for location pages`);
    
    // Process suburbs in batches to avoid overwhelming the database
    const batchSize = 5; // Reduced batch size for memory efficiency
    const locationPages: LocationPageData[] = [];
    
    for (let i = 0; i < suburbs.length; i += batchSize) {
      const batch = suburbs.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (suburb) => {
          try {
            // Get nearby suburbs for each location
            const nearbySuburbs = await getNearbySuburbs(
              suburb.latitude,
              suburb.longitude,
              9, // Get 9 nearby suburbs for the service area grid
              suburb.id
            );
            
            return {
              suburb,
              nearbySuburbs,
              slug: generateLocationSlug(suburb),
              url: generateLocationUrl(suburb)
            };
          } catch (error) {
            console.error(`Error processing suburb ${suburb.name}:`, error);
            // Return basic data even if nearby suburbs fail
            return {
              suburb,
              nearbySuburbs: [],
              slug: generateLocationSlug(suburb),
              url: generateLocationUrl(suburb)
            };
          }
        })
      );
      
      locationPages.push(...batchResults);
      
      // Log progress
      console.log(`Processed ${Math.min(i + batchSize, suburbs.length)} of ${suburbs.length} suburbs`);
    }
    
    return locationPages;
  } catch (error) {
    console.error('Error building location pages:', error);
    return [];
  }
}

/**
 * Get location pages grouped by distance range
 */
export function groupLocationsByDistance(locations: LocationPageData[]): Record<string, LocationPageData[]> {
  const groups: Record<string, LocationPageData[]> = {
    '0-10km': [],
    '10-20km': [],
    '20-30km': [],
    '30-40km': [],
    '40-50km': [],
    '50km+': []
  };
  
  locations.forEach(location => {
    const distance = location.suburb.distanceKm;
    if (distance <= 10) {
      groups['0-10km'].push(location);
    } else if (distance <= 20) {
      groups['10-20km'].push(location);
    } else if (distance <= 30) {
      groups['20-30km'].push(location);
    } else if (distance <= 40) {
      groups['30-40km'].push(location);
    } else if (distance <= 50) {
      groups['40-50km'].push(location);
    } else {
      groups['50km+'].push(location);
    }
  });
  
  // Sort each group alphabetically
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.suburb.name.localeCompare(b.suburb.name));
  });
  
  return groups;
}

/**
 * Get location pages grouped alphabetically
 */
export function groupLocationsAlphabetically(locations: LocationPageData[]): Record<string, LocationPageData[]> {
  const groups: Record<string, LocationPageData[]> = {};
  
  locations.forEach(location => {
    const firstLetter = location.suburb.name[0].toUpperCase();
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(location);
  });
  
  // Sort each group by name
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.suburb.name.localeCompare(b.suburb.name));
  });
  
  return groups;
}

/**
 * Get featured locations (closest suburbs)
 */
export function getFeaturedLocations(locations: LocationPageData[], count: number = 10): LocationPageData[] {
  return locations
    .sort((a, b) => a.suburb.distanceKm - b.suburb.distanceKm)
    .slice(0, count);
}