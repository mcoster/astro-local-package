#!/usr/bin/env tsx

/**
 * Fetch Stock Photos Script
 * 
 * Fetches stock photos for unmatched image slots using multiple providers
 */

import 'dotenv/config';
import { imageRegistry } from '../src/lib/image-registry';
import { stockPhotoService } from '../src/lib/stock-photos';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

async function fetchStockPhotos() {
  console.log(chalk.blue.bold('\n📷 Stock Photo Fetcher\n'));

  const spinner = ora('Loading manifest...').start();

  try {
    // Load manifest
    const manifest = await imageRegistry.loadManifest();
    spinner.succeed('Manifest loaded');

    // Find unmatched required slots
    const unmatchedSlots = Object.values(manifest.slots).filter(
      slot => slot.required && !slot.matchedImage
    );

    if (unmatchedSlots.length === 0) {
      spinner.info('All required slots are already matched');
      return;
    }

    console.log(chalk.cyan(`\n🔍 Found ${unmatchedSlots.length} unmatched required slots\n`));

    // Check if any stock API is configured
    const hasStockAPI = !!(
      process.env.UNSPLASH_ACCESS_KEY ||
      process.env.PEXELS_API_KEY ||
      process.env.PIXABAY_API_KEY
    );

    if (!hasStockAPI) {
      console.log(chalk.yellow('⚠️  No stock photo APIs configured\n'));
      console.log(chalk.gray('Configure at least one of these in your .env file:'));
      console.log(chalk.gray('  • UNSPLASH_ACCESS_KEY (recommended)'));
      console.log(chalk.gray('  • PEXELS_API_KEY'));
      console.log(chalk.gray('  • PIXABAY_API_KEY'));
      console.log(chalk.gray('\nGet API keys from:'));
      console.log(chalk.gray('  • Unsplash: https://unsplash.com/developers'));
      console.log(chalk.gray('  • Pexels: https://www.pexels.com/api/'));
      console.log(chalk.gray('  • Pixabay: https://pixabay.com/api/docs/\n'));
      return;
    }

    // Destination for downloaded photos
    const stockPhotosDir = path.join('business-images/stock');

    // Fetch stock photos for each unmatched slot
    let successCount = 0;
    let failCount = 0;

    for (const slot of unmatchedSlots) {
      const slotSpinner = ora(`Searching for: ${slot.context}...`).start();

      try {
        // Generate search context
        const searchContext = `${slot.component} ${slot.context}`.replace(/_/g, ' ');
        
        // Fetch best matching photo
        const photoPath = await stockPhotoService.fetchBestMatch(
          searchContext,
          stockPhotosDir
        );

        if (photoPath) {
          // Update slot with matched stock photo
          slot.matchedImage = photoPath;
          slot.relevanceScore = 75; // Default score for stock photos
          
          // Update manifest
          manifest.images[photoPath] = {
            path: photoPath,
            filename: path.basename(photoPath),
            source: 'stock',
            analyzed: false
          };

          slotSpinner.succeed(`${slot.component}: ${chalk.green(path.basename(photoPath))}`);
          successCount++;
        } else {
          slotSpinner.fail(`${slot.component}: No suitable stock photo found`);
          failCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        slotSpinner.fail(`${slot.component}: ${errorMessage}`);
        failCount++;
        
        // Check for rate limiting
        if (errorMessage.includes('429') || errorMessage.includes('rate')) {
          console.log(chalk.yellow('\n⚠️  Rate limit reached. Waiting 60 seconds...\n'));
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    }

    // Save updated manifest
    if (successCount > 0) {
      spinner.start('Saving manifest...');
      await imageRegistry.saveManifest();
      spinner.succeed('Manifest saved');
    }

    // Summary
    console.log(chalk.blue.bold('\n📊 Stock Photo Summary\n'));
    console.log(chalk.green(`✓ Downloaded: ${successCount} photos`));
    if (failCount > 0) {
      console.log(chalk.red(`✗ Failed: ${failCount} slots`));
    }

    // Show provider usage
    const providersUsed = new Set();
    Object.values(manifest.images).forEach((img: any) => {
      if (img.source === 'stock' && img.path.includes('-')) {
        const provider = img.path.split('-')[0].split('/').pop();
        providersUsed.add(provider);
      }
    });

    if (providersUsed.size > 0) {
      console.log(chalk.cyan('\n📸 Providers Used:'));
      providersUsed.forEach(provider => {
        console.log(`  • ${provider}`);
      });
    }

    // Next steps
    if (successCount > 0) {
      console.log(chalk.cyan('\n✨ Stock photos downloaded successfully!'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Review downloaded photos in business-images/stock/'));
      console.log(chalk.gray('2. Check attribution files for license requirements'));
      console.log(chalk.gray('3. Run `npm run images:analyze` to analyze stock photos'));
      console.log(chalk.gray('4. Run `npm run images:match` to update mappings\n'));
    }

  } catch (error) {
    spinner.fail('Stock photo fetching failed');
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

// Run the script
fetchStockPhotos().catch(console.error);