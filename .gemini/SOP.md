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
