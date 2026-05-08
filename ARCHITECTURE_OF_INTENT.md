# Architecture of Intent: unstress

## 1. System Vision
`unstress` is a high-performance, local-first life management system designed as an **AI-Native Modular Monolith**. It prioritizes low-latency interactions, data integrity, and strict decoupling to facilitate seamless AI assistance and long-term maintainability.

## 2. Core Architectural Pillars

### 2.1 Modular Monolith
The system is divided into domain-specific modules (Finance, Tasks, Habits, Goals, Schedules). Each module encapsulates its own logic and state, communicating with others only through events.

### 2.2 Event-Driven Nervous System
An internal `EventBroker` facilitates asynchronous communication. Modules publish events (e.g., `TASK_COMPLETED`, `HABIT_LOGGED`) and register listeners in `listeners.py`. Direct cross-module imports are strictly forbidden.

### 2.3 The Result Pattern
To ensure explicit error handling and facilitate AI reasoning, all service-layer functions return a `Result` object:
`{ success: boolean, data?: T, error?: E }`.
Exceptions are reserved for truly exceptional system failures, not domain logic.

### 2.4 High-Performance Sidecar
The FastAPI backend serves as a high-performance sidecar to the Tauri frontend. It is bundled as a standalone executable using **Nuitka**, ensuring sub-10ms IPC via localhost HTTP and a robust health check mechanism at startup.

## 3. Module Specifications

### 3.1 Finance
- **Double-Entry Bookkeeping:** Mathematically enforced ($ \sum Postings = 0 $).
- **Reinforcement:** Listens for `HABIT_LOGGED` events to reward positive behavior with micro-transactions.

### 3.2 Tasks & Goals
- **Momentum Tracking:** Tracks `TASK_FUNDED` and `TASK_COMPLETED` events.
- **Goal Alignment:** Modules contribute to Goal progress via the `GOAL_UPDATE` event.

### 3.3 Scheduling
- **Conflict Detection:** Deterministic overlap detection for events and time blocks.
- **Proactive Assistance:** Listens for `TASK_COMPLETED` to suggest the next "Open Slot" for high-priority work.

## 4. Engineering Standards (SOPs)
- **No Barrel Imports:** Direct imports only (no `index.ts`) to minimize context window bloat.
- **Local-First:** Designed to run entirely on the user's machine (Arch Linux native).
- **Data Integrity:** Drizzle ORM (TS) and Pydantic V2 (Python) ensure type safety and schema-as-code.

## 5. Current State & Readiness
- **Search:** Global cross-module search utility implemented with Command Palette (`cmdk`).
- **Insights:** Deterministic trend calculation (Spending Trends, Habit Streaks).
- **Safety:** Automated daily backups with `pg_dump` and robust error recovery.
- **Distribution:** Sidecar health checks and standalone bundling logic verified.

---
*Last Updated: Friday, May 8, 2026*
