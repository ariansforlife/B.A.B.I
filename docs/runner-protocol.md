# Local runner contract (proposal)

The dashboard cannot directly enumerate local USB devices or launch Appium/Playwright/Maestro. A trusted, locally installed runner is required. The typed interfaces in `src/lib/runner.ts` and bounded scheduler in `src/lib/scheduler.ts` are **contracts only**.

## Security requirements

- Bind a local runner to loopback by default; authenticate dashboard requests and reject untrusted origins.
- Do not execute arbitrary scripts from imported JSON automatically.
- Restrict workspace paths to a configured directory and prevent path traversal.
- Explicitly approve executables and devices; redact secrets and environment variables in logs.
- Enforce timeouts, bounded concurrency, cancellation, and process-tree termination.
- Treat external devices as leased resources; never schedule two exclusive mobile jobs on the same device.

## Device discovery

Android: parse `adb devices -l` and enrich metadata with `adb -s <serial> shell getprop`. iOS: use `xcrun simctl list devices --json` for simulators; physical devices require Xcode tooling and trust pairing. These integrations are not implemented yet.

## File layout (planned)

`workspace.json`, `projects/<project-id>/cases/<case-id>.json`, `scripts/`, `runs/<run-id>/result.json`, `artifacts/`.
