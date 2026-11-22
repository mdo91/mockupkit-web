---
title: "How to add overlays to App Store screenshots"
description: "Add an image overlay to an iPhone screenshot mockup and check that it explains the screen without hiding important app controls."
slug: "how-to-add-overlays-to-app-store-screenshots"
locale: "en"
publishedAt: "2026-11-22"
updatedAt: "2026-11-22"
status: "published"
primaryQuery: "add overlays to app store screenshots"
topics: ["screenshot-mockups"]
sources: [{"title": "Apple screenshot specifications", "url": "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications"}]
related: ["how-to-make-app-store-screenshots-on-mac", "best-app-store-screenshot-backgrounds-and-gradients"]
translationKey: "add-overlays-to-app-store-screenshots"
---

In Mockup Kit on a Mac, import an iPhone screenshot in **Store Mockup**. Open **Overlay**, choose **Add Images…**, then select the overlay’s thumbnail. You can drag the image on the canvas or place it with **Horizontal** and **Vertical**. Use **Scale** to make room for the callout while keeping the app’s controls visible.

## Add and position the image

1. Open the board you want to edit. Import your app capture first if the board is empty. The **Overlay** section appears once the board has a screenshot. Use artwork you have permission to publish.
2. In **Overlay**, choose **Add Images…** and pick your image files. If you add several, click the thumbnail for the image you want to adjust.
3. Drag the selected image into position on the canvas. Use **Horizontal** or **Vertical** for a smaller adjustment along one axis. Change **Scale** if the overlay crowds the device or the headline.
4. Use **Rounded Corners** or **Rotation** if they help the callout read clearly. With two overlays on the board, click each thumbnail before adjusting it. To delete an unwanted image, select its thumbnail and choose **Remove Selected**.

For the canvas, device frame and headline, see the [Mac screenshot guide](/blog/how-to-make-app-store-screenshots-on-mac/). Check [Apple’s screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) for the device sizes accepted for your listing.

## Fix clipping after moving or rotating an overlay

Suppose a fictional budgeting app shows a monthly chart. You want to point out one category, so you add a small arrow image beside the phone. The arrow fits at first. When you turn it toward the chart, one corner extends close to the edge of the canvas.

Select the arrow’s thumbnail and run screenshot preflight. A clipping warning means the arrow’s rotated bounds extend beyond the canvas safe area. Keep the desired angle and move the arrow inward with **Horizontal** or **Vertical**, one axis at a time. If moving inward covers a category label, reduce **Scale** or use less **Rotation**, then run preflight again. If preflight reports an unreadable overlay, replace the image with a readable copy before adjusting its placement. Inspect the exported image at full size for any cut-off pixels and at a small browsing size for readability.

Compare the same composition with and without that image. First identify the chart, then read the headline, then inspect the overlay. If the overlay draws attention before the chart or repeats what the headline already says, move it away from the interface or leave it out. Check the result against the actual app screen, not just the decorated mockup.

If you need more separation around the phone, the [background recipes](/blog/best-app-store-screenshot-backgrounds-and-gradients/) show ways to create it with color and layout.

## Check the exported image

Export the selected screenshot as PNG or JPEG. Reopen the file to check that the whole arrow is visible, the category labels still read clearly, and the dimensions match your target. Inspect the upload in App Store Connect as well. Keep the source captures, overlay artwork and finished exports outside Mockup Kit before quitting because the editor keeps projects for the current session.
