#!/bin/bash

# Script para asegurar que se use Node.js 20 en el frontend

echo "🔧 Verificando versión de Node.js para frontend..."

# Verificar que estamos en el directorio del frontend
if [ ! -f "package.json" ] || [ ! -f ".nvmrc" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend"
    exit 1
fi

# Cargar nvm si no está disponible en el PATH
if ! command -v nvm &> /dev/null; then
    # Intentar cargar nvm desde ubicaciones comunes
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        echo "🔄 Cargando nvm desde $HOME/.nvm/nvm.sh..."
        source "$HOME/.nvm/nvm.sh"
    elif [ -s "$HOME/.bashrc" ]; then
        echo "🔄 Cargando nvm desde .bashrc..."
        source "$HOME/.bashrc"
    elif [ -s "$HOME/.zshrc" ]; then
        echo "🔄 Cargando nvm desde .zshrc..."
        source "$HOME/.zshrc"
    else
        echo "❌ Error: nvm no está disponible"
        echo "💡 Instala nvm o agrégalo a tu PATH"
        echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        exit 1
    fi
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

# Cambiar a la versión requerida
echo "🔄 Cambiando a Node.js $REQUIRED_VERSION..."
nvm use $REQUIRED_VERSION

# Verificar que el cambio fue exitoso
NEW_VERSION=$(node --version 2>/dev/null | sed 's/v//')
if [ "$NEW_VERSION" = "$REQUIRED_VERSION" ]; then
    echo "✅ Cambio exitoso a Node.js $REQUIRED_VERSION"
    echo "💡 Para hacer este cambio permanente, ejecuta: nvm alias default $REQUIRED_VERSION"
else
    echo "❌ Error: No se pudo cambiar a Node.js $REQUIRED_VERSION"
    echo "💡 Intenta ejecutar manualmente: nvm install $REQUIRED_VERSION && nvm use $REQUIRED_VERSION"
    exit 1
fi 