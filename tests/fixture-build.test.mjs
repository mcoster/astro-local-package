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
});

test('pool fixture suppresses LocalBusiness when identity is incomplete but keeps FAQPage', async () => {
  const html = await buildFixture('site-pool');
  const nodes = graphNodes(html);

  assert.equal(nodes.some((node) => node['@type'] === 'LocalBusiness'), false);
  assert.equal(nodes.filter((node) => node['@type'] === 'FAQPage').length, 1);
  assert.match(html, /Estimate only/);
  assert.equal(html.includes('PriceSpecification'), false);
});
