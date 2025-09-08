/**
 * Static Suburbs Data Module
 * Reads suburb data from pre-generated JSON file for production builds
 */

import suburbsData from '../data/suburbs.json';
import type { Suburb, SuburbWithPopulation } from './locations';

// Cache the loaded data
let cachedSuburbs: Suburb[] | null = null;

/**
 * Load suburbs from static JSON file
 */
function loadSuburbs(): Suburb[] {
  if (cachedSuburbs) {
    return cachedSuburbs;
  }

  cachedSuburbs = suburbsData.suburbs.map(s => ({
    id: s.id,
    name: s.name,
    postcode: s.postcode || undefined,
    state: s.state,
    latitude: s.latitude,
    longitude: s.longitude,
    distanceKm: s.distanceKm,
    direction: s.direction,
  }));

  return cachedSuburbs;
}

/**
 * Calculate direction between two points
 */
function calculateDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLng = toLng - fromLng;
  const dLat = toLat - fromLat;
  
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  
  return directions[index];
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get all suburbs within a specified radius from a center point
 */
export async function getSuburbsWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<Suburb[]> {
  const suburbs = loadSuburbs();
  
  // Filter suburbs within radius and recalculate distance/direction from the given center
  return suburbs
    .map(suburb => {
      const distance = calculateDistance(centerLat, centerLng, suburb.latitude, suburb.longitude);
      const direction = calculateDirection(centerLat, centerLng, suburb.latitude, suburb.longitude);
      
      return {
        ...suburb,
        distanceKm: Math.round(distance * 10) / 10,
        direction,
      };
    })
    .filter(suburb => suburb.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Get details for a specific suburb
 */
export async function getSuburbDetails(suburbId: number): Promise<Suburb | null> {
  const suburbs = loadSuburbs();
  return suburbs.find(s => s.id === suburbId) || null;
}

/**
 * Get nearby suburbs to a given location
 */
export async function getNearbySuburbs(
  lat: number,
  lng: number,
  limit: number = 10,
  excludeId?: number
): Promise<Suburb[]> {
  const suburbs = loadSuburbs();
  
  // Calculate distances and sort
  const withDistances = suburbs
    .filter(s => s.id !== excludeId)
    .map(suburb => {
      const distance = calculateDistance(lat, lng, suburb.latitude, suburb.longitude);
      const direction = calculateDirection(lat, lng, suburb.latitude, suburb.longitude);
      
      return {
        ...suburb,
        distanceKm: Math.round(distance * 10) / 10,
        direction,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
  
  return withDistances.slice(0, limit);
}

/**
 * Test function - always returns true for static data
 */
export async function testConnection(): Promise<boolean> {
  const suburbs = loadSuburbs();
  console.log(`Static suburbs data loaded: ${suburbs.length} suburbs`);
  return true;
}

/**
 * Get suburbs with population data within a specified radius
 */
export async function getSuburbsWithPopulation(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<SuburbWithPopulation[]> {
  const suburbs = await getSuburbsWithinRadius(centerLat, centerLng, radiusKm);
  
  // Map to include population fields (even if null)
  return suburbs.map(suburb => ({
    ...suburb,
    population: (suburbsData.suburbs.find(s => s.id === suburb.id) as any)?.population || undefined,
    populationDensity: undefined,
    households: undefined,
    medianAge: undefined,
  }));
}

/**
 * Close function - no-op for static data
 */
export async function closePool(): Promise<void> {
  // No-op for static data
}

/**
 * Geocode placeholder - returns Adelaide CBD coordinates
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  console.warn('Geocoding not available with static data. Using default Adelaide CBD coordinates.');
  return { lat: -34.9285, lng: 138.6007 };
}