# Architecture — Phase 0

## Current implementation

- Next.js/React/TypeScript dashboard, Tailwind styling and Monaco editor.
- Workspace is held in browser memory and imported/exported as versioned JSON. No database or hosted backend.
- Project and test case identities use UUIDs. Engines are Playwright, Appium and Maestro.
- Test execution, local device discovery, parallel scheduling and durable automatic filesystem writes are **not implemented**.

## Next milestone

Implement a user-authorized local companion process with narrow filesystem access, explicit script execution allowlisting, device discovery via ADB/Xcode, execution timeouts and cancellation, concurrency limits, and persisted run evidence. Browser-only apps cannot securely access connected devices or spawn local executables. Never run imported scripts without explicit approval.

## Scope decision

The older Notion architecture specifies Go/Postgres/Redis/MinIO. The newer MVP requirement replaces this with file-based storage and no persistent backend. This branch is a local-first proof of concept, not completion of the older Phase 0 acceptance gates.
