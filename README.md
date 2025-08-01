# Capital Caos Frontend - Trading Dashboard

> **Note:** This repository is intentionally public as it contains only the frontend (UI) code for the Capital Caos trading system. No sensitive data, API keys, or backend logic are present here. All backend and trading logic remain private and secure in the main repository.

A visual dashboard for the Capital Caos algorithmic trading system. It allows you to view statistics, trades, equity charts, drawdown, winrate, and more, connecting to the backend via API.

---

## 🚀 Main Features

- View open and closed trades
- Equity, PnL, winrate, and drawdown charts
- Momentum pairs and operations tables
- Cyberpunk theme and responsive design
- Integration with FastAPI backend
- Sidebar navigation and modern user experience

---

## 🖥️ How to Run the Frontend Locally (Development)

### Prerequisites

- **Node.js 20** (required)
- **nvm** (Node Version Manager) - [Installation guide](https://github.com/nvm-sh/nvm#installing-and-updating)

### Quick Setup

1. Enter the frontend folder:
   ```bash
   cd frontend
   ```
2. Run the setup script (automatically configures Node.js 20 and installs dependencies):
   ```bash
   ./scripts/setup-frontend.sh
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at the URL shown in the console (usually http://localhost:5173).

### Manual Setup

If you prefer to set up manually:

1. Enter the frontend folder:
   ```bash
   cd frontend
   ```
2. Switch to Node.js 20 (automatically):
   ```bash
   npm run node:switch
   ```
   Or manually:
   ```bash
   nvm use 20
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install git hooks:
   ```bash
   npm run hooks:install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Node.js Version Management

The frontend requires Node.js 20. Use these commands to manage the Node.js version:

```bash
# Check current Node.js version
npm run node:check

# Automatically switch to Node.js 20 (if nvm is available)
npm run node:switch

# Manual switch with nvm
nvm use 20
```

- The frontend will automatically reload on file changes.
- Make sure the backend is running and accessible from the frontend (adjust API URLs if needed).

---

## 📦 Project Structure

- `src/` - Main source code (components, pages, utilities)
- `public/` - Static files and assets
- `docs/` - Documentation and roadmap
- `package.json` - npm dependencies and scripts
- `vite.config.js` - Vite configuration

---

## 🧪 Testing

The frontend includes a comprehensive testing setup with Vitest and React Testing Library.

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure

- **Component Tests**: `src/components/__tests__/`
- **Utility Tests**: `src/utils/__tests__/`
- **Test Setup**: `src/test/setup.js`

### Pre-commit Validation

All commits automatically run:

- ✅ Linting (ESLint)
- ✅ Tests (Vitest)
- ✅ CHANGELOG validation

## 🗺️ Roadmap

See the full roadmap and upcoming features in:

[docs/roadmap.md](docs/roadmap.md)

---

## 🤝 Contributing

Pull requests and suggestions are welcome! Please open an issue to discuss major changes before submitting a PR.

---

## 📄 License

MIT

## Git Hooks Setup

After cloning the repo or pulling updates, run:

    ./scripts/install-hooks.sh

This will install the required git hooks for the frontend.

- The pre-commit hook enforces changelog discipline and documentation.

**All collaborators must run this script to ensure code quality and workflow discipline.**
# Test hook
