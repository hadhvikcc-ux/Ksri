# Ksri on Windows and iOS

Ksri is the same offline web app (`www/`) on every platform — only the
shell changes:

| Platform | Shell | App ID |
| --- | --- | --- |
| Android | Capacitor 8 | `com.hadhvik.ksri` |
| Windows | Electron | `com.hadhvik.ksri` |
| iOS | Capacitor 8 | `com.hadhvik.ksri` |

Your chats, notes, calendar and settings live in `localStorage`
(key `ksri_v1`) on each device. They do **not** sync between devices
yet — there is no server or account sync in this demo build.

## Windows

### Install from GitHub Actions (easiest)

1. On GitHub: Actions → **Windows** → latest run → Artifacts →
   download **`ksri-windows-installer`**.
2. Unzip it and run **`Ksri-Setup-1.0.0.exe`**.
3. Windows SmartScreen may warn because the installer is **unsigned**
   (no code-signing certificate is set up yet): click **More info →
   Run anyway**.
4. Ksri opens as a desktop window (420 × 880, phone-like). Register with
   any phone number or email — the demo OTP is `123456`, shown on screen.

### Run / build locally (Windows PC)

```bash
npm install
npm run windows:dev    # open Ksri in an Electron window for testing
npm run windows:build  # build dist/Ksri-Setup-1.0.0.exe (NSIS installer)
```

The build config lives in `package.json` under `"build"` (electron-builder,
NSIS target, appId `com.hadhvik.ksri`). `electron/main.js` loads
`www/index.html` from a `file://` URL, offline — no server needed.

### How the Windows workflow works

`.github/workflows/windows.yml` runs on `windows-latest`, sets up
Node 24 (`actions/setup-node@v5`), runs `npm ci`, then
`npx electron-builder --win`, and uploads `dist/*.exe` as the
`ksri-windows-installer` artifact (30-day retention). It runs on pushes
to `main` that touch `www/**`, `electron/**`, `package.json` /
`package-lock.json`, or manually (Actions → Windows → Run workflow).

## iOS

### The honest limitation

A real iPhone install needs **Apple Developer signing**: a paid Apple
Developer account, a signing certificate + provisioning profile, and
the bundle ID `com.hadhvik.ksri` registered in App Store Connect.
**This project has none of that set up**, so the CI build below does
**not** produce a signed `.ipa` you can install on a phone or submit
to the App Store.

What the CI build **does** produce (artifact **`ksri-ios-app`**):

- `Ksri-simulator.app` — run it in the **iOS Simulator on a Mac**
  (open Xcode → Simulator, drag the `.app` onto it, or use
  `xcrun simctl install booted Ksri-simulator.app`).
- `Ksri-device.app` — an **unsigned** device build. You can open the
  generated `ios/` project in Xcode on a Mac, add your own Apple
  Developer signing, and install it on your iPhone from Xcode.

### Install from GitHub Actions

1. On GitHub: Actions → **iOS** → latest run → Artifacts →
   download **`ksri-ios-app`**.
2. Unzip it. On a Mac, drag `Ksri-simulator.app` onto the iOS
   Simulator to run Ksri.

### Build locally (Mac with Xcode)

```bash
npm install
npx cap add ios        # generates ios/ (not committed — see below)
npm run ios:sync       # npx cap sync ios
npx cap open ios       # opens ios/App/App.xcworkspace in Xcode
```

In Xcode, pick your team under Signing & Capabilities, pick your
iPhone (or a simulator), and press Run. That is the step that gives
you a signed, installable build — it needs your Apple ID / Developer
account, which the CI workflow deliberately does not have.

### How the iOS workflow works

`.github/workflows/ios.yml` runs on `macos-latest`, sets up Node 24,
runs `npm ci`, generates the iOS platform (`npx cap add ios` if
`ios/` is missing) and syncs (`npx cap sync ios`), then builds with
`xcodebuild` twice — once for the simulator and once for a generic
iOS device, both with `CODE_SIGNING_ALLOWED=NO` (unsigned) — and
uploads both `.app` bundles as `ksri-ios-app` (30-day retention).

### Getting a signed iOS build (when you are ready)

1. Enrol in the Apple Developer Program and register the bundle ID
   `com.hadhvik.ksri` in App Store Connect.
2. In the repo, add GitHub Secrets for your certificate (`.p12`,
   base64-encoded) and provisioning profile, plus their passwords.
3. In `.github/workflows/ios.yml`, add an import-certificate step
   before `xcodebuild`, remove `CODE_SIGNING_ALLOWED=NO`, and add
   `-allowProvisioningUpdates` / an export-options plist to produce
   a signed `.ipa` (for TestFlight / App Store) instead of the
   unsigned `.app` files.
4. For sharing with testers without the App Store, TestFlight is the
   supported route — direct `.ipa` installs need the testers' devices
   in your provisioning profile.

## Workflow files and GitHub

Like the Android workflow, `.github/workflows/windows.yml` and
`.github/workflows/ios.yml` **cannot be pushed by the GitHub App**
(403 on workflow files). Add them manually on GitHub (repo → Add file
→ Create new file, paste the contents from this repo), exactly as
was done for `android.yml` / `ci.yml`.

The stray empty `android.yml` at the repo root on GitHub is harmless
— GitHub Actions only reads files under `.github/workflows/`, so it
is ignored. You can delete it from the GitHub web UI if you like.

## Files

```
electron/main.js              Electron entry point (loads www/index.html)
package.json                  "build" (electron-builder), scripts:
                              windows:dev, windows:build, ios:sync, ios:open
.github/workflows/windows.yml  windows-latest, electron-builder --win
.github/workflows/ios.yml      macos-latest, xcodebuild (unsigned .app)
docs/WINDOWS_IOS.md           this file
```
