/**
 * Pre-built Spintax Templates for Location Pages
 * Contains various content templates with spintax variations
 */

export const locationTemplates = {
  // Hero Section Templates
  hero: {
    title: "{Professional|Expert|Trusted|Reliable|Quality} {{businessName}} Services in {{suburb}}{{postcodeSpace}}",
    
    subtitle: "{Serving|Providing services to|Proudly serving} {{suburb}} and {surrounding areas|nearby suburbs|the local area}",
    
    tagline: "Your {local|trusted|reliable} service {provider|professionals|experts} in {{suburb}}, {{state}}"
  },
  
  // Introduction Content Templates
  intro: {
    opening: "{Looking for|Need|Searching for|In need of} {reliable|professional|trusted|quality|expert} services in {{suburb}}? " +
             "{{businessName}} {provides|offers|delivers} {exceptional|outstanding|top-quality|premium} service to " +
             "{{suburb}}{{postcodeWithComma}} and {surrounding areas|nearby suburbs|the local community}.",
    
    location: "{We're|We are} {committed to|dedicated to|focused on} serving {{suburb}} {and can|and are able to} " +
              "{reach|service|arrive at} your {location|property|premises} {quickly|promptly|in no time|within minutes}.",
    
    experience: "With {years of experience|extensive expertise|a proven track record} serving {the local community|{{suburb}} residents|local customers}, " +
                "we {understand|know|appreciate} exactly what our {clients|customers} {need|require|expect}.",
    
    trust: "{Trust|Choose|Rely on} {{businessName}} for {all your|your} service needs in {{suburb}}. " +
           "We're {committed to|dedicated to|focused on} {delivering|providing} {excellent|outstanding|exceptional} results {every time|on every job}."
  },
  
  // Service Area Templates
  serviceArea: {
    primary: "We {proudly serve|provide services to|cover} {{suburb}} and {surrounding areas|nearby locations} including {{nearbySuburbs:5}}.",
    
    coverage: "Our {team|professionals|experts|technicians} {regularly service|frequently work in|often visit} {{suburb}} and can " +
              "{reach|get to|arrive at} your location {quickly|promptly|efficiently} from our {base|headquarters|location}.",
    
    nearby: "{Nearby areas|Surrounding suburbs|Adjacent locations} we service include {{nearbySuburbs:8}}. " +
            "{No matter where|Wherever} you are in {{suburb}}, {we've got you covered|we can help|we're here for you}.",
    
    radius: "We service {all areas|locations|properties} within {{serviceRadius}}km of our {base|location}, " +
            "including {{suburb}} and {many other|numerous} surrounding suburbs."
  },
  
  // Call to Action Templates
  callToAction: {
    primary: "{Call us today|Contact us now|Get in touch|Reach out today} for {a free quote|an obligation-free quote|your free estimate} " +
             "in {{suburb}}!",
    
    secondary: "{Don't wait|Act now|Call today|Get started now}! Our {{suburb}} {team|specialists|experts} are " +
               "{ready to help|standing by|available now|here to assist}.",
    
    service: "For {fast|quick|prompt|immediate} and {reliable|professional|quality} service in {{suburb}}{{postcodeWithComma}}, " +
             "{call|contact|phone} {{businessName}} {today|now|right away}!",
    
    booking: "{Book|Schedule|Arrange} your {service|appointment} in {{suburb}} {today|now|online} - " +
             "{satisfaction guaranteed|quality assured|professional service guaranteed}!"
  },
  
  // SEO Optimized Templates
  seo: {
    title: "{{businessName}} | {Professional|Expert|Local|Quality} Services in {{suburb}} {{postcode}}",
    
    description: "{Get|Find|Discover} {professional|reliable|trusted|quality|expert} services in {{suburb}}, {{state}}{{postcodeWithComma}}. " +
                 "{{businessName}} {serves|services|provides services to} {{suburb}} and {nearby areas|surrounding suburbs|local areas}. " +
                 "{Call now|Contact us today|Get in touch} for {a free quote|your free estimate}.",
    
    h1: "{Professional|Expert|Quality|Trusted} Services in {{suburb}} {{postcode}}",
    
    h2Options: [
      "{{businessName}} - Your {Local|Trusted|Reliable} {{suburb}} Service {Provider|Experts|Specialists}",
      "Serving {{suburb}} and {Surrounding Areas|Nearby Suburbs}",
      "{Why Choose|Trust|Choose} {{businessName}} in {{suburb}}",
      "{Professional|Quality|Expert} Services {Available|Offered} in {{suburb}}",
      "Your {{suburb}} {Specialists|Experts|Professionals}"
    ]
  },
  
  // FAQ Templates
  faq: {
    q1: "Do you {service|provide services to|work in} {{suburb}}?",
    a1: "{Yes|Absolutely|Definitely}! We {regularly service|frequently work in|proudly serve} {{suburb}} and {surrounding areas|nearby suburbs}. " +
        "{We're|We are} located just {{distanceFormatted}} away and can {reach|get to} your location {quickly|promptly|efficiently}.",
    
    q2: "How {quickly|fast|soon} can you {arrive in|get to|reach} {{suburb}}?",
    a2: "{We can typically|Our team can usually|We're able to} {reach|arrive in|get to} {{suburb}} {within minutes|very quickly|promptly}. " +
        "{We're|We are} only {{distanceFormatted}} {{direction}} {from|of} {{suburb}}.",
    
    q3: "What areas near {{suburb}} do you {service|cover|work in}?",
    a3: "{Besides|In addition to|Along with} {{suburb}}, we {also|regularly} service {{nearbySuburbs:6}} and other {nearby areas|surrounding suburbs|local areas}.",
    
    q4: "Are you a local {{suburb}} business?",
    a4: "{While we're based|We're located|Our base is} {{distanceFormatted}} {{direction}}, we {regularly|frequently|often} work in {{suburb}} " +
        "and {consider it|treat it as} part of our {core|primary|main} service area. {Many of|Several of|Numerous} our {regular clients|customers} are from {{suburb}}."
  },
  
  // Features and Benefits Templates
  features: {
    local: "As a {local|nearby} service provider to {{suburb}}, we {understand|know|appreciate} the {unique needs|specific requirements} of the area.",
    
    response: "{Quick|Fast|Rapid|Prompt} response times to {{suburb}} - {we're|we are} just {{distanceFormatted}} away!",
    
    experience: "{Extensive|Years of} experience serving {{suburb}} and {surrounding|nearby} {suburbs|areas}.",
    
    guarantee: "{Satisfaction|Quality} guaranteed for all {work|services} in {{suburb}}{{postcodeWithComma}}."
  },
  
  // Testimonial Templates (for generated testimonials)
  testimonialIntro: {
    text: "{Here's what|See what|Discover what} our {{suburb}} {customers|clients} {say|have to say} about {our services|us}:",
    
    customerLocation: "- {Customer|Client|Resident} from {{suburb}}{{postcodeWithComma}}"
  },
  
  // Service Specific Templates
  serviceTypes: {
    emergency: "{24/7|Round-the-clock|Emergency} services available in {{suburb}} and {surrounding areas|nearby suburbs}.",
    
    regular: "{Regular|Scheduled|Routine} {maintenance|service} {programs|plans} available for {{suburb}} {residents|properties|customers}.",
    
    commercial: "{Commercial|Business} services {available|offered} throughout {{suburb}} and {nearby|surrounding} business districts.",
    
    residential: "{Residential|Home} services for {all|every} {{suburb}} {properties|homes|residences}."
  },
  
  // Footer/Contact Templates
  footer: {
    serviceArea: "Proudly serving {{suburb}}, {{state}} and surrounding areas",
    
    contact: "{{suburb}} service enquiries: Contact {{businessName}} today",
    
    hours: "Servicing {{suburb}} during {regular|standard|normal} business hours{ and emergencies|}."
  }
};

/**
 * Helper function to get a random template from an array
 */
export function getRandomTemplate(templates: string[], seed?: string): string {
  if (seed) {
    // Use seed for consistent selection
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % templates.length;
    return templates[index];
  }
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate multiple content variations for A/B testing
 */
export function generateVariations(template: string, data: any, count: number = 3): string[] {
  const variations: string[] = [];
  const seeds = ['a', 'b', 'c', 'd', 'e'];
  
  for (let i = 0; i < Math.min(count, seeds.length); i++) {
    const spintax = new (require('./spintax').LocationSpintax)(seeds[i]);
    variations.push(spintax.generateContent(template, data));
  }
  
  return variations;
}