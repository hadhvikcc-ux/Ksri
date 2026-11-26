# Ksri

**Ksri** is a WhatsApp-style messenger for Android — with one big difference:
you can register with a **phone number OR an email address**. And it goes
beyond WhatsApp with scheduled messages, an AI assistant, translation, polls,
chat lock, channels and more.

Built with [Capacitor 8](https://capacitorjs.com/): a native Android shell
that loads a standalone, **offline** web app from `www/`. No server, no
network — all data lives on the device in `localStorage` (key `ksri_v1`).

- App ID: `com.hadhvik.ksri`
- App name: `Ksri`
- Web directory: `www/`

## Features

### WhatsApp core (all working)
- **Registration with phone OR email** — pick a method, get a 6-digit OTP
  (demo: the code is shown on screen, since there is no backend yet), then
  set up your profile (name, bio, avatar colour). Log out / switch account.
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

## Project layout

```
capacitor.config.json   App ID com.hadhvik.ksri, webDir www
package.json            Capacitor 8.6.3, scripts: test, android:sync
www/
  index.html            App shell (auth, tabs, chat view, overlays)
  styles.css            WhatsApp-green theme, light + dark
  app.js                All features, localStorage key ksri_v1
tests/ksri.test.js      Node test: files exist + feature strings present
.github/workflows/
  ci.yml                Node 24, npm ci, npm test
  android.yml           JDK 21, v5 actions, builds the debug APK
docs/ANDROID.md         How the Android build works
```

## Notes / limitations (demo)

- OTP is shown on screen — there is no SMS/email backend yet. Plug in a
  real OTP provider (e.g. Firebase Auth) to make it production-ready.
- Simulated replies, AI answers, translations and voice transcripts use
  built-in canned data — they work offline by design.
- Voice notes and photos are stored as data URLs in localStorage, so very
  large media can fill browser storage; export a backup regularly.
