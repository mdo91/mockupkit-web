---
title: "How to Make App Store Screenshots on Mac"
description: "A practical Mac workflow for iPhone screenshot mockups: choose canvas dimensions, add readable headlines, prepare exports, and check App Store requirements."
slug: "how-to-make-app-store-screenshots-on-mac"
locale: "en"
publishedAt: "2026-07-20"
updatedAt: "2026-11-19"
status: "published"
primaryQuery: "app store screenshots on mac"
topics: ["screenshot-mockups", "localization-export"]
sources: [{"title": "Apple screenshot specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications"}, {"title": "Apple creative asset specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications"}, {"title": "Apple creative placement eligibility", "url": "https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets"}]
related: ["best-app-store-screenshot-backgrounds-and-gradients", "app-store-screenshot-workflow-for-indie-developers"]
translationKey: "screenshot-mockups-on-mac"
---

Start with a clean capture of your app, a short explanation of its benefit, and the canvas your listing needs. Mockup Kit is a native macOS editor for composing iPhone screenshot mockups with backgrounds, headlines, device framing, and image overlays.

This guide separates screenshot preparation from Apple's optional creative assets. It also explains what to check before upload; choosing a preset does not guarantee App Review approval.

## Choose the canvas before composing

Check your app's device families and the accepted dimensions in [Apple's screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications). You do not need to export every supported Mockup Kit preset for every listing. Apple's requirements and fallback scaling depend on the devices your app supports.

Mockup Kit includes these portrait screenshot canvas presets:

| Width | Height |
| --- | --- |
| 1242 px | 2688 px |
| 1320 px | 2868 px |
| 1284 px | 2778 px |
| 1290 px | 2796 px |
| 1179 px | 2556 px |
| 1170 px | 2532 px |

These are Mockup Kit's presets, not a complete list of Apple's accepted sizes. For a macOS app's own listing, use Apple's Mac screenshot requirements rather than an iPhone canvas. The app running on a Mac and the platform of the listing you are designing are separate choices.

## Capture a real product story

Pick a small sequence of actual screens that explain one task. For a budgeting app, that might be adding an expense, seeing a category summary, and reviewing a monthly total. Use sample data you are entitled to publish and check that captures do not expose private information.

Pair each capture with a specific benefit. “Know where it went” explains a spending chart more clearly than a generic “Dashboard” label, but it is a copy example, not a measured conversion claim.

![Mockup Kit canvas with iPhone capture, background, and headline controls](/Assets/asset-1.png)

## Compose the screenshot on your Mac

1. Import the iPhone screenshot into Store Mockup and select the canvas size you need.
2. Choose a solid background or a gradient that separates the app UI from the surrounding canvas.
3. Add a short headline and adjust its font, weight, color, and wrapping.
4. Position the screenshot and headline so important controls remain visible.
5. Add an image overlay only when it explains a feature. For example, an “Offline Mode” badge is useful only if the app actually works offline.

For starting colors and practical contrast checks, see the [backgrounds and gradients guide](/blog/best-app-store-screenshot-backgrounds-and-gradients/). View your composition at a small size before export. If the headline needs zooming to read, shorten it or increase its size.

## Export and inspect the file

Choose PNG for crisp UI and text, or JPEG when it suits the artwork and the placement accepts it. Open the exported file and verify the pixel dimensions, crop, text wrapping, and image quality. Recheck [Apple's specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) rather than resizing a finished image by eye.

![Screenshot composition with a gradient background, headline, and overlay artwork](/Assets/asset-2.png)

A single approved frame is a useful starting point for a consistent set. Keep headline placement, margins, and background choices similar, then change the capture and message for each feature. The [indie release workflow](/blog/app-store-screenshot-workflow-for-indie-developers/) includes a repeatable checklist.

## Build and localize the whole screenshot set

Arrange up to ten boards in one workspace. Keep separate headlines and screenshots for each language, and use right-to-left or expanded test layouts to spot wrapping problems before delivery.

Screenshot preflight checks missing or unreadable images, missing translations, headline overflow, clipped overlays, and filename conflicts. With Premium, Export All writes opaque JPEG compositions into language folders with consistent filenames. Follow progress, cancel, or retry unfinished items without replacing successful files. Selected screenshot export also supports PNG.

## Upcoming in Mockup Kit 2.6.0

Version 2.6.0 has been submitted for App Review and is not yet confirmed available on the public App Store. It adds a Headers & Search Results studio, editable category templates, layered creative scenes, illustrative store previews, style syncing, and the creative-scene versions of localization and batch export. Screenshot workspaces, localization, and batch export are already available in version 2.5.8.

These creative images are separate from ordinary screenshots. Apple currently makes Header and Search Results placements optional for iOS and iPadOS apps and games running iOS 27 or iPadOS 27 or later; they are not macOS listing placements. See [Apple's asset eligibility guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets).

When the studio is available, its header preset is 3840 × 1646 PNG, Search Results supports 1920 × 1280 through 3840 × 2560 at 3:2 in PNG or JPEG, and Universal uses 5244 × 2950 PNG. These files must be opaque, with no alpha channel. Confirm the current [creative asset specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications) before delivery.

## Before closing the editor

Projects remain in memory during the current app session; saving and reopening project files is not yet available. Keep original captures and copy separately, and export the files you need before quitting.

One successful selected screenshot or creative export is free. Premium unlocks unlimited selected exports and Export All. Eligible monthly subscribers may be offered a three-day introductory trial; check the App Store purchase sheet for current terms and local pricing.
