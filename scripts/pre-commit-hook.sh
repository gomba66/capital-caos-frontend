#!/bin/bash

CHANGELOG_FILE="CHANGELOG.md"
UNRELEASED_SECTION="## [Unreleased]"

# echo "[DEBUG] Ruta actual: $(pwd)"
# echo "[DEBUG] Archivos en el directorio:"
# ls -l

# echo "[DEBUG] Primeras 10 líneas de $CHANGELOG_FILE:"
# head -10 "$CHANGELOG_FILE"

# Get all staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# echo "[DEBUG] Archivos staged:"
# echo "$STAGED_FILES"

# Check if any staged files are important (JSX, JS, TSX, TS, or in src/, components/, pages/, api/)
HAS_IMPORTANT_FILES=false
while IFS= read -r file; do
    if [[ "$file" =~ \.(jsx|js|tsx|ts)$ ]] || [[ "$file" =~ ^src/ ]] || [[ "$file" =~ ^components/ ]] || [[ "$file" =~ ^pages/ ]] || [[ "$file" =~ ^api/ ]]; then
        HAS_IMPORTANT_FILES=true
        # echo "[DEBUG] Archivo importante detectado: $file"
        break
    fi
done <<< "$STAGED_FILES"

# echo "[DEBUG] HAS_IMPORTANT_FILES: $HAS_IMPORTANT_FILES"

# If only CHANGELOG.md is staged, allow commit
ONLY_CHANGELOG_STAGED=$(echo "$STAGED_FILES" | wc -l)
if [ "$ONLY_CHANGELOG_STAGED" -eq 1 ] && echo "$STAGED_FILES" | grep -q "$CHANGELOG_FILE"; then
    echo "ℹ️ Only $CHANGELOG_FILE is staged. Allowing commit."
    exit 0
fi

# Check if [Unreleased] section exists (tolerante a espacios y mayúsculas)
if ! grep -i -E "^[[:space:]]*##[[:space:]]*\\[Unreleased\\][[:space:]]*$" "$CHANGELOG_FILE" > /dev/null; then
    echo "❌ [Unreleased] section not found in $CHANGELOG_FILE (modo tolerante)"
    # echo "[DEBUG] Coincidencias encontradas con 'Unreleased':"
    grep -i "Unreleased" "$CHANGELOG_FILE"
    exit 1
fi

# Check if there are any entries in [Unreleased] section
UNRELEASED_CONTENT=$(sed -n '/## \[Unreleased\]/,/^## /p' "$CHANGELOG_FILE" | grep -E '^[\s*-]')

# If there are important files staged, require CHANGELOG updates
if [ "$HAS_IMPORTANT_FILES" = true ]; then
    # echo "[DEBUG] Archivos importantes detectados, verificando CHANGELOG..."
    
    # Check if CHANGELOG has been modified in this commit
    CHANGELOG_MODIFIED=$(echo "$STAGED_FILES" | grep "$CHANGELOG_FILE")
    if [ -z "$CHANGELOG_MODIFIED" ]; then
        echo "❌ $CHANGELOG_FILE not updated but important files are staged:"
        echo ""
        echo "$STAGED_FILES" | grep -E "\.(jsx|js|tsx|ts)$|src/|components/|pages/|api/"
        echo ""
        echo "Please update $CHANGELOG_FILE with your changes before committing."
        echo "You can use the following command to update the changelog:"
        echo "npm run update-changelog [type] [description]"
        exit 1
    fi

    # Verify that the CHANGELOG changes are meaningful (not just whitespace)
    CHANGELOG_CHANGES=$(git diff --cached "$CHANGELOG_FILE" | grep -E '^[\s*-]' | wc -l)
    if [ "$CHANGELOG_CHANGES" -eq 0 ]; then
        echo "❌ $CHANGELOG_FILE was modified but no meaningful entries were added"
        exit 1
    fi
else
    # echo "[DEBUG] No se detectaron archivos importantes, verificando si [Unreleased] está vacío..."
    
    # If no important files, allow commit if [Unreleased] is empty (for changelog release)
    if [ -z "$UNRELEASED_CONTENT" ]; then
        echo "ℹ️ [Unreleased] section is empty and no important files staged. Allowing commit (changelog release or no changes to document)."
        exit 0
    fi
fi

echo "✅ $CHANGELOG_FILE verified successfully"
exit 0 