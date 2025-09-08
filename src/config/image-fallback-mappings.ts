/**
 * Image Fallback Mappings Configuration
 * 
 * Maps non-existent service images to existing alternatives.
 * This configuration is used by remark-two-column and other image processing components.
 */

export const imageFallbackMappings: Record<string, string> = {
  // Water damage services
  '/images/services/water-damage.jpg': '/images/professional roof cleaner clearing gutters from debris and leaves.jpg',
  
  // Gutter services
  '/images/services/gutter-inspection.jpg': '/images/expert roof cleaning professionals clearing and washing residential gutters.jpg',
  '/images/services/debris-removal.jpg': '/images/professional roof cleaner clearing gutters from debris and leaves.jpg',
  '/images/services/downpipe-clearing.jpg': '/images/gutters getting cleared and cleaned by professional roof cleaner.jpg',
  '/images/services/gutter-flushing.jpg': '/images/expert roof cleaning professionals clearing and washing residential gutters.jpg',
  '/images/services/final-inspection.jpg': '/images/professional roof cleaner clearing gutters from debris and leaves.jpg',
  '/images/services/gutter-guards.jpg': '/images/gutters getting cleared and cleaned by professional roof cleaner.jpg',
  '/images/services/gutter-repairs.jpg': '/images/expert roof cleaning professionals clearing and washing residential gutters.jpg',
  
  // Roof services
  '/images/services/roof-valleys.jpg': '/images/roof getting washed with gentle pressure cleaning by professional cleaner.jpg',
  '/images/services/protect-investment.jpg': '/images/beige roof tiles before and after professional soft washing.jpg',
  '/images/services/safety-equipment.jpg': '/images/professional roof cleaning company washing tiled roof and skylight.jpg',
  '/images/services/cleaning-schedule.jpg': '/images/roof cleaning specialist washing a tiled roof.jpg',
  '/images/services/warning-signs.jpg': '/images/tiled roof with grime and mould getting professionally cleaned.jpg',
  '/images/services/package-deal.jpg': '/images/professional roof cleaning company washing tiled roof and skylight.jpg'
};

/**
 * Get fallback image path if available
 * @param originalPath - The original image path that may not exist
 * @returns The fallback image path if mapped, otherwise the original path
 */
export function getFallbackImage(originalPath: string): string {
  return imageFallbackMappings[originalPath] || originalPath;
}

/**
 * Check if an image path has a fallback mapping
 * @param imagePath - The image path to check
 * @returns True if a fallback mapping exists
 */
export function hasFallbackImage(imagePath: string): boolean {
  return imagePath in imageFallbackMappings;
}

/**
 * Get all fallback mappings
 * @returns All configured fallback mappings
 */
export function getAllFallbackMappings(): Record<string, string> {
  return { ...imageFallbackMappings };
}