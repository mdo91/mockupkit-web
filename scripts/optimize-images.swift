#!/usr/bin/env swift
// Regenerate committed website image derivatives on macOS:
// swift -module-cache-path /tmp/mockupkit-image-module-cache scripts/optimize-images.swift
// Requires Apple's ImageIO/CoreGraphics frameworks and cwebp (brew install webp).
// The normal Node website build does not invoke this script or require cwebp.

import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct Crop: Codable { let x: Int; let y: Int; let width: Int; let height: Int }
struct Spec {
    let source: String
    let name: String
    let crop: Crop?
    let widths: [Int]
    let fallbackWidth: Int
    var logo = false
}
struct Original: Encodable { let width: Int; let height: Int; let bytes: Int; let format: String }
struct Variant: Encodable { let src: String; let width: Int; let height: Int; let bytes: Int; let type: String }
struct Asset: Encodable {
    let name: String
    let original: Original
    let crop: Crop?
    let width: Int
    let height: Int
    let webp: [Variant]
    let fallback: Variant
}

let scriptURL = URL(fileURLWithPath: #filePath).standardizedFileURL
let root = scriptURL.deletingLastPathComponent().deletingLastPathComponent()
let output = root.appendingPathComponent("Assets/images", isDirectory: true)
let temporary = FileManager.default.temporaryDirectory.appendingPathComponent("mockupkit-image-\(UUID().uuidString)", isDirectory: true)
let cwebpCandidates = [ProcessInfo.processInfo.environment["CWEBP"], "/opt/homebrew/bin/cwebp", "/usr/local/bin/cwebp", "/usr/bin/cwebp"].compactMap { $0 }
guard let cwebp = cwebpCandidates.first(where: { FileManager.default.isExecutableFile(atPath: $0) }) else {
    fatalError("cwebp is required for regeneration. Install webp or set CWEBP to its absolute path.")
}
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: temporary, withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: temporary) }

let largeWidths = [480, 800, 1200, 1600]
let specs = [
    Spec(source: "/Assets/main.png", name: "iphone-screenshot-mockup-workspace", crop: Crop(x: 480, y: 110, width: 4240, height: 2650), widths: largeWidths, fallbackWidth: 1200),
    Spec(source: "/Assets/example.png", name: "iphone-screenshot-gradient-example", crop: Crop(x: 480, y: 110, width: 4240, height: 2650), widths: largeWidths, fallbackWidth: 1200),
    Spec(source: "/Assets/search-result.png", name: "app-store-header-search-results-studio", crop: Crop(x: 770, y: 320, width: 3580, height: 2300), widths: largeWidths, fallbackWidth: 1200),
    Spec(source: "/Assets/localization.png", name: "localized-app-store-creative-studio", crop: nil, widths: largeWidths, fallbackWidth: 1200),
    Spec(source: "/Assets/templates.png", name: "app-store-category-template-gallery", crop: nil, widths: [480, 800, 1200, 1500], fallbackWidth: 1200),
    Spec(source: "/Assets/store-preview.png", name: "app-store-search-card-preview", crop: Crop(x: 0, y: 530, width: 790, height: 900), widths: [320, 480, 640, 790], fallbackWidth: 790),
    Spec(source: "/Assets/asset-1.png", name: "app-store-screenshot-editor", crop: nil, widths: [480, 800, 1200, 1440], fallbackWidth: 1200),
    Spec(source: "/Assets/asset-2.png", name: "app-store-screenshot-gradient-overlay", crop: nil, widths: [480, 800, 1200, 1440], fallbackWidth: 1200),
    Spec(source: "/Assets/logo.png", name: "mockup-kit-logo", crop: nil, widths: [64, 128], fallbackWidth: 128, logo: true)
]

func byteCount(_ url: URL) throws -> Int {
    (try url.resourceValues(forKeys: [.fileSizeKey])).fileSize ?? 0
}

func dimensions(width: Int, image: CGImage) -> (Int, Int) {
    let width = min(width, image.width)
    return (width, max(1, Int((Double(image.height) * Double(width) / Double(image.width)).rounded())))
}

func fallbackImage(_ image: CGImage, width: Int, png: Bool, destination: URL) throws -> (Int, Int) {
    let (width, height) = dimensions(width: width, image: image)
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
        fatalError("Could not allocate image context")
    }
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.interpolationQuality = .high
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    guard let resized = context.makeImage(), let encoder = CGImageDestinationCreateWithURL(destination as CFURL, (png ? UTType.png.identifier : UTType.jpeg.identifier) as CFString, 1, nil) else {
        fatalError("Could not create image encoder")
    }
    // No source EXIF, location data, or other source metadata is copied.
    let options: [CFString: Any] = png ? [:] : [kCGImageDestinationLossyCompressionQuality: 0.86]
    CGImageDestinationAddImage(encoder, resized, options as CFDictionary)
    guard CGImageDestinationFinalize(encoder) else { fatalError("Image encoding failed") }
    return (width, height)
}

var manifest: [String: Asset] = [:]
for spec in specs {
    let source = root.appendingPathComponent(String(spec.source.dropFirst()))
    guard let decoder = CGImageSourceCreateWithURL(source as CFURL, nil), let original = CGImageSourceCreateImageAtIndex(decoder, 0, nil) else {
        fatalError("Could not decode \(spec.source)")
    }
    let originalType = CGImageSourceGetType(decoder).map { $0 as String } ?? "unknown"
    let sourceImage: CGImage
    if let crop = spec.crop {
        guard crop.x >= 0, crop.y >= 0, crop.width > 0, crop.height > 0,
              crop.x + crop.width <= original.width, crop.y + crop.height <= original.height,
              let image = original.cropping(to: CGRect(x: crop.x, y: crop.y, width: crop.width, height: crop.height)) else {
            fatalError("Crop outside image bounds: \(spec.source)")
        }
        sourceImage = image
    } else { sourceImage = original }

    // Convert the source's monitor/P3 profile to sRGB pixels before stripping
    // metadata. Dropping an ICC profile without this conversion changes colors.
    let preparedSource = temporary.appendingPathComponent("\(spec.name).png")
    _ = try fallbackImage(sourceImage, width: sourceImage.width, png: true, destination: preparedSource)
    var variants: [Variant] = []
    for requestedWidth in spec.widths {
        let (width, height) = dimensions(width: requestedWidth, image: sourceImage)
        let filename = "\(spec.name)-\(width).webp"
        let destination = output.appendingPathComponent(filename)
        var arguments = ["-quiet", "-metadata", "none", "-m", "6", "-mt"]
        arguments += spec.logo ? ["-lossless", "-exact"] : ["-q", "86", "-sharp_yuv", "-af"]
        arguments += ["-resize", "\(width)", "\(height)", preparedSource.path, "-o", destination.path]
        let process = Process()
        process.executableURL = URL(fileURLWithPath: cwebp)
        process.arguments = arguments
        try process.run()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else { fatalError("cwebp failed for \(spec.source)") }
        variants.append(Variant(src: "/Assets/images/\(filename)", width: width, height: height, bytes: try byteCount(destination), type: "image/webp"))
    }
    let filename = "\(spec.name)-\(min(spec.fallbackWidth, sourceImage.width)).\(spec.logo ? "png" : "jpg")"
    let destination = output.appendingPathComponent(filename)
    let (width, height) = try fallbackImage(sourceImage, width: spec.fallbackWidth, png: spec.logo, destination: destination)
    let fallback = Variant(src: "/Assets/images/\(filename)", width: width, height: height, bytes: try byteCount(destination), type: spec.logo ? "image/png" : "image/jpeg")
    manifest[spec.source] = Asset(name: spec.name, original: Original(width: original.width, height: original.height, bytes: try byteCount(source), format: originalType), crop: spec.crop, width: sourceImage.width, height: sourceImage.height, webp: variants, fallback: fallback)
    print("\(spec.name): \(try byteCount(source)) bytes original → \(variants.map { "\($0.width)w:\($0.bytes)" }.joined(separator: ", "))")
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
var data = try encoder.encode(manifest)
data.append(0x0A)
try data.write(to: root.appendingPathComponent("src/image-assets.json"), options: .atomic)
print("Wrote src/image-assets.json. Originals remain unchanged.")
