<h1 align="center">unstress</h1>

<p align="center">
  <img src="https://via.placeholder.com/800x200?text=unstress+Banner" alt="unstress banner" />
</p>

<p align="center">
  <a href="https://github.com/humanspolluteearth/unstress/stargazers"><img src="https://img.shields.io/github/stars/humanspolluteearth/unstress?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/humanspolluteearth/unstress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/humanspolluteearth/unstress?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="Version">
</p>

---

### One-Line Pitch
A high-performance, local-first life management system that transitions your productivity data from the cloud to your local machine.

---

### Features
* **Unified Command Palette**: Keyboard-driven navigation and action execution.
* **Modular Monolith**: Decoupled domains (Finance, Tasks, Goals) via an internal event broker.
* **High-Density UI**: Minimalist, data-rich interface for rapid information scanning.
* **Local-First Privacy**: Complete data ownership with local PostgreSQL storage.
* **Focused Tools**: Integrated Zen timer and free-form blackboard for deep work.

---

### Architecture
**unstress** utilizes a client-server architecture where a Tauri-based Rust core handles system-level operations and a Python/FastAPI sidecar powers the modular business logic. Modules communicate through an internal asynchronous event bus, ensuring low latency and high maintainability. Data persists locally in a PostgreSQL instance, accessible via high-throughput localhost HTTP communication.

---

### Tech Stack
* **Desktop Core**: [Tauri v2.0](https://tauri.app/) (Rust)
* **Backend Sidecar**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Persistence**: [PostgreSQL](https://www.postgresql.org/) + [SQLAlchemy](https://www.sqlalchemy.org/)
* **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **OS Target**: Optimized for Arch Linux, cross-platform build support.

---

### Build & Installation

Ensure you have your system dependencies installed (e.g., `base-devel`, `rust`, `nodejs`, `python`, `postgresql`).

**1. Clone the repository:**
```bash
git clone https://github.com/humanspolluteearth/unstress.git
cd unstress
```

**2. Setup Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py
```

**3. Launch Development Server:**
```bash
cd ../frontend
npm install
npm run tauri dev
```

**4. Build Packages:**
```bash
# AppImage
npm run tauri build -- --target appimage
# .deb
npm run tauri build -- --target deb
# .rpm
npm run tauri build -- --target rpm
```

---

### License
Distributed under the MIT License. See `LICENSE` for more information.

---

### Roadmap
- [ ] Integration with hardware-level system monitoring.
- [ ] Advanced AI-driven insights for financial trends.
- [ ] Export/Import functionality for external calendar providers.
- [ ] Enhanced offline synchronization protocols.
