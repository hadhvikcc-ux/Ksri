# Ksri — Real mode with Firebase (free tier)

By default Ksri runs in **demo mode**: no backend, the OTP is always
`123456`, and chats are simulated on one phone only. This guide switches
it to **real mode**: real accounts (SMS code / email link / email +
password) and real chats that reach another phone live.

You do this **once**, in the Firebase console (a website — no coding).
After that, anyone who installs the app signs in for real.

**Cost: free.** Everything below fits in Firebase's free (Spark) tier
for normal personal use. Phone SMS is the only metered part: 10 free
SMS verifications per day on the Spark plan (and 50/day if you add a
billing card — you are only charged if you go beyond the free quota;
see "Free-tier limits" at the end).

---

## Step 1 — Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
3. Project name: `Ksri`. Click Continue.
4. Google Analytics: **leave it OFF** (not needed) → Create project →
   wait → Continue.

## Step 2 — Turn on sign-in methods

1. In the left menu: **Build → Authentication** → **Get started**.
2. Go to the **Sign-in method** tab and enable these three:
   - **Phone** → Enable → Save. (This sends real SMS codes.)
   - **Email/Password** → Enable → Save. (Email + password sign-in.)
   - **Email link (passwordless sign-in)** → Enable → Save. (Tap-a-link
     sign-in. Firebase does **not** send 6-digit codes by email — email
     sign-in is by link or by password. There is no fake email OTP.)
3. Still in Authentication → **Settings → Authorized domains**: leave
   the defaults. If you later use a custom web domain for Ksri, add it
   here.

## Step 3 — Create the Firestore database

1. Left menu: **Build → Firestore Database** → **Create database**.
2. Location: pick the closest one (e.g. `asia-south1` for India).
3. Security rules: choose **Start in production mode** → Create.
   (The app's own rules in `firestore.rules` replace these in Step 4.)
4. Wait for the database to be created.

## Step 4 — Paste the security rules

1. In Firestore Database, open the **Rules** tab.
2. Delete everything in the editor and paste the entire contents of
   the file **`firestore.rules`** from this repo.
3. Click **Publish**.

What the rules do, in plain words: anyone signed in can see user
profiles (so you can find people), but a chat can only be read by the
people in it, and nobody can add themselves to someone else's chat.
One gotcha the app already handles: a chat that does not exist yet has
no participants, so reading it to check whether it exists is denied
("Missing or insufficient permissions") — `ensureDM` treats that denial
as "does not exist" and creates the chat instead of showing an error.

## Step 5 — Copy the web app config into Ksri

1. Left menu (gear icon) → **Project settings**.
2. Scroll to **Your apps** → click the **`</>` (Web)** icon.
3. App nickname: `Ksri Web` → **Register app**. (Do **not** tick
   "Also set up Firebase Hosting".)
4. Firebase shows you a `firebaseConfig` object. Copy the values.
5. In this repo, open **`www/firebase-config.js`** and replace the
   six `PASTE_YOUR_…` values with your real ones (same keys, just the
   values). Save the file.
6. The app now detects the real config automatically — the sign-up
   screen will say **"Real mode — Firebase connected"** (green badge)
   instead of "Demo mode".

> **Is the apiKey a secret?** No. A Firebase *web* apiKey is a public
> client identifier — it is safe to ship in the app. Your data is
> protected by the security rules (Step 4) and by Firebase Auth, not by
> hiding the apiKey. Never paste a *service account* / private key
> anywhere in this app.

## Step 6 — Rebuild and install

The config is part of the app files, so rebuild after Step 5:

- **Android:** push the updated files to GitHub (or wait for the next
  push) — Actions builds a new APK (`ksri-debug-apk`). Install it on
  the phone. (Same workflow as before; `www/firebase-config.js` is a
  normal app file, not a workflow file.)
- **Windows:** the Windows workflow builds a new `.exe` installer.
- **Browser test:** just open `www/index.html` — real mode works in a
  browser too (internet required).

## Step 7 — Test with two phones

1. **Phone A:** open Ksri, choose **Phone**, enter your real number,
   tap **Send OTP**. A real SMS arrives — enter the code, set your
   name, and you are in. The badge says "Real mode".
   **Typing the number:** just type your 10-digit number (e.g.
   `98765 43210`) — the app adds `+91` for you. Or type the full
   number with the country code (`+91 98765 43210`). Both work.
   **Signing in again later:** if you already have a Ksri profile,
   you go straight into your chats — profile setup is only the very
   first time. (If an SMS does not arrive, tap **Resend** — it sends
   a fresh real SMS. Do not use 123456 in real mode; that is demo only.)
2. **Phone B:** do the same with a *different* number (or an email
   account). **Important:** each phone needs its own account — two
   phones signed in as the same account cannot message each other.
3. **Phone A → New chat →** search for Phone B's number (or email) →
   tap the person → send "Hello from A".
4. **Phone B** should see the chat appear and the message arrive live,
   with a double tick on Phone A once it is read. Reply from B — it
   appears on A.
5. **Group test:** Phone A → New group → pick Phone B → send a
   message; B sees it in the group.

If anything fails, the app shows the real Firebase error text on the
screen (for example "SMS quota exceeded" or "reCAPTCHA check failed").
Note the exact wording — it tells you what to fix.

---

## Free-tier limits (Spark plan, as of late 2026)

- **Phone Auth:** 10 SMS verifications/day free. (Adding a billing
  card raises this; you only pay beyond the free quota.)
- **Firestore:** 1 GiB stored, 50,000 reads/day, 20,000 writes/day,
  20,000 deletes/day free — far more than a few friends chatting.
- **Authentication:** unlimited email/password and email-link sign-ins
  on the free tier.
- If you outgrow the free tier, Firebase will tell you in the console
  — nothing silently breaks, and you can upgrade (Blaze, pay-as-you-go)
  when you choose to.

## Honest caveats

- **Phone SMS in the installed Android app:** Firebase Phone Auth uses
  an invisible reCAPTCHA in the WebView. It works on most devices, but
  on some it can fail ("captcha-check-failed"). If SMS fails on a
  phone, try the browser version of the app, or use email sign-in.
  The robust native fix is the `@capacitor-firebase/authentication`
  plugin (no reCAPTCHA) — a future step, not in this build.
- **Email is link-or-password, never a 6-digit code.** Firebase simply
  does not send email OTP codes. The app never fakes one.
- **Email-link sign-in only works on the WEB (https).** In the installed
  Android app the link opens in a browser and can never return to the
  app, so the link button is hidden there — **on Android, use email +
  password** (that is the primary email path on the app). On the web,
  the link works, but open it on the **same browser/device that
  requested it**; if the email was not saved there, the app asks you to
  type the email and finishes sign-in with it instead of failing.
- **Returning users go straight in.** After logout, signing in again
  (phone SMS or email + password) takes you directly to your chats —
  profile setup (name/bio) is first-time only. Your account and chats
  live in Firebase, so they come back on any device.
- **Photos / voice notes in real chats** are stored inside the message
  (Firestore limit ~1 MB per message), so very large photos are
  refused with a message. Full media uploads (Firebase Storage) are a
  future step.
- **Status, Channels, Calls, Ksri AI, translations and voice
  transcripts** are still demo data in real mode — only accounts and
  1:1/group chats are real. Calls between real phones need WebRTC
  signalling, which is not built yet.
- **Notifications:** there is no push-notification server yet, so a
  message on a phone that is not open in the app will not buzz. In-app
  reminders and the 1-day-before planner reminders still work.
- **Deleting the app / clearing data** signs you out locally; your
  account and chats stay in Firebase and come back when you sign in
  again on any device.

## Files involved

| File | What it is |
| --- | --- |
| `www/firebase-config.js` | Your Firebase project values (placeholder until Step 5). |
| `www/firebase.js` | Real auth + Firestore code (CDN SDK v13.4.0, no bundler). |
| `firestore.rules` | Security rules — paste into the console (Step 4). |
| `www/app.js` | Switches between demo mode and real mode automatically. |
| `docs/FIREBASE.md` | This guide. |
