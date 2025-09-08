#!/usr/bin/env tsx

/**
 * Test script for the alt text generation system
 * Verifies that alt text is properly generated from image filenames
 */

import { generateAltTextFromPath, getAltText } from '../src/lib/image-alt-generator';

// Test cases for various filename formats
const testCases = [
  {
    path: 'public/images/solar panels getting cleaned by professional roof cleaning experts.jpg',
    expected: 'Solar Panels Getting Cleaned By Professional Roof Cleaning Experts'
  },
  {
    path: 'public/images/roof-cleaning-process.jpg',
    expected: 'Roof Cleaning Process'
  },
  {
    path: '/images/metal_roof_cleaning.png',
    expected: 'Metal Roof Cleaning'
  },
  {
    path: 'hero-bg.webp',
    expected: 'Hero Bg'
  },
  {
    path: '/public/images/Cleaning-gutters-with-pressure-washer.jpg',
    expected: 'Cleaning Gutters With Pressure Washer'
  },
  {
    path: 'images/services/tile-roof.jpg',
    expected: 'Tile Roof'
  },
  {
    path: 'recently-cleaned-grey-metal-roof.jpg',
    expected: 'Recently Cleaned Grey Metal Roof'
  },
  {
    path: undefined,
    expected: ''
  },
  {
    path: null,
    expected: ''
  },
  {
    path: '',
    expected: ''
  }
];

console.log('🧪 Testing Alt Text Generation\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

// Test generateAltTextFromPath
console.log('\n📝 Testing generateAltTextFromPath():\n');

testCases.forEach((testCase, index) => {
  const result = generateAltTextFromPath(testCase.path);
  const isPass = result === testCase.expected;
  
  if (isPass) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASSED`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAILED`);
    console.log(`   Path: ${testCase.path}`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got: "${result}"`);
  }
});

// Test getAltText with fallbacks
console.log('\n📝 Testing getAltText() with fallbacks:\n');

const fallbackTests = [
  {
    providedAlt: 'Custom Alt Text',
    imagePath: '/images/test.jpg',
    fallback: 'Default',
    expected: 'Custom Alt Text',
    description: 'Should use provided alt text when available'
  },
  {
    providedAlt: '',
    imagePath: '/images/roof-cleaning.jpg',
    fallback: 'Default',
    expected: 'Roof Cleaning',
    description: 'Should generate from path when alt is empty'
  },
  {
    providedAlt: undefined,
    imagePath: '/images/solar-panels.jpg',
    fallback: 'Default',
    expected: 'Solar Panels',
    description: 'Should generate from path when alt is undefined'
  },
  {
    providedAlt: '',
    imagePath: '',
    fallback: 'Fallback Image',
    expected: 'Fallback Image',
    description: 'Should use fallback when both are empty'
  }
];

fallbackTests.forEach((test, index) => {
  const result = getAltText(test.providedAlt, test.imagePath, test.fallback);
  const isPass = result === test.expected;
  
  if (isPass) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${test.description} - PASSED`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${test.description} - FAILED`);
    console.log(`   Expected: "${test.expected}"`);
    console.log(`   Got: "${result}"`);
  }
});

// Summary
console.log('\n' + '=' .repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${passed + failed}`);
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Alt text generation is working correctly.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}