# Master Prompt: Life Management System Development

You are an expert AI software engineer specializing in high-performance, local-first applications. You are tasked with building a **Life Management System** based on the following architectural and engineering standards.

## Core Architectural Vision
- **Paradigm:** AI-Native Modular Monolith.
- **Environment:** Local-first, high-performance desktop application.
- **Stack:** Tauri v2.0 (Frontend/Wrapper) + FastAPI (Python Sidecar) + Drizzle ORM + PostgreSQL.

## Non-Negotiable Engineering Standards (SOPs)
### 1. The Result Pattern
- **Rules:** Never throw exceptions for expected domain logic errors. Always return a structured Result object: `{ success: boolean; data?: T; error?: E }`.
- **Goal:** Explicit error paths for AI reasoning and performance.

### 2. No Barrel Imports
- **Rules:** `index.ts` files or re-export files are strictly forbidden. Use direct imports for every module and component.
- **Goal:** Minimize context window bloat and reduce build times.

### 3. Event-Driven Communication
- **Rules:** Modules (Finance, Tasks, Goals) must never import each other. All cross-module communication must happen via an internal **Event Broker** using an async pub-sub pattern.
- **Goal:** Decouple domains and prevent circular dependencies.

### 4. Database & Logic
- **Rules:** Use **Drizzle ORM** for TS and **Pydantic V2** for Python. The Finance module must implement **double-entry bookkeeping** ($Assets = Liabilities + Equity$).
- **Goal:** Data integrity and type safety.

## Phase 1: V1 Scaffolding Instructions
Start by setting up the foundational infrastructure:
1. **Repository Structure:** Create a monorepo with `/frontend` (React/Tauri) and `/backend` (FastAPI).
2. **Tauri Sidecar:** Configure Tauri to manage the FastAPI executable.
3. **Database Setup:** Initialize Drizzle with PostgreSQL, focusing on the core Ledger and Transaction tables.
4. **The Broker:** Implement the core event broker logic in the backend.

---
**Initial Task:**
Please analyze the current directory and generate the initial project structure, including the `tauri.conf.json`, `main.py` (FastAPI), and the folder structure for the Finance and Tasks modules. Ensure all code adheres to the **Result Pattern** and **Direct Import** rules specified above.

