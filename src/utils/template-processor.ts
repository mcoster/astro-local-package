/**
 * @module template-processor
 * @description Unified Template Processor - Consolidates all template variable and shortcode processing logic
 * to eliminate redundancy across the codebase.
 */

import type { Suburb } from './locations';

/**
 * Base template data structure
 * @interface TemplateData
 * @property {string} [businessName] - Name of the business
 * @property {string} [phone] - Business phone number
 * @property {string} [email] - Business email address
 * @property {string} [formattedPhone] - Phone number formatted for tel: links
 * @property {string} [street] - Street address
 * @property {string} [city] - City name
 * @property {string} [state] - State/province code
 * @property {string} [postcode] - Postal/ZIP code
 * @property {string} [mainLocation] - Computed city, state postcode string
 * @property {string} [governingState] - Legal jurisdiction state
 * @property {string} [governingCity] - Legal jurisdiction city
 * @property {string|number} [serviceRadius] - Service area radius
 */
export interface TemplateData {
  businessName?: string;
  phone?: string;
  email?: string;
  formattedPhone?: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  mainLocation?: string;
  governingState?: string;
  governingCity?: string;
  serviceRadius?: string | number;
  [key: string]: any;
}

/**
 * Service-specific template data
 */
export interface ServiceTemplateData extends TemplateData {
  title?: string;
  description?: string;
  slug?: string;
  image?: string;
  excerpt?: string;
}

/**
 * Location-specific template data
 */
export interface LocationTemplateData extends TemplateData {
  suburb?: Suburb;
  nearbySuburbs?: Suburb[];
  centralLat?: number;
  centralLng?: number;
  mainServiceCategory?: string;
}

/**
 * Unified template processor for all template variable replacement
 */
export class TemplateProcessor {
  private data: TemplateData;
  
  constructor(data: TemplateData = {}) {
    this.data = this.computeDerivedValues(data);
  }
  
  /**
   * Compute derived values from base data
   * @private
   * @param {TemplateData} data - Input template data
   * @returns {TemplateData} Data with computed values added
   */
  private computeDerivedValues(data: TemplateData): TemplateData {
    const computed = { ...data };
    
    // Compute mainLocation if not provided
    if (!computed.mainLocation && computed.city && computed.state && computed.postcode) {
      computed.mainLocation = `${computed.city}, ${computed.state} ${computed.postcode}`;
    }
    
    // Compute formattedPhone if not provided
    if (!computed.formattedPhone && computed.phone) {
      computed.formattedPhone = computed.phone.replace(/\D/g, '');
    }
    
    // Legal jurisdiction is always Queensland (where Web and Glow Pty Ltd is registered)
    computed.governingState = 'Queensland';
    computed.governingCity = 'Brisbane';
    
    return computed;
  }
  
  /**
   * Process a string, replacing all template variables
   * @param {string} str - String containing template variables
   * @returns {string} Processed string with variables replaced
   * @example
   * processor.processString('Welcome to {{businessName}}!')
   * // Returns: 'Welcome to ACME Corp!'
   */
  processString(str: string): string {
    let processed = str;
    
    // Replace all template variables
    Object.entries(this.data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, String(value));
      }
    });
    
    return processed;
  }
  
  /**
   * Process any value recursively (string, array, or object)
   * @param {any} value - Value to process (can be string, array, or object)
   * @returns {any} Processed value with all template variables replaced
   */
  process(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'string') {
      return this.processString(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.process(item));
    }
    
    if (typeof value === 'object') {
      const processed: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = this.process(val);
      }
      return processed;
    }
    
    return value;
  }
  
  /**
   * Update data and recompute derived values
   */
  updateData(data: Partial<TemplateData>): void {
    this.data = this.computeDerivedValues({ ...this.data, ...data });
  }
  
  /**
   * Get all current data
   */
  getData(): TemplateData {
    return { ...this.data };
  }
}

/**
 * Service-specific template processor
 */
export class ServiceTemplateProcessor extends TemplateProcessor {
  constructor(data: ServiceTemplateData) {
    super(data);
  }
  
  processString(str: string): string {
    let processed = str;
    
    // Service-specific replacements with fallback to generic
    const serviceData = this.getData() as ServiceTemplateData;
    processed = processed
      .replace(/{{serviceTitle}}/g, serviceData.title || '')
      .replace(/{{serviceDescription}}/g, serviceData.description || '')
      .replace(/{{serviceSlug}}/g, serviceData.slug || '')
      .replace(/{{serviceImage}}/g, serviceData.image || '')
      .replace(/{{serviceExcerpt}}/g, serviceData.excerpt || '');
    
    // Process remaining variables with base processor
    return super.processString(processed);
  }
}

/**
 * Location-specific template processor with Spintax support
 */
export class LocationTemplateProcessor extends TemplateProcessor {
  private suburb?: Suburb;
  private nearbySuburbs?: Suburb[];
  private centralLat?: number;
  private centralLng?: number;
  
  constructor(data: LocationTemplateData) {
    super(data);
    this.suburb = data.suburb;
    this.nearbySuburbs = data.nearbySuburbs;
    this.centralLat = data.centralLat;
    this.centralLng = data.centralLng;
  }
  
  processString(str: string): string {
    let processed = str;
    
    // Location-specific replacements
    if (this.suburb) {
      processed = processed
        .replace(/{{suburb}}/g, this.suburb.name)
        .replace(/{{postcode}}/g, this.suburb.postcode)
        .replace(/{{postcodeSpace}}/g, ` ${this.suburb.postcode}`)
        .replace(/{{postcodeWithComma}}/g, `, ${this.suburb.postcode}`)
        .replace(/{{state}}/g, this.suburb.state);
      
      // Calculate distance if available
      if (this.suburb.distance_km) {
        const distance = `${Math.round(this.suburb.distance_km)} km`;
        processed = processed.replace(/{{distance}}/g, distance);
      }
      
      // Calculate direction if coordinates available
      if (this.suburb.lat && this.suburb.lng && this.centralLat && this.centralLng) {
        const direction = this.getCompassDirection(
          this.centralLat,
          this.centralLng,
          this.suburb.lat,
          this.suburb.lng
        );
        processed = processed.replace(/{{direction}}/g, direction);
      }
    }
    
    // Handle nearbySuburbs with count
    const nearbyMatch = processed.match(/{{nearbySuburbs:(\d+)}}/);
    if (nearbyMatch && this.nearbySuburbs) {
      const count = parseInt(nearbyMatch[1]);
      const suburbs = this.nearbySuburbs
        .slice(0, count)
        .map(s => s.name)
        .join(', ');
      processed = processed.replace(nearbyMatch[0], suburbs);
    }
    
    // Handle randomNearby
    if (processed.includes('{{randomNearby}}') && this.nearbySuburbs && this.nearbySuburbs.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, this.nearbySuburbs.length));
      const randomSuburb = this.nearbySuburbs[randomIndex].name;
      processed = processed.replace(/{{randomNearby}}/g, randomSuburb);
    }
    
    // Process remaining variables with base processor
    return super.processString(processed);
  }
  
  /**
   * Calculate compass direction from one point to another
   */
  private getCompassDirection(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const dLng = lng2 - lng1;
    const dLat = lat2 - lat1;
    const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((angle + 360) % 360) / 45) % 8;
    
    return directions[index];
  }
}

/**
 * Factory function to create appropriate processor based on context
 * @param {('general'|'service'|'location')} context - Processing context type
 * @param {TemplateData} data - Template data for processing
 * @returns {TemplateProcessor} Appropriate processor instance for the context
 * @example
 * const processor = createTemplateProcessor('service', serviceData);
 */
export function createTemplateProcessor(
  context: 'general' | 'service' | 'location',
  data: TemplateData
): TemplateProcessor {
  switch (context) {
    case 'service':
      return new ServiceTemplateProcessor(data as ServiceTemplateData);
    case 'location':
      return new LocationTemplateProcessor(data as LocationTemplateData);
    default:
      return new TemplateProcessor(data);
  }
}

/**
 * Check for unprocessed template variables in a string
 */
export function findUnprocessedVariables(text: string): string[] {
  const matches = text.match(/{{[^}]+}}/g);
  return matches || [];
}

/**
 * Validate that all required variables are present in data
 */
export function validateTemplateData(
  data: TemplateData,
  required: string[]
): { valid: boolean; missing: string[] } {
  const missing = required.filter(key => !data[key]);
  return {
    valid: missing.length === 0,
    missing
  };
}