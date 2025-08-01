#!/bin/bash

# Script que automáticamente cambia a Node.js 20 si nvm está disponible

echo "🔧 Verificando y cambiando a Node.js 20..."

# Verificar que estamos en el directorio del frontend
if [ ! -f "package.json" ] || [ ! -f ".nvmrc" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend"
    exit 1
fi

# Leer la versión requerida del .nvmrc
REQUIRED_VERSION=$(cat .nvmrc)
CURRENT_VERSION=$(node --version 2>/dev/null | sed 's/v//')

echo "📋 Versión requerida: Node.js $REQUIRED_VERSION"
echo "📋 Versión actual: Node.js $CURRENT_VERSION"

# Verificar si la versión actual coincide con la requerida
if [ "$CURRENT_VERSION" = "$REQUIRED_VERSION" ]; then
    echo "✅ Ya estás usando Node.js $REQUIRED_VERSION"
    exit 0
fi

# Intentar cargar nvm si no está disponible
if ! command -v nvm &> /dev/null; then
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        echo "🔄 Cargando nvm..."
        source "$HOME/.nvm/nvm.sh"
    elif [ -s "$HOME/.bashrc" ]; then
        echo "🔄 Cargando nvm desde .bashrc..."
        source "$HOME/.bashrc"
    elif [ -s "$HOME/.zshrc" ]; then
        echo "🔄 Cargando nvm desde .zshrc..."
        source "$HOME/.zshrc"
    fi
fi

# Intentar cambiar a la versión requerida
if command -v nvm &> /dev/null; then
    echo "🔄 Cambiando a Node.js $REQUIRED_VERSION usando nvm..."
    nvm use $REQUIRED_VERSION
    
    echo "✅ Cambio exitoso a Node.js $REQUIRED_VERSION"
    echo "💡 Nota: El cambio se aplicó, pero necesitas reiniciar tu terminal o ejecutar 'source ~/.bashrc' para que tome efecto"
    exit 0
else
    echo "❌ nvm no está disponible"
    echo "💡 Cambia manualmente a Node.js $REQUIRED_VERSION"
    exit 1
fi 