// Ksri tests — checks www files exist and app.js contains the key features.
// Run: npm test   (node --test tests/ksri.test.js)
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'www', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'www', 'styles.css'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cap = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));

test('www files exist', () => {
  for (const f of ['www/index.html', 'www/styles.css', 'www/app.js']) {
    assert.ok(fs.existsSync(path.join(root, f)), f + ' should exist');
  }
  assert.ok(appJs.length > 10000, 'app.js should be substantial, got ' + appJs.length);
});

test('Ksri branding (old name absent)', () => {
  assert.equal(cap.appId, 'com.hadhvik.ksri');
  assert.equal(cap.appName, 'Ksri');
  assert.equal(cap.webDir, 'www');
  assert.equal(pkg.name, 'ksri');
  assert.match(indexHtml, /<title>Ksri/);
  // 'avechat' catches the old name in any casing without spelling it out here
  assert.doesNotMatch(appJs + indexHtml, /avechat/i);
});

test('registration: phone OR email + OTP', () => {
  for (const s of ['setMethod', 'sendOtp', 'verifyOtp', 'pendingOtp', 'finishRegistration', 'ksri_v1']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  assert.match(indexHtml, /Email/);
  assert.match(indexHtml, /Demo OTP/);
});

test('core WhatsApp features', () => {
  for (const s of ['renderChats', 'openChat', 'sendMessage', 'attachPhoto', 'startVoiceNote', 'reactToMessage', 'editMessage', 'deleteMessage', 'forwardMessage', 'starMessage', 'saveGroup', 'renderStatus', 'saveMyStatus', 'startCall', 'simulateIncomingCall', 'renderSettings', 'exportBackup', 'importBackup']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
});

test('beyond-WhatsApp features', () => {
  for (const s of ['saveScheduled', 'checkScheduled', 'cancelScheduled', 'SMART_REPLIES', 'aiReply', 'translateMessage', 'TRANSLATE_DICT', 'setFolder', 'toggleLock', 'unlockLockedChats', 'savePoll', 'votePoll', 'openNotesPanel', 'setReminder', 'setWallpaper', 'toggleTheme', 'transcribeVoice', 'createBroadcastFlow', 'renderChannels', 'toggleFollowChannel']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
});

test('workflows use the working pattern', () => {
  const android = fs.readFileSync(path.join(root, '.github/workflows/android.yml'), 'utf8');
  assert.match(android, /java-version: '21'/);
  assert.match(android, /actions\/checkout@v5/);
  assert.match(android, /actions\/setup-node@v5/);
  assert.match(android, /actions\/setup-java@v5/);
  assert.match(android, /actions\/upload-artifact@v5/);
  assert.match(android, /\.\/android\/gradlew -p android assembleDebug/);
  assert.doesNotMatch(android, /uses:\s*android-actions\/setup-android/);
  assert.match(android, /ksri-debug-apk/);
  const ci = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.match(ci, /npm test/);
});

test('Capacitor 8.6.3', () => {
  assert.match(pkg.dependencies['@capacitor/core'], /8\.6\.3/);
  assert.match(pkg.dependencies['@capacitor/android'], /8\.6\.3/);
  assert.match(pkg.dependencies['@capacitor/cli'], /8\.6\.3/);
});

test('calendar + todo linked to chats, 1-day-before reminders', () => {
  for (const s of ['state.events', 'state.todos', 'renderCalendar', 'openEventCreator', 'saveEvent', 'editEvent', 'deleteEvent', 'changeCalMonth', 'selectCalDay', 'renderTodos', 'openTodoCreator', 'saveTodo', 'toggleTodo', 'editTodo', 'deleteTodo', 'setTodoFilter', 'syncReminderForEvent', 'syncReminderForTodo', 'ensurePlannerReminders', 'renderReminderList', 'requestNotificationPermission', 'notifyReminder', 'snoozeReminder', 'dismissReminder', 'checkReminders', 'openPlannerFromSettings']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  assert.match(appJs, /1 day before/);
  assert.match(appJs, /24 \* 3600000/);
  assert.match(indexHtml, /tab-calendar/);
  assert.match(indexHtml, /tab-tasks/);
  assert.match(indexHtml, /openEventCreator\(currentChatId\)/);
  assert.match(indexHtml, /openTodoCreator\(currentChatId\)/);
  assert.match(css, /cal-grid/);
  assert.match(css, /reminder-banner/);
});

test('screen sharing in calls', () => {
  for (const s of ['getDisplayMedia', 'startScreenShare', 'stopScreenShare', 'toggleScreenShare', 'startDemoScreenShare', 'beginRealScreenShare', 'offerDemoScreenShare', 'startChatScreenShare', 'startScreenShareCallPrompt', 'toggleScreenShareSetting', 'openScreenShareSettings', 'screenShare', 'share-banner', 'share-tile', 'groupTilesHtml', 'startGroupCall']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  assert.match(appJs, /screenShare: true/);
  assert.match(appJs, /You are sharing your screen/);
  assert.match(appJs, /Stop sharing/);
  assert.match(indexHtml, /startChatScreenShare\(\)/);
  assert.match(indexHtml, /startScreenShareCallPrompt\(\)/);
  assert.match(indexHtml, /Share screen in call/);
  assert.match(css, /share-banner/);
  assert.match(css, /share-tile/);
  assert.match(css, /group-tiles/);
});

test('notes with target date from calendar, 1-day-before reminder', () => {
  for (const s of ['noteDateTime', 'fmtTargetDate', 'isNoteOverdue', 'syncReminderForNote', 'sortedNotes', 'openNotesPanel', 'openNoteCreator', 'upsertNote', 'addNote', 'saveNote', 'editNote', 'deleteNote', 'toggleNote', 'clearNoteTargetDate', 'toggleNoteCalendar', 'renderNoteCalendar', 'changeNoteCalMonth', 'selectNoteCalDay', 'noteCalView', 'targetDate', 'targetTime']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  assert.match(appJs, /kind === 'note'/);
  assert.match(appJs, /Target: /);
  assert.match(appJs, /Reminds 1 day before/);
  assert.match(appJs, /noteDateTime\(n\)\.getTime\(\) - 24 \* 3600000/);
  assert.match(appJs, /Pick from calendar/);
  assert.match(appJs, /type="date"/);
  assert.match(css, /note-date-row/);
  assert.match(css, /mini-cal-wrap/);
  assert.match(css, /note-target/);
});

test('fixed demo OTP 123456, Send OTP always advances, demo bypass', () => {
  // Fixed code, never random — the shown code can never be wrong.
  assert.match(appJs, /var DEMO_OTP = '123456'/);
  assert.match(appJs, /var DEMO_PHONE = '\+91 98765 43210'/);
  assert.match(appJs, /var DEMO_EMAIL = 'demo@ksri\.app'/);
  assert.doesNotMatch(appJs, /Math\.floor\(100000 \+ Math\.random\(\) \* 900000\)/);
  assert.match(appJs, /pendingOtp = DEMO_OTP/);
  for (const s of ['continueDemoAccount', 'skipOtp', 'fillDemoOtp', 'otpTyped', 'resendOtp']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  // sendOtp must have NO early return before it advances — extract it and check.
  const sendOtpFn = appJs.slice(appJs.indexOf('function sendOtp()'), appJs.indexOf('function resendOtp()'));
  assert.ok(sendOtpFn.includes("showStep('step-otp')"), 'sendOtp must advance to the OTP step');
  assert.doesNotMatch(sendOtpFn, /\breturn;/, 'sendOtp must never silently return without advancing');
  assert.match(sendOtpFn, /DEMO_PHONE/, 'sendOtp auto-fills a demo phone when empty/invalid');
  assert.match(sendOtpFn, /Demo OTP is 123456/);
  // verifyOtp accepts the fixed code (and the shown code).
  const verifyFn = appJs.slice(appJs.indexOf('function verifyOtp()'), appJs.indexOf('function cycleAvatarColor()'));
  assert.match(verifyFn, /v === DEMO_OTP/);
  assert.match(verifyFn, /123456/);
  // Shown on the sign-up screen itself, before Send OTP is tapped.
  assert.match(indexHtml, /Demo OTP for this build:/);
  assert.match(indexHtml, /id="demo-otp-signup">123456/);
  assert.match(indexHtml, /id="demo-otp">123456/);
  assert.match(indexHtml, /Continue with demo account/);
  assert.match(indexHtml, /Skip OTP \(demo\)/);
  assert.match(indexHtml, /Use demo code 123456/);
  assert.match(indexHtml, /oninput="otpTyped\(\)"/);
  assert.match(indexHtml, /onclick="continueDemoAccount\(\)"/);
  assert.match(indexHtml, /onclick="fillDemoOtp\(\)"/);
  assert.match(css, /\.demo-otp-big/);
  assert.match(css, /\.demo-otp-code/);
  assert.match(css, /\.info-note/);
});

test('Windows (Electron) + iOS (Capacitor) installable', () => {
  // Electron wrapper
  assert.ok(fs.existsSync(path.join(root, 'electron', 'main.js')), 'electron/main.js should exist');
  const mainJs = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
  assert.match(mainJs, /BrowserWindow/);
  assert.match(mainJs, /loadFile/);
  assert.match(mainJs, /www.*index\.html/);
  assert.match(mainJs, /title: 'Ksri'/);
  assert.equal(pkg.main, 'electron/main.js');
  assert.ok(pkg.scripts['windows:dev'], 'windows:dev script');
  assert.ok(pkg.scripts['windows:build'], 'windows:build script');
  assert.match(pkg.scripts['windows:build'], /electron-builder --win/);
  assert.ok(pkg.devDependencies.electron, 'electron devDependency');
  assert.ok(pkg.devDependencies['electron-builder'], 'electron-builder devDependency');
  assert.equal(pkg.build.appId, 'com.hadhvik.ksri');
  assert.equal(pkg.build.productName, 'Ksri');
  assert.match(pkg.build.win.target, /nsis/i);
  // iOS via Capacitor
  assert.match(pkg.dependencies['@capacitor/ios'], /8\.6\.3/);
  assert.ok(pkg.scripts['ios:sync'], 'ios:sync script');
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.match(gitignore, /^ios\/$/m, 'ios/ must be gitignored (generated on CI, like android/)');
  assert.match(gitignore, /^android\/$/m);
  // Workflows: correct runners, Node 24, v5 actions, artifact names
  const win = fs.readFileSync(path.join(root, '.github/workflows/windows.yml'), 'utf8');
  assert.match(win, /runs-on: windows-latest/);
  assert.match(win, /node-version: '24'/);
  assert.match(win, /actions\/checkout@v5/);
  assert.match(win, /actions\/setup-node@v5/);
  assert.match(win, /actions\/upload-artifact@v5/);
  assert.match(win, /electron-builder --win/);
  assert.match(win, /ksri-windows-installer/);
  const ios = fs.readFileSync(path.join(root, '.github/workflows/ios.yml'), 'utf8');
  assert.match(ios, /runs-on: macos-latest/);
  assert.match(ios, /node-version: '24'/);
  assert.match(ios, /actions\/checkout@v5/);
  assert.match(ios, /actions\/setup-node@v5/);
  assert.match(ios, /actions\/upload-artifact@v5/);
  assert.match(ios, /npx cap add ios/);
  assert.match(ios, /npx cap sync ios/);
  assert.match(ios, /xcodebuild/);
  assert.match(ios, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(ios, /ksri-ios-app/);
  assert.match(ios, /Apple Developer signing/);
  // Docs cover both platforms + the signing caveat
  const docs = fs.readFileSync(path.join(root, 'docs', 'WINDOWS_IOS.md'), 'utf8');
  assert.match(docs, /ksri-windows-installer/);
  assert.match(docs, /ksri-ios-app/);
  assert.match(docs, /SmartScreen/);
  assert.match(docs, /TestFlight/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /Windows/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /iOS/);
});

test('Windows + iOS CI fixes: no publish, SPM xcodeproj build', () => {
  // Windows run 45890547838: electron-builder tried to publish in CI
  // ("GitHub Personal Access Token is not set", GH_TOKEN) after the
  // .exe was already built. Fixed both ways, so it cannot recur.
  assert.strictEqual(pkg.build.publish, null, 'package.json build.publish must be null');
  const win = fs.readFileSync(path.join(root, '.github/workflows/windows.yml'), 'utf8');
  assert.match(win, /electron-builder --win --publish=never/);
  assert.match(win, /CSC_IDENTITY_AUTO_DISCOVERY/);
  assert.match(win, /ksri-windows-installer/);
  assert.match(win, /actions\/upload-artifact@v5/);
  // iOS run 45885971876: xcodebuild exit 66, App.xcworkspace missing.
  // The first fix (pod install) was WRONG: Capacitor 8 uses Swift
  // Package Manager, not CocoaPods — there is no Podfile and no
  // .xcworkspace, so `pod install` fails with "No Podfile found".
  // The real fix: build the plain .xcodeproj with -project, and check
  // it with -d (it is a directory, not a file — -f wrongly reported it
  // missing). Still unsigned.
  const ios = fs.readFileSync(path.join(root, '.github/workflows/ios.yml'), 'utf8');
  assert.doesNotMatch(ios, /pod install/, 'ios.yml must not use pod install (no Podfile in Capacitor 8)');
  assert.doesNotMatch(ios, /App\.xcworkspace/, 'ios.yml must not reference App.xcworkspace');
  assert.doesNotMatch(ios, /CocoaPods/, 'ios.yml must not mention CocoaPods');
  assert.match(ios, /-project ios\/App\/App\.xcodeproj/);
  assert.match(ios, /test -d ios\/App\/App\.xcodeproj/);
  assert.match(ios, /Swift Package Manager/);
  assert.match(ios, /ls -la ios\/App\//);
  assert.match(ios, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(ios, /ksri-ios-app/);
  // Docs record both fixes, with the CocoaPods mistake corrected.
  const docs = fs.readFileSync(path.join(root, 'docs', 'WINDOWS_IOS.md'), 'utf8');
  assert.match(docs, /45890547838/);
  assert.match(docs, /GH_TOKEN/);
  assert.match(docs, /--publish=never/);
  assert.match(docs, /45885971876/);
  assert.match(docs, /Swift Package Manager/);
  assert.doesNotMatch(docs, /runs `pod install/, 'docs must not present pod install as the iOS fix');
});

test('Firebase real mode: config + SDK module', () => {
  // Config must be either the inert placeholder OR the real Ksri project
  // (ksri-8974b, configured 2026-11-27). A web apiKey is a public client
  // identifier, not a secret — committing it is intended once configured.
  const cfgPath = path.join(root, 'www', 'firebase-config.js');
  assert.ok(fs.existsSync(cfgPath), 'www/firebase-config.js should exist');
  const cfg = fs.readFileSync(cfgPath, 'utf8');
  assert.match(cfg, /KSRI_FIREBASE_CONFIGURED/);
  assert.match(cfg, /window\.KSRI_FIREBASE_CONFIG/);
  const isPlaceholder = /PASTE_YOUR_API_KEY_HERE/.test(cfg);
  if (isPlaceholder) {
    assert.match(cfg, /PASTE_YOUR_PROJECT_ID/);
  } else {
    assert.match(cfg, /projectId: 'ksri-8974b'/);
    assert.match(cfg, /authDomain: 'ksri-8974b\.firebaseapp\.com'/);
    assert.match(cfg, /AIza[0-9A-Za-z_-]{20,}/, 'configured apiKey present');
  }
  // firebase.js: CDN modular SDK, no bundler, real auth + Firestore APIs.
  const fbPath = path.join(root, 'www', 'firebase.js');
  assert.ok(fs.existsSync(fbPath), 'www/firebase.js should exist');
  const fb = fs.readFileSync(fbPath, 'utf8');
  assert.match(fb, /gstatic\.com\/firebasejs\//);
  assert.match(fb, /FIREBASE_SDK_VERSION = '13\.4\.0'/);
  assert.match(fb, /signInWithPhoneNumber/);
  assert.match(fb, /RecaptchaVerifier/);
  assert.match(fb, /confirmationResult|_confirmation\.confirm/);
  assert.match(fb, /sendSignInLinkToEmail/);
  assert.match(fb, /isSignInWithEmailLink/);
  assert.match(fb, /createUserWithEmailAndPassword/);
  assert.match(fb, /signInWithEmailAndPassword/);
  assert.match(fb, /onSnapshot/);
  assert.match(fb, /serverTimestamp/);
  assert.match(fb, /persistentLocalCache/);
  assert.match(fb, /window\.KsriFirebase/);
  assert.match(fb, /ksri-firebase-ready/);
  // Firebase does NOT send email OTP codes — the code must say so, and
  // must never fake one.
  assert.match(fb, /does NOT send 6-digit codes by email/);
  assert.doesNotMatch(fb, /Math\.floor\(100000 \+ Math\.random\(\) \* 900000\)/);
});

test('Firestore security rules: participants only', () => {
  const rulesPath = path.join(root, 'firestore.rules');
  assert.ok(fs.existsSync(rulesPath), 'firestore.rules should exist');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  assert.match(rules, /rules_version = '2'/);
  assert.match(rules, /match \/users\/\{uid\}/);
  assert.match(rules, /match \/chats\/\{chatId\}/);
  assert.match(rules, /match \/messages\/\{msgId\}/);
  assert.match(rules, /request\.auth\.uid in .*participants/);
  assert.match(rules, /request\.resource\.data\.senderId == request\.auth\.uid/);
  assert.match(rules, /participants == resource\.data\.participants/);
});

test('Real mode in app.js: mode detection + demo fallback', () => {
  // Mode detection: firebaseReady flag, realMode, badge text.
  assert.match(appJs, /var firebaseReady = false/);
  assert.match(appJs, /var realMode = false/);
  assert.match(appJs, /updateModeBadge/);
  assert.match(appJs, /Real mode — Firebase connected/);
  assert.match(appJs, /Demo mode — no backend/);
  assert.match(appJs, /ksri-firebase-ready/);
  // Real auth flows exist; demo OTP path is untouched (see OTP test).
  for (const s of ['sendPhoneCode', 'confirmPhoneCode', 'sendEmailLinkFlow', 'signInEmailPasswordFlow', 'completeEmailLink', 'upsertUserProfile', 'findUserByContact', 'ensureDM', 'startRealChats', 'listenToMyChats', 'listenToMessages', 'sendChatMessage', 'markChatRead', 'setTyping', 'openRealNewChat', 'searchRealUser', 'startRealChatWith', 'afterFirebaseAuth', 'stopRealChats', 'stopRealMessages']) {
    assert.ok(appJs.includes(s), 'app.js should contain ' + s);
  }
  // Demo fallback: demo OTP + demo bypass still present, and demo chats
  // are only hidden (filtered in renderChats), never deleted.
  assert.match(appJs, /var DEMO_OTP = '123456'/);
  assert.match(appJs, /continueDemoAccount/);
  assert.match(appJs, /if \(realMode\) list = list\.filter\(function \(c\) \{ return c\.real \|\| c\.isAI \|\| c\.isNotes; \}\)/);
  // Real messages go through Firestore, not the simulated reply timer.
  const sendFn = appJs.slice(appJs.indexOf('function sendMessage()'), appJs.indexOf('function aiReply('));
  assert.match(sendFn, /sendChatMessage/);
  assert.match(sendFn, /chat\.real/);
  // In real phone mode the demo code must NEVER verify: if no SMS was
  // requested, verifyOtp refuses instead of falling to the demo check.
  const verifyFn = appJs.slice(appJs.indexOf('function verifyOtp()'), appJs.indexOf('function cycleAvatarColor()'));
  assert.match(verifyFn, /hasPendingPhoneCode/);
  assert.match(verifyFn, /No SMS code was requested/);
  assert.ok(verifyFn.indexOf('No SMS code was requested') < verifyFn.indexOf('v === DEMO_OTP'), 'real-mode refusal must come before the demo check');
});

test('Real mode wiring in index.html + CSS', () => {
  assert.match(indexHtml, /<script src="firebase-config\.js"><\/script>/);
  assert.match(indexHtml, /<script src="firebase\.js"><\/script>/);
  // Firebase scripts load before app.js.
  assert.ok(indexHtml.indexOf('firebase-config.js') < indexHtml.indexOf('app.js'), 'firebase-config.js must load before app.js');
  assert.ok(indexHtml.indexOf('firebase.js') < indexHtml.indexOf('app.js'), 'firebase.js must load before app.js');
  assert.match(indexHtml, /id="mode-badge"/);
  assert.match(indexHtml, /id="settings-mode-badge"/);
  assert.match(indexHtml, /id="recaptcha-container"/);
  assert.match(indexHtml, /id="email-auth-row"/);
  assert.match(indexHtml, /sendEmailLinkFlow\(\)/);
  assert.match(indexHtml, /signInEmailPasswordFlow\(\)/);
  assert.match(indexHtml, /demo-only/);
  assert.match(css, /\.mode-badge/);
  assert.match(css, /\.mode-badge\.real/);
  assert.match(css, /#recaptcha-container/);
  // Docs cover the setup end to end.
  const fbDocs = fs.readFileSync(path.join(root, 'docs', 'FIREBASE.md'), 'utf8');
  assert.match(fbDocs, /console\.firebase\.google\.com/);
  assert.match(fbDocs, /firestore\.rules/);
  assert.match(fbDocs, /firebase-config\.js/);
  assert.match(fbDocs, /10 free/);
  assert.match(fbDocs, /does \*\*not\*\* send 6-digit codes by email/);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /Real mode \(Firebase\)/);
});

test('real auth fixes: normalizePhone, real resend, returning user skips profile', () => {
  // BUG 1 — bare 10-digit numbers must get +91 before Firebase sees them.
  assert.match(appJs, /function normalizePhone\(v\)/);
  assert.match(appJs, /digits\.length === 10\) return '\+91' \+ digits/);
  assert.match(appJs, /digits\.length === 11 && digits\.charAt\(0\) === '0'\) return '\+91' \+ digits\.slice\(1\)/);
  assert.match(appJs, /digits\.length === 12 && digits\.indexOf\('91'\) === 0\) return '\+' \+ digits/);
  const sendOtpFn = appJs.slice(appJs.indexOf('function sendOtp()'), appJs.indexOf('function resendOtp()'));
  assert.match(sendOtpFn, /normalizePhone\(v\)/, 'sendOtp must normalise the typed number');
  assert.doesNotMatch(sendOtpFn, /pendingValue = '\+' \+ digits/, 'sendOtp must not build a bare +digits number');
  assert.match(sendOtpFn, /Added the India code \+91/, 'OTP note shows the normalised number');
  // Real resend actually re-sends the SMS; demo resend keeps the old text.
  const resendFn = appJs.slice(appJs.indexOf('function resendOtp()'), appJs.indexOf('function backToMethod()'));
  assert.match(resendFn, /sendPhoneCode\(pendingValue\)/, 'real resend must call sendPhoneCode');
  assert.match(resendFn, /Demo OTP is still 123456/);
  // User search normalises too (stored phones are +91…).
  const searchFn = appJs.slice(appJs.indexOf('function searchRealUser()'), appJs.indexOf('function startRealChatWith('));
  assert.match(searchFn, /normalizePhone\(v\)/);
  // BUG 2 — returning users skip profile setup on BOTH sign-in paths.
  assert.match(appJs, /function enterAfterSignIn\(\)/);
  assert.match(appJs, /getUserProfile\(fbUser\.uid\)\.then\(function \(p\) \{/);
  const verifyFn = appJs.slice(appJs.indexOf('function verifyOtp()'), appJs.indexOf('function cycleAvatarColor()'));
  // Only the real-mode branch (up to the demo fallback comment).
  const realConfirm = verifyFn.slice(verifyFn.indexOf('confirmPhoneCode(v)'), verifyFn.indexOf('/* Accept the fixed demo code'));
  assert.match(realConfirm, /enterAfterSignIn\(\)/, 'phone confirm must go through enterAfterSignIn');
  assert.doesNotMatch(realConfirm, /showStep\('step-profile'\)/, 'phone confirm must not jump to profile setup');
  const emailFn = appJs.slice(appJs.indexOf('function signInEmailPasswordFlow()'), appJs.indexOf('/* ---------- REAL CHATS'));
  assert.match(emailFn, /enterAfterSignIn\(\)/);
  assert.doesNotMatch(emailFn, /showStep\('step-profile'\)/, 'email sign-in must not jump to profile setup');
  // finishRegistration (new-user profile creation) still exists unchanged.
  assert.match(appJs, /function finishRegistration\(\)/);
  assert.match(appJs, /upsertUserProfile\(\{/);
});

test('email link: hidden on file://, rejected by Firebase, asks for email when not saved', () => {
  const fb = fs.readFileSync(path.join(root, 'www', 'firebase.js'), 'utf8');
  // BUG — "link clicked, not registering": a Firebase email link can
  // never complete back into the installed file:// app, and completing
  // a link whose email was not saved failed outright. Both fixed.
  // 1. The installed app (file://) must not offer the link button.
  assert.match(appJs, /function isFileApp\(\)/);
  assert.match(appJs, /window\.location\.protocol === 'file:'/, 'isFileApp detects file://');
  const refreshFn = appJs.slice(appJs.indexOf('function refreshAuthModeUI()'), appJs.indexOf('function openModeInfo()'));
  assert.match(refreshFn, /email-link-btn/, 'auth UI toggles the link button');
  assert.match(refreshFn, /email-link-note/, 'auth UI toggles the file-app note');
  assert.match(refreshFn, /isFileApp\(\)/, 'link button hidden on file://');
  assert.match(indexHtml, /id="email-link-btn"/);
  assert.match(indexHtml, /id="email-link-note"/);
  assert.match(indexHtml, /don't work inside the installed app/);
  // 2. sendEmailLinkFlow guards file:// before calling Firebase…
  const linkFn = appJs.slice(appJs.indexOf('function sendEmailLinkFlow()'), appJs.indexOf('function promptForEmailLinkEmail()'));
  assert.match(linkFn, /isFileApp\(\)/);
  assert.match(linkFn, /use your password below instead/, 'file:// link flow tells the user to use a password');
  // …and firebase.js refuses a file:// continue URL outright.
  assert.match(fb, /window\.location\.protocol.*'file:'/);
  assert.match(fb, /Email links need a web address/);
  // 3. Completing a link without a saved email asks for the email
  // instead of failing outright.
  assert.match(fb, /function \(email\)/, 'completeEmailLinkWith takes an explicit email');
  assert.match(fb, /completeEmailLinkWith = function \(email\)/);
  assert.match(fb, /ksri-need-email/);
  assert.match(appJs, /function promptForEmailLinkEmail\(\)/);
  assert.match(appJs, /function submitEmailLinkEmail\(\)/);
  assert.match(appJs, /completeEmailLinkWith\(v\)/);
  const bootFn = appJs.slice(appJs.indexOf("document.addEventListener('DOMContentLoaded'"));
  assert.match(bootFn, /e\.code === 'ksri-need-email'/, 'boot asks for the email on ksri-need-email');
  assert.match(bootFn, /promptForEmailLinkEmail\(\)/);
  // 4. A completed link still finishes via afterFirebaseAuth (returning
  // users go straight into chats, not to profile setup).
  assert.match(bootFn, /completeEmailLink\(\)\.then\(function \(\) \{\s*afterFirebaseAuth\(\);/);
  // 5. Email + password (the Android email path) is untouched.
  assert.match(appJs, /function signInEmailPasswordFlow\(\)/);
  assert.match(fb, /signInWithEmailAndPassword/);
  // Docs say so plainly.
  const fbDocs = fs.readFileSync(path.join(root, 'docs', 'FIREBASE.md'), 'utf8');
  assert.match(fbDocs, /Email-link sign-in only works on the WEB/);
  assert.match(fbDocs, /on Android, use email \+\s*password/);
  assert.match(fbDocs, /same browser\/device that\n  requested it/);
});

test('CSS has dark mode + green brand', () => {
  assert.ok(css.includes('body.dark'), 'dark mode styles');
  assert.ok(css.includes('#25D366'), 'WhatsApp green');
});

test('ensureDM: denied existence check on a new chat still creates it', async () => {
  // Regression test for "Could not start chat: Missing or insufficient
  // permissions". The rules only let participants READ a chat, and a chat
  // that does not exist yet has no participants — so Firestore denies
  // getDoc() on a brand-new DM. ensureDM must treat that denial as
  // "does not exist" and create the chat anyway, not surface the error.
  const vm = require('node:vm');
  const fbSrc = fs.readFileSync(path.join(root, 'www', 'firebase.js'), 'utf8');
  const store = {}; // path -> doc data
  const setCalls = [];
  const fakeFs = {
    doc: (db, coll, id) => ({ __path: coll + '/' + id }),
    getDoc: (ref) => {
      if (store[ref.__path]) return Promise.resolve({ exists: () => true, data: () => store[ref.__path] });
      // Mirror the real rules: reading a missing doc under a
      // participants-only read rule is denied, not an empty snapshot.
      return Promise.reject(new Error('Missing or insufficient permissions.'));
    },
    setDoc: (ref, data) => { setCalls.push(ref.__path); store[ref.__path] = data; return Promise.resolve(); },
    serverTimestamp: () => 'ts'
  };
  const ctx = { console, setTimeout, clearTimeout, Promise, Error, JSON, Math, Date, Object, Array, RegExp };
  ctx.window = ctx;
  ctx.CustomEvent = function (type, opts) { this.type = type; this.detail = (opts && opts.detail) || null; };
  ctx.window.dispatchEvent = () => true;
  vm.createContext(ctx);
  vm.runInContext(fbSrc, ctx, { filename: 'firebase.js' });
  const FB = ctx.KsriFirebase;
  FB._fns = { fs: fakeFs };
  FB.user = { uid: 'u1' };

  // 1. New DM: getDoc denied -> chat still created, id returned.
  const id = await FB.ensureDM('u2');
  assert.equal(id, 'dm_u1_u2');
  // (join: the array lives in the vm realm, so deepEqual on prototypes fails)
  assert.equal(store['chats/dm_u1_u2'].participants.join(','), 'u1,u2');
  assert.equal(store['chats/dm_u1_u2'].type, 'dm');
  assert.equal(setCalls.length, 1);

  // 2. Existing DM: returned untouched, no second write (lastMessage etc.
  //    must not be wiped by re-opening the chat).
  store['chats/dm_u1_u2'].lastMessage = 'Hello';
  const id2 = await FB.ensureDM('u2');
  assert.equal(id2, 'dm_u1_u2');
  assert.equal(setCalls.length, 1);
  assert.equal(store['chats/dm_u1_u2'].lastMessage, 'Hello');
});

test('getUserProfile: a stalled Firestore read times out instead of freezing sign-in', async () => {
  // Regression test for "sign in just sits there" with hadhvikcc@gmail.com:
  // Firebase Auth succeeds (the console shows the sign-in) but the
  // Firestore profile lookup after it can stall forever in a sandboxed
  // webview, and enterAfterSignIn() awaits it with no timeout — so the
  // user never leaves the sign-in screen and sees no error.
  const vm = require('node:vm');
  const fbSrc = fs.readFileSync(path.join(root, 'www', 'firebase.js'), 'utf8');
  const ctx = { console, setTimeout, clearTimeout, Promise, Error, JSON, Math, Date, Object, Array, RegExp };
  ctx.window = ctx;
  ctx.CustomEvent = function (type, opts) { this.type = type; this.detail = (opts && opts.detail) || null; };
  ctx.window.dispatchEvent = () => true;
  vm.createContext(ctx);
  vm.runInContext(fbSrc, ctx, { filename: 'firebase.js' });
  const FB = ctx.KsriFirebase;
  FB._profileLookupTimeoutMs = 30; // test speed only; default is 10000
  FB.user = { uid: 'u1' };

  // 1. getDoc that never settles -> rejects with a timeout error.
  FB._fns = {
    fs: {
      doc: (db, coll, id) => ({ __path: coll + '/' + id }),
      getDoc: () => new Promise(() => {}), // stalls forever
      serverTimestamp: () => 'ts'
    }
  };
  await assert.rejects(() => FB.getUserProfile('u1'), /timed out/);

  // 2. A healthy read still returns the profile.
  FB._fns.fs.getDoc = () => Promise.resolve({ exists: () => true, data: () => ({ uid: 'u1', displayName: 'Hadhvik' }) });
  const p = await FB.getUserProfile('u1');
  assert.equal(p.displayName, 'Hadhvik');

  // 3. A missing profile still resolves null (first-time user -> setup).
  FB._fns.fs.getDoc = () => Promise.resolve({ exists: () => false, data: () => null });
  assert.equal(await FB.getUserProfile('u9'), null);
});
