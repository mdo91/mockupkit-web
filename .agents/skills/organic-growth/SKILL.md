---
name: organic-growth
description: Prepare, review, or improve Mockup Kit guides and organic-search content using the product facts, existing guide inventory, and website publishing pipeline. Use for this repository's content and SEO workflow, not unrelated app development.
---

# Mockup Kit organic growth

When assigned the runner’s offline content-writing stage, stay within that stage’s content-only file scope; its task instructions override the broader setup and research steps below. Do not run collectors, change configuration, or publish from that writer stage.

Read [product facts](../../../docs/product-facts.md), [the fact JSON](../../../src/content/product-facts.json), and [editorial policy](../../../docs/editorial-policy.md) before drafting or revising content. Use `npm run growth:keywords -- --plan` for the next proposed topic. `npm run growth:collect` writes private `.growth/` research reports; real Google metrics are used only when configured. Read the repository README for the runner setup and current operational commands.

Inspect `content/guides/en/` for an existing article that already answers the query. Revise that canonical guide when intent overlaps. A genuinely new page should add a useful workflow, example, or answer for app creators, rather than another phrasing of the same keyword.

Keep drafts concise: aim for 450–750 body words when useful, and accept a shorter complete answer. Automated new or changed guides have a 900-word body ceiling; this does not cap untouched library articles or the website parser. Answer the question first, then give necessary steps and one useful example or checklist. Remove filler FAQs, long introductions, repeated conclusions, and product boilerplate already supplied by the shared CTA. The budget controls cost, not Google ranking eligibility; never pad or split an answer to fit it.

Use the generator's Markdown metadata and preserve existing URLs and original publication dates. Root-relative guide links and `/Assets/` images work across generated routes. Include relevant sources as `{title, url}` objects and related guides as slugs. Keep scripts and raw HTML out of article bodies. Use the supported `swatches` code fence for color recipes instead of inline CSS.

Apply these product-specific checks:

- Mockup Kit runs on Mac; Apple's optional Header/Search placements target iOS/iPadOS 27+ apps, not Mac listings.
- Header and Universal creative images require PNG. Search Results accepts PNG/JPEG at the supported 3:2 dimensions. Verify Apple rules from their current first-party documentation.
- Label version 2.6.0 features upcoming until public release is verified in the maintained facts. Do not infer availability merely from a merged PR or TestFlight build.
- One successful selected export is free; Premium unlocks unlimited selected exports and Export All. Introductory monthly trials depend on eligibility; local prices belong in the purchase sheet.
- Projects are session-only. Store Preview is illustrative, and export preflight does not guarantee Apple approval.
- Do not invent conversion metrics, testimonials, reviewer credentials, cloud sync, AI generation, or persistent project storage.

Run `npm test`, `npm run check`, `npm run build`, and `npm run validate`, then inspect the generated result. Review factual claims, metadata, links, images, dates, and layout as well as syntax. Automated checks cannot certify Google rankings, indexing, editorial quality, or Apple acceptance.

The growth runner permits at most one new guide per publishing day. Content PRs require an approval by `mdo91` on the exact current head before release; approval of an older revision does not cover new edits. Prepare content changes as a reviewable pull request under the user's requested publishing scope. Do not mark editorial or language review complete unless it happened. A runner's topic recommendation is a proposal, not permission to publish unrelated content or change product facts. On failure, keep useful diagnostic output and correct the concrete issue instead of repeatedly publishing variants.
