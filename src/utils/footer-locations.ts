/**
 * Footer Location Links Module
 * Manages selection of suburbs to display in the site footer for SEO discovery
 */

import { getSuburbsWithPopulation, getSuburbsByName } from './locations';
import { getCenterLocation, generateLocationSlug, generateLocationUrl } from './location-builder';
import { siteConfig } from '../config/site';
import type { SuburbWithPopulation, Suburb } from './locations';
import type { LocationPageData } from './location-builder';

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
  
  // Known major suburb names bonus
  const majorSuburbs = [
    'North Adelaide', 'Glenelg', 'Norwood', 'Port Adelaide',
    'Unley', 'Prospect', 'Burnside', 'Mitcham', 'Brighton',
    'Henley Beach', 'Modbury', 'Marion', 'Campbelltown'
  ];
  
  if (majorSuburbs.some(major => suburb.name.toLowerCase().includes(major.toLowerCase()))) {
    score += 30;
  }
  
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
      const suburbs = await getSuburbsByName(manualSuburbs);
      
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
      console.warn('No suburbs found for footer selection. Using default suburbs.');
      // Use hardcoded default suburbs when database is not available
      const defaultSuburbs: SuburbWithPopulation[] = [
        { id: 1, name: 'Adelaide', postcode: '5000', state: 'SA', latitude: -34.9285, longitude: 138.6007, distanceKm: 0, direction: 'N', population: 24783, density: 3142, households: 12571, medianAge: 28 },
        { id: 2, name: 'North Adelaide', postcode: '5006', state: 'SA', latitude: -34.9065, longitude: 138.5930, distanceKm: 2.5, direction: 'N', population: 5988, density: 1843, households: 3124, medianAge: 37 },
        { id: 3, name: 'Prospect', postcode: '5082', state: 'SA', latitude: -34.8833, longitude: 138.5945, distanceKm: 5.1, direction: 'N', population: 21196, density: 2677, households: 9433, medianAge: 36 },
        { id: 4, name: 'Glenelg', postcode: '5045', state: 'SA', latitude: -34.9799, longitude: 138.5156, distanceKm: 11.2, direction: 'SW', population: 3349, density: 3571, households: 1744, medianAge: 44 },
        { id: 5, name: 'Henley Beach', postcode: '5022', state: 'SA', latitude: -34.9166, longitude: 138.4931, distanceKm: 11.5, direction: 'W', population: 7247, density: 2415, households: 3275, medianAge: 39 },
        { id: 6, name: 'Port Adelaide', postcode: '5015', state: 'SA', latitude: -34.8477, longitude: 138.5016, distanceKm: 14.1, direction: 'NW', population: 1230, density: 446, households: 615, medianAge: 37 },
        { id: 7, name: 'Modbury Heights', postcode: '5092', state: 'SA', latitude: -34.8308, longitude: 138.6939, distanceKm: 13.3, direction: 'NE', population: 5686, density: 1621, households: 2205, medianAge: 40 },
        { id: 8, name: 'Aberfoyle Park', postcode: '5159', state: 'SA', latitude: -35.0675, longitude: 138.5964, distanceKm: 15.4, direction: 'S', population: 11719, density: 1537, households: 4371, medianAge: 38 },
        { id: 9, name: 'Happy Valley', postcode: '5159', state: 'SA', latitude: -35.0833, longitude: 138.5633, distanceKm: 17.6, direction: 'S', population: 8943, density: 1107, households: 3327, medianAge: 41 },
        { id: 10, name: 'Parafield Gardens', postcode: '5107', state: 'SA', latitude: -34.7833, longitude: 138.6167, distanceKm: 16.2, direction: 'N', population: 16280, density: 1628, households: 5798, medianAge: 33 },
        { id: 11, name: 'Redwood Park', postcode: '5097', state: 'SA', latitude: -34.8000, longitude: 138.7167, distanceKm: 16.7, direction: 'NE', population: 3941, density: 1109, households: 1478, medianAge: 39 }
      ];
      
      return defaultSuburbs.map(suburb => ({
        suburb,
        slug: generateLocationSlug(suburb),
        url: generateLocationUrl(suburb)
      }));
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