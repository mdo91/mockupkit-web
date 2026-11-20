---
title: "How do you create an App Store product page header?"
description: "Plan, compose, and check an optional App Store product page header with a practical art-safe layout."
slug: "how-to-create-app-store-product-page-header"
locale: "en"
publishedAt: "2026-11-20"
updatedAt: "2026-11-20"
status: "published"
primaryQuery: "product page header app store"
topics: ["headers-search-assets"]
sources: [{"title": "Apple creative asset specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications"}, {"title": "Apple asset best practices", "url": "https://developer.apple.com/app-store/asset-best-practices/"}, {"title": "Apple asset management", "url": "https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets"}]
related: ["app-store-screenshot-workflow-for-indie-developers", "how-to-make-app-store-screenshots-on-mac"]
translationKey: "create-app-store-product-page-header"
---

Create a product page header by choosing one clear visual idea, placing its essential artwork inside the art-safe area, and exporting an opaque PNG at the Header dimensions. In Mockup Kit's Headers & Search Results studio, you can compose and check that artwork on a Mac before submitting it through App Store Connect.

The header is an optional creative asset for eligible iOS and iPadOS apps; it is separate from required screenshots and is not a required asset for a Mac listing. Apple describes creative placements on iOS and iPadOS 27 and later in its [asset guidance](https://developer.apple.com/app-store/asset-best-practices/). Check your destination app and Apple's current guidance before planning the asset.

## Set up the header

1. Gather your own artwork, icon, and any screenshots you want to use. Choose a visual that represents the app accurately, and keep the source files outside the editor.
2. Open Headers & Search Results and select the Header placement. Start with an editable category template or build a layered scene. Template slots use your own images and artwork.
3. Add and arrange image, text, card, badge, or ring layers as needed. Move, resize, rotate, reorder, hide, or lock layers while refining the composition; undo and redo are available.
4. Use the art-safe and crop guides to keep essential artwork in the safe area. Extend background artwork across the wider canvas so a crop does not expose an unfinished edge.
5. Review the illustrative Store Preview and adjust the composition. It is a design aid, not a promise of Apple's exact presentation or approval.

Apple specifies a **3840 × 1646 pixel PNG** for the product page header, with no alpha channel. Its art-safe rectangle is **1646 × 661 pixels**, starting at x: 1097, y: 493. Check the [creative specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications) for current rules and templates. Header dimensions are different from screenshot dimensions and from the Search Results and Universal placements.

## Work through one layout

Imagine a habit app whose main visual is a calendar with a completed week. Put the calendar inside the Header art-safe guide, with enough space around it to remain recognizable when cropped. Place a subtle background texture across the whole canvas; treat that texture as expendable at the edges. If a small badge is necessary to explain the calendar, keep it inside the safe area too. Hide the badge temporarily to see whether the main idea still reads without it.

Now inspect the preview and guides together. If the calendar or badge touches the boundary, reduce or reposition the essential group rather than relying on the outer background to survive every crop. Check the actual text and artwork for accuracy as well: safe-area placement alone cannot establish whether a claim is suitable for submission.

## Export and review

Export the Header as PNG and inspect the resulting file for the correct dimensions, opacity, legible details, and intended crop. Mockup Kit's preflight checks include placement, dimensions, format, and missing content, but they do not guarantee acceptance. Apple describes asset submission and management in [App Store Connect Help](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets).

One selected screenshot or creative export is free; Premium unlocks unlimited selected exports and Export All. Work runs locally, and projects are available only during the current app session, so retain source artwork and finished exports before quitting. For the accompanying screenshots, use the [release workflow](/blog/app-store-screenshot-workflow-for-indie-developers/) and [Mac screenshot guide](/blog/how-to-make-app-store-screenshots-on-mac/).
