---
title: "Should you use a Universal asset or separate App Store creative images?"
description: "Choose between one Universal image and separate Header and Search Results artwork by checking the focal image, safe areas, and export requirements."
slug: "choose-universal-or-separate-app-store-creative-assets"
locale: "en"
publishedAt: "2026-11-21"
updatedAt: "2026-11-21"
status: "published"
primaryQuery: "should you use a universal asset or separate app store creative images"
topics: ["headers-search-assets"]
sources: [{"title": "Apple creative asset specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications"}, {"title": "Apple asset best practices", "url": "https://developer.apple.com/app-store/asset-best-practices/"}]
related: ["how-to-create-app-store-product-page-header", "app-store-screenshot-workflow-for-indie-developers"]
translationKey: "choose-universal-or-separate-creative-assets"
---

Use a Universal asset when one compact focal image works for both placements. Choose separate Header and Search Results artwork when the focal image needs different framing or supporting elements in each. In either case, keep essential artwork inside the applicable art-safe guide and inspect the result before export.

These are optional creative assets for eligible iOS and iPadOS apps, separate from required screenshots. Apple describes creative placements on iOS and iPadOS 27 and later in its [asset guidance](https://developer.apple.com/app-store/asset-best-practices/); they are not required for a Mac listing. Mockup Kit is a Mac authoring app.

## Compare the choices

Apple allows a single Universal image across the Header and Search Results placements, or unique images for each. Its [creative specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications) define different canvases and safe areas:

| Placement | Canvas | Art-safe area | Format |
| --- | --- | --- | --- |
| Header | 3840 × 1646 px | 1646 × 661 px at x: 1097, y: 493 | PNG |
| Search Results | 1920 × 1280 to 3840 × 2560 px, 3:2 | At maximum size: 2168 × 1030 px at x: 836, y: 765 | PNG or JPEG |
| Universal | 5244 × 2950 px | 1402 × 962 px at x: 1921, y: 660 | PNG |

Images must have no alpha channel or transparency. The safe areas are placement-specific: do not assume that a layout fitting the Header guide will also fit the Universal guide. Extend background artwork across the canvas while keeping critical elements inside the relevant boundary.

## Try a focal-image test

Imagine a habit app using a calendar and a small streak badge. First, place the calendar inside the Universal art-safe guide and treat the background outside it as expendable. If the badge is essential to understanding the image, fit it inside the guide too. Check whether the calendar and badge remain recognizable together in the illustrative previews.

If fitting both makes the calendar too small to read, try separate scenes: give the Header a wider arrangement and place the calendar above the badge in Search Results. Check each scene against its own guide. Choose the version that keeps the idea clear in both placements; a single Universal file is convenient only if that compact composition works for your artwork.

## Compose and export

1. In Mockup Kit's Headers & Search Results studio, select Universal, or create separate Header and Search Results scenes. Start from an editable category template or arrange your own image, text, card, badge, and ring layers. Template slots use your own artwork.
2. Move and resize essential layers inside the placement's art-safe guide. Use the crop guides and illustrative Store Preview to inspect the composition, and adjust each scene where necessary.
3. Export the appropriate opaque PNG or JPEG and open the finished file to check its dimensions, content, and crop. Preflight checks placement, dimensions, format, and missing content; it does not guarantee Apple approval. The preview does not promise Apple's exact interface or cropping.

One selected screenshot or creative export is free; Premium unlocks unlimited selected exports and Export All. Work runs locally and projects are available during the current session, so retain your source artwork and exports before quitting. For a detailed single-placement example, see the [Header guide](/blog/how-to-create-app-store-product-page-header/); the [release workflow](/blog/app-store-screenshot-workflow-for-indie-developers/) covers accompanying screenshots.
