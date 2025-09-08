// Main entry point for @astro-local/template package

// Export utilities
export * from './utils/config-loader';
export * from './utils/template-processor';
export * from './utils/spintax';
export * from './utils/locations';
export * from './utils/image-registry';
export * from './utils/google-places';

// Component registry exports
export * from './utils/component-registry';
export * from './utils/shortcode-registry';

// Type exports
export interface BusinessConfig {
  business: {
    name: string;
    logo: string;
    tagline: string;
    phone: string;
    email: string;
    owner_name: string;
    broad_region: string;
    form_location: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  service: {
    main_category: string;
    main_location: string;
    radius_km: number;
    max_location_pages?: number;
    center_lat?: number;
    center_lng?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    cta: string;
  };
  website: {
    url: string;
    google_site_verification?: string;
    google_maps_embed?: string;
  };
}

export interface Location {
  suburb: string;
  postcode: string;
  state: string;
  lat: number;
  lng: number;
  distance?: number;
  slug?: string;
}

export interface ImageManifest {
  slots: Record<string, {
    description: string;
    requirements: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dimensions?: {
      width: number;
      height: number;
    };
    currentImage?: string;
  }>;
  analyzed: Array<{
    path: string;
    analysis: any;
  }>;
  matches: Record<string, string>;
}