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

### Features & Hotkeys

unstress is designed for keyboard-driven efficiency.

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| **Command Palette** | `Ctrl/Cmd + K` | Global search and quick-action menu. |
| **Go to Dashboard** | `Alt + D` | Navigate to the main dashboard. |
| **Go to Tasks** | `Alt + T` | Manage tasks and Kanban boards. |
| **Go to Schedule** | `Alt + S` | View daily, weekly, or monthly calendars. |
| **Go to Habits** | `Alt + H` | Track daily habits and routines. |
| **Go to Finance** | `Alt + F` | Ledger management and financial tracking. |
| **Go to Goals** | `Alt + G` | Long-term objective planning. |
| **Go to Blackboard** | `Alt + B` | Free-form notes and brainstorming. |
| **Go to Zen Timer** | `Alt + Z` | Focused work timer. |

---

### Core Modules

* **Dashboard**: Central hub providing a high-density overview of your day.
* **Tasks**: ListView and KanbanView for project management with quick-entry TaskModals.
* **Schedules**: Flexible Daily/Weekly/Monthly grids for comprehensive event management.
* **Habits**: Daily routines tracking with rapid completion checklists and data-backed logs.
* **Finance**: Secure, local-first financial ledger with transaction management.
* **Goals**: Long-term vision tracking with milestone definition and focused detail panels.
* **Zen**: Minimalist, distraction-free focus timer.
* **Blackboard**: Workspace for unstructured brainstorming and notes.

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
This project is licensed under the MIT License.
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

### Roadmap
- [ ] Integration with hardware-level system monitoring.
- [ ] Advanced AI-driven insights for financial trends.
- [ ] Export/Import functionality for external calendar providers.
- [ ] Enhanced offline synchronization protocols.
