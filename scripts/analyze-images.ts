#!/usr/bin/env node

/**
 * Analyze Images Script
 * 
 * Analyzes all images in the business-images/pending directory
 * and generates analysis metadata for each image
 */

import { glob } from 'glob';
import { imageAnalysis } from '../src/lib/image-analysis';
import { imageRegistry } from '../src/lib/image-registry';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';

async function analyzeImages() {
  console.log(chalk.blue.bold('\n🔍 Image Analysis Tool\n'));

  const spinner = ora('Loading image manifest...').start();

  try {
    // Load the manifest
    await imageRegistry.loadManifest();
    spinner.succeed('Manifest loaded');

    // Find pending images
    spinner.start('Scanning for pending images...');
    const pendingImages = await glob('business-images/pending/**/*.{jpg,jpeg,png,webp}');
    
    if (pendingImages.length === 0) {
      spinner.warn('No pending images found');
      console.log(chalk.yellow('\n📁 Place images in business-images/pending/ to analyze them\n'));
      return;
    }

    spinner.succeed(`Found ${pendingImages.length} pending images`);

    // Analyze each image
    console.log(chalk.cyan('\n📸 Analyzing images...\n'));
    
    const analyses = new Map();
    let successCount = 0;
    let failCount = 0;

    for (const imagePath of pendingImages) {
      const filename = path.basename(imagePath);
      const imageSpinner = ora(`Analyzing ${filename}...`).start();

      try {
        const analysis = await imageAnalysis.analyzeImage(imagePath);
        analyses.set(imagePath, analysis);
        
        imageSpinner.succeed(`${filename} ✓`);
        
        // Display key findings
        console.log(chalk.gray(`  Subjects: ${analysis.subjects.join(', ')}`));
        console.log(chalk.gray(`  Scene: ${analysis.scene}`));
        console.log(chalk.gray(`  Quality: ${analysis.quality}/100`));
        
        if (analysis.businessRelevance) {
          const relevantTypes = [];
          if (analysis.businessRelevance.isTeamPhoto) relevantTypes.push('Team Photo');
          if (analysis.businessRelevance.isServiceAction) relevantTypes.push('Service Action');
          if (analysis.businessRelevance.isBeforeAfter) relevantTypes.push('Before/After');
          if (analysis.businessRelevance.isBuilding) relevantTypes.push('Building/Location');
          
          if (relevantTypes.length > 0) {
            console.log(chalk.green(`  Business Type: ${relevantTypes.join(', ')}`));
          }
        }
        
        console.log('');
        successCount++;
      } catch (error) {
        imageSpinner.fail(`${filename} ✗`);
        console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}\n`));
        failCount++;
      }
    }

    // Summary
    console.log(chalk.blue.bold('\n📊 Analysis Summary\n'));
    console.log(chalk.green(`✓ Successfully analyzed: ${successCount} images`));
    if (failCount > 0) {
      console.log(chalk.red(`✗ Failed to analyze: ${failCount} images`));
    }

    // Save updated manifest
    spinner.start('Saving analysis results...');
    await imageRegistry.saveManifest();
    spinner.succeed('Analysis results saved');

    console.log(chalk.cyan('\n✨ Analysis complete!'));
    console.log(chalk.gray('Run `npm run images:match` to match images to website sections\n'));

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
    process.exit(1);
  }
}

// Run the script
analyzeImages().catch(console.error);