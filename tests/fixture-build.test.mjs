import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const astroBin = resolve(repoRoot, 'node_modules/.bin/astro');

const fixturePublicEnv = [
  'PUBLIC_PHONE',
  'PUBLIC_EMAIL',
  'PUBLIC_STREET_ADDRESS',
  'PUBLIC_CITY',
  'PUBLIC_STATE',
  'PUBLIC_POSTCODE',
  'PUBLIC_COUNTRY',
  'PUBLIC_COUNTRY_CODE',
  'PUBLIC_HOURS_MONDAY',
  'PUBLIC_HOURS_TUESDAY',
  'PUBLIC_HOURS_WEDNESDAY',
  'PUBLIC_HOURS_THURSDAY',
  'PUBLIC_HOURS_FRIDAY',
  'PUBLIC_HOURS_SATURDAY',
  'PUBLIC_HOURS_SUNDAY',
  'PUBLIC_GOOGLE_MAPS_URL',
  'PUBLIC_GOOGLE_MAPS_EMBED',
  'PUBLIC_GOOGLE_MAPS_PLACE_ID',
  'PUBLIC_GOOGLE_MAPS_API_KEY',
  'PUBLIC_GOOGLE_PLACES_API_KEY',
];

async function buildFixture(name, env = {}) {
  const fixtureRoot = resolve(repoRoot, 'tests/fixtures', name);
  await rm(resolve(fixtureRoot, 'dist'), { recursive: true, force: true });

  const fixtureEnv = { ...process.env };
  for (const key of fixturePublicEnv) delete fixtureEnv[key];

  const result = spawnSync(astroBin, ['build'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: {
      ...fixtureEnv,
      ...env,
      NODE_ENV: 'test',
    },
  });

  assert.equal(
    result.status,
    0,
    `Fixture ${name} failed to build\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );

  return {
    html: await readFile(resolve(fixtureRoot, 'dist/index.html'), 'utf8'),
    stdout: result.stdout,
  };
}

function fixtureComponent(html, name) {
  const start = `data-fixture-marker="${name}-start"`;
  const end = `data-fixture-marker="${name}-end"`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex);

  assert.notEqual(startIndex, -1, `Missing ${name} fixture start marker`);
  assert.notEqual(endIndex, -1, `Missing ${name} fixture end marker`);
  return html.slice(startIndex + start.length, endIndex);
}

function occurrenceCount(value, search) {
  return value.split(search).length - 1;
}

function jsonLdScripts(html) {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]));
}

function graphNodes(html) {
  const scripts = jsonLdScripts(html);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0]['@context'], 'https://schema.org');
  assert.ok(Array.isArray(scripts[0]['@graph']));
  return scripts[0]['@graph'];
}

function localBusinessNodes(html) {
  return graphNodes(html).filter((node) => node['@type'] === 'LocalBusiness');
}

test('roof fixture builds one graph with LocalBusiness, deduped FAQ, and visible cost ranges', async () => {
  const { html } = await buildFixture('site-roof');
  const nodes = graphNodes(html);
  const faqPages = nodes.filter((node) => node['@type'] === 'FAQPage');
  const header = fixtureComponent(html, 'header');
  const hero = fixtureComponent(html, 'hero');
  const customHero = fixtureComponent(html, 'custom-hero');
  const heroWithForm = fixtureComponent(html, 'hero-with-form');
  const floatingCta = fixtureComponent(html, 'floating-cta');
  const footer = fixtureComponent(html, 'footer');
  const businessHours = fixtureComponent(html, 'business-hours');

  assert.equal(nodes.filter((node) => node['@type'] === 'LocalBusiness').length, 1);
  assert.equal(faqPages.length, 1);
  assert.equal(faqPages[0].mainEntity.length, 2);
  assert.match(html, /<table/);
  assert.match(html, /Estimate only/);
  assert.equal(html.includes('PriceSpecification'), false);
  assert.equal(html.includes('approved_by'), false);
  assert.match(html, /07 5555 1234/);
  assert.match(html, /quotes@goldcoastroofcare\.example/);
  assert.match(html, /12 Marine Parade/);
  assert.match(html, /google\.com\/maps\/embed\/v1\/place/);
  assert.equal(occurrenceCount(header, 'href="tel:0755551234"'), 2);
  assert.match(hero, /href="tel:0755551234"/);
  assert.match(hero, /Call 07 5555 1234/);
  assert.match(customHero, /href="\/book"/);
  assert.match(customHero, /Book a Roof Clean/);
  assert.match(heroWithForm, /href="tel:0755551234"/);
  assert.match(heroWithForm, /Call 07 5555 1234/);
  assert.match(floatingCta, /href="tel:0755559999"/);
  assert.match(floatingCta, /aria-label="Call 07 5555 9999"/);
  assert.match(floatingCta, /class="floating-cta__text"[^>]*>07 5555 9999</);
  assert.match(footer, /12 Marine Parade/);
  assert.match(footer, /quotes@goldcoastroofcare\.example/);
  assert.match(businessHours, /Monday/);
  assert.match(html, /id="fixture-map-config-type">address</);
  const [business] = localBusinessNodes(html);
  assert.equal(business.telephone, '07 5555 1234');
  assert.equal(business.address.streetAddress, '12 Marine Parade');
  assert.ok(business.openingHoursSpecification.length > 0);
});

test('pool fixture omits absent contact facts and keeps an enquiry action', async () => {
  const { html, stdout } = await buildFixture('site-pool', {
    PUBLIC_GOOGLE_MAPS_API_KEY: 'fixture-map-key',
  });
  const header = fixtureComponent(html, 'header');
  const hero = fixtureComponent(html, 'hero');
  const heroWithForm = fixtureComponent(html, 'hero-with-form');
  const footer = fixtureComponent(html, 'footer');
  const businessHours = fixtureComponent(html, 'business-hours');

  for (const invented of [
    '(00) 0000 0000',
    'info@example.com',
    '123 Main Street',
    '5000',
    '9:00 AM - 5:00 PM',
  ]) {
    assert.equal(html.includes(invented), false);
  }
  assert.equal(html.includes('href="tel:'), false);
  assert.equal(html.includes('href="mailto:'), false);
  assert.equal(/<div class="floating-cta(?:\s|")/.test(html), false);
  assert.equal(/<div class="contact-info-section(?:\s|")/.test(html), false);
  assert.equal(/<div class="map-embed(?:\s|")/.test(html), false);
  assert.equal(html.includes('google.com/maps/embed'), false);
  assert.equal(header.includes('href="tel:'), false);
  assert.equal(heroWithForm.includes('href="tel:'), false);
  assert.equal(footer.includes('href="tel:'), false);
  assert.equal(footer.includes('href="mailto:'), false);
  assert.equal(/<p>\s*<\/p>/.test(footer), false);
  assert.equal(/>Business Hours</.test(footer), false);
  assert.equal(/<div class="business-hours(?:\s|")/.test(businessHours), false);
  assert.equal(stdout.includes('discovering Place ID'), false);
  assert.equal(localBusinessNodes(html).length, 0);
  assert.match(hero, /Send an Enquiry/);
  assert.match(hero, /href="\/contact"/);
  assert.match(html, /id="fixture-map-config-type">address</);
});

test('partial hours omit blank rows and unavailable current status', async () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const configuredDay = today === 'monday' ? 'saturday' : 'monday';
  const configuredLabel = configuredDay === 'monday' ? 'Mon-Fri:' : 'Saturday:';
  const { html } = await buildFixture('site-pool', {
    [`PUBLIC_HOURS_${configuredDay.toUpperCase()}`]: '9:00 AM - 1:00 PM',
  });
  const footer = fixtureComponent(html, 'footer');
  const businessHours = fixtureComponent(html, 'business-hours');

  assert.match(footer, new RegExp(`${configuredLabel}<\\/span> 9:00 AM - 1:00 PM`));
  assert.equal(/<div>\s*<span class="font-medium">[^<]+:<\/span>\s*<\/div>/.test(footer), false);
  assert.equal(occurrenceCount(businessHours, 'class="hours-row'), 1);
  assert.match(businessHours, /9:00 AM - 1:00 PM/);
  assert.equal(businessHours.includes('status-badge'), false);
});
