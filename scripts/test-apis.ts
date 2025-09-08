#!/usr/bin/env tsx
/**
 * API Test Script
 * 
 * Tests all configured APIs individually to verify they're working
 */

import 'dotenv/config';
// import fs from 'fs/promises'; // Unused import
import path from 'path';
import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Unused variable

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

async function testOpenAI() {
  logSection('Testing OpenAI Vision API');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.VISION_MODEL_OPENAI || 'gpt-5';
  
  if (!apiKey) {
    log('✗ OpenAI API key not configured', colors.red);
    return false;
  }
  
  log(`API Key: ${apiKey.substring(0, 20)}...`, colors.yellow);
  log(`Model: ${model}`, colors.yellow);
  
  try {
    // Create a simple test image
    const testImage = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
    ]).toString('base64');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What do you see in this image?'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${testImage}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✓ OpenAI Vision API is working!', colors.green);
      return true;
    } else {
      log(`✗ OpenAI API error: ${data.error?.message || JSON.stringify(data)}`, colors.red);
      if (data.error?.type === 'invalid_request_error' && data.error?.code === 'model_not_found') {
        log('  Note: The specified model may not exist or you may not have access to it', colors.yellow);
      }
      return false;
    }
  } catch (error) {
    log(`✗ OpenAI API test failed: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    return false;
  }
}

async function testAnthropic() {
  logSection('Testing Anthropic Claude Vision API');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.VISION_MODEL_ANTHROPIC || 'claude-sonnet-4-20250514';
  
  if (!apiKey) {
    log('✗ Anthropic API key not configured', colors.red);
    return false;
  }
  
  log(`API Key: ${apiKey.substring(0, 20)}...`, colors.yellow);
  log(`Model: ${model}`, colors.yellow);
  
  try {
    // Create a simple test image
    const testImage = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
    ]).toString('base64');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: testImage
                }
              },
              {
                type: 'text',
                text: 'What do you see in this image?'
              }
            ]
          }
        ]
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Anthropic Claude Vision API is working!', colors.green);
      return true;
    } else {
      log(`✗ Anthropic API error: ${data.error?.message || JSON.stringify(data)}`, colors.red);
      if (data.error?.type === 'invalid_request_error') {
        log('  Note: The specified model may not exist or the format may be incorrect', colors.yellow);
      }
      return false;
    }
  } catch (error) {
    log(`✗ Anthropic API test failed: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    return false;
  }
}

async function testUnsplash() {
  logSection('Testing Unsplash API');
  
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!apiKey) {
    log('✗ Unsplash API key not configured', colors.red);
    return false;
  }
  
  log(`API Key: ${apiKey.substring(0, 20)}...`, colors.yellow);
  
  try {
    const response = await fetch(
      'https://api.unsplash.com/search/photos?query=roof+cleaning&per_page=1',
      {
        headers: {
          'Authorization': `Client-ID ${apiKey}`
        }
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Unsplash API is working!', colors.green);
      log(`  Found ${data.total} results for "roof cleaning"`, colors.magenta);
      if (data.results.length > 0) {
        log(`  Example: ${data.results[0].description || data.results[0].alt_description}`, colors.magenta);
      }
      return true;
    } else {
      log(`✗ Unsplash API error: ${data.errors?.join(', ') || JSON.stringify(data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Unsplash API test failed: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    return false;
  }
}

async function testPexels() {
  logSection('Testing Pexels API');
  
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    log('✗ Pexels API key not configured', colors.red);
    return false;
  }
  
  log(`API Key: ${apiKey.substring(0, 20)}...`, colors.yellow);
  
  try {
    const response = await fetch(
      'https://api.pexels.com/v1/search?query=roof+cleaning&per_page=1',
      {
        headers: {
          'Authorization': apiKey
        }
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      log('✓ Pexels API is working!', colors.green);
      log(`  Found ${data.total_results} results for "roof cleaning"`, colors.magenta);
      if (data.photos.length > 0) {
        log(`  Example: ${data.photos[0].alt}`, colors.magenta);
      }
      return true;
    } else {
      log(`✗ Pexels API error: ${data.error || JSON.stringify(data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Pexels API test failed: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    return false;
  }
}

async function testPixabay() {
  logSection('Testing Pixabay API');
  
  const apiKey = process.env.PIXABAY_API_KEY;
  
  if (!apiKey) {
    log('✗ Pixabay API key not configured', colors.red);
    return false;
  }
  
  log(`API Key: ${apiKey.substring(0, 20)}...`, colors.yellow);
  
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=roof+cleaning&per_page=1&image_type=photo`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (response.ok && !data.error) {
      log('✓ Pixabay API is working!', colors.green);
      log(`  Found ${data.totalHits} results for "roof cleaning"`, colors.magenta);
      if (data.hits.length > 0) {
        log(`  Example: ${data.hits[0].tags}`, colors.magenta);
      }
      return true;
    } else {
      log(`✗ Pixabay API error: ${data.error || JSON.stringify(data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Pixabay API test failed: ${error instanceof Error ? error.message : String(error)}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🔧 API CONFIGURATION TEST\n', colors.bright + colors.magenta);
  
  log('Environment variables loaded from .env', colors.yellow);
  
  const results = {
    openai: await testOpenAI(),
    anthropic: await testAnthropic(),
    unsplash: await testUnsplash(),
    pexels: await testPexels(),
    pixabay: await testPixabay()
  };
  
  logSection('Test Summary');
  
  const workingAPIs = Object.entries(results).filter(([_, working]) => working);
  const failedAPIs = Object.entries(results).filter(([_, working]) => !working);
  
  if (workingAPIs.length > 0) {
    log('\n✓ Working APIs:', colors.green);
    workingAPIs.forEach(([api]) => {
      log(`  • ${api.charAt(0).toUpperCase() + api.slice(1)}`, colors.green);
    });
  }
  
  if (failedAPIs.length > 0) {
    log('\n✗ Failed/Unconfigured APIs:', colors.red);
    failedAPIs.forEach(([api]) => {
      log(`  • ${api.charAt(0).toUpperCase() + api.slice(1)}`, colors.red);
    });
  }
  
  log('\nRecommendations:', colors.yellow);
  
  if (!results.openai && !results.anthropic) {
    log('  • At least one vision API (OpenAI or Anthropic) should be configured', colors.yellow);
    log('    The system will fall back to mock analysis without them', colors.yellow);
  }
  
  if (!results.unsplash && !results.pexels && !results.pixabay) {
    log('  • At least one stock photo API should be configured', colors.yellow);
    log('    The system will use placeholders without them', colors.yellow);
  }
  
  if (workingAPIs.length > 0) {
    log('\n✓ Ready to process images!', colors.bright + colors.green);
    log('\nNext steps:', colors.yellow);
    log('  1. Run: npm run images:fetch-stock', colors.reset);
    log('  2. Run: npm run images:process', colors.reset);
  }
}

// Run tests
main().catch(console.error);