# AI Extractable Widgets Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 of the AI-extractable content pattern in this package: answer-first content blocks, a single page-level JSON-LD graph, cost content validation, and static cost-page support with no new client-side JavaScript.

**Architecture:** Keep content components render-only. Pages pass FAQ/schema inputs into a shared collector that produces one `@graph` object and one JSON-LD script from the page shell. Cost data is validated by a package-shipped content schema/helper and displayed as visible HTML only.

**Tech Stack:** Astro components, TypeScript utilities, Astro content collections, Node's built-in test runner, local Astro fixture builds.

## Global Constraints

- Phase 1 only: do not build `CostEstimator` or `DecisionQuiz`.
- Do not rebuild or deploy any live site.
- Components do not mutate schema as a side effect.
- Emit exactly one page-level `<script type="application/ld+json">` graph.
- Deduplicate FAQ items by normalized question into one `FAQPage`.
- Missing real business identity suppresses `LocalBusiness` only; `FAQPage` and content schema still emit.
- Cost ranges render as visible HTML only; do not emit `PriceSpecification` or price schema.
- `approved_by` is internal governance metadata and must not render publicly.

---

### Task 1: Schema Collector Contract

**Files:**
- Create: `src/utils/schema.ts`
- Test: `tests/schema.test.mjs`

**Interfaces:**
- Produces: `normalizeQuestion(question: string): string`
- Produces: `faqEntriesFromAnswerBlocks(blocks: unknown[]): FAQEntry[]`
- Produces: `buildPageSchema(input: PageSchemaInput): JsonLdGraph`
- Produces: `hasRealLocalBusinessIdentity(siteConfig: SiteConfigLike): boolean`

- [ ] Write failing tests for FAQ dedupe, LocalBusiness gating, FAQ survival without identity, and two site-config fixtures.
- [ ] Run `rtk npm test` and confirm the new tests fail because the schema module does not exist.
- [ ] Implement the schema utility with first-wins FAQ dedupe and per-type LocalBusiness gating.
- [ ] Run `rtk npm test` and confirm schema tests pass.

### Task 2: Cost Content Contract

**Files:**
- Create: `src/content/cost/schema.ts`
- Create: `src/content/config.ts`
- Create: `src/content/cost/README.md`
- Test: `tests/cost-content.test.mjs`

**Interfaces:**
- Produces: `COST_ESTIMATE_DISCLAIMER`
- Produces: `validateCostEntry(entry: unknown): CostEntryValidationResult`
- Produces: `createCostEntrySchema(z: ZodLike): unknown`

- [ ] Write failing tests for valid cost entries, missing governance metadata, invalid min/max ranges, required disclaimer text, and absence of price schema.
- [ ] Run `rtk npm test` and confirm the new tests fail because the cost schema does not exist.
- [ ] Implement the pure validator and Astro collection schema factory.
- [ ] Run `rtk npm test` and confirm cost tests pass.

### Task 3: Render-Only Components

**Files:**
- Create: `src/components/AnswerBlock.astro`
- Create: `src/components/CostRangeTable.astro`
- Modify: `src/components/ContentBlocks.astro`
- Modify: `src/utils/component-registry.ts`
- Test: `tests/component-source.test.mjs`

**Interfaces:**
- Produces: `AnswerBlock` props `{ question, shortAnswer, detail, cta, interlink }`
- Produces: `CostRangeTable` props `{ ranges, disclaimer }`
- Extends: `ContentBlocks` block type `answer`

- [ ] Write failing source-level tests that `AnswerBlock`, `ServiceFAQ`, and `CostRangeTable` contain no JSON-LD script and no price schema.
- [ ] Run `rtk npm test` and confirm component tests fail because the components do not exist.
- [ ] Implement `AnswerBlock.astro` with `h2`, lead paragraph, markdown detail, optional CTA, and optional interlink.
- [ ] Implement `CostRangeTable.astro` as visible table plus required disclaimer.
- [ ] Add the `answer` block type to `ContentBlocks` and registry exports.
- [ ] Run `rtk npm test` and confirm component tests pass.

### Task 4: Single Script Wiring

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/layouts/LandingPage.astro`
- Modify: `src/components/SEO.astro`
- Modify: `src/components/Breadcrumb.astro`

**Interfaces:**
- Consumes: `buildPageSchema(input: PageSchemaInput)`
- Produces: `Layout` props `{ schema, faqs, includeLocalBusiness }`
- Produces: `SEO` props `{ schema, faqs, includeLocalBusiness }`

- [ ] Add tests or fixture assertions that a rendered page has one JSON-LD script and one FAQPage.
- [ ] Replace Layout's inline LocalBusiness object with `buildPageSchema`.
- [ ] Route custom `schema` and FAQ items through Layout/SEO collector inputs.
- [ ] Stop Breadcrumb from emitting a standalone JSON-LD script by default.
- [ ] Run `rtk npm test` and confirm one-script assertions pass.

### Task 5: Fixture Builds, CI, Version, PR

**Files:**
- Create: `tests/fixtures/site-roof/*`
- Create: `tests/fixtures/site-pool/*`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `npm test` as the CI command.
- Produces: package version patch bump.

- [ ] Add two local Astro fixture builds that use different business configs and Phase 1 components.
- [ ] Add PR CI that runs `npm ci` and `npm test` only.
- [ ] Bump package version with `npm version patch --no-git-tag-version`.
- [ ] Run `rtk npm test`.
- [ ] Run fixture builds through the test suite and inspect generated HTML assertions.
- [ ] Commit, push `codex/ai-extractable-widgets-phase1`, open a PR, and wait for CI to pass.
