# Android app — Ksri

## What it is

Ksri packaged for a phone with
[Capacitor](https://capacitorjs.com/): a native Android shell (Kotlin/Java)
that loads a standalone, offline web app from `www/`.

The native `android/` platform is **not committed** to the repo — it contains
binary PNG/JAR assets — and is generated on the GitHub Actions runner with
`npx cap add android`, then synced with `npx cap sync android`. Locally you
can still generate it with `npm run android:sync` after `npx cap add android`.

It is **not** a server app. The Android app works with **no server and no
network**:

- Register with a **phone number or an email address**; a 6-digit OTP is
  verified on-device (demo: shown on screen — no backend yet).
- All chats, statuses, calls, channels, notes, scheduled messages and
  settings live in `localStorage` on the device (key `ksri_v1`).
- Demo conversations are seeded on first run so every feature can be tried
  immediately: chats, groups, polls, scheduled messages, chat lock, Ksri AI,
  translation, voice notes, channels and more.

App ID: `com.hadhvik.ksri` · App name: `Ksri` · Web directory: `www/` ·
See `capacitor.config.json`.

## How GitHub builds it

There is no Java or Android SDK on a normal dev machine, so the APK is built
on GitHub Actions — see `.github/workflows/android.yml`:

1. Push to `main` touching `www/**`, `capacitor.config.json`,
   `package.json`, `package-lock.json` or the workflow itself — or run the
   workflow manually (Actions → Android → Run workflow).
2. The runner checks out the repo (`actions/checkout@v5`), sets up Node 24
   (`actions/setup-node@v5`), runs `npm ci`.
3. It generates the Android platform (`npx cap add android` if missing)
   and syncs the web assets (`npx cap sync android`).
4. It sets up **JDK 21** (`actions/setup-java@v5`, Temurin) — Capacitor 8
   requires Java 21; JDK 17 fails with `error: invalid source release: 21`.
5. It uses the **preinstalled Android SDK** on the `ubuntu-latest` runner
   (`ANDROID_HOME` is already set) and just verifies it — **do NOT add an
   `android-actions/setup-android` step**: v3 targets Node 20, which GitHub
   removed from Actions runners in Sep 2026, so that step fails.
6. It builds with `./android/gradlew -p android assembleDebug` — note
   `gradlew` lives in `android/`, not at the repo root (`./gradlew` fails
   with exit code 127).
7. It uploads the APK as the `ksri-debug-apk` artifact
   (`actions/upload-artifact@v5`, 30-day retention).

Download the APK from the workflow run page: Actions → Android → latest
run → Artifacts → `ksri-debug-apk`. Install it on your phone (allow
"Install unknown apps" for your browser/files app when prompted).

## Lessons carried over (from the Invisible ID Vault build)

- `actions/checkout@v5`, `setup-node@v5`, `setup-java@v5`,
  `upload-artifact@v5` — v5 across the board (v4 targets Node 20).
- JDK **21**, not 17.
- No `setup-android` step; check the preinstalled SDK instead.
- `./android/gradlew -p android assembleDebug`.
- Workflow files (`.github/workflows/*.yml`) **cannot be pushed by the
  GitHub App** — they must be added manually on GitHub (see the
  "Getting the APK" steps in the handoff / README of the parent project).
