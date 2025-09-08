#!/usr/bin/env tsx

/**
 * Quick Match Script
 * Manually assigns the best analyzed images to key slots
 */

import fs from 'fs/promises';
import path from 'path';

async function quickMatch() {
  console.log('\n🎯 Quick Image Matching\n');

  // Load the analysis cache and manifest
  // const analysisCache = JSON.parse(
  //   await fs.readFile('business-images/analysis-cache.json', 'utf-8')
  // ); // Unused variable
  
  const manifest = JSON.parse(
    await fs.readFile('business-images/manifest.json', 'utf-8')
  );

  // Manual matches based on the analyzed content
  const matches = [
    {
      slot: 'src/content/homepage/homepage.yaml:sections[0].props.backgroundImage',
      image: 'Roof cleaning service.jpg',
      reason: 'Professional roof cleaning action shot'
    },
    {
      slot: 'src/content/services/tile-roof-cleaning.md:image',
      image: 'tile roof pressure cleaning - before vs after.jpg',
      reason: 'Perfect tile roof before/after'
    },
    {
      slot: 'src/content/services/metal-roof-cleaning.md:image',
      image: 'aluminum roof pressure cleaning - before vs after.jpg',
      reason: 'Metal roof before/after'
    },
    {
      slot: 'src/content/services/solar-panel-cleaning.md:image',
      image: 'dirty solar panel before pressure washing - before vs after.jpg',
      reason: 'Solar panel before/after'
    },
    {
      slot: 'src/content/services/gutter-cleaning.md:image',
      image: 'gutter cleaning by pressure washing - before vs after.jpg',
      reason: 'Gutter cleaning before/after'
    }
  ];

  // Apply matches
  for (const match of matches) {
    const imagePath = `business-images/pending/${match.image}`;
    
    // Check if image exists
    try {
      await fs.access(imagePath);
      
      // Update manifest
      if (manifest.slots[match.slot]) {
        manifest.slots[match.slot].matchedImage = imagePath;
        console.log(`✅ Matched: ${match.image}`);
        console.log(`   → ${match.slot}`);
        console.log(`   Reason: ${match.reason}\n`);
      }
    } catch (err) {
      console.log(`❌ Image not found: ${match.image}`);
    }
  }

  // Save updated manifest
  await fs.writeFile(
    'business-images/manifest.json',
    JSON.stringify(manifest, null, 2)
  );

  console.log('✨ Matching complete! Now copying images to public directory...\n');

  // Copy matched images to public directory
  for (const match of matches) {
    const sourcePath = `business-images/pending/${match.image}`;
    const slot = manifest.slots[match.slot];
    
    if (slot?.matchedImage) {
      const targetPath = path.join('public', slot.currentPath);
      
      try {
        // Ensure target directory exists
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        
        // Copy file
        await fs.copyFile(sourcePath, targetPath);
        console.log(`📁 Copied: ${match.image} → ${slot.currentPath}`);
      } catch (err) {
        console.error(`Failed to copy ${match.image}:`, err);
      }
    }
  }

  console.log('\n✅ All images matched and copied successfully!');
}

quickMatch().catch(console.error);