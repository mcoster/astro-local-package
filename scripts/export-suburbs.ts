#!/usr/bin/env tsx

/**
 * Export Suburbs to JSON
 * 
 * This script exports suburb data from PostGIS to a static JSON file
 * for use in production builds where database access isn't available.
 */

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Suburb {
  id: number;
  name: string;
  postcode?: string;
  state: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  direction: string;
  population?: number;
}

async function exportSuburbs() {
  console.log('🏘️  Exporting suburbs from PostGIS database...\n');

  // Database connection
  const pool = new Pool({
    host: process.env.POSTGIS_HOST || 'localhost',
    port: parseInt(process.env.POSTGIS_PORT || '5432'),
    database: process.env.POSTGIS_DATABASE || 'au_suburbs_db',
    user: process.env.POSTGIS_USER || 'suburbs_user',
    password: process.env.POSTGIS_PASSWORD || '',
  });

  try {
    // Get center location (Adelaide business address)
    const centerLat = -34.8517; // Kilburn, SA
    const centerLng = 138.5829;
    const radiusKm = 50; // Export suburbs within 50km

    console.log(`📍 Center: ${centerLat}, ${centerLng}`);
    console.log(`📏 Radius: ${radiusKm}km\n`);

    // Query suburbs within radius using the correct schema
    const query = `
      WITH center AS (
        SELECT ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography AS point
      )
      SELECT 
        s.id,
        s.name,
        s.postcode,
        s.state,
        s.latitude,
        s.longitude,
        ROUND((ST_Distance(s.location, c.point) / 1000)::numeric, 2) AS distance_km,
        CASE 
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 337.5 AND 360 
            OR degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 0 AND 22.5 THEN 'N'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 22.5 AND 67.5 THEN 'NE'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 67.5 AND 112.5 THEN 'E'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 112.5 AND 157.5 THEN 'SE'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 157.5 AND 202.5 THEN 'S'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 202.5 AND 247.5 THEN 'SW'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 247.5 AND 292.5 THEN 'W'
          WHEN degrees(ST_Azimuth(c.point::geometry, s.location::geometry)) BETWEEN 292.5 AND 337.5 THEN 'NW'
        END AS direction,
        s.population
      FROM suburbs s
      CROSS JOIN center c
      WHERE s.state = 'SA'
        AND ST_DWithin(s.location, c.point, $3 * 1000)
      ORDER BY distance_km ASC
    `;

    const result = await pool.query(query, [centerLat, centerLng, radiusKm]);
    
    const suburbs: Suburb[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      postcode: row.postcode,
      state: row.state,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      distanceKm: parseFloat(row.distance_km),
      direction: row.direction,
      population: row.population || null,
    }));

    console.log(`✅ Found ${suburbs.length} suburbs within ${radiusKm}km\n`);

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'src', 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Save to JSON file
    const outputPath = path.join(dataDir, 'suburbs.json');
    const data = {
      generated: new Date().toISOString(),
      center: { lat: centerLat, lng: centerLng },
      radiusKm,
      count: suburbs.length,
      suburbs,
    };

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved to: ${outputPath}`);

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`  - Total suburbs: ${suburbs.length}`);
    console.log(`  - Closest: ${suburbs[0]?.name} (${suburbs[0]?.distanceKm}km)`);
    console.log(`  - Furthest: ${suburbs[suburbs.length - 1]?.name} (${suburbs[suburbs.length - 1]?.distanceKm}km)`);
    
    const withPopulation = suburbs.filter(s => s.population).length;
    console.log(`  - With population data: ${withPopulation}`);

  } catch (error) {
    console.error('❌ Error exporting suburbs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the export
exportSuburbs().catch(console.error);