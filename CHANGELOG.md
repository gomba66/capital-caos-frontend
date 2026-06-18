# Changelog

## [Unreleased]

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.14] - 2026-06-18


### ✨ Added

### 🐛 Fixed

- **RiskLevelsInfo unused import** - Eliminada importación no utilizada de useState

### 🎨 Enhanced
- **Equity chart dynamic time-range buttons: added 3d and hide ranges without enough historical data**

- **Open Trades Default Sorting** - La tabla de open trades ahora se ordena automáticamente por Open Time (más recientes primero) por defecto para facilitar la visualización de los trades más nuevos

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.13] - 2025-11-28


### ✨ Added

### 🐛 Fixed

- **RiskLevelsInfo unused import** - Eliminada importación no utilizada de useState

### 🎨 Enhanced

- **Open Trades Default Sorting** - La tabla de open trades ahora se ordena automáticamente por Open Time (más recientes primero) por defecto para facilitar la visualización de los trades más nuevos

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.12] - 2025-11-26

### ✨ Added

- **Equity Chart 1-Day Filter** - Added "1d" button to equity chart for viewing last 24 hours of trading activity

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

- **Charts Tests** - Fixed Charts.test.jsx to properly mock getStats and getSymbolStatistics API calls to prevent test failures

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.11] - 2025-11-26

### ✨ Added

### 🐛 Fixed

- **Equity Chart Currency Tooltip** - Fixed tooltip to respect selected currency (was always showing USDT values). Now correctly converts and formats values based on the currency selected in the dashboard (COP, USD, MXN, etc.)
- **Equity Chart 7-Day Filter** - Fixed equity chart to actually display 7-day data when component mounts (was showing "all" data despite 7d button being selected)
- **Y-Axis Labels for Large Currencies** - Fixed Y-axis labels being cut off for currencies with large values (COP, CLP, IDR, KRW) by increasing axis width from 70px to 85px and adjusting font size to 13px for better readability
- **Simplified View Default** - Simplified view default works correctly for new users (existing users retain their localStorage preference)

### 🎨 Enhanced

- **Global Currency Context** - Created CurrencyContext to synchronize currency selection across all components (Dashboard, Charts, etc.)
- **Simplified View Default** - Simplified view is now enabled by default for better initial user experience
- **Sidebar Collapsed by Default** - Sidebar is now collapsed by default for cleaner initial layout
- **Remove Dashboard Title** - Removed redundant "Trading Dashboard" title to save vertical space
- **Equity Chart Improvements** - Defaults to 7-day view instead of "all time" for more focused analysis; height adjusted for optimal viewing (416px simplified view, 350px full view); removed "Equity" label from Y-axis for cleaner appearance; increased axis font size to 14px (13px for large-value currencies)
- **Win Rate Always Visible** - Win Rate column is now always visible regardless of simplified/detailed view mode

### 🔧 Technical

- **Currency Context Implementation** - Added CurrencyContext in AppContexts.jsx with automatic localStorage synchronization
- **Dashboard Test Updates** - Updated Dashboard tests to reflect removed "Trading Dashboard" title; tests now check for "Simplified View" and "Total Capital" instead

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.10] - 2025-11-25

### 🧹 Corrección de Linting (2025-11-25)

**Resolución de errores de ESLint**

- Agregado prefijo `_` a variables extraídas del destructuring pero no usadas directamente
- Variables afectadas: `scannerType`, `statsLoading`, `scanner_type`, `symbol`, `formatNumber`
- Eliminado comentario `eslint-disable` que causaba error (regla `import/no-unresolved` no existe)
- Quedan solo 5 warnings de `react-hooks/exhaustive-deps` (seguros de ignorar)

---

### 🧪 Corrección de Tests (2025-11-25)

**Actualización de tests para reflejar cambios en componentes**

- Eliminadas verificaciones de columna 'Entry' que fue removida del OperationsTable
- Tests de ordenamiento ahora usan columna 'PnL' en lugar de 'Entry'
- Eliminadas verificaciones de `scanner_type` que no se renderiza en la UI de ScannerInfo
- Simplificado test de valores no numéricos en formatNumber
- Corregido uso de `getAllByText` para elementos que aparecen múltiples veces

---

### 🔄 Smart Refresh para Closed Trades (2025-11-25)

**Implementado sistema de refresco inteligente basado en cambios de capital**

#### Problema anterior:

- Polling constante cada 30 segundos sin importar actividad
- Consumo innecesario de recursos y ancho de banda
- Actualizaciones cuando no había cambios reales

#### Solución implementada:

- **Refresco condicional**: Solo actualiza cuando hay cambio en el capital total
- **Polling periódico reducido**: Cada 60 segundos (reducido de 30s)
- **Detección de cambios**: Compara capital actual vs último conocido
- **Actualización inteligente**: Solo hace fetch si detecta trades nuevos

#### Mejoras técnicas:

- `lastUpdate` solo se actualiza en refrescos de closed trades (no en open)
- Polling separado para open trades (15s) y closed trades (60s condicional)
- Mejor rendimiento y reducción de carga en el servidor

#### Commits:

- `ab21bca`: fix: update lastUpdate only on closed trades refresh
- `a1f3cf1`: refactor: simplify refresh logic with periodic polling
- `c7ee762`: feat: implement smart refresh for closed trades based on capital changes

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.8] - 2025-10-05

### 🎯 Fix - Equity Chart Starting Point

#### Problema

- **Chart incompleto**: El equity chart no mostraba el punto de inicio desde $0
- **Falta de contexto**: No se veía el recorrido completo desde el punto de partida
- **Punto inicial faltante**: El chart empezaba directamente con el primer trade

#### Solución

- **Punto inicial**: Se agrega un punto antes del primer trade con equity = $0
- **Recorrido completo**: El chart ahora muestra la evolución desde $0
- **Mejor visualización**: Se ve claramente el punto de partida y la evolución

#### Archivos Modificados

- `frontend/src/components/charts/EquityChart.jsx` - Agregado punto inicial desde $0
- `docs/EQUITY_CHART_STARTING_POINT_FIX.md` - Documentación del fix

#### Impacto

- ✅ **Punto de inicio**: Se ve claramente el punto de partida desde $0
- ✅ **Recorrido completo**: Se muestra la evolución completa del PnL
- ✅ **Mejor análisis**: Permite ver el rendimiento desde el inicio
- ✅ **Contexto claro**: Se entiende la evolución del equity desde $0

## [v0.1.7] - 2025-10-04

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

- **Unificar cálculo de winrates usando endpoint del backend** - Charts page ahora usa `getStats()` para obtener winrates pre-calculados del backend en lugar de calcularlos localmente, eliminando duplicación de lógica y asegurando consistencia con Dashboard

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.6] - 2025-08-21

### ✨ Added

### 🐛 Fixed

- **corregir tests de MomentumPairsTable - usar regex para búsqueda de texto con emojis - usar findAllByText para elementos múltiples**

### 🎨 Enhanced

- **mejorar gráfica de rendimiento por scanner - optimizar espaciado vertical y labels - agregar sistema de alertas para winrate bajo - simplificar pie chart sin labels personalizados - unificar altura de charts a 250px**

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.5] - 2025-08-21

### ✨ Added

### 🐛 Fixed

- **corregir timezone en EquityChart y DrawdownChart**

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.4] - 2025-08-11

### ✨ Added

- **integrar información del scanner en tablas de trades**

### 🐛 Fixed

- **corregir timezone en EquityChart y DrawdownChart**
- **corregir timezone en EquityChart y DrawdownChart**

- **update WinrateChart tests to expect rounded values**

### 🎨 Enhanced

- **improve dashboard and charts components**

### 🔧 Technical

- **aplicar formateo y mejoras de código**

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.3] - 2025-08-10

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

- **actualizar tests de WinrateChart para reflejar comportamiento solo backend**
- **WinrateChart solo usa datos del backend, sin cálculos locales**

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.2] - 2025-08-09

### ✨ Added

- **Show closed trade reason in OperationsTable; normalize reason labels**

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.1] - 2025-08-08

### ✨ Added

### 🐛 Fixed

- **corregir timezone en EquityChart y DrawdownChart**

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.1.0] - 2025-08-04

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

- **Simplify date format in all charts and tables to dd/MM/yy - h:mm:ss a**
- **Simplify date format in closed trades table to dd/MM/yy - h:mm:ss a**

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.9] - 2025-08-03

### ✨ Added

- **add development banner to TradingChart page and implement chart functionality**

### 🐛 Fixed

- **fix TradingChart real-time and more issues**
- **fix TradingChart real-time to stop when changing symbols and use current values**
- **simplify TradingChart real-time useEffect to fix interval issues**
- **fix TradingChart real-time button by converting updateLastCandle to regular function**
- **fix TradingChart useEffect to wait for chart initialization before loading data**
- **convert TradingChart functions from useCallback to regular functions to fix loading issues**
- **remove circular dependencies in TradingChart to fix loading issues**
- **simplify TradingChart useEffect dependencies to resolve loading issues**
- **optimize TradingChart useEffect dependencies to prevent infinite re-renders and multiple API calls**
- **fix TradingChart addTradeLines initialization error by removing circular dependency**
- **fix TradingChart useCallback dependencies to resolve loading issues**
- **fix TradingChart loading issue by moving functions before useEffect**
- **fix TradingChart component initialization error with addTradeLines dependency**
- **fix TradingChart component initialization error with loadPriceData and loadTradeData**
- **fix TradingChart component initialization error with addTradeLines**
- **fix TradingChart page initialization error with loadAvailableSymbols**

### 🎨 Enhanced

### 🔧 Technical

- **add debug logs to TradingChart to diagnose loading issues**
- **resolve all React hooks warnings and linting issues**
- **update page imports to use contexts from separate file**
- **fix test files to use contexts from separate file**
- **move React contexts to separate file to fix react-refresh errors**
- **remove unused variables in changelog script**
- **fix linting errors and warnings**

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.8] - 2025-08-01

### ✨ Added

### 🐛 Fixed

- **fix auto-switch-node script to work in production without nvm**

### 🎨 Enhanced

- **improve dashboard visual effects and color consistency**
- **improve test coverage to 92.5% with comprehensive testing system**

### 🔧 Technical

- **Add coverage directory to .gitignore**
- **Exclude coverage directory from linting to avoid warnings**
- **Add @vitest/coverage-v8 dependency for test coverage**
- **Update package-lock.json to sync with testing dependencies**
- **Fix working directory in GitHub Actions workflow**
- **Fix GitHub Actions cache paths for working directory**
- **Fix GitHub Actions workflow to run on all PRs and pushes**
- **Fix deprecated button attribute warning in Sidebar component**
- **Fix linting errors for pre-push validation**
- **All frontend tests now passing (12/12) with Node.js 20**
- **Configure Node.js 20 enforcement with automatic version switching**
- **Add GitHub Actions CI workflow for frontend validation**
- **Add pre-push hooks for linting and testing validation**
- **Add comprehensive testing setup with Vitest, React Testing Library, and Node.js 20 enforcement**
- **Update release script to match backend structure - only version parameter required**

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.6] - 2025-08-01

### ✨ Added

### 🐛 Fixed

- **Fix PnLHistogram crash and improve charts performance**

### 🎨 Enhanced

- **Fix weekly performance chart to start on Monday**
- **Improve histogram design and number formatting**

### 🔧 Technical

- **Configure Vite to properly load environment variables**

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.5] - 2025-07-29

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

- **Dashboard Updates**: Improved dashboard layout and functionality with new aggregations component

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.4] - 2025-07-28

### ✨ Added

### 🐛 Fixed

### 🎨 Enhanced

### 🔧 Technical

### 📱 Mobile Features

### 🖥️ Desktop Features

## [v0.0.3] - 2025-07-28

## [v0.0.2] - 2025-07-28 - Responsive Sidebar

### ✨ Added

- **Responsive Sidebar**: Implementation of sidebar that automatically adapts to screen size
- **Collapsed Mode**: 80px sidebar with icons only to maximize content space
- **Expanded Mode**: 220px sidebar with complete text and all information
- **Collapse Button**: Allows toggling between modes on desktop (icons only vs complete text)
- **Smooth Animations**: 0.3s transitions for width, left, opacity and transform
- **Informative Tooltips**:
  - Timezone visible when hovering over clock icon when collapsed
  - Page names visible when hovering over navigation icons
- **Dynamic Layout**: Main content automatically adjusts to sidebar width

### 🎨 Enhanced

- **Mobile UX**: Sidebar always visible at 80px on mobile devices
- **Desktop UX**: Option for complete or minimalist sidebar based on user preference
- **Visual Feedback**: Collapse button with ChevronLeft/ChevronRight icons
- **Consistent Styling**: Tooltips with dark theme and cyan borders
- **Dynamic Layout**: Main content automatically adjusts to sidebar width
- **Improve hooks installation script to work from any location**

### 🔧 Technical

- **Context API**: SidebarContext to share sidebar width with App.jsx
- **Responsive Design**: Use of useMediaQuery to detect screen size
- **CSS Transitions**: Smooth animations for width, left, opacity and transform
- **Conditional Rendering**: Elements show/hide based on collapsed state

### 📱 Mobile Features

- **Fixed Sidebar**: 80px always visible, no floating button
- **Minimalist Navigation**: Icons only, centered
- **Compact Logo**: 50x50px without text
- **Tooltips**: Information available on hover

### 🖥️ Desktop Features

- **Flexibility**: User can choose between more space or more information
- **Smooth Transition**: Instant change between modes with animations
- **Persistent State**: Collapsed mode maintained during session
- **Efficient Space**: 140px more space when collapsed

### 🎯 User Experience

- **Immediate Navigation**: No need to open/close anything
- **Accessible Information**: Tooltips provide context when needed
- **Clean Design**: No floating elements or extra buttons
- **Adaptability**: Perfectly adjusts to different screen sizes

## [v0.0.1] - 2025-07-28

### 🛠️ Technical

- **Add changelog release enforcement workflow**: Add GitHub Actions workflow to block PRs to main if changelog is not released.

### 🎨 Enhanced

### 🔧 Technical

- **Improved Pre-commit Hook**: Enhanced CHANGELOG enforcement for better documentation
  - Add strict verification that staged files are documented in CHANGELOG
  - Block commits when significant files are staged without CHANGELOG updates
  - Show staged files that require documentation
  - Provide clear guidance on how to update CHANGELOG
