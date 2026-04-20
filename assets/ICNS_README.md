# macOS Icon Note

The `favicon.icns` file is required for macOS builds but is not included in the repository because:
1. It's a binary file that would increase repository size
2. It can be generated from the existing `favicon.ico` file

## For Local Development

To generate the `.icns` file for local macOS builds, please see [MAC_ICON_GENERATION.md](../docs/MAC_ICON_GENERATION.md) for detailed instructions.

## For CI/CD

The GitHub Actions workflow for macOS builds will automatically handle icon conversion if the `.icns` file is not present, or you can pre-generate it and commit it to the repository.

If you want to commit the `.icns` file:
1. Generate it using one of the methods in [MAC_ICON_GENERATION.md](../docs/MAC_ICON_GENERATION.md)
2. Save it as `assets/favicon.icns`
3. Commit it to the repository

The file should be approximately 200-500 KB in size depending on the number of icon sizes included.
