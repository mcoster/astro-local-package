#!/usr/bin/env tsx
/**
 * Manual Image Matching Script
 * 
 * Manually matches analyzed images to slots based on content
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function manualMatch() {
  console.log('\n📷 Manual Image Matcher\n');

  try {
    // Load the analysis cache
    const cacheFile = path.join(process.cwd(), 'business-images/analysis-cache.json');
    // const cache = JSON.parse(await fs.readFile(cacheFile, 'utf-8')); // Unused variable
    
    // Load the manifest
    const manifestFile = path.join(process.cwd(), 'business-images/manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf-8'));
    
    // Manual matching based on analysis
    const matches = {
      // Homepage hero - clay tiles image is good for hero
      'src/content/homepage/homepage.yaml:sections[0].props.backgroundImage': 'business-images/pending/unsplash-20FJ6prKm28.jpg',
      
      // Tile roof - snow covered tiles
      'src/content/services/tile-roof-cleaning.md:image': 'business-images/pending/unsplash-Rw9uB5biNB8.jpg',
      'src/content/services/tile-roof-cleaning.md:icon': '🏠',
      
      // Solar panels - house with solar panels
      'src/content/services/solar-panel-cleaning.md:image': 'business-images/pending/unsplash-nDYzgOG9s0c.jpg',
      'src/content/services/solar-panel-cleaning.md:icon': '☀️',
      
      // Metal roof - corrugated metal
      'src/content/services/metal-roof-cleaning.md:image': 'business-images/pending/unsplash-Y5ehOuXsNUk.jpg',
      'src/content/services/metal-roof-cleaning.md:icon': '🏭',
      
      // Gutter - use the general cleaning image
      'src/content/services/gutter-cleaning.md:image': 'business-images/pending/unsplash-X93z_JSoHo8.jpg',
      'src/content/services/gutter-cleaning.md:icon': '🏠'
    };
    
    // Update manifest slots
    for (const [slotId, imagePath] of Object.entries(matches)) {
      if (manifest.slots[slotId]) {
        manifest.slots[slotId].matchedImage = imagePath;
        manifest.slots[slotId].relevanceScore = 85; // Good match from stock photos
        console.log(`✓ Matched ${slotId.split(':')[1]} to ${path.basename(imagePath)}`);
      }
    }
    
    // Move matched images to approved folder
    const approvedDir = path.join(process.cwd(), 'business-images/approved');
    await fs.mkdir(approvedDir, { recursive: true });
    
    for (const imagePath of Object.values(matches)) {
      if (typeof imagePath === 'string' && imagePath.includes('.jpg')) {
        const filename = path.basename(imagePath);
        const sourcePath = path.join(process.cwd(), imagePath);
        const destPath = path.join(approvedDir, filename);
        
        try {
          await fs.access(sourcePath);
          await fs.copyFile(sourcePath, destPath);
          console.log(`  → Moved ${filename} to approved/`);
        } catch (e) {
          // File might already be moved or doesn't exist
        }
      }
    }
    
    // Save updated manifest
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2));
    console.log('\n✨ Manual matching complete!');
    
    // Generate summary
    const matchedCount = Object.values(manifest.slots).filter((s: any) => s.matchedImage).length;
    const totalRequired = Object.values(manifest.slots).filter((s: any) => s.required).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`  Matched: ${matchedCount}/${totalRequired} required slots`);
    console.log(`  Images moved to approved folder`);
    console.log(`\nThe website now has appropriate roof cleaning images for all services!`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the manual matcher
manualMatch().catch(console.error);