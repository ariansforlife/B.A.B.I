# P0 acceptance checklist

Status checked against code merged into `main` on 2026-10-21. An implementation checkmark is **not** equivalent to device-host end-to-end verification.

- [x] Dashboard scaffold and test-case editor
- [x] Workspace JSON import/export
- [x] Device discovery CLI for Android and iOS simulators
- [x] Initial Playwright/Maestro CLI
- [x] Parallel scheduler and device lease implementation
- [x] Authenticated local bridge between dashboard and runner (localhost only)
- [x] Durable workspace persistence in local JSON files
- [x] Dashboard device inventory and selection implementation
- [x] Execute tests from dashboard with logs and saved history implementation
- [x] Appium Node test adapter and device leasing implementation
- [x] Cancellation, timeout, process cleanup and artifact storage implementation
- [x] Queue ID regression test and available-device status fix (PR #2)
- [x] Runner process timer cleanup and symlink artifact rejection (PR #3)
- [ ] Automatically capture screenshots/artifacts for each engine without test-specific setup
- [ ] End-to-end integration tests covering HTTP bridge, workspace, script, queue, reports and downloads
- [ ] Verify cancellation, timeout, interrupted job recovery and device lease release on real processes
- [ ] Complete security review: symlinks, path access, hostile inputs and browser origin behavior
- [ ] End-to-end QA on Android and iOS device hosts and real web target
- [ ] Verify final CI green after all remaining P0 changes

## Release gate

Phase 0 is **not accepted** until every unchecked item above has evidence (test report or CI link). GitHub CI on an ordinary runner cannot establish that a real iOS/Android device works. Do not mark real-device QA complete without an attached test host.

## Relevant pull requests

- [PR #2](https://github.com/ariansforlife/B.A.B.I/pull/2): queue identity and device validation (merged)
- [PR #3](https://github.com/ariansforlife/B.A.B.I/pull/3): runner lifecycle and artifact access hardening (merged; CI #79 passed)
