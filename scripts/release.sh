#!/bin/bash
set -e

# Bump patch version (1.0.0 → 1.0.1), commit, tag
npm version patch --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")

echo "→ Releasing v$VERSION"

# Build binaries
npm run electron:build:all

# Commit version bump
git add package.json package-lock.json
git commit -m "Release v$VERSION"
git tag "v$VERSION"
git push && git push --tags

# Upload to GitHub Releases
gh release create "v$VERSION" \
  "release/Runway-$VERSION-arm64.dmg" \
  "release/Runway Setup $VERSION.exe" \
  --title "v$VERSION" \
  --notes "Release v$VERSION"

echo "✓ Done — https://github.com/anandghanw/runway/releases/tag/v$VERSION"
