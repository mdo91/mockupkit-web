# Mockup Kit website

Static marketing site and practical App Store creative guides for [Mockup Kit](https://mockupkits.com/), a native macOS app. The website is published by GitHub Pages from `main`.

## Development

Use Node 24 and install the pinned dependencies without lifecycle scripts:

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run build
```

The build writes only `dist/`. Preview it with `python3 -m http.server 4173 --directory dist`. To verify repository-path assets, use `BASE_PATH=/mockupkit-web/ npm run build`; production canonical URLs remain on `https://mockupkits.com/`.

## Content

The three existing guide URLs remain under `/blog/`. Their sources are Markdown in `content/guides/en/`; a shared parser supplies safe rendering, metadata validation, related links and source hashes. The generator assembles the blog index, homepage article links, structured data, and sitemap. Published pages include visible authorship, sources, and accurate publication/update dates. Existing publication identities survive substantive updates.

`index.html`, `support.html`, the legal pages, and `editorial-policy.html` remain editable HTML sources. Shared article templates preserve the site's design. `src/content/product-facts.json` and `docs/product-facts.md` record reviewed capabilities and release status. Do not claim pending features are already publicly available. See [editorial policy](docs/editorial-policy.md) and the [organic growth skill](.agents/skills/organic-growth/SKILL.md) before editing guides.

## Research and publishing

The separate **private** `mdo91/mockupkit-growth-runner` orchestrates research and content generation. Its schedule is 09:00 Europe/Istanbul, with recovery triggers at 09:17 and 09:37. Publishing checks run hourly and resume only pending work. The Mac need not remain awake. GitHub schedule delivery may be delayed.

```sh
npm run growth:keywords -- --plan
npm run growth:keywords -- --language en --refresh
npm run growth:collect
```

The first command is offline. Real collection requires dedicated `mockupkit-searchconsole` and `mockupkit-keywords` native Gum profiles, the approved Ads account configuration, and the private runner's setup. Collection permits only the configured Search Console property and worldwide, English, Google Search Keyword Planner reads. It cannot create campaigns, spend money, or change billing. Search Console's broad availability and withheld query data are represented honestly; missing demand is never invented as zero.

Reports and keyword caches live in ignored `.growth/` with private filesystem modes. Never commit them, `.tools/`, account identifiers, credentials, or model sessions. Fixture reports remain explicitly marked and cannot establish hosted readiness.

The writer changes at most one substantive English guide per day. Independent validation precedes the content PR. An approving review from **mdo91 on the exact current commit** is required before the publisher merges it; green CI alone is insufficient. Date corrections produce a new revision and require approval again. The publisher verifies the exact Pages deployment and live source hash, canonical, sitemap and discovery links. A deployment is not proof of Google indexing or ranking improvement.

## Deployment

`Validate website` runs on pull requests and pushes. The Pages workflow builds and validates `dist/` before upload. Production retains the custom domain, current analytics configuration, established blog URLs and genuine missing-page responses.

The App Store download destination is [Mockup Kit](https://apps.apple.com/app/id6784220988). Support: hi@damastechnologies.com.
