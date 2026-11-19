---
title: "How do you localize App Store screenshots?"
description: "Prepare language-specific screenshot images and headlines, review layout expansion and right-to-left text, and organize exports for App Store Connect."
slug: "how-to-localize-app-store-screenshots"
locale: "en"
publishedAt: "2026-11-19"
updatedAt: "2026-11-19"
status: "published"
primaryQuery: "app store screenshot localization"
topics: ["localization-export"]
sources: [{"title": "Apple screenshot specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications"}]
related: ["app-store-screenshot-workflow-for-indie-developers", "how-to-make-app-store-screenshots-on-mac"]
translationKey: "localize-app-store-screenshots"
---

Localize App Store screenshots by pairing each language's reviewed headline with a matching capture, checking the layout in context, and exporting a complete set for each language. Translate text inside the app captures as well as the headlines around them. Mockup Kit keeps language-specific headlines and images, but you supply and review the translations and captures.

## Prepare a language set

1. Choose the screens and order that explain your app. Capture the same tasks in each supported language using publishable sample data.
2. Keep original captures and reviewed copy in folders outside the app. Note which language and board each file belongs to.
3. In Store Mockup, compose the first board with its capture, background, device position, and headline. Arrange up to ten boards, giving each one a distinct task.
4. Add the appropriate headline and image for each language. Review text embedded in the image separately: changing a headline does not translate a capture.

The [Mac screenshot guide](/blog/how-to-make-app-store-screenshots-on-mac/) walks through the initial composition and canvas choices. Check [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) for your supported devices and localization options.

## Review one board across languages

For a hypothetical habit app, take a board showing a weekly streak. Its English headline might be “See your progress.” Pair each translated headline with a capture showing the same streak in that language. If the translated headline wraps onto an extra line, adjust the wording or layout while keeping the streak visible; do not simply shrink the text until it fits.

Review that board in every language before moving to the next:

- Does the headline describe the screen and fit without clipping?
- Does the capture use the intended language, including labels and sample data?
- In right-to-left layouts, does the composition still read naturally and leave controls visible?
- Does an expanded-layout preview reveal text that needs more room?
- Can a language reviewer understand the message without relying on the English version?

Mockup Kit offers right-to-left and expanded test layouts; these are visual checks, not a substitute for reviewing the language itself. Repeat the review for each board, then inspect each language as a sequence for consistent order and styling.

## Export and check the folders

Screenshot preflight can flag missing translations, unreadable images, overflowing headlines, clipped overlays, and filename conflicts. Resolve the issues and inspect the actual images as well: a passing check cannot judge translation quality or guarantee Apple approval.

A selected screenshot can be exported as PNG or JPEG. Premium Export All produces opaque JPEGs in language folders with consistent filenames, and supports progress, cancellation, and retry of unfinished work. One selected screenshot or creative export is free; Premium unlocks unlimited selected exports and Export All.

Open a file from each language folder and check the headline, capture, dimensions, and crop. Compare the folder contents with your board list before inspecting the upload in App Store Connect. Keep captures, reviewed copy, and final exports outside Mockup Kit: projects remain available only during the current app session. The [release workflow](/blog/app-store-screenshot-workflow-for-indie-developers/) includes a broader upload checklist.
