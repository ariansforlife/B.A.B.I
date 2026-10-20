# Local runner (initial CLI)

No hosted backend or database is needed. The CLI runs **on the same trusted computer** as the test tools, separately from the browser dashboard.

## Device inventory

`node tools/device-discovery.mjs` enumerates ADB Android devices and Xcode iOS simulators (macOS only). Missing tools are reported as errors rather than crashing. Physical iOS device discovery is not yet implemented.

## Run a test

1. Install Node.js, pnpm, Playwright and/or Maestro locally. For Playwright, install browser dependencies separately.
2. Put a test file in `babi-data/` (or set `BABI_WORKSPACE_DIR` to a trusted directory).
3. Run `node tools/runner-cli.mjs playwright tests/example.spec.ts --approve` or `node tools/runner-cli.mjs maestro flows/login.yaml --approve`.
4. Inspect `babi-data/runs/<run-id>/result.json`.

The CLI only accepts known executables and file extensions, and requires explicit approval. **Do not import or execute untrusted test scripts.** No browser-to-runner communication, device leasing, Appium execution, or parallel process management is connected yet. Runner logs can contain sensitive data; use only test credentials.
