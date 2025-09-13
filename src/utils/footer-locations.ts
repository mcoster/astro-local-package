/**
 * Footer Location Links Module
 * Manages selection of suburbs to display in the site footer for SEO discovery
 */

// Use static suburbs data if database is not configured or USE_STATIC_SUBURBS is set
import * as staticSuburbs from './static-suburbs';
import * as dynamicSuburbs from './locations';
import { getCenterLocation, generateLocationSlug, generateLocationUrl } from './location-builder';
import { siteConfig } from '../config/site';
import type { SuburbWithPopulation, Suburb } from './locations';
import type { LocationPageData } from './location-builder';

// Check if we should use static data (same logic as location-builder.ts)
const useStaticData = !import.meta.env.POSTGIS_HOST || 
                      import.meta.env.POSTGIS_HOST === 'localhost' ||
                      import.meta.env.USE_STATIC_SUBURBS === 'true';

// Select the appropriate module
const suburbsModule = useStaticData ? staticSuburbs : dynamicSuburbs;
const { getSuburbsWithPopulation, getSuburbsByName } = suburbsModule;

console.log(`[Footer] Using ${useStaticData ? 'static JSON' : 'PostGIS database'} for suburb data`);

export interface FooterLocationData {
  suburb: SuburbWithPopulation;
  slug: string;
  url: string;
}

/**
 * Calculate distance from center for suburbs retrieved by name
 */
function calculateDistanceAndDirection(
  suburb: SuburbWithPopulation,
  centerLat: number,
  centerLng: number
): SuburbWithPopulation {
  const R = 6371; // Earth's radius in km
  const dLat = (suburb.latitude - centerLat) * Math.PI / 180;
  const dLng = (suburb.longitude - centerLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(centerLat * Math.PI / 180) * Math.cos(suburb.latitude * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Calculate direction
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const direction = directions[Math.round(normalized / 45) % 8];
  
  return {
    ...suburb,
    distanceKm: Math.round(distance * 10) / 10,
    direction
  };
}

/**
 * Score suburbs for selection priority
 */
function scoreSuburb(suburb: SuburbWithPopulation): number {
  let score = 0;
  
  // Population score (higher population = higher score)
  if (suburb.population) {
    score += Math.min(suburb.population / 100, 100); // Cap at 100 points
  }
  
  // Distance score (closer = higher, but not too close to avoid clustering)
  if (suburb.distanceKm >= 5 && suburb.distanceKm <= 15) {
    score += 50; // Optimal distance range
  } else if (suburb.distanceKm < 5) {
    score += 30; // Very close
  } else if (suburb.distanceKm <= 25) {
    score += 40; // Medium distance
  } else if (suburb.distanceKm <= 35) {
    score += 30; // Far but still good
  } else {
    score += 20; // Outer areas
  }
  
  // Population density bonus (urban areas)
  if (suburb.populationDensity && suburb.populationDensity > 1000) {
    score += 20;
  }
  
  // Major suburb bonus - only if configured
  // Projects can define major suburbs in their config for scoring boost
  // This allows each city to define its own important suburbs
  // Note: This is handled by manual selection in footerFeaturedSuburbs config
  
  return score;
}

/**
 * Smart selection algorithm for footer locations
 */
function smartSelectLocations(
  suburbs: SuburbWithPopulation[],
  count: number = 11
): SuburbWithPopulation[] {
  // Score all suburbs
  const scoredSuburbs = suburbs.map(suburb => ({
    suburb,
    score: scoreSuburb(suburb)
  }));
  
  // Sort by score
  scoredSuburbs.sort((a, b) => b.score - a.score);
  
  const selected: SuburbWithPopulation[] = [];
  const usedDirections = new Set<string>();
  const distanceTiers = {
    close: 0,  // 0-15km
    medium: 0, // 15-30km
    far: 0     // 30-50km
  };
  
  // Target distribution
  const maxPerTier = Math.ceil(count / 3);
  
  for (const { suburb } of scoredSuburbs) {
    if (selected.length >= count) break;
    
    // Determine tier
    let tier: 'close' | 'medium' | 'far';
    if (suburb.distanceKm <= 15) {
      tier = 'close';
    } else if (suburb.distanceKm <= 30) {
      tier = 'medium';
    } else {
      tier = 'far';
    }
    
    // Check if we have room in this tier
    if (distanceTiers[tier] >= maxPerTier) continue;
    
    // Check for geographic diversity (avoid clustering in same direction)
    if (usedDirections.has(suburb.direction) && selected.length > 4) {
      // Allow some duplication but not too much
      const directionCount = selected.filter(s => s.direction === suburb.direction).length;
      if (directionCount >= 2) continue;
    }
    
    selected.push(suburb);
    distanceTiers[tier]++;
    usedDirections.add(suburb.direction);
  }
  
  // If we don't have enough, fill with highest scored remaining
  if (selected.length < count) {
    for (const { suburb } of scoredSuburbs) {
      if (selected.length >= count) break;
      if (!selected.includes(suburb)) {
        selected.push(suburb);
      }
    }
  }
  
  return selected.slice(0, count);
}

/**
 * Get footer locations based on configuration
 */
export async function getFooterLocations(): Promise<FooterLocationData[]> {
  try {
    const center = await getCenterLocation();
    const radiusKm = siteConfig.locationPages.serviceRadiusKm;
    
    // Check for manual selection
    const manualSuburbs = siteConfig.locationPages.footerFeaturedSuburbs;
    
    if (manualSuburbs && manualSuburbs.length > 0) {
      console.log(`Using manual footer suburbs: ${manualSuburbs.join(', ')}`);
      
      // Query suburbs by name
      const suburbs = await getSuburbsByName(manualSuburbs as string[]);
      
      // Add distance and direction for manual suburbs
      const suburbsWithDistance = suburbs.map(suburb => 
        calculateDistanceAndDirection(suburb, center.lat, center.lng)
      );
      
      // Filter to only those within service radius
      const validSuburbs = suburbsWithDistance.filter(s => s.distanceKm <= radiusKm);
      
      if (validSuburbs.length < manualSuburbs.length) {
        console.warn(`Some manual suburbs not found or outside service radius. Found ${validSuburbs.length} of ${manualSuburbs.length}`);
      }
      
      // If we have fewer than 11, supplement with smart selection
      let finalSuburbs = validSuburbs;
      if (validSuburbs.length < 11) {
        const allSuburbs = await getSuburbsWithPopulation(center.lat, center.lng, radiusKm);
        const additionalSuburbs = smartSelectLocations(
          allSuburbs.filter(s => !validSuburbs.some(v => v.id === s.id)),
          11 - validSuburbs.length
        );
        finalSuburbs = [...validSuburbs, ...additionalSuburbs];
      }
      
      return finalSuburbs.slice(0, 11).map(suburb => ({
        suburb,
        slug: generateLocationSlug(suburb),
        url: generateLocationUrl(suburb)
      }));
    }
    
    // Use smart selection
    console.log('Using smart selection for footer suburbs');
    const allSuburbs = await getSuburbsWithPopulation(center.lat, center.lng, radiusKm);
    console.log(`getSuburbsWithPopulation returned ${allSuburbs.length} suburbs`);
    
    if (allSuburbs.length === 0) {
      console.warn('No suburbs found for footer selection. Please ensure suburbs.json is properly configured.');
      // Return empty array - the project should have its own suburbs.json data
      return [];
    }
    
    const selectedSuburbs = smartSelectLocations(allSuburbs, 11);
    
    return selectedSuburbs.map(suburb => ({
      suburb,
      slug: generateLocationSlug(suburb),
      url: generateLocationUrl(suburb)
    }));
  } catch (error) {
    console.error('Error getting footer locations:', error);
    return [];
  }
}

/**
 * Cache footer locations for consistent builds
 */
let cachedFooterLocations: FooterLocationData[] | null = null;

export async function getCachedFooterLocations(): Promise<FooterLocationData[]> {
  if (!cachedFooterLocations) {
    cachedFooterLocations = await getFooterLocations();
  }
  return cachedFooterLocations;
}