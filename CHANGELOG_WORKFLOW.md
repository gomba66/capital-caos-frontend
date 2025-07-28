# Changelog Workflow

Este documento describe el workflow automatizado para manejar el CHANGELOG del proyecto.

## Scripts Disponibles

### 1. Actualizar Changelog

```bash
node scripts/update-changelog.js [type] [description]
```

**Tipos disponibles:**

- `added`: Nueva funcionalidad
- `fixed`: Corrección de bug
- `enhanced`: Mejora de UX/UI
- `technical`: Cambio técnico
- `mobile`: Característica móvil
- `desktop`: Característica de escritorio

**Ejemplo:**

```bash
node scripts/update-changelog.js added "Nueva funcionalidad de sidebar responsive"
```

### 2. Liberar Changelog

```bash
node scripts/release-changelog.js [version] [date]
```

**Ejemplo:**

```bash
node scripts/release-changelog.js v1.0.5 2025-07-28
```

### 3. Probar Workflow

```bash
node scripts/test-changelog-workflow.js
```

## Estructura del CHANGELOG

El CHANGELOG sigue esta estructura:

```markdown
# Changelog

## [Unreleased]

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v1.0.4] - 2025-07-28

### ✨ Added

- **Nueva funcionalidad**

### 🐛 Fixed

- **Bug corregido**
```

## Workflow de GitHub Actions

### Verificación Automática

El workflow `changelog-release.yml` verifica automáticamente:

1. **PRs a main**: Bloquea PRs si `[Unreleased]` contiene entradas
2. **Estructura**: Verifica que existan las secciones requeridas
3. **Versiones liberadas**: Confirma que hay al menos una versión liberada

### Cómo Funciona

1. **Desarrollo**: Los desarrolladores agregan entradas a `[Unreleased]` usando el script
2. **Verificación**: GitHub Actions verifica que no haya entradas pendientes antes de mergear a main
3. **Liberación**: Cuando se libera una versión, las entradas se mueven de `[Unreleased]` a la nueva versión

## Mejoras Implementadas

### ✅ Problemas Resueltos

1. **Secciones Vacías**: `[Unreleased]` ahora tiene todas las categorías vacías listas para recibir entradas
2. **Detección Correcta**: El workflow detecta correctamente cuando hay entradas pendientes
3. **Script Mejorado**: El script `update-changelog.js` crea automáticamente las secciones si no existen
4. **Release Automatizado**: El script `release-changelog.js` mueve entradas de `[Unreleased]` a una nueva versión

### 🔧 Cambios Técnicos

- **Script `update-changelog.js`**: Ahora crea secciones vacías automáticamente
- **Workflow `changelog-release.yml`**: Mejorada la detección de entradas pendientes
- **Script `release-changelog.js`**: Reescrito para mover entradas correctamente
- **Script `test-changelog-workflow.js`**: Nuevo script para probar el workflow

## Uso Recomendado

### Para Desarrolladores

1. **Agregar cambios**:

   ```bash
   node scripts/update-changelog.js added "Nueva funcionalidad"
   ```

2. **Verificar estado**:
   ```bash
   node scripts/test-changelog-workflow.js
   ```

### Para Releases

1. **Liberar versión**:

   ```bash
   node scripts/release-changelog.js v1.0.5 2025-07-28
   ```

2. **Verificar que `[Unreleased]` esté vacío**:
   ```bash
   node scripts/test-changelog-workflow.js
   ```

## Validaciones

- ✅ `[Unreleased]` tiene todas las categorías vacías
- ✅ El workflow detecta entradas pendientes
- ✅ El script agrega entradas correctamente
- ✅ El release mueve entradas a la nueva versión
- ✅ Se mantiene la estructura del CHANGELOG
