# Mockup Kit product facts

The machine-readable source of truth for content generation is [src/content/product-facts.json](../src/content/product-facts.json). Keep it separate from suggested topics and search-demand signals: a query is not evidence that the app supports a feature.

Facts were checked on November 19, 2026 against the native app source, the user's current feature description, and Apple's first-party asset documentation. Native source is linked in the JSON. Public App Store availability for version 2.6.0 has not been confirmed; its new creative studio and the creative-scene versions of localization and preflight must remain labeled upcoming until a maintainer verifies the public release.

## Product and audience

Mockup Kit is a native macOS editor for app creators making iPhone screenshot mockups and, in version 2.6.0, Header/Search creative artwork. It is not a browser-based editor, AI image generator, cloud workspace, or service that publishes an App Store listing for the user.

Existing composition tools include screenshot canvas presets, device framing, backgrounds and gradients, headlines, overlays, rounded corners, and selected PNG/JPEG exports. Rounded Image is a standalone PNG finishing tool.

Version 2.5.8 already includes up to ten screenshot boards, per-language headlines and screenshots, right-to-left and expanded test layouts, screenshot preflight, and screenshot Export All with progress, cancellation, retry, locale folders, and consistent filenames. Screenshot rendering is opaque RGB. Selected screenshot export supports PNG/JPEG; screenshot Export All encodes JPEG. These facts are verified against the pinned 2.5.8 source commit `f8cd468aaac23b004bb4b839248c444efb5ffce3`, linked in the JSON.

Version 2.6.0 adds the layered Headers & Search Results studio, six editable category templates, illustrative store previews, style syncing, art-safe/crop guides, and extends localization, opaque RGB output, preflight, and batch export to those new creative scenes. A store preview is illustrative; preflight does not guarantee Apple approval.

Composition and export run locally. Projects remain in memory during the app session. Saving and reopening project files is not yet available. Do not claim persistent project storage, account sync, collaborative editing, or external AI services.

## Pricing claims

The native export policy allows one successful selected screenshot or creative export free. Premium allows unlimited selected exports and Export All. Eligible monthly subscribers may see a three-day introductory trial; the app's StoreKit configuration and paywall include that offer. State eligibility and direct readers to the current purchase sheet instead of treating one storefront's prices as universal.

## Apple's placements

Apple's [asset eligibility guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets) distinguishes optional creative assets from screenshots and previews. Header/Search creatives currently apply to iOS/iPadOS 27+ apps and games, not macOS listings. The creator tool running on Mac does not change the target placement's eligibility.

Under the [creative specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications), Header is exactly 3840 × 1646 PNG, Search Results ranges from 1920 × 1280 to 3840 × 2560 at 3:2 in PNG/JPEG, and Universal is exactly 5244 × 2950 PNG. No alpha channel or transparency is allowed. Use Apple's exact art-safe rectangles in product facts, not a generic center-50% approximation.

Screenshot presets reflect the app's supported canvases, not an exhaustive or universally required Apple upload list. Consult [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) for supported devices and fallback rules. Do not invent support for every Apple platform or future device canvas.

## Updating facts

When source or product behavior changes, update the JSON, this context, and affected published content together. Verify prices in the actual storefront if a price is necessary. Verify the public App Store version before changing release availability. Record the source and check date; an automatically changed timestamp alone is not a verification.

If sources disagree, preserve the uncertainty and prepare a correction for review. User feature intent establishes scope; source and current first-party documentation establish what can truthfully be described as shipped behavior or an Apple requirement.
