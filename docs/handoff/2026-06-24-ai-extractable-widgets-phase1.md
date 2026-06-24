# Handoff — AI-extractable widgets, Phase 1 build

date: 2026-06-24
repo: astro-local-package (this repo)
for: a fresh Codex implementation session, in a git worktree
full spec (context): `~/Library/CloudStorage/GoogleDrive-mark@webandglow.com/My Drive/WorkOS/02-areas/astro-platform/specs/ai-extractable-widgets-spec.md`

## Goal / definition of done

Implement **Phase 1 only** of the AI-extractable content pattern in this shared package, so the local
sites can earn Google AI-Overview citations on informational queries (e.g. "how much does roof cleaning
cost in [city]") without losing their local-business conversion identity. Phase 1 is **content + schema
+ governance, NO client-side JS.**

Done when, on a feature branch with green CI:
1. **`AnswerBlock.astro`** — render-only Q&A component (`<h2>` question → lead `<p>` short answer →
   markdown detail → optional CTA / interlink). It must **not** mutate page schema. Also usable as a
   `ContentBlocks` block type `answer`.
2. **Single page-level schema collector** — one util/layer assembles the page's JSON-LD and emits
   **exactly one** `<script type="application/ld+json">` graph. FAQ items from `AnswerBlock`s **and the
   existing `ServiceFAQ`** are routed through it and **deduped by normalised question → one
   `FAQPage`.** (Today `ServiceFAQ` emits its own `FAQPage`; that must stop double-emitting.)
3. **Per-type schema gating** — missing real business-identity fields suppress **`LocalBusiness`**
   schema only; `FAQPage`/content schema still emits.
4. **Static cost page pattern** (in the template, see note) — `AnswerBlock` + a **visible cost-range
   table** + disclaimer ("Estimate only — final price depends on on-site assessment. Call for a
   quote."). **No `PriceSpecification`/price schema** from cost ranges.
5. **Content collections** — `src/content/cost/` (+ schema) holding cost ranges, short answers, and
   **required source metadata per entry**: `last_reviewed`, `assumptions`, `service_area`,
   `inclusions`/`exclusions`, `approved_by` (internal governance field — never rendered as a public
   credential), source notes. Entries without this fail validation. Cost data lives here, **not** in
   `site.ts` (which stays identity/config/env only).
6. **Tests:** exactly one `FAQPage` per page; existing-FAQ + AnswerBlock dedupe; `LocalBusiness`
   suppressed when identity fields missing while `FAQPage` still emits; content-model validation
   (ranges, disclaimers, source metadata present); per-site build fixture across configs.

**Explicitly OUT of scope (Phase 2, do NOT build now):** `CostEstimator` interactive calculator,
`DecisionQuiz`. They come after Phase 1 is proven on 1–2 sites.

## Current state

- Branch `main`, last commit `4950593` (chore: bump version to v1.0.64), working tree clean.
- Nothing started. This is a greenfield Phase 1.
- The cost-page route + content live in the consuming sites/template, not this package — this package
  ships the **components + schema collector + content-collection schema**; the template wires them into
  a page. Coordinate the template change in `astro-local-template` (sibling repo).

## Decisions already made — do not re-litigate (Codex-reviewed, 2 passes, converged)

- Components are **render-only**; schema flows explicitly through one collector (no child side-effects).
- **One** page schema graph; one deduped `FAQPage`; route existing `ServiceFAQ` through it.
- **No price schema** for estimate ranges — ranges stay in visible HTML. (A range is not a quote;
  bad price schema is worse than none.)
- Cost/answer/quiz data → **content collections**, not `site.ts`.
- Phased: **Phase 1 = no client-side JS.**
- "Answer-first, short" is **editorial guidance, not a mechanical rule** — answers must read naturally,
  be sourced, and sit in useful detail.
- Identity-truthfulness is handled in a **separate** pass (see the truthfulness handoff) — but do not
  introduce any new unsubstantiated claim here.

## Next 3 actions (in order)

1. Create a worktree + feature branch (e.g. `feat/ai-extractable-phase1`). Write the **schema/data
   contract first**: the single-graph collector interface + the `src/content/cost/` collection schema
   (with required source metadata) + the per-type gating rule.
2. Implement `AnswerBlock.astro` + the collector; migrate `ServiceFAQ` to feed the collector (kill its
   standalone `FAQPage`). Add the `answer` block type to `ContentBlocks`.
3. Add the static cost-page wiring + tests; bump package version; open a PR. Stop there.

## Rails

- Target a **feature branch + PR**, never `main` directly. Get CI green; Mark autonomy allows
  merge-once-green in his repos.
- **Do NOT rebuild or deploy any live site** — Mark gates rebuild/deploy timing.
- Work in a **worktree** (Mark's standing rule for parallel sessions).
- Pilot sites when it reaches the template/site stage: **Gold Coast roof + Gold Coast pool**.

## Open questions for Mark

- **Cost ranges need a defensible source.** Phase 1 ships visible ranges — where do the numbers come
  from (your real job data? a cited market range?)? Needed before the cost page can go live truthfully.
- Confirm Gold Coast roof + pool as the pilot pair.
