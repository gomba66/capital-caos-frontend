#!/bin/bash

echo "🚀 [PRE-PUSH] Verificando frontend antes de push..."

# Verificar que estamos en el directorio del frontend
if [ ! -f "package.json" ] || [ ! -f "vite.config.js" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio frontend"
    exit 1
fi

# Ejecutar linting
echo "🔍 Ejecutando linting..."
if ! npm run lint; then
    echo "❌ [PRE-PUSH] Linting falló. Push cancelado."
    echo "💡 Corrige los errores de linting antes de hacer push"
    exit 1
fi

# Ejecutar tests locales
echo "🧪 Ejecutando tests locales..."
if ! ./scripts/pre-push-tests.sh; then
    echo "❌ [PRE-PUSH] Tests fallaron. Push cancelado."
    exit 1
fi

# BLOQUEAR push directo a main
CURRENT_BRANCH=$(git symbolic-ref HEAD | sed 's/refs\/heads\///')
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "❌ [PRE-PUSH] ERROR: Push directo a main está BLOQUEADO"
    echo ""
    echo "🚨 REGLA DE SEGURIDAD:"
    echo "   • NUNCA hagas push directo a main"
    echo "   • Siempre usa ramas feature y Pull Requests"
    echo ""
    echo "💡 FLUJO CORRECTO:"
    echo "   1. git checkout -b feature/nueva-funcionalidad"
    echo "   2. git add . && git commit -m 'feat: nueva funcionalidad'"
    echo "   3. git push origin feature/nueva-funcionalidad"
    echo "   4. Crear Pull Request en GitHub"
    echo "   5. Revisar y aprobar el PR"
    echo "   6. Merge a main desde GitHub"
    echo ""
    echo "🔒 Push cancelado por seguridad"
    exit 1
fi

echo "✅ [PRE-PUSH] Todas las verificaciones del frontend completadas"
echo "🚀 Procediendo con push a rama: $CURRENT_BRANCH"
exit 0 