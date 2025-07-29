# Changelog

## [Unreleased]

## [v0.0.5] - 2025-07-29

### ✨ Added

- **Aggregations Expander Component**: New component to display and expand aggregation information in the operations table
- **Enhanced Operations Table**: Improved table with aggregation details and expandable rows

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
- **Smooth Animations**: 0.3s transitions for width and content changes
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
- **Add aggregations expander to open trades table**

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
