# macOS Icon Generation Guide

## Overview
This guide explains how to generate the `favicon.icns` file required for macOS builds.

## Prerequisites
The project currently has a `favicon.ico` file in the `assets` folder that needs to be converted to `.icns` format for macOS.

## Methods to Generate .icns File

### Method 1: Online Conversion (Easiest)
1. Visit https://cloudconvert.com/ico-to-icns
2. Upload `assets/favicon.ico`
3. Download the converted `favicon.icns`
4. Save it to `assets/favicon.icns`

### Method 2: Using macOS iconutil (Recommended for macOS users)

#### Step 1: Extract PNG from ICO
```bash
# Install ImageMagick if not already installed
brew install imagemagick

# Convert ICO to PNG
convert assets/favicon.ico -resize 1024x1024 /tmp/icon_1024x1024.png
```

#### Step 2: Create iconset folder structure
```bash
mkdir /tmp/favicon.iconset

# Generate all required sizes
sips -z 16 16     /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_16x16.png
sips -z 32 32     /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_16x16@2x.png
sips -z 32 32     /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_32x32.png
sips -z 64 64     /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_32x32@2x.png
sips -z 128 128   /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_128x128.png
sips -z 256 256   /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_128x128@2x.png
sips -z 256 256   /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_256x256.png
sips -z 512 512   /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_256x256@2x.png
sips -z 512 512   /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_512x512.png
sips -z 1024 1024 /tmp/icon_1024x1024.png --out /tmp/favicon.iconset/icon_512x512@2x.png
```

#### Step 3: Generate .icns file
```bash
iconutil -c icns /tmp/favicon.iconset -o assets/favicon.icns
```

### Method 3: Using ImageMagick/GraphicsMagick
```bash
# Install ImageMagick
brew install imagemagick

# Convert directly (may not include all required sizes)
convert assets/favicon.ico -resize 1024x1024 assets/favicon.icns
```

### Method 4: Using png2icons (npm package)
```bash
# Install png2icons
npm install -g png2icons

# First convert ICO to PNG
convert assets/favicon.ico -resize 1024x1024 /tmp/icon.png

# Generate .icns
png2icons /tmp/icon.png assets -icns
```

## Verification
After generating the `.icns` file, verify it exists:
```bash
ls -lh assets/favicon.icns
```

The file should be committed to the repository so it's available during CI/CD builds.

## Notes
- The `.icns` file should contain multiple resolutions (16x16 up to 1024x1024)
- For best results, start with a high-resolution source image (at least 1024x1024)
- The icon will be used for the macOS application bundle

## CI/CD Builds
The GitHub Actions workflow expects the `assets/favicon.icns` file to be present in the repository. Make sure to commit this file after generation.
