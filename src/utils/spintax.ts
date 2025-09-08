/**
 * Spintax Template Engine for Location Pages
 * Wraps cnc-spintax with location-specific placeholder replacement
 */

import { Spinner } from 'cnc-spintax';
import type { Suburb } from './locations';

export interface LocationData {
  suburb: Suburb;
  nearbySuburbs?: Suburb[];
  businessName: string;
  serviceRadius: number;
}

export class LocationSpintax {
  private seed?: string;
  
  constructor(seed?: string) {
    this.seed = seed;
  }
  
  /**
   * Process a template with spintax and placeholders
   */
  generateContent(template: string, data: LocationData): string {
    // Step 1: Replace location placeholders
    let processed = this.replacePlaceholders(template, data);
    
    // Step 2: Process spintax
    try {
      // Create a seeded random number generator for consistent results
      if (this.seed) {
        const seedHash = this.hashCode(this.seed);
        // Use a deterministic but efficient approach
        // Process each spintax pattern individually with seeded randomness
        processed = this.processSpintaxWithSeed(processed, seedHash);
        return processed;
      }
      
      // For non-seeded, just use random selection
      const spinner = new Spinner(processed);
      return spinner.unspinRandom();
    } catch (error) {
      console.warn('Spintax parsing error:', error);
      // Return with placeholders replaced but no spintax processing
      return processed;
    }
  }
  
  /**
   * Process spintax patterns with a deterministic seed
   * This is much more efficient than generating all variations
   */
  private processSpintaxWithSeed(text: string, seed: number): string {
    // Process nested spintax from innermost to outermost
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    while (text.includes('{') && text.includes('|') && iterations < maxIterations) {
      iterations++;
      
      // Find the innermost spintax pattern
      const regex = /\{([^{}]*\|[^{}]*)\}/;
      const match = text.match(regex);
      
      if (!match) break;
      
      const fullMatch = match[0];
      const options = match[1].split('|');
      
      // Use seed to select an option deterministically
      const index = Math.abs((seed + iterations) * 2654435761) % options.length;
      const selected = options[index];
      
      // Replace this spintax pattern with the selected option
      text = text.replace(fullMatch, selected);
    }
    
    return text;
  }
  
  /**
   * Replace placeholder tokens with actual data
   */
  private replacePlaceholders(text: string, data: LocationData): string {
    // Guard against undefined text
    if (!text) {
      return '';
    }
    
    const replacements: Record<string, string> = {
      '{{suburb}}': data.suburb.name,
      '{{postcode}}': data.suburb.postcode || '',
      '{{state}}': data.suburb.state,
      '{{distance}}': data.suburb.distanceKm.toString(),
      '{{direction}}': this.getDirectionText(data.suburb.direction),
      '{{businessName}}': data.businessName,
      '{{serviceRadius}}': data.serviceRadius.toString(),
    };
    
    // Handle nearby suburbs list (e.g., {{nearbySuburbs:5}})
    text = text.replace(/\{\{nearbySuburbs:(\d+)\}\}/g, (match, count) => {
      if (!data.nearbySuburbs || data.nearbySuburbs.length === 0) {
        return 'surrounding areas';
      }
      const limit = parseInt(count);
      return data.nearbySuburbs
        .slice(0, limit)
        .map(s => s.name)
        .join(', ');
    });
    
    // Handle random nearby suburb
    text = text.replace(/\{\{randomNearby\}\}/g, () => {
      if (!data.nearbySuburbs || data.nearbySuburbs.length === 0) {
        return 'a nearby area';
      }
      const index = this.seed 
        ? this.hashCode(this.seed + 'nearby') % data.nearbySuburbs.length
        : Math.floor(Math.random() * data.nearbySuburbs.length);
      return data.nearbySuburbs[index].name;
    });
    
    // Handle conditional postcode display
    text = text.replace(/\{\{postcodeWithComma\}\}/g, () => {
      return data.suburb.postcode ? `, ${data.suburb.postcode}` : '';
    });
    
    // Handle postcode without comma
    text = text.replace(/\{\{postcodeSpace\}\}/g, () => {
      return data.suburb.postcode ? ` ${data.suburb.postcode}` : '';
    });
    
    // Handle formatted distance
    text = text.replace(/\{\{distanceFormatted\}\}/g, () => {
      const km = data.suburb.distanceKm;
      if (km < 1) {
        return 'less than 1km';
      } else if (km === Math.floor(km)) {
        return `${km}km`;
      } else {
        return `${km}km`;
      }
    });
    
    // Replace all standard placeholders
    Object.entries(replacements).forEach(([key, value]) => {
      text = text.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return text;
  }
  
  /**
   * Convert direction abbreviation to full text
   */
  private getDirectionText(direction: string): string {
    const directions: Record<string, string> = {
      'N': 'north',
      'NE': 'northeast',
      'E': 'east',
      'SE': 'southeast',
      'S': 'south',
      'SW': 'southwest',
      'W': 'west',
      'NW': 'northwest'
    };
    return directions[direction] || direction.toLowerCase();
  }
  
  /**
   * Simple hash function for consistent seeding
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Validate a spintax template
   */
  static validateTemplate(template: string): boolean {
    try {
      const testSpinner = new Spinner(template);
      testSpinner.unspinRandom();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Count possible variations in a template
   */
  static countVariations(template: string): number {
    try {
      const spinner = new Spinner(template);
      return spinner.maxVariations();
    } catch (error) {
      return 1;
    }
  }
}