#!/usr/bin/env tsx

/**
 * Validate and Auto-regenerate Suburbs Data
 * 
 * This script validates that the suburbs.json file exists and matches
 * the current configuration. If not, it attempts to regenerate it.
 */

import fs from 'fs/promises';
import path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface SuburbsMetadata {
  generated: string;
  center: { lat: number; lng: number };
  radiusKm: number;
  count: number;
  state?: string;
  configHash?: string;
}

/**
 * Calculate a simple hash of relevant config values
 */
function calculateConfigHash(config: any): string {
  const relevant = {
    lat: config.service?.center_lat || config.address?.coordinates?.lat,
    lng: config.service?.center_lng || config.address?.coordinates?.lng,
    radius: config.service?.radius_km || config.seo?.location_based?.radius_km || config.locationPages?.serviceRadiusKm,
  };
  return JSON.stringify(relevant);
}

/**
 * Check if we have database access
 */
async function hasDatabase(): Promise<boolean> {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: process.env.POSTGIS_HOST || 'localhost',
      port: parseInt(process.env.POSTGIS_PORT || '5432'),
      database: process.env.POSTGIS_DATABASE || 'au_suburbs_db',
      user: process.env.POSTGIS_USER || 'suburbs_user',
      password: process.env.POSTGIS_PASSWORD || '',
      connectionTimeoutMillis: 2000,
    });
    
    try {
      await pool.query('SELECT 1');
      await pool.end();
      return true;
    } catch {
      await pool.end();
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Main validation function
 */
async function validateSuburbs(): Promise<void> {
  console.log('🔍 Validating suburbs data...\n');
  
  const configPath = path.join(process.cwd(), 'config', 'business.yaml');
  const suburbsPath = path.join(process.cwd(), 'src', 'data', 'suburbs.json');
  
  // Load business config
  const configContent = await fs.readFile(configPath, 'utf8');
  const config = yaml.load(configContent) as any;
  
  // Calculate expected values
  const expectedLat = config.service?.center_lat || config.address?.coordinates?.lat || -34.8517;
  const expectedLng = config.service?.center_lng || config.address?.coordinates?.lng || 138.5829;
  const expectedRadius = config.service?.radius_km || 
                         config.seo?.location_based?.radius_km || 
                         config.locationPages?.serviceRadiusKm || 33;
  const configHash = calculateConfigHash(config);
  
  // Check if suburbs.json exists
  let needsRegeneration = false;
  let reason = '';
  
  try {
    const suburbsContent = await fs.readFile(suburbsPath, 'utf8');
    const suburbsData = JSON.parse(suburbsContent);
    
    // Validate metadata
    if (!suburbsData.center || !suburbsData.radiusKm) {
      needsRegeneration = true;
      reason = 'Missing metadata';
    } else if (Math.abs(suburbsData.center.lat - expectedLat) > 0.001) {
      needsRegeneration = true;
      reason = `Latitude mismatch (${suburbsData.center.lat} vs ${expectedLat})`;
    } else if (Math.abs(suburbsData.center.lng - expectedLng) > 0.001) {
      needsRegeneration = true;
      reason = `Longitude mismatch (${suburbsData.center.lng} vs ${expectedLng})`;
    } else if (suburbsData.radiusKm !== expectedRadius) {
      needsRegeneration = true;
      reason = `Radius mismatch (${suburbsData.radiusKm}km vs ${expectedRadius}km)`;
    } else if (suburbsData.configHash && suburbsData.configHash !== configHash) {
      needsRegeneration = true;
      reason = 'Configuration changed';
    }
    
    if (!needsRegeneration) {
      console.log('✅ Suburbs data is valid and up-to-date');
      console.log(`   📍 Center: ${suburbsData.center.lat}, ${suburbsData.center.lng}`);
      console.log(`   📏 Radius: ${suburbsData.radiusKm}km`);
      console.log(`   🏘️  Count: ${suburbsData.count} suburbs`);
      return;
    }
    
  } catch (error) {
    needsRegeneration = true;
    reason = 'File not found or invalid JSON';
  }
  
  // Needs regeneration
  console.log(`⚠️  Suburbs data needs regeneration: ${reason}\n`);
  
  // Check if we have database access
  const dbAvailable = await hasDatabase();
  
  if (dbAvailable) {
    console.log('🔄 Regenerating suburbs data...\n');
    
    try {
      // Run export-suburbs.ts
      execSync('npx tsx scripts/export-suburbs.ts', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('\n✅ Suburbs data regenerated successfully');
      
      // Update the file with additional metadata
      const newContent = await fs.readFile(suburbsPath, 'utf8');
      const newData = JSON.parse(newContent);
      // Remove state field - suburbs can span multiple states
      delete newData.state;
      newData.configHash = configHash;
      await fs.writeFile(suburbsPath, JSON.stringify(newData, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to regenerate suburbs data:', error);
      process.exit(1);
    }
  } else {
    // No database access - check if we can continue
    try {
      await fs.access(suburbsPath);
      console.warn('⚠️  Database not available, using existing suburbs data');
      console.warn('   Note: Data may not match current configuration');
      console.warn(`   Expected: ${expectedRadius}km radius from ${expectedLat}, ${expectedLng}`);
      console.warn('\n   To regenerate manually when database is available:');
      console.warn('   npm run suburbs:generate\n');
      // Don't fail the build, just warn
    } catch {
      // No suburbs.json and no database - can't continue
      console.error('❌ Cannot build: suburbs.json is missing and database is not available');
      console.error('\nTo fix this issue:');
      console.error('1. Ensure PostGIS database is running locally, OR');
      console.error('2. Copy suburbs.json from another site and adjust if needed, OR');
      console.error('3. Run: npm run suburbs:generate (when database is available)\n');
      process.exit(1);
    }
  }
}

// Run validation
validateSuburbs().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});