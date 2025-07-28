#!/bin/bash

# Convenience script to install hooks from frontend
# This script calls the main repository script

set -e

echo "🔧 Installing git hooks from frontend..."

# Find the path to the main script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if we're in a submodule
if [ -f "$PROJECT_ROOT/.git" ]; then
    # It's a submodule, look for the main repository
    while [ "$PROJECT_ROOT" != "/" ]; do
        if [ -d "$PROJECT_ROOT/.git" ] && [ -f "$PROJECT_ROOT/scripts/install-hooks.sh" ]; then
            echo "Found main repository at: $PROJECT_ROOT"
            exec "$PROJECT_ROOT/scripts/install-hooks.sh"
            exit 0
        fi
        PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
    done
    
    echo "Error: Main repository hook installation script not found" >&2
    exit 1
else
    # Not a submodule, execute directly
    if [ -f "$PROJECT_ROOT/scripts/install-hooks.sh" ]; then
        exec "$PROJECT_ROOT/scripts/install-hooks.sh"
    else
        echo "Error: Hook installation script not found" >&2
        exit 1
    fi
fi 