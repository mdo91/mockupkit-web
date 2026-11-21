# Organic growth editorial policy

Public policy: [editorial-policy.html](../editorial-policy.html). Publisher: Damas Technologies. The organization byline identifies the publisher; it does not assert that a named person has manually tested or reviewed every article.

## Choose a useful task

Content should answer a real app creator's question using Mockup Kit's verified capabilities. Prefer a practical workflow, a reproducible example, a useful comparison, or a specific troubleshooting answer. Cover screenshot mockups, optional Header/Search assets, localization/export, and standalone image finishing. Do not stretch category templates into claims about unrelated finance, health, or AI capabilities.

Check the existing guide inventory before proposing a page. Improve the existing canonical guide when the new query has the same intent. Do not generate a page for every small keyword variation, location, device label, or year. Search-demand data can prioritize work, but cannot supply product facts or justify thin pages.

## Prepare a reviewable draft

- Read [product facts](product-facts.md) and [the fact JSON](../src/content/product-facts.json).
- Cite current Apple documentation for dimensions, formats, eligibility, and requirements. Use the dated public-release evidence in product facts: version 2.6.0 was verified in the US Mac App Store on November 21. Future unverified features remain labeled upcoming.
- Give the reader concrete steps or examples with a clear outcome. Keep useful color recipes, screenshots, and filenames when they support that outcome.
- Separate design advice from measured results. Do not invent conversion percentages, reviews, testimonials, author credentials, performance measurements, or Apple endorsement.
- Explain that session-only projects must be exported before quitting. Do not promise saved/reopenable projects or cloud sync.
- Keep titles, descriptions, alt text, dates, and structured data accurate and consistent with visible content. Metadata has the same factual-review standard as prose.
- New and materially revised content goes through a pull request. A separate automated editorial review checks its exact revision against product facts, sources, existing coverage, metadata and images before the runner may merge it. Required website CI and repository protections also apply. Do not describe an automated review as human review.

The runner may automatically merge only its reserved, independently validated guide files. Code, assets, configuration and unrelated pull requests remain outside that publication scope. Review approval is bound to the exact content revision; changes invalidate it. At most two review attempts are allowed for the reserved guide, including retries. A rejection, missing review evidence or exhausted attempt budget holds publication without creating another daily guide or resetting usage. An owner may still approve the exact revision through the documented human-review route; that is recorded separately from automated approval.

## Keep the answer concise

Aim for 450–750 words of article body when the task needs that space. A complete shorter answer is welcome; do not pad an introduction, add filler FAQs, repeat conclusions, or split one useful answer into thin pages. Start with the immediate answer, then include the necessary steps and a concrete example or checklist. Use related links and the shared product CTA instead of repeating background and pricing throughout every guide.

Apply a 900-word body ceiling to each automated new or changed guide. That output budget does not impose a global parser limit or invalidate untouched existing articles. It reduces generation and library-input costs; it is not a Google preferred word count or a substitute for helpfulness and factual review.

## Sources and evidence

Favor primary sources: Apple for App Store rules, the native source and product owner for capabilities, Google Search Central for Search guidance. Use original screenshots the publisher may use, with descriptive alt text. Demo artwork illustrates a workflow and is not social proof. Preserve source URLs and verification dates; do not copy entire source documents into articles.

Never scrape Google results for automated rank checks or add link schemes. Use authorized Search Console data when available. A lack of connected metrics is a missing signal, not evidence of zero demand or zero performance.

## Technical publication checks

Articles are Markdown under `content/guides/en/` with the metadata accepted by the content generator. Preserve existing slugs and original publication dates for migrated guides. Use root-relative internal links and asset URLs, relevant related-guide links, and descriptive source objects. Do not add raw HTML, scripts, or a second H1 to article bodies.

Run the site build, tests, and SEO audit before review. Check generated canonical URLs, status eligibility, headings, metadata, internal links, asset files, article/breadcrumb schema, sitemap inclusion, visible organization byline, dates, and narrow-screen layout. A clean audit establishes those checks only; it is not Google certification.

Record `updatedAt` only for substantive content, source, or structured-data corrections. Preserve `publishedAt`. Sitemap `lastmod` must reflect actual significant updates, not every build. A new language needs real reviewed content and reciprocal language links; do not publish automated translations as editorially reviewed.

## Search expectations

Google's [technical requirements](https://developers.google.com/search/docs/essentials/technical) establish eligibility, not an indexing promise. [Helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) favors useful original material; it does not prescribe a word count. [Scaled-content policy](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content) applies when automated pages are created primarily for rankings without user value. [AI guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content) calls for factual review, including metadata.

[Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [canonical links](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) help discovery and URL selection. Valid [Article markup](https://developers.google.com/search/docs/appearance/structured-data/article) can aid interpretation, but [rich results remain unguaranteed](https://developers.google.com/search/docs/appearance/structured-data/sd-policies). Do not promise FAQ rich results: [Google retired that feature in May 2026](https://developers.google.com/search/updates).
