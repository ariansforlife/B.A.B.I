# B.A.B.I — Simple Local Testing Workspace

**MVP workflow:** Project → Test Case + Script → Run → Report.

No Docker or database is required. Release, feature, scenario and advanced libraries are optional legacy data, not required for the MVP flow.

## Quick start

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
```

In another terminal:

```bash
npm run runner
```

Open http://localhost:3000, enter the token printed by the runner, and connect. Create a project, create a test case, edit its script and run it. The workspace is stored in `babi-data/workspace.json`; scripts and reports live under `babi-data/`.

The local runner is required for saving, device discovery and test execution. Playwright/Appium/Maestro still need their respective CLIs and platform dependencies installed before executing tests. External MCP support is developed separately and is optional.

## Development checks

```bash
npm test
npm run typecheck
npm run build
```

---

## Previous technical reference

Local-first platform untuk mengelola **project, test case, script automation, device, dan hasil pengujian** web maupun mobile dalam satu dashboard. B.A.B.I menggunakan Next.js + React + TypeScript, Monaco Editor, dan local Node.js runner; tidak memerlukan database atau hosted backend untuk MVP.

> **Status: Phase 0 / MVP.** Dashboard dan local runner sudah tersedia. Pengujian Appium di perangkat fisik, screenshot otomatis lintas engine, dan QA end-to-end masih perlu diselesaikan. Belum siap dianggap production-grade.

## Fitur

| Modul | Implementasi saat ini |
| --- | --- |
| Workspace | Project dan test case, import/export JSON, simpan ke disk lokal |
| Script editor | Monaco (pengalaman editor seperti VS Code) |
| Engine | Playwright, Maestro, Appium melalui Node test adapter |
| Device discovery | Android via ADB, iOS simulator via Xcode simctl |
| Execution | Queue, concurrency, device leasing, cancel, timeout |
| Report | Riwayat run, logs, metadata artifact dan download |
| Storage | File-based di `babi-data/` |
| Security | Token local bridge, bind ke loopback, konfirmasi eksekusi |

## Arsitektur

```text
Browser (Next.js dashboard + Monaco)
                |
                | HTTP localhost + X-BABI-Token
                v
Local Bridge (Node.js, 127.0.0.1:4318)
    |-- workspace / script files
    |-- device discovery (adb / xcrun simctl)
    |-- job queue + device leasing
    |-- runner CLI
          |-- Playwright
          |-- Maestro
          |-- Appium (.spec.js Node test)
    +-- logs, result.json, artifacts
```

Runner harus berjalan di komputer yang memiliki tool automation dan akses perangkat. Dashboard yang di-host di Vercel **tidak otomatis bisa mengakses runner localhost**; koneksi aman untuk origin HTTPS masih perlu dirancang. Jangan mengekspos port local runner langsung ke internet.

## Persyaratan

- Node.js 22 dan pnpm 9.
- Playwright: CLI serta browser dependencies.
- Android: Android SDK/ADB dan device/emulator yang terotorisasi.
- iOS: macOS, Xcode, dan simulator yang berjalan. Deteksi perangkat iOS fisik belum didukung.
- Maestro: Maestro CLI.
- Appium: Appium server, driver platform (UiAutomator2/XCUITest), dan WebDriver client di dalam script Node test. Runner tidak menyalakan Appium server otomatis.

## Menjalankan secara lokal

```bash
git clone https://github.com/ariansforlife/B.A.B.I.git
cd B.A.B.I
corepack enable
pnpm install
```

Terminal pertama — dashboard:

```bash
pnpm dev
```

Terminal kedua — local runner:

```bash
node tools/local-bridge.mjs
```

Buka **http://localhost:3000**, salin `BABI_RUNNER_TOKEN` dari terminal runner, lalu masukkan token dan tekan **Connect**. URL default bridge adalah `http://127.0.0.1:4318`.

### Membuat dan menjalankan test

1. Buat **New project**, pilih target Web/Android/iOS. Untuk Web, isi URL aplikasi.
2. Tambahkan test case, lalu pilih Playwright, Maestro, atau Appium.
3. Tulis script pada Monaco Editor. Ekstensi: Playwright `.spec.ts`, Maestro `.yaml`, Appium `.spec.js`.
4. Untuk mobile, hubungkan device dan pilih dari daftar device yang tersedia.
5. Klik **Run test**, lalu konfirmasi. Script disimpan di `babi-data/scripts/` sebelum masuk queue.
6. Gunakan **Refresh** untuk memantau run. Lihat **Saved reports** untuk logs dan artifact yang berhasil dikumpulkan.

Script automation merupakan kode yang dieksekusi di komputer lokal. **Hanya jalankan script yang tepercaya** dan gunakan kredensial testing, bukan kredensial produksi.

### Runner CLI

Simpan script terlebih dahulu di dalam `babi-data/scripts/`, kemudian:

```bash
node tools/runner-cli.mjs playwright scripts/example.spec.ts --approve
node tools/runner-cli.mjs maestro scripts/example.yaml --approve
node tools/runner-cli.mjs appium scripts/example.spec.js --approve
```

Contoh di atas membutuhkan script dan tool yang sesuai; nama file tersebut bukan file contoh yang otomatis tersedia.

### Memeriksa device

```bash
node tools/device-discovery.mjs
adb devices -l
xcrun simctl list devices
```

Perintah `xcrun` hanya tersedia pada macOS dengan Xcode.

## Penyimpanan lokal

```text
babi-data/
├── workspace.json
├── scripts/
│   └── <test-id>.spec.ts / .spec.js / .yaml
├── job-history/
│   └── <job-id>.json
└── runs/
    └── <run-id>/
        ├── result.json
        ├── output.log
        └── artifact dari script (jika ada)
```

| Environment variable | Default | Keterangan |
| --- | --- | --- |
| `BABI_WORKSPACE_DIR` | `./babi-data` | Direktori workspace |
| `BABI_RUNNER_PORT` | `4318` | Port bridge lokal |
| `BABI_RUNNER_TOKEN` | Dibuat otomatis | Token autentikasi HTTP |
| `BABI_DEVICE_ID` | Diisi runner | Device untuk eksekusi |
| `BABI_ARTIFACT_DIR` | Diisi runner | Direktori evidence per run |

Artifact dapat ditulis oleh script ke `BABI_ARTIFACT_DIR`. **Screenshot otomatis untuk seluruh engine belum diimplementasikan**; konfigurasi screenshot Playwright/Maestro/Appium tetap diperlukan di script masing-masing.

## API local bridge

Semua endpoint menggunakan header `X-BABI-Token`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/health` | Status bridge |
| GET | `/devices` | Device inventory |
| GET / PUT | `/workspace` | Baca / simpan workspace |
| PUT | `/scripts` | Simpan script |
| GET / POST | `/runs` | Daftar / jalankan job |
| POST | `/runs/:id/cancel` | Batalkan job |
| GET | `/reports` | Riwayat tersimpan |
| GET | `/artifacts/:id/:name` | Unduh artifact |

## Development dan quality checks

```bash
pnpm test
pnpm typecheck
pnpm build
```

GitHub Actions menjalankan test, typecheck, dan build. Lulus CI **bukan** pengganti pengujian real-device atau E2E.

## Roadmap / pekerjaan terbuka

- Screenshot dan artifact capture otomatis per engine.
- Artifact preview/viewer langsung di dashboard.
- QA cancellation, timeout, process cleanup, dan recovery setelah restart.
- Pengujian Appium pada Android/iOS nyata.
- Penguatan keamanan path, symlink, dan local bridge.
- Integration test dashboard–runner serta QA E2E.
- Strategi koneksi aman dashboard cloud ke runner lokal.
- Validasi deployment Vercel (akses GitHub App masih terkendala).

## Dokumentasi

- [Architecture](docs/architecture.md)
- [Local runner](docs/local-runner.md)
- [Dashboard bridge](docs/dashboard-bridge.md)
- [Runner protocol](docs/runner-protocol.md)
- [P0 acceptance](docs/p0-acceptance.md)
- [Appium device QA](docs/appium-device-qa.md)

## Repository

[github.com/ariansforlife/B.A.B.I](https://github.com/ariansforlife/B.A.B.I)
