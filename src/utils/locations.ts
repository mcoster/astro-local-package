/**
 * PostGIS Integration Module for Dynamic Location Pages
 * Connects to a PostgreSQL/PostGIS database to query Australian suburbs
 * within a specified radius for generating location-specific landing pages
 */

import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

// Types
export interface Suburb {
  id: number;
  name: string;
  postcode?: string; // Optional as some suburbs might not have postcodes
  state: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  direction: string; // N, NE, E, SE, S, SW, W, NW
}

export interface SuburbWithPopulation extends Suburb {
  population?: number;
  populationDensity?: number;
  households?: number;
  medianAge?: number;
}

export interface LocationConfig {
  serviceRadiusKm: number;
  centerLat?: number;
  centerLng?: number;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

// Database connection configuration
function getPoolConfig(): PoolConfig | undefined {
  // Check for connection string first
  if (import.meta.env.POSTGIS_CONNECTION_STRING) {
    return {
      connectionString: import.meta.env.POSTGIS_CONNECTION_STRING,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
  
  // Check for individual connection parameters
  if (import.meta.env.POSTGIS_HOST && import.meta.env.POSTGIS_DATABASE) {
    return {
      host: import.meta.env.POSTGIS_HOST,
      port: parseInt(import.meta.env.POSTGIS_PORT || '5432'),
      database: import.meta.env.POSTGIS_DATABASE,
      user: import.meta.env.POSTGIS_USER,
      password: import.meta.env.POSTGIS_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
  
  return undefined;
}

// Create connection pool (lazy initialization)
let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const config = getPoolConfig();
    if (config) {
      pool = new Pool(config);
      
      // Handle pool errors
      pool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });
    }
  }
  return pool;
}

/**
 * Calculate compass direction from one point to another
 */
function calculateDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLng = toLng - fromLng;
  const dLat = toLat - fromLat;
  
  // Calculate angle in degrees
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  
  // Normalize to 0-360
  const normalized = (angle + 360) % 360;
  
  // Convert to compass direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  
  return directions[index];
}

/**
 * Geocode an address to latitude/longitude coordinates
 * This is a placeholder - in production, you'd use a geocoding service
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // For now, return Adelaide CBD coordinates as default
  // In production, integrate with a geocoding service like Google Maps Geocoding API
  console.warn('Geocoding not implemented. Using default Adelaide CBD coordinates.');
  return { lat: -34.9285, lng: 138.6007 };
}

/**
 * Get all suburbs within a specified radius from a center point
 */
export async function getSuburbsWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<Suburb[]> {
  const dbPool = getPool();
  if (!dbPool) {
    console.warn('PostGIS database not configured. Skipping suburb query.');
    return [];
  }
  
  try {
    // Query using PostGIS spatial functions with joined postcode data
    const query = `
      SELECT 
        s.id,
        s.name,
        sp.postcode,
        s.state,
        s.latitude,
        s.longitude,
        ST_Distance(
          s.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) / 1000 as distance_km
      FROM suburbs s
      LEFT JOIN suburb_postcodes sp ON s.id = sp.suburb_id AND sp.is_primary = true
      WHERE ST_DWithin(
        s.location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3 * 1000  -- Convert km to meters
      )
      ORDER BY distance_km ASC
    `;
    
    const result = await dbPool.query(query, [centerLat, centerLng, radiusKm]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: Math.round(row.distance_km * 10) / 10,
      direction: calculateDirection(centerLat, centerLng, row.latitude, row.longitude),
    }));
  } catch (error) {
    console.error('Error querying suburbs:', error);
    return [];
  }
}

/**
 * Get details for a specific suburb
 */
export async function getSuburbDetails(suburbId: number): Promise<Suburb | null> {
  const dbPool = getPool();
  if (!dbPool) {
    console.warn('PostGIS database not configured. Skipping suburb query.');
    return null;
  }
  
  try {
    const query = `
      SELECT 
        s.id,
        s.name,
        sp.postcode,
        s.state,
        s.latitude,
        s.longitude
      FROM suburbs s
      LEFT JOIN suburb_postcodes sp ON s.id = sp.suburb_id AND sp.is_primary = true
      WHERE s.id = $1
    `;
    
    const result = await dbPool.query(query, [suburbId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // For single suburb, we'll need to get distance from center
    // This would typically be passed in or retrieved from config
    return {
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: 0, // Will be calculated relative to service center
      direction: '', // Will be calculated relative to service center
    };
  } catch (error) {
    console.error('Error querying suburb details:', error);
    return null;
  }
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
  const dbPool = getPool();
  if (!dbPool) {
    console.warn('PostGIS database not configured. Skipping suburb query.');
    return [];
  }
  
  try {
    let query = `
      SELECT 
        s.id,
        s.name,
        sp.postcode,
        s.state,
        s.latitude,
        s.longitude,
        ST_Distance(
          s.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) / 1000 as distance_km
      FROM suburbs s
      LEFT JOIN suburb_postcodes sp ON s.id = sp.suburb_id AND sp.is_primary = true
    `;
    
    const params: any[] = [lat, lng];
    
    if (excludeId) {
      query += ' WHERE s.id != $3';
      params.push(excludeId);
    }
    
    query += `
      ORDER BY distance_km ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);
    
    const result = await dbPool.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: Math.round(row.distance_km * 10) / 10,
      direction: calculateDirection(lat, lng, row.latitude, row.longitude),
    }));
  } catch (error) {
    console.error('Error querying nearby suburbs:', error);
    return [];
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const dbPool = getPool();
  if (!dbPool) {
    console.log('PostGIS database not configured.');
    return false;
  }
  
  try {
    const result = await dbPool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Get suburbs with population data within a specified radius
 */
export async function getSuburbsWithPopulation(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<SuburbWithPopulation[]> {
  const dbPool = getPool();
  if (!dbPool) {
    console.warn('PostGIS database not configured. Skipping suburb query.');
    return [];
  }
  
  try {
    // Query with population data joined
    const query = `
      SELECT 
        s.id,
        s.name,
        sp.postcode,
        s.state,
        s.latitude,
        s.longitude,
        ST_Distance(
          s.location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) / 1000 as distance_km,
        pop.population_total,
        pop.population_density,
        pop.households,
        pop.median_age
      FROM suburbs s
      LEFT JOIN suburb_postcodes sp ON s.id = sp.suburb_id AND sp.is_primary = true
      LEFT JOIN suburb_population pop ON s.id = pop.suburb_id
      WHERE ST_DWithin(
        s.location::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3 * 1000  -- Convert km to meters
      )
      ORDER BY distance_km ASC
    `;
    
    const result = await dbPool.query(query, [centerLat, centerLng, radiusKm]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: Math.round(row.distance_km * 10) / 10,
      direction: calculateDirection(centerLat, centerLng, row.latitude, row.longitude),
      population: row.population_total,
      populationDensity: row.population_density,
      households: row.households,
      medianAge: row.median_age,
    }));
  } catch (error) {
    console.error('Error querying suburbs with population:', error);
    return [];
  }
}

/**
 * Get suburbs by name with population data
 */
export async function getSuburbsByName(names: string[]): Promise<SuburbWithPopulation[]> {
  const dbPool = getPool();
  if (!dbPool) {
    console.warn('PostGIS database not configured. Skipping suburb query.');
    return [];
  }
  
  if (names.length === 0) {
    return [];
  }
  
  try {
    const query = `
      SELECT 
        s.id,
        s.name,
        sp.postcode,
        s.state,
        s.latitude,
        s.longitude,
        pop.population_total,
        pop.population_density,
        pop.households,
        pop.median_age
      FROM suburbs s
      LEFT JOIN suburb_postcodes sp ON s.id = sp.suburb_id AND sp.is_primary = true
      LEFT JOIN suburb_population pop ON s.id = pop.suburb_id
      WHERE LOWER(s.name) = ANY($1::text[])
    `;
    
    const lowerNames = names.map(n => n.toLowerCase());
    const result = await dbPool.query(query, [lowerNames]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceKm: 0, // Will be calculated relative to center
      direction: '', // Will be calculated relative to center
      population: row.population_total,
      populationDensity: row.population_density,
      households: row.households,
      medianAge: row.median_age,
    }));
  } catch (error) {
    console.error('Error querying suburbs by name:', error);
    return [];
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}