# Local dashboard bridge

Run the dashboard and companion on the same trusted laptop. No hosted backend or database is required.

```bash
pnpm install
node tools/local-bridge.mjs
# In another terminal:
pnpm dev
```

Copy the generated runner token from the terminal into the dashboard, then click **Connect**. The companion binds to `127.0.0.1:4318` and accepts the dashboard origins `http://localhost:3000` and `http://127.0.0.1:3000`. Keep the token secret. Do not expose this port publicly.

The dashboard loads `babi-data/workspace.json`, autosaves changes, and reads device inventory via `adb` and `xcrun simctl`. When you click Run, the dashboard writes the editor contents to `babi-data/scripts/<test-id>.spec.ts` (Playwright) or `<test-id>.yaml` (Maestro), then asks the companion to run that file. A confirmation dialog is shown before each run.

Install the chosen automation engine on the laptop. Appium is not connected yet. A Playwright test file must be valid for your local Playwright installation; use a real test project with the necessary dependencies. The bridge holds run status in memory while CLI results are saved in `babi-data/runs/`.

**Security limitations:** this is a development-only companion. Do not use untrusted scripts. The initial bridge does not provide robust job cancellation, device locking, rate limiting, symlink protection or hardened request authentication. Run only on your own trusted computer and do not publish the runner service.
