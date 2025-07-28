#!/bin/sh

CHANGELOG_FILE="CHANGELOG.md"
UNRELEASED_SECTION="## [Unreleased]"

# Get all staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# If only CHANGELOG.md is staged, allow commit
ONLY_CHANGELOG_STAGED=$(echo "$STAGED_FILES" | wc -l)
if [ "$ONLY_CHANGELOG_STAGED" -eq 1 ] && echo "$STAGED_FILES" | grep -q "$CHANGELOG_FILE"; then
    echo "ℹ️ Only $CHANGELOG_FILE is staged. Allowing commit."
    exit 0
fi

# Check if [Unreleased] section exists
if ! grep -q "$UNRELEASED_SECTION" "$CHANGELOG_FILE"; then
    echo "❌ [Unreleased] section not found in $CHANGELOG_FILE"
    exit 1
fi

# Check if there are any entries in [Unreleased] section
UNRELEASED_CONTENT=$(sed -n '/## \[Unreleased\]/,/^## /p' "$CHANGELOG_FILE" | grep -E '^[\s*-]')

# Allow commit if [Unreleased] is empty (for changelog release)
if [ -z "$UNRELEASED_CONTENT" ]; then
    echo "ℹ️ [Unreleased] section is empty in $CHANGELOG_FILE. Allowing commit (changelog release or no changes to document)."
    exit 0
fi

# Check if CHANGELOG has been modified in this commit
CHANGELOG_MODIFIED=$(echo "$STAGED_FILES" | grep "$CHANGELOG_FILE")
if [ -z "$CHANGELOG_MODIFIED" ]; then
    echo "❌ $CHANGELOG_FILE not updated but significant files are staged"
    exit 1
fi

# Verify that the CHANGELOG changes are meaningful (not just whitespace)
CHANGELOG_CHANGES=$(git diff --cached "$CHANGELOG_FILE" | grep -E '^[\s*-]' | wc -l)
if [ "$CHANGELOG_CHANGES" -eq 0 ]; then
    echo "❌ $CHANGELOG_FILE was modified but no meaningful entries were added"
    exit 1
fi

echo "✅ $CHANGELOG_FILE verified successfully"
exit 0 