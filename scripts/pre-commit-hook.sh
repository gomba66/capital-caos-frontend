#!/bin/sh

# Pre-commit hook to verify CHANGELOG for Capital Caos Frontend
# Blocks commits if CHANGELOG is not updated when there are significant changes

CHANGELOG_FILE="CHANGELOG.md"
UNRELEASED_SECTION="## [Unreleased]"

# Get staged files (excluding CHANGELOG.md itself and certain file types)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -v "$CHANGELOG_FILE" | grep -E '\.(js|jsx|ts|tsx|css|scss|json)$' | grep -v "^docs/" | grep -v "^public/")

# If no significant files are staged, allow commit
if [ -z "$STAGED_FILES" ]; then
    echo "✅ No significant files staged, allowing commit"
    exit 0
fi

# Check if CHANGELOG.md exists
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "❌ CHANGELOG.md not found"
    echo "Please create a CHANGELOG.md with the [Unreleased] section"
    exit 1
fi

# Check if [Unreleased] section exists
if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    echo "❌ [Unreleased] section not found in CHANGELOG.md"
    echo "Please add the [Unreleased] section to the CHANGELOG"
    exit 1
fi

# Check if there are any entries in [Unreleased] section
UNRELEASED_CONTENT=$(sed -n '/## \[Unreleased\]/,/^## /p' "$CHANGELOG_FILE" | grep -E '^\s*[-*]\s*\*\*')

if [ -z "$UNRELEASED_CONTENT" ]; then
    echo "❌ No entries found in [Unreleased] section"
    echo "You must add entries to the CHANGELOG before committing"
    echo ""
    echo "Staged files that require documentation:"
    echo "$STAGED_FILES" | sed 's/^/  - /'
    echo ""
    echo "Use: node scripts/update-changelog.js <type> <description>"
    echo ""
    echo "Available types: added, fixed, enhanced, technical, security, performance, deployment, ui, ux, api"
    echo "Example: node scripts/update-changelog.js fixed \"Chart rendering issue\""
    echo ""
    echo "Commit blocked. Please update CHANGELOG and try again."
    exit 1
fi

# Check if CHANGELOG has been modified in this commit
CHANGELOG_MODIFIED=$(git diff --cached --name-only | grep "$CHANGELOG_FILE")

if [ -z "$CHANGELOG_MODIFIED" ]; then
    echo "❌ CHANGELOG.md not updated but significant files are staged"
    echo ""
    echo "Staged files that require documentation:"
    echo "$STAGED_FILES" | sed 's/^/  - /'
    echo ""
    echo "You must update the CHANGELOG to document these changes"
    echo ""
    echo "Use: node scripts/update-changelog.js <type> <description>"
    echo ""
    echo "Available types: added, fixed, enhanced, technical, security, performance, deployment, ui, ux, api"
    echo "Example: node scripts/update-changelog.js fixed \"Chart rendering issue\""
    echo ""
    echo "Commit blocked. Please update CHANGELOG and try again."
    exit 1
fi

# Verify that the CHANGELOG changes are meaningful (not just whitespace)
CHANGELOG_CHANGES=$(git diff --cached "$CHANGELOG_FILE" | grep -E '^\s*[-*]\s*\*\*' | wc -l)

if [ "$CHANGELOG_CHANGES" -eq 0 ]; then
    echo "❌ CHANGELOG.md was modified but no meaningful entries were added"
    echo ""
    echo "Staged files that require documentation:"
    echo "$STAGED_FILES" | sed 's/^/  - /'
    echo ""
    echo "You must add meaningful entries to the CHANGELOG"
    echo ""
    echo "Use: node scripts/update-changelog.js <type> <description>"
    echo ""
    echo "Available types: added, fixed, enhanced, technical, security, performance, deployment, ui, ux, api"
    echo "Example: node scripts/update-changelog.js fixed \"Chart rendering issue\""
    echo ""
    echo "Commit blocked. Please add meaningful CHANGELOG entries and try again."
    exit 1
fi

echo "✅ CHANGELOG verified successfully"
echo "📝 Changes documented in CHANGELOG.md"
echo "📁 Staged files:"
echo "$STAGED_FILES" | sed 's/^/  - /'

exit 0 