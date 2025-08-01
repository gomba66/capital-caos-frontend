#!/bin/bash

echo "🧪 [PRE-PUSH] Ejecutando tests del frontend antes de push..."

# Verificar que estamos en el directorio del frontend
if [ ! -f "package.json" ] || [ ! -f "vite.config.js" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend"
    exit 1
fi

# Verificar versión de Node.js
echo "🔧 Verificando versión de Node.js..."
if ! ./scripts/check-node-version.sh; then
    echo "❌ Error: Versión incorrecta de Node.js"
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "🔧 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo "🧪 Ejecutando tests del frontend..."
echo "   • Framework: Vitest"
echo "   • Environment: jsdom"
echo "   • Coverage: enabled"
echo ""

# Ejecutar tests con configuración optimizada
if npm run test:run; then
    echo ""
    echo "✅ [PRE-PUSH] Todos los tests del frontend pasaron exitosamente"
    echo "🚀 Listo para push!"
    exit 0
else
    echo ""
    echo "❌ [PRE-PUSH] Tests del frontend fallaron"
    echo "💡 Corrige los errores antes de hacer push"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   • npm run test:run        # Ejecutar tests"
    echo "   • npm run test:coverage   # Ver cobertura de tests"
    echo "   • npm run test:ui         # Interfaz visual de tests"
    echo "   • npm run lint            # Verificar linting"
    exit 1
fi 