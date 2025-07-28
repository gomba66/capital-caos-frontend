# Changelog

## [Unreleased] - Sidebar Responsive

### ✨ Added

- **Sidebar Responsive**: Implementación de sidebar que se adapta automáticamente al tamaño de pantalla
- **Modo Colapsado**: Sidebar de 80px con solo iconos para maximizar espacio de contenido
- **Modo Expandido**: Sidebar de 220px con texto completo y toda la información
- **Botón de Colapsar**: Permite alternar entre modos en desktop (solo iconos vs texto completo)
- **Animaciones Suaves**: Transiciones de 0.3s para cambios de ancho y contenido
- **Tooltips Informativos**:
  - Timezone visible al hacer hover sobre icono de reloj cuando colapsado
  - Nombres de páginas visibles al hacer hover sobre iconos de navegación
- **Layout Dinámico**: El contenido principal se ajusta automáticamente al ancho del sidebar

### 🎨 Enhanced

- **UX Mobile**: Sidebar siempre visible de 80px en móviles
- **UX Desktop**: Opción de sidebar completo o minimalista según preferencia del usuario
- **Feedback Visual**: Botón de colapsar con iconos ChevronLeft/ChevronRight
- **Estilo Consistente**: Tooltips con tema oscuro y bordes cyan

### 🔧 Technical

- **Context API**: SidebarContext para compartir ancho del sidebar con App.jsx
- **Responsive Design**: Uso de useMediaQuery para detectar tamaño de pantalla
- **CSS Transitions**: Animaciones suaves para width, left, opacity y transform
- **Conditional Rendering**: Elementos se muestran/ocultan según estado colapsado

### 📱 Mobile Features

- **Sidebar Fijo**: 80px siempre visible, sin botón flotante
- **Navegación Minimalista**: Solo iconos centrados
- **Logo Compacto**: 50x50px sin texto
- **Tooltips**: Información disponible al hacer hover

### 🖥️ Desktop Features

- **Flexibilidad**: Usuario puede elegir entre más espacio o más información
- **Transición Suave**: Cambio instantáneo entre modos con animaciones
- **Estado Persistente**: El modo colapsado se mantiene durante la sesión
- **Espacio Eficiente**: 140px más de espacio cuando está colapsado

### 🎯 User Experience

- **Navegación Inmediata**: No hay que abrir/cerrar nada
- **Información Accesible**: Tooltips proporcionan contexto cuando es necesario
- **Diseño Limpio**: Sin elementos flotantes o botones extra
- **Adaptabilidad**: Se ajusta perfectamente a diferentes tamaños de pantalla
