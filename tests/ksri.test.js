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

test('Firebase real mode: config placeholder + SDK module', () => {
  // Placeholder config must exist and be inert (no real keys committed).
  const cfgPath = path.join(root, 'www', 'firebase-config.js');
  assert.ok(fs.existsSync(cfgPath), 'www/firebase-config.js should exist');
  const cfg = fs.readFileSync(cfgPath, 'utf8');
  assert.match(cfg, /PASTE_YOUR_API_KEY_HERE/);
  assert.match(cfg, /PASTE_YOUR_PROJECT_ID/);
  assert.match(cfg, /KSRI_FIREBASE_CONFIGURED/);
  assert.match(cfg, /window\.KSRI_FIREBASE_CONFIG/);
  assert.doesNotMatch(cfg, /AIza[0-9A-Za-z_-]{20,}/, 'no real Firebase apiKey may be committed');
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

test('CSS has dark mode + green brand', () => {
  assert.ok(css.includes('body.dark'), 'dark mode styles');
  assert.ok(css.includes('#25D366'), 'WhatsApp green');
});
