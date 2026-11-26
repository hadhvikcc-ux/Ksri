# Ksri

**Ksri** is a WhatsApp-style messenger for Android, Windows and iOS — with one big difference:
you can register with a **phone number OR an email address**. And it goes
beyond WhatsApp with scheduled messages, an AI assistant, translation, polls,
chat lock, channels and more.

Built with [Capacitor 8](https://capacitorjs.com/): a native Android / iOS shell
that loads a standalone, **offline** web app from `www/`. On Windows the same
app runs in an [Electron](https://www.electronjs.org/) window. No server, no
network — all data lives on the device in `localStorage` (key `ksri_v1`).

## Real mode (Firebase) — real accounts + real chats

Ksri ships in **demo mode** (offline, demo OTP `123456`, simulated chats).
To make it function for real — real SMS codes and real messages between
two phones — follow **[`docs/FIREBASE.md`](docs/FIREBASE.md)** (free tier,
about 15 minutes in the Firebase console, no coding):

1. Create a Firebase project called `Ksri`.
2. Enable Phone, Email/Password and Email-link sign-in.
3. Create a Firestore database (production mode).
4. Paste `firestore.rules` into the console's Rules tab and publish.
5. Copy the web app config into `www/firebase-config.js`.
6. Rebuild / reinstall — the sign-up screen shows a green
   **"Real mode — Firebase connected"** badge, and demo contacts are
   replaced by your real chats.

Real mode: phone sign-in sends a **real SMS code**; email sign-in is by
**sign-in link or password** (Firebase does not send email OTP codes —
the app never fakes one). Chats sync live over Firestore, work offline
and sync later, and only chat participants can read a chat. If Firebase
is not configured or cannot be reached, the app falls back to demo mode
automatically — nothing breaks.

- App ID: `com.hadhvik.ksri`
- App name: `Ksri`
- Web directory: `www/`

## Features

### WhatsApp core (all working)
- **Registration with phone OR email** — pick a method, get a 6-digit OTP
  (demo: the code is shown on screen, since there is no backend yet), then
  set up your profile (name, bio, avatar colour). Log out / switch account.
  With Firebase configured ([`docs/FIREBASE.md`](docs/FIREBASE.md)), phone
  sign-in sends a real SMS code and email sign-in uses a sign-in link or
  password instead.
- **Chats** — 10 seeded conversations (Amma, Rahul, Priya, Project Team,
  Family Group, Ksri AI, Notes to Self…), avatars, last message, time,
  unread badges, double-tick read receipts, online / typing indicators.
  Search chats, archive, mute, pin, delete, mark as read.
- **Chat view** — send text, emoji picker, attach photos (stored as data
  URLs), voice notes (MediaRecorder, with playback), reply, react
  (❤️👍😂😮😢🙏), edit your own messages, delete for me / for everyone,
  forward, star, copy. Contacts reply after 1–2 s with a typing indicator,
  and ticks go sent → delivered → read. Disappearing messages (24h / 7d /
  off) and a per-chat wallpaper.
- **Groups** — create a group (pick members, name), sender names, admin
  badge, add / remove members, group info.
- **Status** — post text/photo status (24 h expiry label), view others'
  status rings, reply to a status.
- **Calls** — voice/video call screen with timer, mute / speaker / end,
  call history, group call, simulated incoming call.
- **Settings** — profile, privacy (last seen, read receipts, profile
  photo), notifications, dark/light theme, font size, chat backup
  export/import (JSON).

### Beyond WhatsApp (all working)
1. **Email + phone registration** (above).
2. **Scheduled messages** — schedule a message for a time, list + cancel;
   it auto-sends when the time arrives (checked on load and every 20 s).
3. **AI Smart Replies** — 3 suggested replies under the input, tap to send;
   plus a **Ksri AI** chat that answers questions with smart canned replies.
4. **Message translation** — long-press any message → Translate → Hindi,
   Telugu or Spanish (built-in dictionary, with an honest fallback note).
5. **Chat folders** — All / Unread / Personal / Work / Groups filter chips.
6. **Chat Lock** — lock a chat with a 4-digit PIN; locked chats hide in a
   separate section until unlocked.
7. **Polls** — create a poll in any chat/group, vote, live result bars.
8. **Notes to Self + Reminders** — personal notes chat, notes panel, and
   "Remind me about this" on any message.
9. **Custom themes & wallpapers** — dark/light theme, font size, 6 chat
   wallpapers per chat.
10. **Voice transcription** — a Transcribe button on voice notes shows a
    transcript (demo text).
11. **Broadcast lists + Channels** — create broadcast lists; follow
    channels, discover new ones, create your own.
12. **More** — starred-messages view, in-chat search, larger file sharing
    (photos as data URLs), disappearing messages.

## Try it in a browser

```bash
# just open www/index.html in any browser — no build step needed
# or serve it:
npx serve www
```

On first run, demo chats are seeded automatically. Register with any phone
number (10+ digits) or email — the demo OTP is shown on screen.

## Build the Android APK

The APK is built on **GitHub Actions**, not locally (no Java / Android SDK
needed on your machine). See [`docs/ANDROID.md`](docs/ANDROID.md).

```bash
npm install
npm test          # checks www files exist and key features are present
npm run android:sync   # after: npx cap add android (CI does this)
```

## Windows

Ksri runs on Windows as a desktop app (Electron, same offline `www/` app).
See [`docs/WINDOWS_IOS.md`](docs/WINDOWS_IOS.md).

```bash
npm install
npm run windows:dev    # open Ksri in a desktop window for testing
npm run windows:build  # build dist/Ksri-Setup-1.0.0.exe (NSIS installer)
```

The installer is built on GitHub Actions too (`.github/workflows/windows.yml`,
`windows-latest`): download the **`ksri-windows-installer`** artifact from
the latest Windows run. It is **unsigned**, so Windows SmartScreen may warn
on first run — click More info → Run anyway.

## iOS

Ksri runs on iOS via Capacitor (same offline `www/` app). See
[`docs/WINDOWS_IOS.md`](docs/WINDOWS_IOS.md) — **read the signing note first.**

```bash
npm install
npx cap add ios        # generates ios/ (CI does this; never committed)
npm run ios:sync       # npx cap sync ios
npx cap open ios       # opens the project in Xcode (Mac only)
```

The iOS workflow (`.github/workflows/ios.yml`, `macos-latest`) builds an
**unsigned** `.app` and uploads it as **`ksri-ios-app`** (a simulator build
you can run on a Mac, plus an unsigned device build). It is **not** a signed
`.ipa` — installing on a real iPhone needs Apple Developer signing (paid
account, certificate + provisioning profile), which is not set up here.
Open the generated project in Xcode with your own Apple ID to get a
signed, installable build, or use TestFlight when you are ready.

## Project layout

```
capacitor.config.json   App ID com.hadhvik.ksri, webDir www
package.json            Capacitor 8.6.3, Electron, scripts: test,
                        android:sync, ios:sync, windows:dev, windows:build
electron/
  main.js               Windows desktop entry point (loads www/index.html)
www/
  index.html            App shell (auth, tabs, chat view, overlays)
  styles.css            WhatsApp-green theme, light + dark
  app.js                All features, localStorage key ksri_v1; demo/real mode switch
  firebase-config.js    Firebase project values (PLACEHOLDER until set up)
  firebase.js           Real auth + Firestore (CDN SDK, no bundler)
firestore.rules         Firestore security rules (paste into Firebase console)
docs/FIREBASE.md        Real-mode setup guide (free Firebase project)
tests/ksri.test.js      Node test: files exist + feature strings present
.github/workflows/
  ci.yml                Node 24, npm ci, npm test
  android.yml           JDK 21, v5 actions, builds the debug APK
  windows.yml           windows-latest, electron-builder --win, .exe installer
  ios.yml               macos-latest, xcodebuild, unsigned .app (see docs)
docs/ANDROID.md         How the Android build works
docs/WINDOWS_IOS.md     How the Windows + iOS builds work (incl. signing)
```

## Notes / limitations (demo)

- OTP is shown on screen — there is no SMS/email backend yet. Plug in a
  real OTP provider (e.g. Firebase Auth) to make it production-ready.
  **Real mode is now built in — see [`docs/FIREBASE.md`](docs/FIREBASE.md):
  paste your Firebase config into `www/firebase-config.js` and the app
  switches to real SMS codes and real chats automatically.**
- Simulated replies, AI answers, translations and voice transcripts use
  built-in canned data — they work offline by design. In real mode,
  1:1 and group chats are real; status, channels, calls and Ksri AI are
  still demo data.
- Voice notes and photos are stored as data URLs in localStorage, so very
  large media can fill browser storage; export a backup regularly. In
  real chats, photos/voice notes must fit Firestore's ~1 MB per-message
  limit.
