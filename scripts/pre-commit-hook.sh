#!/bin/sh

# Pre-commit hook to verify CHANGELOG
# Verifies that if there are significant changes, the CHANGELOG is updated

CHANGELOG_FILE="CHANGELOG.md"
UNRELEASED_SECTION="## [Unreleased]"

# Verificar si hay cambios en archivos de código (excluyendo documentación)
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx|css|scss)$')

if [ -n "$CHANGED_FILES" ]; then
    echo "🔍 Verifying CHANGELOG..."
    
    # Verify that CHANGELOG exists
    if [ ! -f "$CHANGELOG_FILE" ]; then
        echo "❌ CHANGELOG.md not found"
        echo "Please create a CHANGELOG.md with the [Unreleased] section"
        exit 1
    fi
    
    # Verify that [Unreleased] section exists
    if ! grep -q "$UNRELEASED_SECTION" "$CHANGELOG_FILE"; then
        echo "❌ [Unreleased] section not found in CHANGELOG.md"
        echo "Please add the [Unreleased] section to the CHANGELOG"
        exit 1
    fi
    
    # Verify that there is at least one entry in [Unreleased]
    UNRELEASED_CONTENT=$(sed -n '/## \[Unreleased\]/,/^## /p' "$CHANGELOG_FILE" | grep -E '^\s*[-*]\s*\*\*')
    
    if [ -z "$UNRELEASED_CONTENT" ]; then
        echo "⚠️  Warning: No entries found in [Unreleased] section"
        echo "Consider adding entries to the CHANGELOG to document changes"
        echo "You can use: node scripts/update-changelog.js [type] [description]"
    else
        echo "✅ CHANGELOG verified successfully"
    fi
fi

exit 0 