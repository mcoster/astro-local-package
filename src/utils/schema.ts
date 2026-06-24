export interface FAQEntry {
  question: string;
  answer: string;
}

export interface JsonLdNode {
  [key: string]: unknown;
}

export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

export interface SiteConfigLike {
  businessName?: string;
  tagline?: string;
  siteUrl?: string;
  phone?: string;
  email?: string;
  mainLocation?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  hours?: Record<string, string | undefined>;
  locationPages?: {
    centerLat?: number;
    centerLng?: number;
    serviceRadiusKm?: number;
  };
}

export interface PageSchemaInput {
  siteConfig?: SiteConfigLike;
  pageUrl?: string | URL;
  schema?: JsonLdNode | JsonLdNode[] | JsonLdGraph | null;
  schemaItems?: JsonLdNode | JsonLdNode[] | JsonLdGraph | null;
  faqs?: FAQEntry[];
  includeLocalBusiness?: boolean;
}

export interface BreadcrumbSchemaItem {
  label: string;
  href?: string;
  current?: boolean;
}

const PLACEHOLDER_VALUES = new Set([
  'your business name',
  'professional services',
  'your website',
  'https://your-website.com',
  '(00) 0000 0000',
  '0000000000',
  'info@example.com',
  '123 main street',
  'your city',
  'state',
]);

const DAY_NAMES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export function normalizeQuestion(question: string): string {
  return String(question || '')
    .toLocaleLowerCase('en-AU')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeIdentityValue(value: unknown): string {
  return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-AU');
}

function hasRealString(value: unknown): value is string {
  const normalized = normalizeIdentityValue(value);
  return normalized.length > 0 && !PLACEHOLDER_VALUES.has(normalized);
}

function hasRealPhone(value: unknown): boolean {
  if (!hasRealString(value)) return false;
  const digits = String(value).replace(/\D/g, '');
  return digits.length >= 6 && !/^0+$/.test(digits);
}

function hasRealEmail(value: unknown): boolean {
  if (!hasRealString(value)) return false;
  const email = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && normalizeIdentityValue(email) !== 'info@example.com';
}

function hasRealUrl(value: unknown): boolean {
  if (!hasRealString(value)) return false;
  try {
    const url = new URL(String(value));
    return Boolean(url.protocol && url.hostname);
  } catch {
    return false;
  }
}

export function hasRealLocalBusinessIdentity(siteConfig: SiteConfigLike = {}): boolean {
  const address = siteConfig.address || {};
  return [
    hasRealString(siteConfig.businessName),
    hasRealUrl(siteConfig.siteUrl),
    hasRealPhone(siteConfig.phone),
    hasRealEmail(siteConfig.email),
    hasRealString(address.street),
    hasRealString(address.city),
    hasRealString(address.state),
    hasRealString(address.postcode),
    hasRealString(address.country),
  ].every(Boolean);
}

function parseHours(hoursString?: string) {
  if (!hoursString || /^closed$/i.test(hoursString.trim())) return null;
  const [opens, closes] = hoursString.split(' - ').map((part) => part?.trim());
  if (!opens || !closes) return null;
  return { opens, closes };
}

function createOpeningHoursSpecification(hours: SiteConfigLike['hours'] = {}) {
  return DAY_NAMES
    .map((day) => {
      const parsed = parseHours(hours[day]);
      if (!parsed) return null;

      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
        opens: parsed.opens,
        closes: parsed.closes,
      };
    })
    .filter(Boolean);
}

function absoluteUrl(path: string, siteUrl?: string) {
  if (!siteUrl) return undefined;
  try {
    return new URL(path, siteUrl).href;
  } catch {
    return undefined;
  }
}

export function createLocalBusinessSchema(siteConfig: SiteConfigLike, pageUrl?: string | URL): JsonLdNode | null {
  if (!hasRealLocalBusinessIdentity(siteConfig)) return null;

  const address = siteConfig.address || {};
  const locationPages = siteConfig.locationPages || {};
  const areaServed: JsonLdNode[] = [];

  if (
    typeof locationPages.centerLat === 'number' &&
    typeof locationPages.centerLng === 'number' &&
    typeof locationPages.serviceRadiusKm === 'number'
  ) {
    areaServed.push({
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: locationPages.centerLat,
        longitude: locationPages.centerLng,
      },
      geoRadius: String(locationPages.serviceRadiusKm * 1000),
    });
  }

  if (siteConfig.mainLocation) {
    areaServed.push({
      '@type': 'City',
      name: siteConfig.mainLocation,
    });
  }

  return {
    '@type': 'LocalBusiness',
    '@id': pageUrl ? `${String(pageUrl).replace(/#.*$/, '')}#localbusiness` : undefined,
    name: siteConfig.businessName,
    description: siteConfig.tagline,
    url: siteConfig.siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    image: absoluteUrl('/og-image.jpg', siteConfig.siteUrl),
    logo: absoluteUrl('/logo.png', siteConfig.siteUrl),
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postcode,
      addressCountry: address.country,
    },
    openingHoursSpecification: createOpeningHoursSpecification(siteConfig.hours),
    ...(areaServed.length > 0 ? { areaServed } : {}),
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/contact', siteConfig.siteUrl),
        inLanguage: 'en-AU',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Request a Quote',
      },
    },
  };
}

function isObject(value: unknown): value is JsonLdNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSchemaNodes(schema?: PageSchemaInput['schema']): JsonLdNode[] {
  if (!schema) return [];
  if (Array.isArray(schema)) return schema.flatMap((item) => normalizeSchemaNodes(item));
  if (!isObject(schema)) return [];

  if (Array.isArray(schema['@graph'])) {
    return (schema['@graph'] as unknown[]).filter(isObject);
  }

  const { '@context': _context, ...node } = schema;
  return [node];
}

function extractFaqEntriesFromFAQPage(node: JsonLdNode): FAQEntry[] {
  if (node['@type'] !== 'FAQPage' || !Array.isArray(node.mainEntity)) return [];

  return node.mainEntity
    .map((entity) => {
      if (!isObject(entity) || typeof entity.name !== 'string') return null;
      const acceptedAnswer = entity.acceptedAnswer;
      if (!isObject(acceptedAnswer) || typeof acceptedAnswer.text !== 'string') return null;
      return {
        question: entity.name,
        answer: acceptedAnswer.text,
      };
    })
    .filter((entry): entry is FAQEntry => Boolean(entry));
}

function createFAQPage(faqs: FAQEntry[] = []): JsonLdNode | null {
  const deduped = new Map<string, FAQEntry>();

  for (const faq of faqs) {
    if (!faq?.question || !faq?.answer) continue;
    const normalized = normalizeQuestion(faq.question);
    if (!normalized || deduped.has(normalized)) continue;
    deduped.set(normalized, {
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    });
  }

  if (deduped.size === 0) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: Array.from(deduped.values()).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function faqEntriesFromAnswerBlocks(blocks: unknown[]): FAQEntry[] {
  return (blocks || [])
    .map((block) => {
      if (!isObject(block) || block.type !== 'answer') return null;
      const question = typeof block.question === 'string' ? block.question.trim() : '';
      const answer = typeof block.shortAnswer === 'string'
        ? block.shortAnswer.trim()
        : typeof block.answer === 'string'
          ? block.answer.trim()
          : '';

      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((entry): entry is FAQEntry => Boolean(entry));
}

export function breadcrumbSchemaFromItems(items: BreadcrumbSchemaItem[], baseUrl: string | URL): JsonLdNode | null {
  if (!Array.isArray(items) || items.length === 0) return null;

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && !item.current ? { item: new URL(item.href, baseUrl).href } : {}),
    })),
  };
}

export function buildPageSchema(input: PageSchemaInput): JsonLdGraph {
  const graph: JsonLdNode[] = [];
  const faqEntries: FAQEntry[] = [...(input.faqs || [])];
  const schemaNodes = [
    ...normalizeSchemaNodes(input.schema),
    ...normalizeSchemaNodes(input.schemaItems),
  ];

  if (input.includeLocalBusiness !== false && input.siteConfig) {
    const localBusiness = createLocalBusinessSchema(input.siteConfig, input.pageUrl);
    if (localBusiness) graph.push(localBusiness);
  }

  for (const node of schemaNodes) {
    if (node['@type'] === 'FAQPage') {
      faqEntries.push(...extractFaqEntriesFromFAQPage(node));
    } else {
      graph.push(node);
    }
  }

  const faqPage = createFAQPage(faqEntries);
  if (faqPage) graph.push(faqPage);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
