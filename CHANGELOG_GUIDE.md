# CHANGELOG Maintenance Guide

## 📝 Writing Rules

### **Commit Structure**

```
feat: add new functionality
fix: fix bug
docs: update documentation
style: format changes (no functional impact)
refactor: code refactoring
test: add or modify tests
chore: maintenance tasks
```

### **CHANGELOG Structure**

```markdown
## [Unreleased] - Descriptive Title

### ✨ Added (New features)

- **Feature**: Clear and concise description

### 🐛 Fixed (Bug fixes)

- **Bug**: Description of the resolved issue

### 🎨 Enhanced (Improvements)

- **UX/UI**: User experience improvements

### 🔧 Technical (Technical changes)

- **Architecture**: Structure or performance changes

### 📱 Mobile Features (Mobile-specific features)

- **Responsive**: Mobile-specific improvements

### 🖥️ Desktop Features (Desktop-specific features)

- **Desktop**: Desktop-specific improvements
```

## 🔄 Maintenance Process

### **1. During Development**

- ✅ Document changes **while developing**
- ✅ Use appropriate categories
- ✅ Be specific and descriptive
- ✅ Include technical context when relevant

### **2. Before Commit**

- ✅ Review that all changes are documented
- ✅ Verify that categories are correct
- ✅ Ensure description is clear

### **3. When Creating Pull Request**

- ✅ Include change summary in PR description
- ✅ Reference updated CHANGELOG
- ✅ Request documentation review

### **4. When Making Release**

- ✅ Change `[Unreleased]` to `[v1.2.3]`
- ✅ Add release date
- ✅ Create new `[Unreleased]` section for upcoming changes

## 📋 Change Categories

### **✨ Added**

- New functionalities
- New components
- New pages or routes
- New APIs or endpoints

### **🐛 Fixed**

- Bug fixes
- UI problem solutions
- Logic error corrections

### **🎨 Enhanced**

- UX/UI improvements
- Visual optimizations
- Accessibility improvements

### **🔧 Technical**

- Code refactoring
- Architecture changes
- Performance optimizations
- Dependency updates

### **📱 Mobile Features**

- Mobile-specific improvements
- Responsive design
- Touch interactions

### **🖥️ Desktop Features**

- Desktop-specific improvements
- Keyboard shortcuts
- Desktop-specific UI

## 🎯 Practical Examples

### **Good Example:**

```markdown
### ✨ Added

- **Responsive Sidebar**: Implementation of sidebar that automatically adapts to screen size
- **Informative Tooltips**: Timezone visible when hovering over clock icon when collapsed
```

### **Bad Example:**

```markdown
### Added

- Fixed sidebar
- Added tooltips
```

## 📅 Update Frequency

### **Daily**

- ✅ Document changes while developing
- ✅ Don't leave for the end

### **Weekly**

- ✅ Review and clean duplicate entries
- ✅ Consolidate related changes

### **Per Release**

- ✅ Finalize current version
- ✅ Create new section for upcoming changes

## 🔍 Quality Review

### **Pre-Commit Checklist:**

- [ ] Are all categories correct?
- [ ] Are descriptions clear and specific?
- [ ] Does it include technical context when necessary?
- [ ] Is it logically organized?
- [ ] Does it follow the established format?

### **Pre-PR Checklist:**

- [ ] Is the CHANGELOG updated?
- [ ] Are descriptions understandable for other developers?
- [ ] Does it include sufficient information for review?
