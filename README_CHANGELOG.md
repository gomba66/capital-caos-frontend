# 📝 CHANGELOG Maintenance Guide

## 🚀 Quick Start

### **Add entry to CHANGELOG:**

```bash
npm run changelog:add [type] [description]
```

**Examples:**

```bash
npm run changelog:add added "New responsive sidebar functionality"
npm run changelog:add fixed "Animation bug fix"
npm run changelog:add enhanced "Improved collapse button UX"
```

### **Check CHANGELOG:**

```bash
npm run changelog:check
```

### **Make Release:**

```bash
npm run changelog:release v1.2.3
```

## 📋 Available Types

| Type        | Emoji | Description       | Example                             |
| ----------- | ----- | ----------------- | ----------------------------------- |
| `added`     | ✨    | New functionality | New page, component, API            |
| `fixed`     | 🐛    | Bug fix           | UI bug, logic error                 |
| `enhanced`  | 🎨    | UX/UI improvement | Visual improvements, accessibility  |
| `technical` | 🔧    | Technical change  | Refactor, performance, dependencies |
| `mobile`    | 📱    | Mobile feature    | Responsive, touch, mobile-specific  |
| `desktop`   | 🖥️    | Desktop feature   | Keyboard shortcuts, desktop UI      |

## 🔄 Workflow

### **1. During Development**

```bash
# While developing, document changes
npm run changelog:add added "New feature X"
npm run changelog:add enhanced "Component Y improvement"
```

### **2. Before Commit**

```bash
# Verify CHANGELOG is updated
npm run changelog:check
```

### **3. When Making Release**

```bash
# Create new version
npm run changelog:release v1.2.3
```

## 📖 CHANGELOG Structure

```markdown
## [Unreleased] - Descriptive Title

### ✨ Added

- **Feature**: Clear and concise description

### 🐛 Fixed

- **Bug**: Description of the resolved issue

### 🎨 Enhanced

- **UX/UI**: User experience improvements

### 🔧 Technical

- **Architecture**: Structure or performance changes

### 📱 Mobile Features

- **Responsive**: Mobile-specific improvements

### 🖥️ Desktop Features

- **Desktop**: Desktop-specific improvements
```

## 🎯 Best Practices

### **✅ Do:**

- Document changes **while developing**
- Use **specific and clear** descriptions
- Include **technical context** when relevant
- **Categorize correctly** the changes
- **Review** before commit

### **❌ Avoid:**

- Leave documentation for the end
- Use vague descriptions ("Fixed bug", "Added feature")
- Don't categorize changes
- Don't review before commit

## 🔧 Available Scripts

### **update-changelog.js**

- Adds entries to CHANGELOG
- Automatically categorizes
- Maintains consistent format

### **release-changelog.js**

- Creates new version
- Automatically adds date
- Creates new [Unreleased] section

### **pre-commit-hook.sh**

- Verifies CHANGELOG is updated
- Prevents commits without documentation
- Suggests useful commands

## 📅 Update Frequency

| Frequency       | Action             | Command                     |
| --------------- | ------------------ | --------------------------- |
| **Daily**       | Document changes   | `npm run changelog:add`     |
| **Weekly**      | Review and clean   | Manual review               |
| **Per Release** | Create new version | `npm run changelog:release` |

## 🚨 Troubleshooting

### **Error: "Invalid type"**

```bash
# Check available types
npm run changelog:add --help
```

### **Error: "[Unreleased] not found"**

```bash
# Create section manually or use release
npm run changelog:release v1.0.0
```

### **Error: "CHANGELOG.md not found"**

```bash
# Create CHANGELOG.md file with basic structure
touch CHANGELOG.md
echo "## [Unreleased]" >> CHANGELOG.md
```

## 📚 Additional Resources

- [CHANGELOG_GUIDE.md](./CHANGELOG_GUIDE.md) - Detailed guide
- [scripts/](./scripts/) - Automation scripts
- [CHANGELOG.md](./CHANGELOG.md) - Current changelog file
