# unstress

A high-performance, local-first **Life Management System** designed for speed, clarity, and agentic interoperability. **unstress** transitions your personal data from the cloud to your local machine, utilizing a modular monolith architecture for ultra-low latency.

## 🚀 Quick Start (Arch Linux)

Ensure you have the necessary system dependencies installed:

```bash
sudo pacman -S --needed base-devel curl wget openssl libsoup webkit2gtk-4.1 rust nodejs npm python postgresql
```

### 1. Clone & Setup Frontend
```bash
cd frontend
npm install
```

### 2. Setup Backend Sidecar
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py  # Initialize local PostgreSQL tables
```

### 3. Launch Development Mode
```bash
cd frontend
npm run tauri dev
```

---

## 🛠 Technology Stack

- **Desktop Framework**: [Tauri v2.0](https://tauri.app/) (Rust Core)
- **Backend Sidecar**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Persistence**: [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy](https://www.sqlalchemy.org/)
- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 🏛 Architecture

### High-Density UI Design Philosophy
**unstress** follows a "High-Density" UI approach, inspired by modern command centers and professional tools. Instead of white-space-heavy mobile-first designs, we prioritize:
- **Information Richness**: Maximizing visible data points for rapid scanning.
- **Command-First Navigation**: Global command palettes (`cmdk`) for keyboard-driven workflows.
- **Visual Feedback**: Real-time health reports and status lines reflecting system and financial state.

### AI-Native Modular Monolith
The backend is structured as a **Modular Monolith**. Domains (Finance, Tasks, Goals) are decoupled via an **Internal Event Broker**. This ensures:
- **Decoupled Logic**: Modules communicate asynchronously, preventing circular dependencies.
- **Agentic Readability**: Structured Pydantic schemas and the **Result Pattern** provide clear paths for LLM reasoning and debugging.
- **Local-First Performance**: Bulk data stays on your machine, accessed via localhost HTTP for maximum throughput.

---

## ⚖️ License

Distributed under the **MIT License**. This project leverages several MIT and Apache 2.0 licensed libraries, making it fully compatible with both open-source and commercial use cases. See `LICENSE` for more information.
