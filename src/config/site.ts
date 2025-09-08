/**
 * Site Configuration
 * This file combines business configuration from YAML with environment variables
 * and provides type-safe access to configuration throughout the app
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

interface Colors {
  primary: string;
  secondary: string;
  accent: string;
  cta: string;
}

interface BusinessConfig {
  business: {
    name: string;
    logo?: string;
    tagline: string;
    phone: string;
    email: string;
    owner_name?: string;
    broad_region?: string;
    form_location?: string;
  };
  address: Address;
  service: {
    main_category: string;
    main_location: string;
    radius_km: number;
    max_location_pages: number;
    center_lat?: number;
    center_lng?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    cta: string;
  };
  hours: BusinessHours;
  social: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  website: {
    url: string;
    google_maps_url?: string;
    google_reviews_url?: string;
  };
  google_maps: {
    embed?: string;
  };
  footer: {
    featured_suburbs?: string[];
  };
}

// Load business configuration from YAML
function loadBusinessConfig(): BusinessConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'config', 'business.yaml');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return yaml.load(configContent) as BusinessConfig;
    }
  } catch (error) {
    console.warn('Could not load business.yaml, falling back to environment variables:', error);
  }
  return null;
}

// Load the business configuration
const businessConfig = loadBusinessConfig();

// Helper function to get value from config or env with fallback
function getConfigValue<T>(
  configPath: string,
  envVar: string,
  defaultValue: T
): T {
  // Try to get from business config first
  if (businessConfig) {
    const keys = configPath.split('.');
    let value: any = businessConfig;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  
  // Fall back to environment variable
  const envValue = import.meta.env[envVar];
  if (envValue !== undefined && envValue !== null && envValue !== '') {
    return envValue as T;
  }
  
  // Return default
  return defaultValue;
}

export const siteConfig = {
  // Business Information
  businessName: getConfigValue('business.name', 'PUBLIC_BUSINESS_NAME', 'Your Business Name'),
  businessLogo: getConfigValue('business.logo', 'PUBLIC_BUSINESS_LOGO', undefined),
  tagline: getConfigValue('business.tagline', 'PUBLIC_BUSINESS_TAGLINE', 'Professional Services'),
  phone: getConfigValue('business.phone', 'PUBLIC_PHONE', '(00) 0000 0000'),
  email: getConfigValue('business.email', 'PUBLIC_EMAIL', 'info@example.com'),
  ownerName: getConfigValue('business.owner_name', 'PUBLIC_OWNER_NAME', undefined),
  broadRegion: getConfigValue('business.broad_region', 'PUBLIC_BROAD_REGION', undefined),
  formLocation: getConfigValue('business.form_location', 'PUBLIC_FORM_LOCATION', undefined),
  mainLocation: getConfigValue('service.main_location', 'PUBLIC_MAIN_LOCATION', 'Adelaide'),
  mainServiceCategory: getConfigValue('service.main_category', 'PUBLIC_MAIN_SERVICE_CATEGORY', 'Professional'),
  
  // Address
  address: {
    street: getConfigValue('address.street', 'PUBLIC_STREET_ADDRESS', '123 Main Street'),
    city: getConfigValue('address.city', 'PUBLIC_CITY', 'Adelaide'),
    state: getConfigValue('address.state', 'PUBLIC_STATE', 'SA'),
    postcode: getConfigValue('address.postcode', 'PUBLIC_POSTCODE', '5000'),
    country: getConfigValue('address.country', 'PUBLIC_COUNTRY', 'Australia'),
  } as Address,
  
  // Business Hours
  hours: {
    monday: getConfigValue('hours.monday', 'PUBLIC_HOURS_MONDAY', '9:00 AM - 5:00 PM'),
    tuesday: getConfigValue('hours.tuesday', 'PUBLIC_HOURS_TUESDAY', '9:00 AM - 5:00 PM'),
    wednesday: getConfigValue('hours.wednesday', 'PUBLIC_HOURS_WEDNESDAY', '9:00 AM - 5:00 PM'),
    thursday: getConfigValue('hours.thursday', 'PUBLIC_HOURS_THURSDAY', '9:00 AM - 5:00 PM'),
    friday: getConfigValue('hours.friday', 'PUBLIC_HOURS_FRIDAY', '9:00 AM - 5:00 PM'),
    saturday: getConfigValue('hours.saturday', 'PUBLIC_HOURS_SATURDAY', '9:00 AM - 1:00 PM'),
    sunday: getConfigValue('hours.sunday', 'PUBLIC_HOURS_SUNDAY', 'Closed'),
  } as BusinessHours,
  
  // Social Media
  social: {
    facebook: getConfigValue('social.facebook', 'PUBLIC_FACEBOOK_URL', undefined),
    instagram: getConfigValue('social.instagram', 'PUBLIC_INSTAGRAM_URL', undefined),
    linkedin: getConfigValue('social.linkedin', 'PUBLIC_LINKEDIN_URL', undefined),
    youtube: getConfigValue('social.youtube', 'PUBLIC_YOUTUBE_URL', undefined),
  } as SocialLinks,
  
  // SEO & Metadata
  siteUrl: getConfigValue('website.url', 'PUBLIC_SITE_URL', 'https://adelaide-roof-cleaning-pros.netlify.app'),
  googleMapsUrl: getConfigValue('website.google_maps_url', 'PUBLIC_GOOGLE_MAPS_URL', undefined),
  googleReviewsUrl: getConfigValue('website.google_reviews_url', 'PUBLIC_GOOGLE_REVIEWS_URL', undefined),
  
  // Google Maps Integration
  googleMaps: {
    embed: getConfigValue('google_maps.embed', 'PUBLIC_GOOGLE_MAPS_EMBED', undefined),
    placeId: import.meta.env.PUBLIC_GOOGLE_MAPS_PLACE_ID || undefined,
    apiKey: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY || undefined,
    discoveredCache: import.meta.env.GOOGLE_MAPS_DISCOVERED_CACHE || undefined,
  },
  
  // Theme Colors (with # prefix added)
  colors: {
    primary: `#${getConfigValue('colors.primary', 'PUBLIC_COLOR_PRIMARY', '3B82F6')}`,
    secondary: `#${getConfigValue('colors.secondary', 'PUBLIC_COLOR_SECONDARY', '10B981')}`,
    accent: `#${getConfigValue('colors.accent', 'PUBLIC_COLOR_ACCENT', 'EF4444')}`,
    cta: `#${getConfigValue('colors.cta', 'PUBLIC_COLOR_CTA', 'FF6B35')}`,
  } as Colors,
  
  // Location Page Generation Settings
  locationPages: {
    serviceRadiusKm: getConfigValue('service.radius_km', 'SERVICE_RADIUS_KM', 50),
    maxLocationPages: getConfigValue('service.max_location_pages', 'MAX_LOCATION_PAGES', 100),
    centerLat: getConfigValue('service.center_lat', 'SERVICE_CENTER_LAT', undefined),
    centerLng: getConfigValue('service.center_lng', 'SERVICE_CENTER_LNG', undefined),
    footerFeaturedSuburbs: getConfigValue('footer.featured_suburbs', 'FOOTER_FEATURED_SUBURBS', []),
  },
  
  // Computed values
  get formattedPhone() {
    // Remove all non-digits from phone number
    return this.phone.replace(/\D/g, '');
  },
  
  get fullAddress() {
    const { street, city, state, postcode } = this.address;
    return `${street}, ${city} ${state} ${postcode}`;
  },
};

// Export type for use in other files
export type SiteConfig = typeof siteConfig;