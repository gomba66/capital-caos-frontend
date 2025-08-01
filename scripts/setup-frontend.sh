#!/bin/bash

echo "🚀 Configurando entorno del frontend..."

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
        echo "💡 Instala nvm primero:"
        echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        echo "   source ~/.bashrc  # o reinicia tu terminal"
        exit 1
    fi
fi

# Leer la versión requerida
REQUIRED_VERSION=$(cat .nvmrc)
echo "📋 Configurando Node.js $REQUIRED_VERSION..."

# Verificar si la versión está instalada
if ! nvm list | grep -q "$REQUIRED_VERSION"; then
    echo "📦 Instalando Node.js $REQUIRED_VERSION..."
    nvm install $REQUIRED_VERSION
fi

# Cambiar a la versión requerida
echo "🔄 Cambiando a Node.js $REQUIRED_VERSION..."
nvm use $REQUIRED_VERSION

# Verificar que el cambio fue exitoso
CURRENT_VERSION=$(node --version 2>/dev/null | sed 's/v//')
if [ "$CURRENT_VERSION" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: No se pudo cambiar a Node.js $REQUIRED_VERSION"
    exit 1
fi

echo "✅ Node.js $REQUIRED_VERSION configurado correctamente"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Instalar hooks de git
echo "🔧 Instalando hooks de git..."
npm run hooks:install

# Verificar que todo funciona
echo "🧪 Verificando que todo funciona..."
if npm run test:run; then
    echo "✅ Tests pasaron correctamente"
else
    echo "⚠️  Algunos tests fallaron, pero el setup básico está completo"
fi

echo ""
echo "🎉 ¡Setup del frontend completado!"
echo ""
echo "📋 Comandos útiles:"
echo "   • npm run dev          # Iniciar servidor de desarrollo"
echo "   • npm run test:run     # Ejecutar tests"
echo "   • npm run lint         # Verificar linting"
echo "   • npm run build        # Construir para producción"
echo ""
echo "💡 Para cambiar automáticamente a Node.js 20 en el futuro:"
echo "   • nvm alias default 20"
echo "   • O ejecuta: npm run node:check" 