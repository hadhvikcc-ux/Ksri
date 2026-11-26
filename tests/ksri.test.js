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

test('Windows + iOS CI fixes: no publish, CocoaPods workspace', () => {
  // Windows run 45890547838: electron-builder tried to publish in CI
  // ("GitHub Personal Access Token is not set", GH_TOKEN) after the
  // .exe was already built. Fixed both ways, so it cannot recur.
  assert.strictEqual(pkg.build.publish, null, 'package.json build.publish must be null');
  const win = fs.readFileSync(path.join(root, '.github/workflows/windows.yml'), 'utf8');
  assert.match(win, /electron-builder --win --publish=never/);
  assert.match(win, /CSC_IDENTITY_AUTO_DISCOVERY/);
  assert.match(win, /ksri-windows-installer/);
  assert.match(win, /actions\/upload-artifact@v5/);
  // iOS run 45885971876: xcodebuild exit 66, App.xcworkspace missing
  // because CocoaPods never ran. Fixed with pod install + a workspace
  // check + a .xcodeproj fallback. Still unsigned.
  const ios = fs.readFileSync(path.join(root, '.github/workflows/ios.yml'), 'utf8');
  assert.match(ios, /pod install/);
  assert.match(ios, /pod install --repo-update/);
  assert.match(ios, /ls -la ios\/App\//);
  assert.match(ios, /test -f ios\/App\/App\.xcworkspace/);
  assert.match(ios, /-project ios\/App\/App\.xcodeproj/);
  assert.match(ios, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(ios, /ksri-ios-app/);
  // Docs record both fixes.
  const docs = fs.readFileSync(path.join(root, 'docs', 'WINDOWS_IOS.md'), 'utf8');
  assert.match(docs, /45890547838/);
  assert.match(docs, /GH_TOKEN/);
  assert.match(docs, /--publish=never/);
  assert.match(docs, /45885971876/);
  assert.match(docs, /App\.xcworkspace/);
  assert.match(docs, /pod install/);
});

test('CSS has dark mode + green brand', () => {
  assert.ok(css.includes('body.dark'), 'dark mode styles');
  assert.ok(css.includes('#25D366'), 'WhatsApp green');
});
