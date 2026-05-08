# GEMINI.md: Life Management System Specification

## 1. Architectural Paradigm
The system is built as an **AI-Native Modular Monolith**, transitioning from cloud-centric to a **high-performance, local-first architecture** [cite: 284, 285, 494, 495]. This approach ensures low-latency interactions for LLM integration and maintains high cohesion by grouping logic by domain capability (Finance, Tasks, Goals) [cite: 286, 287, 496].

## 2. Core Agentic SOPs
To maximize efficiency for AI agents (Gemini, Cursor, Claude), the following standards are strictly enforced:

### 2.1 Result Pattern for Error Handling
* **Standard**: Functions must return a Result object `{ success: boolean; data?: T; error?: E }` instead of throwing exceptions for domain logic [cite: 358, 362, 388, 516, 517, 526].
* **Reasoning**: This makes error handling explicit in the type signature, preventing "hidden control flow" and reducing computational overhead [cite: 355, 356, 516].

### 2.2 Prohibiting Barrel Imports (No index.ts)
* **Standard**: Barrel files are strictly forbidden; direct imports must be used (e.g., `import { Button } from './components/Button'`) [cite: 373, 377, 389, 520, 522, 527].
* **Reasoning**: Barrel files bloat the AI context window and increase build times by up to 75% [cite: 375, 376, 490, 521].

### 2.3 Mandatory Git Commits
* **Standard**: After every logical modification or fix, the agent MUST stage and commit the changes to the git repository.
* **Reasoning**: Ensures granular version control and allows for immediate recovery in case of regressions or errors during the development lifecycle.

## 3. Communication & Persistence
### 3.1 Event Broker Architecture
* **Function**: Acts as the "nervous system," facilitating asynchronous, event-driven communication between modules to prevent circular dependencies [cite: 289, 290, 497, 498].
* **Implementation**: Modules export a `listeners.py` file registered at startup; they do not import the broker directly to listen [cite: 304, 502].

### 3.2 Database Standards (Drizzle + Postgres)
* **ORM**: Drizzle ORM is used for a TypeScript-first, schema-as-code approach [cite: 312, 313, 505].
* **Naming**: All table names must be `snake_case` [cite: 398, 531].
* **Integrity**: The Finance module follows **double-entry bookkeeping** rules where Assets = Liabilities + Equity [cite: 315, 316, 317, 505].

## 4. Technical Stack & IPC
* **Backend**: FastAPI with Pydantic V2 for high-performance validation and serialization [cite: 293, 294, 301, 498, 499, 501].
* **Desktop Wrapper**: Tauri v2.0 treats the FastAPI backend as a "Sidecar" executable [cite: 336, 406, 510, 535].
* **IPC**: Bulk data transfer uses **Localhost HTTP** to balance performance and security [cite: 342, 343, 344, 510, 511, 512].

## 5. V1 Scaffolding Plan
1. **Infrastructure**: Initialize monorepo (/frontend and /backend) and set up Tauri Sidecar [cite: 405, 406, 534, 535].
2. **Data**: Configure Postgres and define core Finance tables (accounts, transactions, postings) [cite: 411, 412, 537, 538].
3. **Communication**: Implement the Event Broker core and define initial finance events [cite: 415, 416, 538, 539].
4. **Logic**: Build the Transaction Service with double-entry validation and the ledger UI [cite: 418, 420, 539, 542].
5. **Integration**: Create a cross-module listener in the Tasks module for financial triggers [cite: 423, 424, 544, 545].

---
**References**
* Life Management System Spec Generation.pdf
* Life Management System Spec Generation.txt
