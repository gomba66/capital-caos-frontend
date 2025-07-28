#!/bin/sh

set -e

echo "Installing frontend git hooks..."

cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Frontend hooks installed." 