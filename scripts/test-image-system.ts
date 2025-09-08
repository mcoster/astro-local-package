#!/usr/bin/env tsx
/**
 * Test script for the Intelligent Image Injection System
 * 
 * Tests the multi-provider fallback chains:
 * - Vision: OpenAI → Anthropic → Mock
 * - Stock: Unsplash → Pexels → Pixabay
 */

import { imageAnalysis } from '../src/lib/image-analysis';
import { stockPhotoService } from '../src/lib/stock-photos';
import { imageRegistry } from '../src/lib/image-registry';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(60));
}

async function testVisionAPI() {
  logSection('Testing Vision API Fallback Chain');
  
  // Create a test image if it doesn't exist
  const testImagePath = path.join(process.cwd(), 'business-images/pending/test-image.jpg');
  
  try {
    await fs.access(testImagePath);
  } catch {
    log('Creating test image...', colors.yellow);
    // Create a simple test image (1x1 pixel JPEG)
    const jpegData = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0x35, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
      0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
      0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
      0x82, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb,
      0xd5, 0xff, 0xd9
    ]);
    
    await fs.mkdir(path.dirname(testImagePath), { recursive: true });
    await fs.writeFile(testImagePath, jpegData);
  }
  
  log('\nAnalyzing test image with fallback chain...', colors.yellow);
  
  try {
    const analysis = await imageAnalysis.analyzeImage(testImagePath);
    
    log('✓ Image analysis successful!', colors.green);
    log('\nAnalysis Results:', colors.magenta);
    console.log({
      subjects: analysis.subjects,
      scene: analysis.scene,
      quality: analysis.quality,
      confidence: analysis.confidence,
      tags: analysis.tags.slice(0, 5),
      businessRelevance: analysis.businessRelevance
    });
    
    // Check which provider was used (based on confidence)
    if (analysis.confidence === 0.95) {
      log('\n→ Used OpenAI Vision API', colors.green);
    } else if (analysis.confidence === 0.90) {
      log('\n→ Used Anthropic Claude Vision', colors.green);
    } else if (analysis.confidence === 0.75) {
      log('\n→ Used Mock Analysis (fallback)', colors.yellow);
    }
  } catch (error) {
    log(`✗ Vision API test failed: ${error.message}`, colors.red);
  }
}

async function testStockPhotoAPI() {
  logSection('Testing Stock Photo API Fallback Chain');
  
  const testQuery = 'roof cleaning service';
  log(`\nSearching for: "${testQuery}"`, colors.yellow);
  
  try {
    const results = await stockPhotoService.searchPhotos(testQuery, 3);
    
    if (results) {
      log(`✓ Stock photo search successful!`, colors.green);
      log(`\n→ Provider: ${results.provider}`, colors.magenta);
      log(`→ Total results: ${results.totalResults}`, colors.magenta);
      log(`→ Photos returned: ${results.photos.length}`, colors.magenta);
      
      if (results.photos.length > 0) {
        log('\nFirst photo:', colors.blue);
        const photo = results.photos[0];
        console.log({
          id: photo.id,
          photographer: photo.photographer,
          source: photo.source,
          description: photo.description?.substring(0, 100),
          altText: photo.altText
        });
      }
    } else {
      log('✗ No stock photos found (all providers failed)', colors.red);
    }
  } catch (error) {
    log(`✗ Stock photo search failed: ${error.message}`, colors.red);
  }
}

async function testImageRegistry() {
  logSection('Testing Image Registry');
  
  try {
    log('\nScanning for image slots...', colors.yellow);
    const slots = await imageRegistry.scanForImageSlots();
    log(`✓ Found ${slots.length} image slots`, colors.green);
    
    if (slots.length > 0) {
      log('\nExample slots:', colors.blue);
      slots.slice(0, 3).forEach(slot => {
        console.log(`  - ${slot.id}: ${slot.context.substring(0, 50)}...`);
      });
    }
    
    log('\nScanning available images...', colors.yellow);
    const images = await imageRegistry.scanAvailableImages();
    log(`✓ Found ${images.pending} pending, ${images.approved} approved images`, colors.green);
    
  } catch (error) {
    log(`✗ Registry test failed: ${error.message}`, colors.red);
  }
}

async function testFallbackChain() {
  logSection('Testing Complete Fallback Chain');
  
  log('\nSimulating API failures to test fallback...', colors.yellow);
  
  // Temporarily modify environment to test fallback
  const originalOpenAI = process.env.OPENAI_API_KEY;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  
  // Test with no API keys (should fall back to mock)
  process.env.OPENAI_API_KEY = '';
  process.env.ANTHROPIC_API_KEY = '';
  
  try {
    const testImagePath = path.join(process.cwd(), 'business-images/pending/test-fallback.jpg');
    
    // Ensure test image exists
    try {
      await fs.access(testImagePath);
    } catch {
      // Copy the test image
      const sourceImage = path.join(process.cwd(), 'business-images/pending/test-image.jpg');
      await fs.copyFile(sourceImage, testImagePath);
    }
    
    // Force cache clear for this test
    const cacheFile = path.join(process.cwd(), 'business-images/analysis-cache.json');
    try {
      const cache = JSON.parse(await fs.readFile(cacheFile, 'utf-8'));
      delete cache[testImagePath];
      await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
    } catch {
      // Cache might not exist yet
    }
    
    // Create new instance to reload config
    const { ImageAnalysisService } = await import('../src/lib/image-analysis');
    const testService = new ImageAnalysisService();
    
    const analysis = await testService.analyzeImage(testImagePath);
    
    if (analysis.confidence === 0.75) {
      log('✓ Successfully fell back to mock analysis!', colors.green);
    } else {
      log('✗ Unexpected confidence level', colors.red);
    }
    
  } catch (error) {
    log(`✗ Fallback test failed: ${error.message}`, colors.red);
  } finally {
    // Restore original environment
    process.env.OPENAI_API_KEY = originalOpenAI;
    process.env.ANTHROPIC_API_KEY = originalAnthropic;
  }
}

async function main() {
  log('\n🧪 INTELLIGENT IMAGE INJECTION SYSTEM TEST\n', colors.bright + colors.magenta);
  
  try {
    await testVisionAPI();
    await testStockPhotoAPI();
    await testImageRegistry();
    await testFallbackChain();
    
    logSection('Test Summary');
    log('✓ All tests completed!', colors.bright + colors.green);
    log('\nNext steps:', colors.yellow);
    log('1. Add your API keys to .env file', colors.reset);
    log('2. Place images in business-images/pending/', colors.reset);
    log('3. Run: npm run images:process', colors.reset);
    log('4. Check business-images/manifest-report.json for results', colors.reset);
    
  } catch (error) {
    logSection('Test Failed');
    log(`✗ ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);