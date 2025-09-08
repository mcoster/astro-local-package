/**
 * Config Loader
 * Loads business configuration from YAML file at build time
 * This ensures all template variables are replaced with actual values
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Business configuration structure (for reference)
// Removed TypeScript interface for JavaScript compatibility

/**
 * Load business configuration from YAML file
 */
export function loadBusinessConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'business.yaml');
    
    if (!fs.existsSync(configPath)) {
      console.warn('business.yaml not found at', configPath);
      return null;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);
    
    return config;
  } catch (error) {
    console.error('Error loading business.yaml:', error);
    return null;
  }
}

/**
 * Get the raw business configuration
 * Useful for accessing config values directly
 */
export function getBusinessConfig() {
  return loadBusinessConfig();
}

/**
 * Get template variables for shortcode replacement
 * Combines business config with computed values
 */
export function getTemplateVariables() {
  const config = loadBusinessConfig();
  
  if (!config) {
    // Return defaults if config not found
    return {
      businessName: 'Your Business Name',
      phone: '(00) 0000 0000',
      email: 'info@example.com',
      formattedPhone: '0000000000',
      street: '123 Main Street',
      city: 'Your City',
      state: 'Your State',
      postcode: '0000',
      governingState: 'Queensland',
      governingCity: 'Brisbane',
      serviceRadius: '50',
      mainLocation: 'Your City, Your State 0000',
    };
  }
  
  // Build template variables from config
  const vars = {
    // Business info
    businessName: config.business.name,
    tagline: config.business.tagline,
    phone: config.business.phone,
    email: config.business.email,
    ownerName: config.business.owner_name,
    broadRegion: config.business.broad_region,
    formLocation: config.business.form_location,
    
    // Address
    street: config.address.street,
    city: config.address.city,
    state: config.address.state,
    postcode: config.address.postcode,
    country: config.address.country,
    
    // Service info
    mainServiceCategory: config.service.main_category,
    mainLocation: config.service.main_location,
    serviceRadius: String(config.service.radius_km),
    
    // Computed values
    formattedPhone: config.business.phone.replace(/\D/g, ''),
    fullAddress: `${config.address.street}, ${config.address.city} ${config.address.state} ${config.address.postcode}`,
    mainLocationFull: `${config.address.city}, ${config.address.state} ${config.address.postcode}`,
    // Legal jurisdiction is always Queensland (where Web and Glow Pty Ltd is registered)
    governingState: 'Queensland',
    governingCity: 'Brisbane',
    
    // Business hours
    hoursMonday: config.hours.monday,
    hoursTuesday: config.hours.tuesday,
    hoursWednesday: config.hours.wednesday,
    hoursThursday: config.hours.thursday,
    hoursFriday: config.hours.friday,
    hoursSaturday: config.hours.saturday,
    hoursSunday: config.hours.sunday,
    
    // Social media
    facebookUrl: config.social.facebook,
    instagramUrl: config.social.instagram,
    linkedinUrl: config.social.linkedin,
    youtubeUrl: config.social.youtube,
    
    // Website
    siteUrl: config.website.url,
    googleMapsUrl: config.website.google_maps_url,
    googleReviewsUrl: config.website.google_reviews_url,
    googleMapsEmbed: config.google_maps.embed,
  };
  
  // Remove undefined values
  Object.keys(vars).forEach(key => {
    if (vars[key] === undefined) {
      delete vars[key];
    }
  });
  
  return vars;
}