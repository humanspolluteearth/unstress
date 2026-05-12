# Documentation: unstress

unstress is a high-performance, local-first **Life Management System**. It shifts control of your data from the cloud to your local machine, utilizing a modular architecture for speed and privacy.

## ⌨️ Global Hotkeys

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

## 🏛️ Core Modules

### 1. Dashboard
The central hub providing a high-density overview of your day, including upcoming tasks, schedule highlights, and key financial summaries.

### 2. Tasks
A comprehensive task management system featuring:
- **ListView**: Traditional list view for quick entry.
- **KanbanView**: Visual project management to track status progression.
- **TaskModal**: Quick creation and editing of task details.

### 3. Schedules
Manage your time with flexible views:
- **Daily/Weekly/Monthly Grids**: Visualization of events.
- **Event Management**: Create and edit events directly within the grid.

### 4. Habits
Stay consistent with your daily routines:
- **Checklist**: Rapid completion tracking.
- **Editable Logs**: Keep data-backed records of habits.

### 5. Finance
Local-first financial ledger:
- **Ledger**: Record all income and expenses.
- **Transaction Management**: Securely log transactions via modal.

### 6. Goals
Long-term vision tracking:
- Define major objectives and track milestones.
- View goal details in focused side panels.

### 7. Zen
Minimize distraction with a dedicated focus timer.

### 8. Blackboard
A space for unstructured thoughts, brainstorming, and complex notes.

---

## 🚀 Building the App

unstress supports cross-platform packaging. Use the following build commands:

- **AppImage**: `npm run tauri build -- --target appimage`
- **.deb**: `npm run tauri build -- --target deb`
- **.rpm**: `npm run tauri build -- --target rpm`
