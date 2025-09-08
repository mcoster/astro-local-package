#!/usr/bin/env node

/**
 * Generate Manifest Script
 * 
 * Scans all content files to generate a complete manifest of required images
 */

import { imageRegistry } from '../src/lib/image-registry';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

async function generateManifest() {
  console.log(chalk.blue.bold('\n📋 Image Manifest Generator\n'));

  const spinner = ora('Initializing...').start();

  try {
    // Update registry with all discovered slots and images
    spinner.text = 'Scanning content files for image references...';
    await imageRegistry.updateRegistry();
    
    const manifest = await imageRegistry.loadManifest();
    const slots = Object.values(manifest.slots);
    const images = Object.values(manifest.images);

    spinner.succeed('Content scan complete');

    // Generate report
    const report = await imageRegistry.generateReport();

    // Display findings
    console.log(chalk.cyan('\n📊 Manifest Summary\n'));
    
    console.log(chalk.white('Image Requirements:'));
    console.log(`  Total slots: ${chalk.yellow(report.totalSlots)}`);
    console.log(`  Required slots: ${chalk.yellow(report.requiredSlots)}`);
    console.log(`  Matched slots: ${chalk.green(report.matchedSlots)}`);
    console.log(`  Unmatched slots: ${chalk.red(report.unmatchedSlots.length)}`);

    console.log(chalk.white('\nAvailable Images:'));
    console.log(`  Total images: ${chalk.yellow(report.availableImages)}`);
    console.log(`  Unused images: ${chalk.yellow(report.unusedImages.length)}`);

    // List required but unmatched slots
    if (report.unmatchedSlots.length > 0) {
      console.log(chalk.red('\n⚠️  Required images missing:\n'));
      
      for (const slotId of report.unmatchedSlots) {
        const slot = manifest.slots[slotId];
        if (slot) {
          console.log(`  • ${chalk.yellow(slot.component)}: ${slot.context}`);
          if (slot.currentPath) {
            console.log(`    Expected at: ${chalk.gray(slot.currentPath)}`);
          }
        }
      }
    }

    // List unused images
    if (report.unusedImages.length > 0) {
      console.log(chalk.yellow('\n📁 Unused images available:\n'));
      for (const filename of report.unusedImages) {
        console.log(`  • ${filename}`);
      }
    }

    // Generate detailed report file
    spinner.start('Generating detailed report...');
    
    const detailedReport = {
      generated: new Date().toISOString(),
      summary: report,
      requiredSlots: slots.filter(s => s.required).map(s => ({
        id: s.id,
        component: s.component,
        context: s.context,
        currentPath: s.currentPath,
        matched: !!s.matchedImage
      })),
      optionalSlots: slots.filter(s => !s.required).map(s => ({
        id: s.id,
        component: s.component,
        context: s.context,
        currentPath: s.currentPath,
        matched: !!s.matchedImage
      })),
      availableImages: images.map(img => ({
        path: img.path,
        filename: img.filename,
        source: img.source,
        analyzed: img.analyzed
      }))
    };

    const reportPath = path.join(process.cwd(), 'business-images/manifest-report.json');
    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));
    
    spinner.succeed('Detailed report generated');

    console.log(chalk.cyan('\n✨ Manifest generation complete!'));
    console.log(chalk.gray(`\nDetailed report saved to: ${reportPath}`));
    console.log(chalk.gray('Run `npm run images:analyze` to analyze pending images'));
    console.log(chalk.gray('Run `npm run images:match` to match images to slots\n'));

  } catch (error) {
    spinner.fail('Manifest generation failed');
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

// Run the script
generateManifest().catch(console.error);