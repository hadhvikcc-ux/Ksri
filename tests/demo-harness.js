// Demo-mode runtime harness for Ksri (no browser needed).
// Stubs DOM/localStorage, loads firebase-config.js + firebase.js +
// app.js, boots the app, and walks the demo sign-up flow.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log('PASS', name); }
  else { failed++; console.log('FAIL', name); }
}

function makeEl(id) {
  const cls = new Set();
  return {
    id, value: '', textContent: '', innerHTML: '',
    style: {}, dataset: {},
    classList: {
      add: (c) => cls.add(c), remove: (c) => cls.delete(c),
      toggle: (c, f) => { if (f === undefined) { cls.has(c) ? cls.delete(c) : cls.add(c); } else if (f) cls.add(c); else cls.delete(c); },
      contains: (c) => cls.has(c)
    },
    addEventListener: () => {}, removeEventListener: () => {},
    focus: () => {}, click: () => {},
    querySelectorAll: () => [], querySelector: () => null,
    appendChild: () => {}, setAttribute: () => {}, getAttribute: () => null,
    _cls: cls
  };
}

const els = {};
const listeners = {};
const store = {};
const ctx = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, JSON, Math, Object, Array, Promise, RegExp, Error,
  navigator: {},
  location: { href: 'file://' + path.join(__dirname, '..', 'www', 'index.html') },
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  },
  CustomEvent: function (type, opts) { this.type = type; this.detail = (opts && opts.detail) || null; },
};
ctx.window = ctx;
ctx.document = {
  getElementById: (id) => {
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: () => makeEl('created'),
  addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
  documentElement: { style: {} },
  body: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } }
};
ctx.window.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
ctx.window.dispatchEvent = (ev) => {
  (listeners[ev.type] || []).forEach((fn) => { try { fn(ev); } catch (e) { console.log('listener error', e.message); } });
  return true;
};
ctx.confirm = () => true;
vm.createContext(ctx);

function run(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
}
run('www/firebase-config.js');
// This harness tests DEMO mode, so force the placeholder config even
// though the committed config is now the real ksri-8974b project — the
// harness must not try to reach Firebase. Real mode is covered by
// tests/real-harness.js with its own fake backend.
ctx.KSRI_FIREBASE_CONFIG = {
  apiKey: 'PASTE_YOUR_API_KEY_HERE',
  authDomain: 'PASTE_YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_YOUR_PROJECT_ID',
  storageBucket: 'PASTE_YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'PASTE_YOUR_SENDER_ID',
  appId: 'PASTE_YOUR_APP_ID'
};
ctx.KSRI_FIREBASE_CONFIGURED = false;
run('www/firebase.js');
run('www/app.js');

// firebase.js with placeholder config must settle as NOT ready (demo mode).
check('placeholder config -> KSRI_FIREBASE_CONFIGURED false', ctx.KSRI_FIREBASE_CONFIGURED === false);
check('firebase settled flag set', ctx.__ksriFirebaseSettled === true);
check('KsriFirebase.ready false (demo mode)', ctx.KsriFirebase.ready === false);

// Boot the app (DOMContentLoaded).
(listeners['DOMContentLoaded'] || []).forEach((fn) => fn());
check('firebaseReady false after boot', ctx.firebaseReady === false);
check('realMode false after boot', ctx.realMode === false);
check('auth screen shown (not hidden)', !els['auth-screen']._cls.has('hidden'));
check('mode badge says Demo mode', (els['mode-badge'].textContent || '').indexOf('Demo mode') !== -1);

// Demo sign-up: empty input -> sendOtp must advance to OTP step.
ctx.sendOtp();
check('sendOtp advances to OTP step', els['step-otp'] && !els['step-otp']._cls.has('hidden'));
check('demo OTP shown is 123456', els['demo-otp'] && els['demo-otp'].textContent === '123456');
// Verify with the demo code -> profile step.
els['otp-input'].value = '123456';
ctx.verifyOtp();
check('verifyOtp(123456) advances to profile step', els['step-profile'] && !els['step-profile']._cls.has('hidden'));
// Wrong code stays on OTP step with error.
ctx.showStep('step-otp');
els['otp-input'].value = '000000';
ctx.verifyOtp();
check('wrong code shows error', els['otp-error'] && !els['otp-error']._cls.has('hidden'));
// Finish registration.
els['otp-input'].value = '123456';
ctx.verifyOtp();
ctx.document.getElementById('profile-name').value = 'Hadhvik';
ctx.document.getElementById('profile-bio').value = 'Testing';
ctx.finishRegistration();
check('user registered', ctx.state.user && ctx.state.user.name === 'Hadhvik');
check('app screen shown after registration', !els['app-screen']._cls.has('hidden'));
check('demo chats rendered (10 seeded)', Array.isArray(ctx.state.chats) && ctx.state.chats.length === 10);
check('state saved to localStorage', !!store['ksri_v1']);

// Send a demo message in the first chat; simulated reply arrives.
const chatId = ctx.state.chats[0].id;
ctx.openChat(chatId);
els['msg-input'].value = 'Hello demo';
const before = ctx.getChat(chatId).messages.length;
ctx.sendMessage();
check('demo message sent locally', ctx.getChat(chatId).messages.length === before + 1);

// Settings mode row reflects demo mode.
ctx.renderSettings();
check('settings mentions Demo mode', (els['settings-list'].innerHTML || '').indexOf('Demo mode') !== -1);

// Logout returns to auth screen.
ctx.logout();
check('logout clears user', ctx.state.user === null);
check('auth screen shown after logout', !els['auth-screen']._cls.has('hidden'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
