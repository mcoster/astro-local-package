/**
 * @module page-renderer
 * @description Unified Page Renderer - Handles dynamic rendering of page sections with context-aware processing
 */

import { getComponent } from './component-registry';
import { LocationSpintax } from './spintax';
import type { LocationData } from './spintax';
import {
  TemplateProcessor,
  ServiceTemplateProcessor,
  LocationTemplateProcessor,
  type TemplateData,
  type ServiceTemplateData,
  type LocationTemplateData
} from './template-processor';

/**
 * Page section configuration
 * @interface PageSection
 * @property {string} component - Component name from registry
 * @property {boolean} [enabled] - Whether section is enabled
 * @property {Record<string, any>} [props] - Component props
 */
export interface PageSection {
  component: string;
  enabled?: boolean;
  props?: Record<string, any>;
}

/**
 * Base context for processing template variables (wraps TemplateProcessor)
 */
export class PageContext {
  protected processor: TemplateProcessor;
  
  constructor(processor: TemplateProcessor) {
    this.processor = processor;
  }
  
  /**
   * Process a string, replacing template variables
   */
  processString(str: string): string {
    return this.processor.processString(str);
  }
  
  /**
   * Process props recursively
   */
  process(props: any): any {
    return this.processor.process(props);
  }
}

/**
 * Context for general pages (homepage, about, contact)
 */
export class TemplateContext extends PageContext {
  constructor(data: TemplateData) {
    super(new TemplateProcessor(data));
  }
}

/**
 * Context for service pages
 */
export class ServiceContext extends PageContext {
  constructor(data: ServiceTemplateData) {
    super(new ServiceTemplateProcessor(data));
  }
}

/**
 * Context for location pages with Spintax support
 */
export class LocationContext extends PageContext {
  private spintax: LocationSpintax;
  private locationData: LocationData;
  
  constructor(locationData: LocationData & { slug: string }) {
    const templateData: LocationTemplateData = {
      ...locationData,
      suburb: locationData.suburb,
      nearbySuburbs: locationData.nearbySuburbs,
      centralLat: locationData.centralLat,
      centralLng: locationData.centralLng
    };
    super(new LocationTemplateProcessor(templateData));
    this.spintax = new LocationSpintax(locationData.slug);
    this.locationData = locationData;
  }
  
  processString(str: string): string {
    // First: Process template variables with LocationTemplateProcessor
    let processed = super.processString(str);
    
    // Then: Process any Spintax patterns
    if (processed.includes('{') && processed.includes('|')) {
      processed = this.spintax.generateContent(processed, this.locationData);
    }
    
    return processed;
  }
  
  /**
   * Override process to ensure strings go through our processString (with spintax)
   */
  process(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    if (typeof value === 'string') {
      // Use our processString which includes spintax processing
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
}

// Removed processProps function - now using TemplateProcessor.process() directly

/**
 * Special handlers for content injection
 */
export interface SpecialHandlers {
  content?: any; // For markdown content injection
  [key: string]: any;
}

/**
 * Calculate background variant based on index
 */
function getVariant(index: number, override?: string): 'white' | 'gray' | 'primary' | 'gradient' | 'transparent' {
  // Allow explicit overrides (e.g., for CTA sections)
  if (override && ['primary', 'gradient', 'transparent'].includes(override)) {
    return override as 'primary' | 'gradient' | 'transparent';
  }
  
  // Alternate between white and gray
  return index % 2 === 0 ? 'white' : 'gray';
}

/**
 * Render page sections with context processing and alternating backgrounds
 * @param {PageSection[]} sections - Array of section configurations
 * @param {PageContext} context - Page context for template processing
 * @param {SpecialHandlers} [specialHandlers] - Optional special content handlers
 * @returns {any[]} Array of rendered section objects with components and props
 * @example
 * const sections = renderPageSections(homepageSections, new TemplateContext(data));
 */
export function renderPageSections(
  sections: PageSection[],
  context: PageContext,
  specialHandlers?: SpecialHandlers
): any[] {
  const renderedSections: any[] = [];
  let sectionIndex = 0;
  
  sections.forEach((section) => {
    // Skip disabled sections
    if (section.enabled === false) {
      return;
    }
    
    // Get component from registry
    const Component = getComponent(section.component);
    if (!Component) {
      console.warn(`Component not found: ${section.component}`);
      return;
    }
    
    // Process props with context
    const processedProps = context.process(section.props || {});
    
    // Add variant prop for background alternation
    // Some components may override this (e.g., CTABanner with gradient)
    if (!processedProps.variant) {
      processedProps.variant = getVariant(sectionIndex, section.props?.variant);
    }
    
    // Special handling for ServiceContent - pass the section index for H2 sections
    if (section.component === 'ServiceContent') {
      processedProps.startIndex = sectionIndex;
    }
    
    // Handle special cases
    if (processedProps.injectContent && specialHandlers?.content) {
      // Special handling for markdown content injection
      renderedSections.push({
        Component,
        props: processedProps,
        children: specialHandlers.content
      });
    } else {
      renderedSections.push({
        Component,
        props: processedProps
      });
    }
    
    // Increment section index
    sectionIndex++;
  });
  
  return renderedSections;
}