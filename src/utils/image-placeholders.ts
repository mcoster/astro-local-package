/**
 * Image Placeholder Generator
 * 
 * Generates contextual SVG placeholders for missing images
 */

interface PlaceholderOptions {
  width: number;
  height: number;
  text?: string;
  type?: 'placeholder' | 'gradient' | 'blur' | 'pattern';
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Generate a data URI SVG placeholder
 */
export async function generatePlaceholder(options: PlaceholderOptions): Promise<string> {
  const {
    width,
    height,
    text = 'Image',
    type = 'placeholder',
    primaryColor = '#4f46e5',
    secondaryColor = '#7c3aed'
  } = options;

  switch (type) {
    case 'gradient':
      return generateGradientPlaceholder(width, height, primaryColor, secondaryColor);
    
    case 'pattern':
      return generatePatternPlaceholder(width, height, text, primaryColor);
    
    case 'blur':
      return generateBlurPlaceholder(width, height, primaryColor);
    
    case 'placeholder':
    default:
      return generateDefaultPlaceholder(width, height, text, primaryColor);
  }
}

/**
 * Generate a default placeholder with icon and text
 */
function generateDefaultPlaceholder(
  width: number,
  height: number,
  text: string,
  color: string
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f4f6"/>
      <g transform="translate(${width/2}, ${height/2})">
        <rect x="-100" y="-60" width="200" height="120" rx="8" fill="${color}" opacity="0.1"/>
        <path d="M -30 -20 L 30 -20 L 30 20 L -30 20 Z" 
              fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
        <circle cx="-10" cy="-5" r="5" fill="${color}" opacity="0.3"/>
        <path d="M -30 20 L -5 -5 L 15 10 L 30 -10" 
              fill="none" stroke="${color}" stroke-width="2" opacity="0.3"/>
        <text y="40" text-anchor="middle" font-family="system-ui" font-size="14" fill="${color}" opacity="0.5">
          ${escapeXml(text)}
        </text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a gradient placeholder
 */
function generateGradientPlaceholder(
  width: number,
  height: number,
  primaryColor: string,
  secondaryColor: string
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a pattern-based placeholder
 */
function generatePatternPlaceholder(
  width: number,
  height: number,
  text: string,
  color: string
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#f9fafb"/>
          <path d="M0 20h40M20 0v40" stroke="${color}" stroke-width="0.5" opacity="0.2"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#pattern)"/>
      <rect x="${width/2 - 100}" y="${height/2 - 30}" width="200" height="60" rx="8" fill="white" opacity="0.9"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="system-ui" font-size="16" fill="${color}">
        ${escapeXml(text)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a blur-style placeholder (solid color that will be blurred via CSS)
 */
function generateBlurPlaceholder(
  width: number,
  height: number,
  color: string
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}" opacity="0.3"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Generate a blur hash for progressive image loading
 * Note: This is a simplified version. For production, use a proper blurhash library
 */
export function generateBlurHash(imagePath: string): string {
  // This would normally analyze the image and generate a proper blurhash
  // For now, return a simple gradient based on the image path hash
  const hash = imagePath.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  return `hsl(${hue}, 70%, 80%)`;
}

/**
 * Get an appropriate icon for a given context
 */
export function getContextIcon(context: string): string {
  const contextMap: Record<string, string> = {
    'hero': '🏔️',
    'team': '👥',
    'service': '🔧',
    'gallery': '🖼️',
    'testimonial': '💬',
    'contact': '📧',
    'about': 'ℹ️',
    'location': '📍',
    'before': '⬅️',
    'after': '➡️',
    'roof': '🏠',
    'cleaning': '🧹',
    'gutter': '🏗️',
    'solar': '☀️'
  };

  const lowerContext = context.toLowerCase();
  
  for (const [key, icon] of Object.entries(contextMap)) {
    if (lowerContext.includes(key)) {
      return icon;
    }
  }
  
  return '📷'; // Default camera icon
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate metadata to embed in placeholder
 */
export function generatePlaceholderMetadata(slot: {
  component: string;
  context: string;
  dimensions?: { width: number; height: number };
}): string {
  return JSON.stringify({
    component: slot.component,
    context: slot.context,
    dimensions: slot.dimensions || { width: 1920, height: 1080 },
    generated: new Date().toISOString(),
    icon: getContextIcon(slot.context)
  });
}