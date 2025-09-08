#!/usr/bin/env node

/**
 * Match Images Script
 * 
 * Matches analyzed images to website sections based on relevance scores
 */

import { imageRegistry } from '../src/lib/image-registry';
import { imageAnalysis } from '../src/lib/image-analysis';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

async function matchImages() {
  console.log(chalk.blue.bold('\n🎯 Image Matching Tool\n'));

  const spinner = ora('Loading manifest...').start();

  try {
    // Load manifest
    const manifest = await imageRegistry.loadManifest();
    spinner.succeed('Manifest loaded');

    // Get all available images
    const availableImages = Object.keys(manifest.images).filter(
      imgPath => manifest.images[imgPath].analyzed
    );

    if (availableImages.length === 0) {
      spinner.warn('No analyzed images available');
      console.log(chalk.yellow('\n📸 Run `npm run images:analyze` first to analyze pending images\n'));
      return;
    }

    // Get all unmatched slots
    const unmatchedSlots = Object.values(manifest.slots).filter(
      slot => !slot.matchedImage
    );

    if (unmatchedSlots.length === 0) {
      spinner.info('All slots already matched');
      return;
    }

    console.log(chalk.cyan(`\n🔍 Matching ${availableImages.length} images to ${unmatchedSlots.length} slots...\n`));

    // Track matches
    const matches: Array<{
      slot: typeof unmatchedSlots[0];
      image: string;
      score: number;
    }> = [];

    const usedImages = new Set<string>();

    // Sort slots by priority (required first)
    const sortedSlots = unmatchedSlots.sort((a, b) => {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return 0;
    });

    // Match each slot
    for (const slot of sortedSlots) {
      const slotSpinner = ora(`Matching ${slot.component}: ${slot.context}...`).start();

      // Find unused images for this slot
      const candidateImages = availableImages.filter(img => !usedImages.has(img));

      if (candidateImages.length === 0) {
        slotSpinner.warn(`No more images available for ${slot.component}`);
        continue;
      }

      // Find best match
      const bestMatch = await imageAnalysis.findBestMatch(
        candidateImages,
        `${slot.component} ${slot.context}`,
        manifest.config.minRelevanceScore
      );

      if (bestMatch) {
        // Update slot with matched image
        slot.matchedImage = bestMatch.image;
        slot.relevanceScore = bestMatch.score;
        
        matches.push({
          slot,
          image: bestMatch.image,
          score: bestMatch.score
        });

        usedImages.add(bestMatch.image);

        slotSpinner.succeed(
          `${slot.component}: ${chalk.green(path.basename(bestMatch.image))} (${bestMatch.score}%)`
        );
      } else {
        slotSpinner.fail(`No suitable match for ${slot.component}`);
      }
    }

    // Move matched images to approved directory
    if (matches.length > 0) {
      console.log(chalk.cyan('\n📁 Moving matched images to approved directory...\n'));

      for (const match of matches) {
        const filename = path.basename(match.image);
        const source = match.image;
        const destination = path.join('business-images/approved', filename);

        try {
          // Ensure approved directory exists
          await fs.mkdir(path.dirname(destination), { recursive: true });
          
          // Copy file (not move, in case of errors)
          await fs.copyFile(source, destination);
          
          // Update image path in manifest
          manifest.images[destination] = {
            ...manifest.images[source],
            path: destination
          };
          
          // Update slot reference
          match.slot.matchedImage = destination;
          
          console.log(chalk.green(`  ✓ ${filename}`));
        } catch (error) {
          console.log(chalk.red(`  ✗ ${filename}: ${error instanceof Error ? error.message : String(error)}`));
        }
      }
    }

    // Save updated manifest
    spinner.start('Saving matched manifest...');
    await imageRegistry.saveManifest();
    spinner.succeed('Manifest saved');

    // Summary
    console.log(chalk.blue.bold('\n📊 Matching Summary\n'));
    console.log(chalk.green(`✓ Matched: ${matches.length} images`));
    
    const remainingRequired = unmatchedSlots.filter(
      s => s.required && !matches.find(m => m.slot.id === s.id)
    ).length;
    
    if (remainingRequired > 0) {
      console.log(chalk.yellow(`⚠ Still missing: ${remainingRequired} required images`));
    }

    // Show match quality distribution
    if (matches.length > 0) {
      console.log(chalk.cyan('\n📈 Match Quality:\n'));
      const excellent = matches.filter(m => m.score >= 90).length;
      const good = matches.filter(m => m.score >= 80 && m.score < 90).length;
      const fair = matches.filter(m => m.score >= 70 && m.score < 80).length;
      
      if (excellent > 0) console.log(`  Excellent (90-100%): ${chalk.green(excellent)}`);
      if (good > 0) console.log(`  Good (80-89%): ${chalk.yellow(good)}`);
      if (fair > 0) console.log(`  Fair (70-79%): ${chalk.yellow(fair)}`);
    }

    console.log(chalk.cyan('\n✨ Image matching complete!'));
    
    if (remainingRequired > 0) {
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Add more images to business-images/pending/'));
      console.log(chalk.gray('2. Run `npm run images:analyze` to analyze new images'));
      console.log(chalk.gray('3. Run `npm run images:match` again to match remaining slots'));
      console.log(chalk.gray('4. Or run `npm run images:fetch-stock` to get stock photos\n'));
    }

  } catch (error) {
    spinner.fail('Matching failed');
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

// Run the script
matchImages().catch(console.error);