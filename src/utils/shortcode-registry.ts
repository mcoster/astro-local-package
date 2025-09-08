/**
 * Shortcode Registry
 * Central registry of all available shortcodes in the system
 * Used for validation, documentation, and error reporting
 */

export interface ShortcodeDefinition {
  name: string;
  description: string;
  contexts: ('general' | 'service' | 'location' | 'legal')[];
  example?: string;
  computed?: boolean; // Whether this value is computed from other values
}

/**
 * Complete registry of all available shortcodes
 */
export const SHORTCODE_REGISTRY: ShortcodeDefinition[] = [
  // Business Information
  {
    name: 'businessName',
    description: 'The name of the business',
    contexts: ['general', 'service', 'location', 'legal'],
    example: 'Adelaide Roof Cleaning Pros'
  },
  {
    name: 'phone',
    description: 'Business phone number with formatting',
    contexts: ['general', 'service', 'location', 'legal'],
    example: '(08) 7282 0180'
  },
  {
    name: 'email',
    description: 'Business email address',
    contexts: ['general', 'service', 'location', 'legal'],
    example: 'info@adelaideroofcleaning.com.au'
  },
  {
    name: 'formattedPhone',
    description: 'Phone number formatted for tel: links (digits only)',
    contexts: ['general', 'service', 'location', 'legal'],
    example: '0872820180'
  },
  
  // Address Information
  {
    name: 'street',
    description: 'Street address of the business',
    contexts: ['general', 'legal'],
    example: '13/543 Churchill Rd'
  },
  {
    name: 'city',
    description: 'City where the business is located',
    contexts: ['general', 'legal'],
    example: 'Kilburn'
  },
  {
    name: 'state',
    description: 'State/province abbreviation',
    contexts: ['general', 'location', 'legal'],
    example: 'SA'
  },
  {
    name: 'postcode',
    description: 'Postal/ZIP code',
    contexts: ['general', 'location', 'legal'],
    example: '5084'
  },
  {
    name: 'mainLocation',
    description: 'Combined city, state, and postcode',
    contexts: ['general', 'service'],
    example: 'Kilburn, SA 5084',
    computed: true
  },
  
  // Legal Page Specific
  {
    name: 'governingState',
    description: 'State for legal jurisdiction (defaults to business state)',
    contexts: ['legal'],
    example: 'SA'
  },
  {
    name: 'governingCity',
    description: 'City for legal jurisdiction (defaults to business city)',
    contexts: ['legal'],
    example: 'Adelaide'
  },
  
  // Service Page Specific
  {
    name: 'serviceTitle',
    description: 'Title of the current service',
    contexts: ['service'],
    example: 'Tile Roof Cleaning'
  },
  {
    name: 'serviceDescription',
    description: 'Description of the current service',
    contexts: ['service'],
    example: 'Professional tile roof cleaning services'
  },
  {
    name: 'serviceSlug',
    description: 'URL slug for the current service',
    contexts: ['service'],
    example: 'tile-roof-cleaning'
  },
  {
    name: 'serviceImage',
    description: 'Featured image for the current service',
    contexts: ['service'],
    example: '/images/tile-roof-cleaning.jpg'
  },
  {
    name: 'serviceExcerpt',
    description: 'Short excerpt for the current service',
    contexts: ['service'],
    example: 'Expert tile roof cleaning to restore your roof\'s appearance'
  },
  
  // Location Page Specific
  {
    name: 'suburb',
    description: 'Current suburb name',
    contexts: ['location'],
    example: 'North Adelaide'
  },
  {
    name: 'postcodeSpace',
    description: 'Postcode with leading space',
    contexts: ['location'],
    example: ' 5006'
  },
  {
    name: 'postcodeWithComma',
    description: 'Postcode with leading comma',
    contexts: ['location'],
    example: ', 5006'
  },
  {
    name: 'distance',
    description: 'Distance from central location',
    contexts: ['location'],
    example: '12 km',
    computed: true
  },
  {
    name: 'direction',
    description: 'Compass direction from central location',
    contexts: ['location'],
    example: 'NE',
    computed: true
  },
  {
    name: 'nearbySuburbs:N',
    description: 'List of N nearby suburbs (replace N with number)',
    contexts: ['location'],
    example: '{{nearbySuburbs:5}}',
    computed: true
  },
  {
    name: 'randomNearby',
    description: 'Random nearby suburb name',
    contexts: ['location'],
    example: 'Prospect',
    computed: true
  },
  {
    name: 'mainServiceCategory',
    description: 'Main category of services offered',
    contexts: ['location'],
    example: 'Roof Cleaning'
  },
  {
    name: 'serviceRadius',
    description: 'Service radius in kilometers',
    contexts: ['general', 'location'],
    example: '33'
  }
];

/**
 * Get all shortcodes for a specific context
 */
export function getShortcodesForContext(context: 'general' | 'service' | 'location' | 'legal'): ShortcodeDefinition[] {
  return SHORTCODE_REGISTRY.filter(shortcode => shortcode.contexts.includes(context));
}

/**
 * Validate if a shortcode exists and is valid for the given context
 */
export function validateShortcode(name: string, context?: 'general' | 'service' | 'location' | 'legal'): {
  valid: boolean;
  message?: string;
} {
  // Remove the {{ }} wrapper if present
  const cleanName = name.replace(/^{{/, '').replace(/}}$/, '');
  
  // Handle special case for nearbySuburbs with number
  if (cleanName.startsWith('nearbySuburbs:')) {
    const baseDefinition = SHORTCODE_REGISTRY.find(s => s.name === 'nearbySuburbs:N');
    if (baseDefinition) {
      if (context && !baseDefinition.contexts.includes(context)) {
        return {
          valid: false,
          message: `Shortcode '{{${cleanName}}}' is not available in ${context} context`
        };
      }
      return { valid: true };
    }
  }
  
  const definition = SHORTCODE_REGISTRY.find(s => s.name === cleanName);
  
  if (!definition) {
    return {
      valid: false,
      message: `Unknown shortcode: '{{${cleanName}}}'. Available shortcodes: ${SHORTCODE_REGISTRY.map(s => s.name).join(', ')}`
    };
  }
  
  if (context && !definition.contexts.includes(context)) {
    return {
      valid: false,
      message: `Shortcode '{{${cleanName}}}' is not available in ${context} context. It's only available in: ${definition.contexts.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Get all unprocessed shortcodes from a text string
 */
export function findUnprocessedShortcodes(text: string): string[] {
  const matches = text.match(/{{[^}]+}}/g);
  return matches || [];
}

/**
 * Generate documentation for all shortcodes
 */
export function generateShortcodeDocumentation(): string {
  let doc = '# Available Shortcodes\n\n';
  
  const contexts = ['general', 'service', 'location', 'legal'] as const;
  
  for (const context of contexts) {
    const shortcodes = getShortcodesForContext(context);
    if (shortcodes.length === 0) continue;
    
    doc += `## ${context.charAt(0).toUpperCase() + context.slice(1)} Context\n\n`;
    doc += '| Shortcode | Description | Example |\n';
    doc += '|-----------|-------------|----------|\n';
    
    for (const shortcode of shortcodes) {
      const example = shortcode.example || '-';
      const computed = shortcode.computed ? ' *(computed)*' : '';
      doc += `| \`{{${shortcode.name}}}\` | ${shortcode.description}${computed} | ${example} |\n`;
    }
    
    doc += '\n';
  }
  
  return doc;
}