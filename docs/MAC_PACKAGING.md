# macOS Packaging Setup

This document describes the macOS packaging configuration for the Kadalingo application.

## Overview

The project now supports building macOS applications with the following features:
- Support for both Intel (x64) and Apple Silicon (arm64) architectures
- DMG installer package
- ZIP archive distribution
- Code signing and notarization support (when certificates are available)
- Automated GitHub Actions workflow for releases

## Build Configuration

### package.json Configuration

The Mac build configuration in `package.json` includes:

```json
{
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "icon": "assets/favicon.icns",
    "category": "public.app-category.education",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  }
}
```

### Key Features

1. **Universal Binaries**: Builds for both Intel (x64) and Apple Silicon (arm64)
2. **DMG Package**: Creates a macOS disk image for easy installation
3. **ZIP Archive**: Provides a compressed archive alternative
4. **Entitlements**: Configured for Electron app security requirements
5. **Hardened Runtime**: Enhanced security for macOS Catalina and later

## Prerequisites

### Icon File

The macOS build requires a `.icns` icon file. See [MAC_ICON_GENERATION.md](./MAC_ICON_GENERATION.md) for instructions on generating this file.

### Entitlements

The `build/entitlements.mac.plist` file is included and configured with necessary entitlements for Electron apps:
- JIT compilation support
- Unsigned executable memory
- Library validation
- Environment variables

## Building for macOS

### Local Build

To build the macOS application locally:

```bash
# Install dependencies
npm install

# Build for macOS
npm run build:mac
```

The build artifacts will be in the `build/` directory:
- `kadalingo-{version}.dmg` - DMG installer
- `kadalingo-{version}-mac.zip` - ZIP archive

### Build Requirements

- macOS 10.13 or later (for building)
- Node.js 18 or later
- npm or yarn

## GitHub Actions Workflow

The `.github/workflows/release-mac.yml` workflow automates macOS builds and releases.

### Workflow Features

1. **Automatic Versioning**: Reads version from `package.json`
2. **Tag Management**: Creates git tags for releases
3. **Build Artifacts**: Compiles DMG and ZIP packages
4. **GitHub Release**: Publishes releases with artifacts
5. **Cloudflare R2 Upload**: Uploads artifacts to R2 storage
6. **Version Tracking**: Maintains version information

### Triggering the Workflow

The workflow can be triggered in two ways:

1. **Automatic**: Push to `main` branch with updated version in `package.json`
2. **Manual**: Use GitHub Actions workflow dispatch

### Manual Trigger

```bash
# Via GitHub UI: Actions > Release Mac > Run workflow
# Or via gh CLI:
gh workflow run release-mac.yml -f version=v1.1.0
```

## Code Signing and Notarization

For distribution outside the Mac App Store, you'll need:

1. **Developer ID Certificate**: For code signing
2. **Notarization**: Apple's notary service

### Setting Up Code Signing

1. Obtain Apple Developer ID certificate
2. Add certificate to GitHub Secrets:
   - `CSC_LINK`: Base64-encoded .p12 certificate
   - `CSC_KEY_PASSWORD`: Certificate password
3. Update workflow to include signing

Example workflow addition:

```yaml
- name: Build application
  env:
    CSC_LINK: ${{ secrets.CSC_LINK }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
  run: npm run build:mac
```

## Distribution

### DMG Installation

1. Download the `.dmg` file
2. Double-click to mount
3. Drag the app to Applications folder
4. Eject the DMG

### ZIP Installation

1. Download the `.zip` file
2. Extract the archive
3. Move the app to Applications folder

### First Run

On first run, users may see a security warning. To resolve:

1. Open System Preferences > Security & Privacy
2. Click "Open Anyway" button
3. Or right-click the app and select "Open"

## Troubleshooting

### Icon Not Found

If you get an error about missing `favicon.icns`:
1. Generate the icon file (see [MAC_ICON_GENERATION.md](./MAC_ICON_GENERATION.md))
2. Place it in `assets/favicon.icns`
3. Rebuild

### Build Fails on CI

1. Check that all dependencies are installed
2. Verify `build/entitlements.mac.plist` is committed
3. Check workflow logs for specific errors

### App Won't Open

If the app won't open after installation:
1. Verify macOS version compatibility (10.13+)
2. Check System Preferences > Security & Privacy
3. Try right-click > Open instead of double-click

## Architecture Details

### Universal Binary

The build creates separate binaries for:
- **x64**: Intel Macs
- **arm64**: Apple Silicon (M1/M2/M3)

Users download one package that works on both architectures.

### File Sizes

Approximate sizes:
- DMG: 80-150 MB
- ZIP: 70-140 MB

(Sizes vary based on dependencies and Electron version)

## Resources

- [Electron Builder Mac Documentation](https://www.electron.build/configuration/mac)
- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarization Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

## Support

For issues with macOS builds:
1. Check this documentation
2. Review [GitHub Issues](https://github.com/JianWang97/kadalingo/issues)
3. Open a new issue with build logs
