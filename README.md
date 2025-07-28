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

1. Enter the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at the URL shown in the console (usually http://localhost:5173).

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
