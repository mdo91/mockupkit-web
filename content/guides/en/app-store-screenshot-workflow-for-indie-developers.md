---
title: "App Store Screenshot Workflow for Indie Developers"
description: "A release checklist for indie developers: capture real UI, compose screenshot sets, prepare localized text, export assets, and verify the upload in App Store Connect."
slug: "app-store-screenshot-workflow-for-indie-developers"
locale: "en"
publishedAt: "2026-07-20"
updatedAt: "2026-11-19"
status: "published"
primaryQuery: "app store screenshot workflow"
topics: ["screenshot-mockups", "headers-search-assets", "localization-export", "image-finishing"]
sources: [{"title": "Apple screenshot specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications"}, {"title": "Apple creative asset specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications"}, {"title": "Apple creative placement eligibility", "url": "https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets"}]
related: ["how-to-make-app-store-screenshots-on-mac", "best-app-store-screenshot-backgrounds-and-gradients"]
translationKey: "indie-screenshot-workflow"
---

Use the same order for each screenshot update: capture the release UI, compose a consistent set, review translations, export, and check the upload. Keep source files outside Mockup Kit so the next update does not depend on an open editor session.

## Plan one task per frame

Choose tasks that explain the release. A habit-app example could show setting a goal, recording today's progress, and reviewing a streak. Write one headline for each capture before decorating it.

Capture the build users will receive. Use publishable sample data and remove private information. Keep originals in a release folder so you can change a crop without recapturing everything.

## Compose the first frame before repeating it

1. Import the strongest capture into Store Mockup and choose the listing canvas.
2. Set a background, write a specific headline, and adjust type size and color.
3. Position the device without hiding important controls.
4. Add a badge or overlay only when it explains a real capability.
5. Check the result at a small size, then reuse its visual system across the set.

![Mockup Kit screenshot workspace with device capture and headline controls](/Assets/asset-1.png)

Arrange up to ten screenshot boards. Use the [background recipes](/blog/best-app-store-screenshot-backgrounds-and-gradients/) for colors and the [basic composition guide](/blog/how-to-make-app-store-screenshots-on-mac/) for canvas presets. Every preset is not a mandatory upload: check [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) for your supported devices. A Mac app's listing needs Mac screenshot dimensions.

## Prepare localization and exports

Version 2.5.8 already keeps per-language headlines and images, with right-to-left and expanded-layout previews. Review meaning, line breaks, and text embedded in captures; previews cannot replace a language review.

Selected screenshot export supports PNG or JPEG. Premium Export All writes opaque JPEG files into language folders. Names include the board, sequence, language, and dimensions: an Overview board can produce `overview-01-en-1320x2868.jpg`.

Keep a manually organized release folder for original captures, translated copy, and final exports. This separates editable source material from generated delivery files without implying that the app saves project documents.

## Plan optional creative artwork separately

The upcoming 2.6.0 release adds Header, Search Results, and Universal scenes, six editable templates, layered composition, undo/redo, and creative-scene localization/export. Public App Store release is not yet confirmed. Store Preview is illustrative, not a live listing or approval check.

These optional placements are for iOS/iPadOS 27+ apps and games, not macOS listings. Check [Apple's placement eligibility](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets) and [creative specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications):

| Placement | Export canvas | Format |
| --- | --- | --- |
| Header | 3840 × 1646 px | PNG |
| Search Results | 1920 × 1280 through 3840 × 2560 px, 3:2 | PNG or JPEG |
| Universal | 5244 × 2950 px | PNG |

Keep focal artwork inside the studio's art-safe guides and inspect the crop. These images must be opaque, without an alpha channel.

## Run a release checklist

- Captures and claims match the release build.
- Each frame explains a different useful task.
- Headlines remain readable at a small size.
- Translations and embedded screenshot text have been checked.
- Export dimensions, format, crop, and image quality match the placement.
- Files open correctly and look right in App Store Connect's preview.
- Source captures, copy, and final exports are retained outside the app.

Screenshot preflight already flags missing or unreadable images, missing translations, overflow, clipped overlays, and filename conflicts. Export All supports progress, cancellation, and retry of unfinished work without replacing successful files. The new creative studio adds placement-specific dimension and format checks; Apple still evaluates the submission.

For a standalone image, Rounded Image applies corner radius in pixels or a percentage and exports PNG. Projects remain session-only, so export finished work before quitting; saving and reopening project files is not yet available.
