/**
 * Component Registry
 * Maps component names to actual Astro components for dynamic rendering
 */

// Import all components that can be used in dynamic pages
import HeroWithForm from '@/components/HeroWithForm.astro';
import Hero from '@/components/Hero.astro';
import ServicesGrid from '@/components/ServicesGrid.astro';
import TwoColumnSection from '@/components/TwoColumnSection.astro';
import IconGrid from '@/components/IconGrid.astro';
import CTABanner from '@/components/CTABanner.astro';
import ServiceAreas from '@/components/ServiceAreas.astro';
import ServiceAreasWithLocations from '@/components/ServiceAreasWithLocations.astro';
import ContactForm from '@/components/ContactForm.astro';
import ContactInfo from '@/components/ContactInfo.astro';
import QuoteForm from '@/components/QuoteForm.astro';
import BusinessHours from '@/components/BusinessHours.astro';
import ServiceContent from '@/components/ServiceContent.astro';
import RelatedServices from '@/components/RelatedServices.astro';
import ServiceFeatures from '@/components/ServiceFeatures.astro';
import ServiceFAQ from '@/components/ServiceFAQ.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import MarkdownContent from '@/components/MarkdownContent.astro';
import WhyUs from '@/components/WhyUs.astro';
import Spacer from '@/components/Spacer.astro';

/**
 * Registry of all available components
 * Add new components here to make them available for dynamic rendering
 */
export const componentRegistry: Record<string, any> = {
  // Hero Components
  'HeroWithForm': HeroWithForm,
  'Hero': Hero,
  
  // Content Components
  'TwoColumnSection': TwoColumnSection,
  'IconGrid': IconGrid,
  'ServicesGrid': ServicesGrid,
  'MarkdownContent': MarkdownContent,
  
  // Service-specific Components
  'ServiceContent': ServiceContent,
  'ServiceFeatures': ServiceFeatures,
  'ServiceFAQ': ServiceFAQ,
  'RelatedServices': RelatedServices,
  'ServiceAreas': ServiceAreas,
  'ServiceAreasWithLocations': ServiceAreasWithLocations,
  
  // Form Components
  'ContactForm': ContactForm,
  'ContactInfo': ContactInfo,
  'QuoteForm': QuoteForm,
  
  // Utility Components
  'CTABanner': CTABanner,
  'BusinessHours': BusinessHours,
  'Breadcrumb': Breadcrumb,
  'WhyUs': WhyUs,
  'Spacer': Spacer,
};

/**
 * Get a component from the registry
 * @param componentName - Name of the component to retrieve
 * @returns The component or null if not found
 */
export function getComponent(componentName: string) {
  const component = componentRegistry[componentName];
  
  if (!component) {
    console.warn(`Component "${componentName}" not found in registry. Available components:`, Object.keys(componentRegistry));
    return null;
  }
  
  return component;
}

/**
 * Check if a component exists in the registry
 * @param componentName - Name of the component to check
 * @returns True if the component exists
 */
export function hasComponent(componentName: string): boolean {
  return componentName in componentRegistry;
}

/**
 * Get all available component names
 * @returns Array of component names
 */
export function getAvailableComponents(): string[] {
  return Object.keys(componentRegistry);
}