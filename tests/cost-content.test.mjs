import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { importTypeScript } from './helpers/import-ts.mjs';

const costModule = await importTypeScript('src/content/cost/schema.ts');

function validCostEntry(overrides = {}) {
  return {
    title: 'Roof cleaning cost on the Gold Coast',
    service: 'Roof cleaning',
    question: 'How much does roof cleaning cost on the Gold Coast?',
    short_answer: 'Most residential roof cleaning jobs cost between $450 and $900.',
    detail: 'Final pricing depends on access, height, roof material, and staining.',
    service_area: 'Gold Coast',
    cost_ranges: [
      {
        label: 'Single-storey tile roof',
        min: 450,
        max: 900,
        unit: 'job',
        currency: 'AUD',
        notes: 'Typical residential range before on-site assessment.',
      },
    ],
    disclaimer: costModule.COST_ESTIMATE_DISCLAIMER,
    last_reviewed: '2026-06-24',
    assumptions: ['Safe roof access is available', 'No repair work is included'],
    inclusions: ['Roof cleaning', 'Basic site cleanup'],
    exclusions: ['Repairs', 'Gutter replacement'],
    approved_by: 'Mark Coster',
    source_notes: [
      {
        label: 'Internal quote review',
        note: 'Based on reviewed local job ranges before publication.',
      },
    ],
    ...overrides,
  };
}

test('validateCostEntry accepts a complete governed cost entry', () => {
  const result = costModule.validateCostEntry(validCostEntry());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateCostEntry requires governance and source metadata on every entry', () => {
  const requiredFields = [
    'last_reviewed',
    'assumptions',
    'service_area',
    'inclusions',
    'exclusions',
    'approved_by',
    'source_notes',
  ];

  for (const field of requiredFields) {
    const entry = validCostEntry();
    delete entry[field];
    const result = costModule.validateCostEntry(entry);
    assert.equal(result.valid, false, `${field} should be required`);
    assert.match(result.errors.join('\n'), new RegExp(field));
  }
});

test('validateCostEntry rejects invalid cost ranges and missing disclaimer', () => {
  const invalidRange = costModule.validateCostEntry(validCostEntry({
    cost_ranges: [
      {
        label: 'Impossible range',
        min: 900,
        max: 450,
        unit: 'job',
        currency: 'AUD',
      },
    ],
  }));
  assert.equal(invalidRange.valid, false);
  assert.match(invalidRange.errors.join('\n'), /cost_ranges\[0\]\.max/);

  const missingDisclaimer = costModule.validateCostEntry(validCostEntry({
    disclaimer: 'Prices may vary.',
  }));
  assert.equal(missingDisclaimer.valid, false);
  assert.match(missingDisclaimer.errors.join('\n'), /disclaimer/);
});

test('cost schema and source do not introduce PriceSpecification schema', async () => {
  const source = await readFile('src/content/cost/schema.ts', 'utf8');
  assert.equal(source.includes('PriceSpecification'), false);
  assert.equal(JSON.stringify(validCostEntry()).includes('PriceSpecification'), false);
});
