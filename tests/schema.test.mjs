import assert from 'node:assert/strict';
import test from 'node:test';
import { importTypeScript } from './helpers/import-ts.mjs';

const schemaModule = await importTypeScript('src/utils/schema.ts');

const realSiteConfig = {
  businessName: 'Gold Coast Roof Care',
  tagline: 'Roof cleaning for Gold Coast homes',
  siteUrl: 'https://example.com',
  phone: '07 5555 1234',
  email: 'quotes@example.com',
  mainLocation: 'Gold Coast',
  address: {
    street: '12 Marine Parade',
    city: 'Southport',
    state: 'QLD',
    postcode: '4215',
    country: 'Australia',
  },
  hours: {
    monday: '8:00 AM - 5:00 PM',
    tuesday: '8:00 AM - 5:00 PM',
    wednesday: '8:00 AM - 5:00 PM',
    thursday: '8:00 AM - 5:00 PM',
    friday: '8:00 AM - 5:00 PM',
    saturday: 'Closed',
    sunday: 'Closed',
  },
  locationPages: {
    centerLat: -28.0167,
    centerLng: 153.4,
    serviceRadiusKm: 40,
  },
};

function graphNodes(graph) {
  assert.equal(graph['@context'], 'https://schema.org');
  assert.ok(Array.isArray(graph['@graph']));
  return graph['@graph'];
}

test('buildPageSchema emits one FAQPage and dedupes FAQ questions by normalized question', () => {
  const graph = schemaModule.buildPageSchema({
    siteConfig: realSiteConfig,
    pageUrl: 'https://example.com/cost/roof-cleaning/',
    faqs: [
      {
        question: 'How much does roof cleaning cost?',
        answer: 'Most homes cost between $450 and $900 after an on-site assessment.',
      },
      {
        question: '  how much does roof cleaning cost  ',
        answer: 'Duplicate answer from an AnswerBlock should be deduped.',
      },
    ],
  });

  const faqPages = graphNodes(graph).filter((node) => node['@type'] === 'FAQPage');
  assert.equal(faqPages.length, 1);
  assert.equal(faqPages[0].mainEntity.length, 1);
  assert.equal(faqPages[0].mainEntity[0].name, 'How much does roof cleaning cost?');
  assert.equal(
    faqPages[0].mainEntity[0].acceptedAnswer.text,
    'Most homes cost between $450 and $900 after an on-site assessment.',
  );
});

test('buildPageSchema suppresses LocalBusiness when real identity fields are missing but keeps FAQPage', () => {
  const graph = schemaModule.buildPageSchema({
    siteConfig: {
      ...realSiteConfig,
      businessName: 'Your Business Name',
      phone: '',
      address: {
        ...realSiteConfig.address,
        street: '123 Main Street',
      },
    },
    pageUrl: 'https://example.com/cost/roof-cleaning/',
    faqs: [
      {
        question: 'Do you provide quotes?',
        answer: 'Yes. Call for a quote before work starts.',
      },
    ],
  });

  const nodes = graphNodes(graph);
  assert.equal(nodes.some((node) => node['@type'] === 'LocalBusiness'), false);
  assert.equal(nodes.filter((node) => node['@type'] === 'FAQPage').length, 1);
});

test('buildPageSchema includes LocalBusiness and FAQPage for multiple complete site configs', () => {
  const configs = [
    realSiteConfig,
    {
      ...realSiteConfig,
      businessName: 'Gold Coast Pool Pros',
      tagline: 'Pool care for Gold Coast homes',
      email: 'hello@poolpros.example',
      address: {
        street: '8 Palm Avenue',
        city: 'Burleigh Heads',
        state: 'QLD',
        postcode: '4220',
        country: 'Australia',
      },
    },
  ];

  for (const siteConfig of configs) {
    const graph = schemaModule.buildPageSchema({
      siteConfig,
      pageUrl: `${siteConfig.siteUrl}/cost/`,
      faqs: [
        {
          question: `How much does ${siteConfig.businessName} cost?`,
          answer: 'Costs vary by scope and on-site conditions.',
        },
      ],
    });

    const nodes = graphNodes(graph);
    assert.equal(nodes.filter((node) => node['@type'] === 'LocalBusiness').length, 1);
    assert.equal(nodes.filter((node) => node['@type'] === 'FAQPage').length, 1);
  }
});

test('faqEntriesFromAnswerBlocks extracts answer ContentBlocks without schema side effects', () => {
  const faqs = schemaModule.faqEntriesFromAnswerBlocks([
    {
      type: 'answer',
      question: 'How long does roof cleaning take?',
      shortAnswer: 'Most residential jobs take less than a day.',
    },
    {
      heading: 'Regular content',
      content: 'This is not an answer block.',
    },
  ]);

  assert.deepEqual(faqs, [
    {
      question: 'How long does roof cleaning take?',
      answer: 'Most residential jobs take less than a day.',
    },
  ]);
});
