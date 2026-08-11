import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const astroBin = resolve(repoRoot, 'node_modules/.bin/astro');

async function buildFixture(name) {
  const fixtureRoot = resolve(repoRoot, 'tests/fixtures', name);
  await rm(resolve(fixtureRoot, 'dist'), { recursive: true, force: true });

  const result = spawnSync(astroBin, ['build'], {
    cwd: fixtureRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  assert.equal(
    result.status,
    0,
    `Fixture ${name} failed to build\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );

  return readFile(resolve(fixtureRoot, 'dist/index.html'), 'utf8');
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
  const html = await buildFixture('site-roof');
  const nodes = graphNodes(html);
  const faqPages = nodes.filter((node) => node['@type'] === 'FAQPage');

  assert.equal(nodes.filter((node) => node['@type'] === 'LocalBusiness').length, 1);
  assert.equal(faqPages.length, 1);
  assert.equal(faqPages[0].mainEntity.length, 2);
  assert.match(html, /<table/);
  assert.match(html, /Estimate only/);
  assert.equal(html.includes('PriceSpecification'), false);
  assert.equal(html.includes('approved_by'), false);
  assert.match(html, /07 5555 1234/);
  assert.match(html, /href="tel:0755559999"/);
  assert.match(html, /quotes@goldcoastroofcare\.example/);
  assert.match(html, /12 Marine Parade/);
  assert.match(html, /google\.com\/maps\/embed\/v1\/place/);
  const [business] = localBusinessNodes(html);
  assert.equal(business.telephone, '07 5555 1234');
  assert.equal(business.address.streetAddress, '12 Marine Parade');
  assert.ok(business.openingHoursSpecification.length > 0);
});

test('pool fixture omits absent contact facts and keeps an enquiry action', async () => {
  const html = await buildFixture('site-pool');

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
  assert.equal(localBusinessNodes(html).length, 0);
  assert.match(html, /Send an Enquiry/);
  assert.match(html, /href="\/contact"/);
});
