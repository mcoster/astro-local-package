import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(path) {
  return readFile(path, 'utf8');
}

function assertNoJsonLd(componentName, text) {
  assert.equal(
    /type=["']application\/ld\+json["']/.test(text),
    false,
    `${componentName} must not emit its own JSON-LD script`,
  );
}

test('AnswerBlock is render-only answer-first content', async () => {
  const text = await source('src/components/AnswerBlock.astro');

  assert.match(text, /<h2[^>]*>\{question\}<\/h2>/);
  assert.match(text, /class=["'][^"']*answer-block__lead/);
  assert.match(text, /set:html=\{detailHtml\}/);
  assertNoJsonLd('AnswerBlock', text);
});

test('ServiceFAQ remains render-only and does not emit standalone FAQPage schema', async () => {
  const text = await source('src/components/ServiceFAQ.astro');

  assertNoJsonLd('ServiceFAQ', text);
  assert.equal(text.includes('FAQPage'), false);
});

test('CostRangeTable renders visible ranges and approved disclaimer without price schema', async () => {
  const text = await source('src/components/CostRangeTable.astro');

  assert.match(text, /<table/);
  assert.match(text, /COST_ESTIMATE_DISCLAIMER/);
  assert.match(text, /disclaimer/);
  assert.equal(text.includes('approved_by'), false);
  assert.equal(text.includes('PriceSpecification'), false);
  assertNoJsonLd('CostRangeTable', text);
});

test('ContentBlocks supports answer blocks through AnswerBlock', async () => {
  const text = await source('src/components/ContentBlocks.astro');

  assert.match(text, /import AnswerBlock/);
  assert.match(text, /type:\s*'answer'/);
  assert.match(text, /block\.type === 'answer'/);
});

test('Layout routes page schema through the collector and emits one JSON-LD script', async () => {
  const text = await source('src/layouts/Layout.astro');
  const scriptMatches = text.match(/type=["']application\/ld\+json["']/g) || [];

  assert.match(text, /buildPageSchema/);
  assert.match(text, /faqs\?:/);
  assert.equal(text.includes('localBusinessSchema'), false);
  assert.equal(scriptMatches.length, 1);
});

test('SEO routes custom schema and FAQ inputs through the collector', async () => {
  const text = await source('src/components/SEO.astro');
  const scriptMatches = text.match(/type=["']application\/ld\+json["']/g) || [];

  assert.match(text, /buildPageSchema/);
  assert.match(text, /faqs\?:/);
  assert.equal(text.includes('JSON.stringify(schema)'), false);
  assert.equal(scriptMatches.length, 1);
});

test('Breadcrumb does not emit standalone JSON-LD by default', async () => {
  const text = await source('src/components/Breadcrumb.astro');

  assertNoJsonLd('Breadcrumb', text);
  assert.equal(text.includes('breadcrumbSchema'), false);
});
