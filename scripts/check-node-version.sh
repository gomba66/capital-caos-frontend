#!/bin/bash

# Script simple para verificar la versión de Node.js

echo "🔧 Verificando versión de Node.js para frontend..."

# Verificar que estamos en el directorio del frontend
if [ ! -f "package.json" ] || [ ! -f ".nvmrc" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend"
    exit 1
fi

# Leer la versión requerida del .nvmrc
REQUIRED_VERSION=$(cat .nvmrc | tr -d ' ')
CURRENT_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d'.' -f1)

echo "📋 Versión requerida: Node.js $REQUIRED_VERSION"
echo "📋 Versión actual: Node.js $CURRENT_VERSION"

# Verificar si la versión actual coincide con la requerida
if [ "$CURRENT_VERSION" = "$REQUIRED_VERSION" ]; then
    echo "✅ Ya estás usando Node.js $REQUIRED_VERSION"
    exit 0
else
    echo "❌ Versión incorrecta de Node.js"
    echo "💡 Cambia a Node.js $REQUIRED_VERSION usando:"
    echo "   nvm use $REQUIRED_VERSION"
    echo "   o"
    echo "   nvm install $REQUIRED_VERSION && nvm use $REQUIRED_VERSION"
    exit 1
fi 