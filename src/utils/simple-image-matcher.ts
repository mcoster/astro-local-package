/**
 * Simple Image Matcher
 * 
 * A lightweight alternative to the complex AI-based image analysis system.
 * Matches images to website sections based on filename patterns and basic metadata.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Simple image metadata without AI analysis
 */
export interface SimpleImageData {
  path: string;
  filename: string;
  keywords: string[];
  category?: string;
  priority?: number;
}

/**
 * Slot requirement for image matching
 */
export interface ImageSlot {
  id: string;
  component: string;
  keywords: string[];
  required: boolean;
  matchedImage?: string;
  relevanceScore?: number;
}

/**
 * Extract keywords from filename
 * @param filename - Image filename
 * @returns Array of keywords
 */
function extractKeywordsFromFilename(filename: string): string[] {
  // Remove extension and path
  const baseName = path.basename(filename, path.extname(filename));
  
  // Split by common separators and filter
  const keywords = baseName
    .toLowerCase()
    .split(/[-_\s]+/)
    .filter(word => word.length > 2 && !['jpg', 'png', 'jpeg', 'webp', 'svg'].includes(word));
  
  return keywords;
}

/**
 * Calculate relevance score between image and slot
 * @param image - Image data
 * @param slot - Slot requirements
 * @returns Relevance score (0-100)
 */
function calculateRelevanceScore(image: SimpleImageData, slot: ImageSlot): number {
  let score = 0;
  const slotKeywords = slot.keywords.map(k => k.toLowerCase());
  const imageKeywords = image.keywords.map(k => k.toLowerCase());
  
  // Check for exact matches
  for (const slotKeyword of slotKeywords) {
    if (imageKeywords.includes(slotKeyword)) {
      score += 30;
    }
    // Partial matches
    else if (imageKeywords.some(k => k.includes(slotKeyword) || slotKeyword.includes(k))) {
      score += 15;
    }
  }
  
  // Check component name match
  const componentName = slot.component.toLowerCase().replace(/[^a-z]/g, '');
  if (image.filename.toLowerCase().includes(componentName)) {
    score += 20;
  }
  
  // Category match
  if (image.category && slot.id.includes(image.category)) {
    score += 10;
  }
  
  // Priority bonus
  if (image.priority) {
    score += image.priority * 5;
  }
  
  return Math.min(100, score);
}

/**
 * Simple image matcher class
 */
export class SimpleImageMatcher {
  private imageDir: string;
  private images: SimpleImageData[] = [];
  
  constructor(imageDir: string = 'business-images/pending') {
    this.imageDir = imageDir;
  }
  
  /**
   * Load and index all images
   */
  async loadImages(): Promise<void> {
    try {
      const files = await fs.readdir(this.imageDir);
      
      this.images = files
        .filter(file => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
        .map(filename => {
          const keywords = extractKeywordsFromFilename(filename);
          
          // Detect category from keywords
          let category: string | undefined;
          if (keywords.some(k => ['hero', 'banner', 'header'].includes(k))) {
            category = 'hero';
          } else if (keywords.some(k => ['service', 'work', 'job'].includes(k))) {
            category = 'service';
          } else if (keywords.some(k => ['team', 'staff', 'about'].includes(k))) {
            category = 'about';
          } else if (keywords.some(k => ['contact', 'location', 'map'].includes(k))) {
            category = 'contact';
          }
          
          return {
            path: path.join(this.imageDir, filename),
            filename,
            keywords,
            category,
            priority: 0
          };
        });
      
      console.log(`Loaded ${this.images.length} images for matching`);
    } catch (error) {
      console.error('Failed to load images:', error);
      this.images = [];
    }
  }
  
  /**
   * Match images to slots based on keywords
   * @param slots - Array of image slots to match
   * @returns Matched slots with image paths
   */
  matchImages(slots: ImageSlot[]): ImageSlot[] {
    const matchedSlots = [...slots];
    const usedImages = new Set<string>();
    
    // Sort slots by priority (required first)
    const sortedSlots = matchedSlots.sort((a, b) => {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return 0;
    });
    
    for (const slot of sortedSlots) {
      // Skip if already matched
      if (slot.matchedImage) {
        usedImages.add(slot.matchedImage);
        continue;
      }
      
      // Calculate scores for all available images
      const imageScores = this.images
        .filter(img => !usedImages.has(img.path))
        .map(img => ({
          image: img,
          score: calculateRelevanceScore(img, slot)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
      
      // Use the best match if score is acceptable
      if (imageScores.length > 0 && imageScores[0].score >= 30) {
        slot.matchedImage = imageScores[0].image.path;
        slot.relevanceScore = imageScores[0].score;
        usedImages.add(imageScores[0].image.path);
      }
    }
    
    return matchedSlots;
  }
  
  /**
   * Get matching statistics
   * @param slots - Matched slots
   * @returns Statistics object
   */
  getStatistics(slots: ImageSlot[]): {
    total: number;
    matched: number;
    required: number;
    requiredMatched: number;
    averageScore: number;
  } {
    const matched = slots.filter(s => s.matchedImage);
    const required = slots.filter(s => s.required);
    const requiredMatched = required.filter(s => s.matchedImage);
    
    const totalScore = matched.reduce((sum, s) => sum + (s.relevanceScore || 0), 0);
    const averageScore = matched.length > 0 ? totalScore / matched.length : 0;
    
    return {
      total: slots.length,
      matched: matched.length,
      required: required.length,
      requiredMatched: requiredMatched.length,
      averageScore: Math.round(averageScore)
    };
  }
}

/**
 * Quick match function for simple use cases
 * @param imageDir - Directory containing images
 * @param slots - Slots to match
 * @returns Matched slots
 */
export async function quickMatch(
  imageDir: string,
  slots: ImageSlot[]
): Promise<ImageSlot[]> {
  const matcher = new SimpleImageMatcher(imageDir);
  await matcher.loadImages();
  return matcher.matchImages(slots);
}

/**
 * Generate match report
 * @param slots - Matched slots
 * @returns Formatted report string
 */
export function generateMatchReport(slots: ImageSlot[]): string {
  const matcher = new SimpleImageMatcher();
  const stats = matcher.getStatistics(slots);
  
  let report = '📊 Image Matching Report\n';
  report += '========================\n\n';
  
  report += `Total Slots: ${stats.total}\n`;
  report += `Matched: ${stats.matched} (${Math.round(stats.matched / stats.total * 100)}%)\n`;
  report += `Required Matched: ${stats.requiredMatched}/${stats.required}\n`;
  report += `Average Match Score: ${stats.averageScore}%\n\n`;
  
  report += 'Matched Slots:\n';
  report += '--------------\n';
  
  for (const slot of slots.filter(s => s.matchedImage)) {
    report += `✓ ${slot.component}: ${path.basename(slot.matchedImage!)} (${slot.relevanceScore}%)\n`;
  }
  
  if (slots.some(s => !s.matchedImage)) {
    report += '\nUnmatched Slots:\n';
    report += '----------------\n';
    
    for (const slot of slots.filter(s => !s.matchedImage)) {
      const marker = slot.required ? '❌' : '⚠️';
      report += `${marker} ${slot.component}${slot.required ? ' (REQUIRED)' : ''}\n`;
    }
  }
  
  return report;
}