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
 * Calculate distance between two points
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate distance from center for suburbs retrieved by name
 */
function calculateDistanceAndDirection(
  suburb: SuburbWithPopulation,
  centerLat: number,
  centerLng: number
): SuburbWithPopulation {
  const distance = calculateDistance(
    { latitude: centerLat, longitude: centerLng },
    { latitude: suburb.latitude, longitude: suburb.longitude }
  );

  // Calculate direction
  const dLng = (suburb.longitude - centerLng) * Math.PI / 180;
  const dLat = (suburb.latitude - centerLat) * Math.PI / 180;
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
 * Calculate population percentile for importance scoring
 */
function calculatePopulationPercentile(
  suburb: SuburbWithPopulation,
  allSuburbs: SuburbWithPopulation[]
): number {
  const populations = allSuburbs
    .map(s => s.population || 0)
    .filter(p => p > 0)
    .sort((a, b) => a - b);

  if (populations.length === 0 || !suburb.population) return 0;

  const index = populations.findIndex(p => p >= suburb.population);
  return index / populations.length;
}

/**
 * Detect if a suburb is a regional center based on relative population
 */
function isRegionalCenter(
  suburb: SuburbWithPopulation,
  allSuburbs: SuburbWithPopulation[]
): boolean {
  if (!suburb.population || suburb.population < 1000) return false;

  // Find suburbs within 10km
  const nearby = allSuburbs.filter(s => {
    if (s.id === suburb.id) return false;
    const distance = calculateDistance(
      { latitude: suburb.latitude, longitude: suburb.longitude },
      { latitude: s.latitude, longitude: s.longitude }
    );
    return distance < 10;
  });

  if (nearby.length === 0) return true; // Isolated suburb = likely important

  // Check if this suburb is significantly larger than neighbors
  const avgNearbyPop = nearby.reduce((sum, n) => sum + (n.population || 0), 0) / nearby.length;
  return suburb.population > avgNearbyPop * 1.5;
}

/**
 * Find statistically significant suburbs (population outliers)
 */
function findSignificantSuburbs(suburbs: SuburbWithPopulation[]): Set<number> {
  const populations = suburbs
    .map(s => s.population || 0)
    .filter(p => p > 0);

  if (populations.length === 0) return new Set();

  // Calculate mean and standard deviation
  const mean = populations.reduce((a, b) => a + b, 0) / populations.length;
  const variance = populations.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / populations.length;
  const stdDev = Math.sqrt(variance);

  // Suburbs with population > mean + 0.5 * stdDev are significant
  const threshold = mean + (stdDev * 0.5);

  return new Set(
    suburbs
      .filter(s => s.population && s.population > threshold)
      .map(s => s.id)
  );
}

/**
 * Detect commercial centers through geographic clustering
 */
function detectCommercialCenters(suburbs: SuburbWithPopulation[]): Set<number> {
  const centers = new Set<number>();

  // Only consider suburbs with reasonable population
  const candidates = suburbs.filter(s => s.population && s.population >= 2000);

  // Group suburbs into geographic clusters
  const clusters: SuburbWithPopulation[][] = [];

  for (const suburb of candidates) {
    let addedToCluster = false;

    // Check if belongs to existing cluster (within 5km of any member)
    for (const cluster of clusters) {
      const isNearCluster = cluster.some(member => {
        const distance = calculateDistance(
          { latitude: suburb.latitude, longitude: suburb.longitude },
          { latitude: member.latitude, longitude: member.longitude }
        );
        return distance < 5;
      });

      if (isNearCluster) {
        cluster.push(suburb);
        addedToCluster = true;
        break;
      }
    }

    if (!addedToCluster) {
      clusters.push([suburb]);
    }
  }

  // The largest suburb in each cluster is likely the commercial center
  for (const cluster of clusters) {
    if (cluster.length > 0) {
      const largest = cluster.reduce((max, s) =>
        (s.population || 0) > (max.population || 0) ? s : max
      );
      centers.add(largest.id);
    }
  }

  return centers;
}

/**
 * Analyze distance distribution and find natural rings
 */
function analyzeDistanceRings(
  suburbs: SuburbWithPopulation[],
  center: { lat: number; lng: number }
): { [key: string]: SuburbWithPopulation[] } {
  // Sort suburbs by distance
  const sorted = [...suburbs].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const rings: { [key: string]: SuburbWithPopulation[] } = {
    inner: [],
    middle: [],
    outer: [],
    satellite: []
  };

  if (sorted.length === 0) return rings;

  // Find natural breaks in distance distribution
  const gaps: number[] = [];
  let lastDistance = 0;

  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].distanceKm || 0) - (sorted[i-1].distanceKm || 0);
    if (gap > 2) { // Gap of more than 2km suggests a natural break
      gaps.push(sorted[i].distanceKm || 0);
    }
  }

  // Define ring boundaries based on gaps or quartiles
  let innerBoundary = gaps[0] || 10;
  let middleBoundary = gaps[1] || 20;
  let outerBoundary = gaps[2] || 30;

  // Ensure reasonable boundaries
  if (innerBoundary > 15) innerBoundary = 10;
  if (middleBoundary > 25) middleBoundary = 20;
  if (outerBoundary > 40) outerBoundary = 35;

  // Assign suburbs to rings
  for (const suburb of sorted) {
    const distance = suburb.distanceKm || 0;
    if (distance <= innerBoundary) {
      rings.inner.push(suburb);
    } else if (distance <= middleBoundary) {
      rings.middle.push(suburb);
    } else if (distance <= outerBoundary) {
      rings.outer.push(suburb);
    } else {
      rings.satellite.push(suburb);
    }
  }

  return rings;
}

/**
 * Universal smart selection algorithm for footer locations
 */
function smartSelectLocations(
  suburbs: SuburbWithPopulation[],
  count: number = 11,
  centerCoords?: { lat: number; lng: number }
): SuburbWithPopulation[] {
  if (suburbs.length === 0) return [];

  console.log(`Smart selection starting with ${suburbs.length} suburbs`);

  // Get center location for distance ring analysis
  // Use provided center or calculate from suburbs
  let centerPoint = centerCoords;
  if (!centerPoint) {
    // Find the suburb closest to 0 distance (should be near center)
    const centerSuburb = suburbs.reduce((closest, suburb) =>
      (suburb.distanceKm || 0) < (closest.distanceKm || Infinity) ? suburb : closest
    );
    centerPoint = { lat: centerSuburb.latitude, lng: centerSuburb.longitude };
  }

  // 1. Statistical analysis
  const significantSuburbs = findSignificantSuburbs(suburbs);
  const commercialCenters = detectCommercialCenters(suburbs);
  const distanceRings = analyzeDistanceRings(suburbs, centerPoint);

  console.log(`Found ${significantSuburbs.size} significant suburbs, ${commercialCenters.size} commercial centers`);

  // 2. Score each suburb
  const scoredSuburbs = suburbs.map(suburb => {
    let score = 0;

    // CRITICAL: Heavily penalize suburbs with no population data
    if (!suburb.population) {
      score = -1000; // Start with massive negative score
    } else {
      // Population percentile score (0-100 points)
      const percentile = calculatePopulationPercentile(suburb, suburbs);
      if (percentile > 0.9) score += 100;
      else if (percentile > 0.8) score += 80;
      else if (percentile > 0.7) score += 60;
      else if (percentile > 0.5) score += 40;
      else score += percentile * 40;

      // Regional center bonus (30 points)
      if (isRegionalCenter(suburb, suburbs)) {
        score += 30;
      }

      // Commercial center bonus (25 points)
      if (commercialCenters.has(suburb.id)) {
        score += 25;
      }

      // Statistical significance bonus (20 points)
      if (significantSuburbs.has(suburb.id)) {
        score += 20;
      }

      // Population density bonus for urban areas
      if (suburb.populationDensity && suburb.populationDensity > 1000) {
        score += 15;
      }
    }

    return { suburb, score };
  });

  // Sort by score
  scoredSuburbs.sort((a, b) => b.score - a.score);

  // 3. Select with geographic distribution
  const selected: SuburbWithPopulation[] = [];
  const ringQuotas = {
    inner: Math.max(2, Math.floor(count * 0.25)),     // 25% inner
    middle: Math.max(3, Math.floor(count * 0.35)),    // 35% middle
    outer: Math.max(3, Math.floor(count * 0.30)),     // 30% outer
    satellite: Math.floor(count * 0.10)               // 10% satellite
  };

  // First pass: Select top-scored suburbs from each ring up to quota
  for (const [ring, quota] of Object.entries(ringQuotas)) {
    const ringSuburbs = scoredSuburbs
      .filter(s => distanceRings[ring].includes(s.suburb))
      .slice(0, quota);

    for (const { suburb } of ringSuburbs) {
      if (selected.length >= count) break;
      if (!selected.includes(suburb)) {
        selected.push(suburb);
      }
    }
  }

  // Second pass: Fill remaining slots with highest scored suburbs
  if (selected.length < count) {
    for (const { suburb } of scoredSuburbs) {
      if (selected.length >= count) break;
      if (!selected.includes(suburb)) {
        selected.push(suburb);
      }
    }
  }

  const finalSelection = selected.slice(0, count);

  // Log the selected suburbs for debugging
  console.log('Selected suburbs for footer:');
  finalSelection.forEach((suburb, i) => {
    const scoreInfo = scoredSuburbs.find(s => s.suburb.id === suburb.id);
    console.log(`${i + 1}. ${suburb.name} (pop: ${suburb.population || 'N/A'}, dist: ${suburb.distanceKm}km, score: ${scoreInfo?.score || 0})`);
  });

  return finalSelection;
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
          11 - validSuburbs.length,
          center
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

    const selectedSuburbs = smartSelectLocations(allSuburbs, 11, center);
    
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