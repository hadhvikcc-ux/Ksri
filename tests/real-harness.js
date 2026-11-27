// Real-mode runtime harness for Ksri (no network, no Firebase project).
// Stubs DOM/localStorage and a FAKE window.KsriFirebase implementing the
// same API as www/firebase.js, then boots app.js and walks the real flows.
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
const calls = [];
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
  getElementById: (id) => { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  // The stub does not parse HTML, so model the class-based queries the
  // app actually makes: .demo-only = the demo OTP boxes/buttons.
  querySelectorAll: (sel) => {
    if (sel === '.demo-only') return ['demo-otp', 'demo-otp-signup'].map((id) => els[id]).filter(Boolean);
    if (sel === '.real-only') return [];
    return [];
  },
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
// Pre-create the demo-only elements (in a real browser they exist in
// the HTML, so querySelectorAll('.demo-only') finds them).
ctx.document.getElementById('demo-otp');
ctx.document.getElementById('demo-otp-signup');

// ---- FAKE Firebase backend (same API surface as www/firebase.js) ----
const fakeUser = { uid: 'u1', phoneNumber: '+919999999999', email: null };
ctx.KsriFirebase = {
  ready: true,
  configured: true,
  user: null, // starts signed OUT; sign-in flows set it
  _phonePending: false,
  friendlyAuthError: (e) => (e && e.message) || 'error',
  sendPhoneCode: (phone) => { calls.push(['sendPhoneCode', phone]); ctx.KsriFirebase._phonePending = true; return Promise.resolve(true); },
  hasPendingPhoneCode: () => ctx.KsriFirebase._phonePending,
  confirmPhoneCode: (code) => { calls.push(['confirmPhoneCode', code]); ctx.KsriFirebase.user = fakeUser; return Promise.resolve(fakeUser); },
  sendEmailLink: (email) => { calls.push(['sendEmailLink', email]); return Promise.resolve(); },
  isEmailLink: () => false,
  completeEmailLink: () => Promise.resolve(fakeUser),
  createEmailAccount: (e, p) => { ctx.KsriFirebase.user = { uid: e === 'new@ksri.app' ? 'u9' : 'u1', email: e }; return Promise.resolve(ctx.KsriFirebase.user); },
  signInEmailPassword: (e, p) => {
    // Only the returning user can sign in; anyone else is "no account".
    if (e === 'returning@ksri.app') { ctx.KsriFirebase.user = { uid: 'u1', email: e }; calls.push(['signInEmailPassword', e]); return Promise.resolve(ctx.KsriFirebase.user); }
    calls.push(['signInEmailPassword', e]); return Promise.reject({ code: 'auth/user-not-found', message: 'no user' });
  },
  signOut: () => { calls.push(['signOut']); ctx.KsriFirebase.user = null; return Promise.resolve(); },
  upsertUserProfile: (p) => { calls.push(['upsertUserProfile', p.displayName]); return Promise.resolve(); },
  getUserProfile: (uid) => Promise.resolve(uid === 'u2'
    ? { uid: 'u2', displayName: 'Friend', phone: '+918888888888', email: '', avatarColor: '#29B6F6', bio: 'hi' }
    : uid === 'u9' ? null // brand-new user: no Firestore profile yet
    : { uid: 'u1', displayName: 'Test User', phone: '+919999999999', email: '', avatarColor: '#25D366', bio: 'Real user' }),
  updateLastSeen: () => {},
  findUserByContact: (v) => Promise.resolve(v === '+918888888888'
    ? [{ uid: 'u2', displayName: 'Friend', phone: '+918888888888', email: '' }] : []),
  listUsers: () => Promise.resolve([{ uid: 'u2', displayName: 'Friend', phone: '+918888888888', email: '' }]),
  ensureDM: (other) => { calls.push(['ensureDM', other]); return Promise.resolve('dm_u1_u2'); },
  createGroup: (name, members) => Promise.resolve('g1'),
  listenToMyChats: (cb) => {
    cb([{ _id: 'dm_u1_u2', participants: ['u1', 'u2'], type: 'dm', name: '', lastMessage: 'Hey', updatedAt: { toMillis: () => Date.now() }, typing: {} }]);
    return () => {};
  },
  listenToMessages: (chatId, cb) => {
    cb([{ _id: 'm1', senderId: 'u2', text: 'Hey from Friend', createdAt: { toMillis: () => Date.now() }, status: 'read', type: 'text' }]);
    return () => {};
  },
  stopAllListeners: () => {},
  sendChatMessage: (chatId, text, extra) => { calls.push(['sendChatMessage', chatId, text]); return Promise.resolve(); },
  markChatRead: (chatId) => { calls.push(['markChatRead', chatId]); return Promise.resolve(); },
  setTyping: () => {},
  reactToMessage: () => Promise.resolve(),
  editMessage: () => Promise.resolve(),
  deleteMessageForEveryone: () => Promise.resolve(),
  deleteMessageForMe: () => Promise.resolve(),
  updateMessageFields: () => Promise.resolve(),
};

run('www/app.js');

(async () => {
  // Boot: DOMContentLoaded, then the firebase-ready event.
  (listeners['DOMContentLoaded'] || []).forEach((fn) => fn());
  ctx.window.dispatchEvent(new ctx.CustomEvent('ksri-firebase-ready', { detail: { ready: true, configured: true } }));
  await sleep(20);
  check('firebaseReady true after event', ctx.firebaseReady === true);
  check('mode badge says Real mode', (els['mode-badge'].textContent || '').indexOf('Real mode') !== -1);
  check('not signed in -> auth screen shown', !els['auth-screen']._cls.has('hidden'));
  check('demo OTP boxes hidden in real mode', els['demo-otp'] ? els['demo-otp']._cls.has('hidden') : true);

  // normalizePhone: bare 10-digit Indian numbers get +91 before Firebase.
  check('normalizePhone 10 digits -> +91', ctx.normalizePhone('9876543210') === '+919876543210');
  check('normalizePhone 91-prefixed 12 digits', ctx.normalizePhone('919876543210') === '+919876543210');
  check('normalizePhone +91 with spaces unchanged', ctx.normalizePhone('+91 98765 43210') === '+919876543210');
  check('normalizePhone 0-prefixed 11 digits', ctx.normalizePhone('09876543210') === '+919876543210');
  check('normalizePhone empty -> empty', ctx.normalizePhone('') === '');

  // Real phone sign-up: bare 10-digit number must be sent as +91…
  ctx.document.getElementById('id-input').value = '9999999999';
  ctx.sendOtp();
  await sleep(10);
  check('sendOtp normalised bare number to +91', calls.some((c) => c[0] === 'sendPhoneCode' && c[1] === '+919999999999'));
  check('OTP target shows normalised number', els['otp-target'].textContent === '+919999999999');
  check('sendOtp advanced to OTP step (real)', !els['step-otp']._cls.has('hidden'));
  check('OTP note mentions real SMS', (els['otp-note'].textContent || '').indexOf('Real SMS') !== -1);
  // Resend in real mode re-sends a real SMS (not the demo code).
  ctx.resendOtp();
  await sleep(10);
  check('resendOtp re-sent real SMS', calls.filter((c) => c[0] === 'sendPhoneCode' && c[1] === '+919999999999').length >= 2);
  // Verify the SMS code.
  els['otp-input'].value = '123456';
  ctx.verifyOtp();
  await sleep(10);
  check('verifyOtp called confirmPhoneCode', calls.some((c) => c[0] === 'confirmPhoneCode' && c[1] === '123456'));
  // Returning user (Firestore profile exists for u1) goes straight in —
  // NO profile setup screen after sign-in.
  check('returning phone user enters app directly', !els['app-screen']._cls.has('hidden'));
  check('returning phone user skips profile step', els['step-profile']._cls.has('hidden'));
  // Finish registration -> Firestore profile upsert.
  ctx.document.getElementById('profile-name').value = 'Test User';
  ctx.document.getElementById('profile-bio').value = 'Real user';
  ctx.finishRegistration();
  await sleep(20);
  check('upsertUserProfile called with display name', calls.some((c) => c[0] === 'upsertUserProfile' && c[1] === 'Test User'));
  check('realMode true after sign-in', ctx.realMode === true);
  check('app screen shown (real)', !els['app-screen']._cls.has('hidden'));
  check('real chat from Firestore present', !!ctx.getChat('dm_u1_u2'));
  await sleep(20);
  check('real chat named from profile (Friend)', ctx.getChat('dm_u1_u2').name === 'Friend');
  // Demo contacts hidden from the rendered list.
  ctx.renderChats();
  check('rendered list hides demo contacts', (els['chat-list'].innerHTML || '').indexOf('Amma') === -1);
  check('rendered list shows real chat', (els['chat-list'].innerHTML || '').indexOf('Friend') !== -1);

  // Open the real chat: live messages load, read marked.
  ctx.openChat('dm_u1_u2');
  await sleep(10);
  check('markChatRead called on open', calls.some((c) => c[0] === 'markChatRead' && c[1] === 'dm_u1_u2'));
  check('real message loaded from listener', ctx.getChat('dm_u1_u2').messages.some((m) => m.text === 'Hey from Friend'));
  check('incoming message from resolved name', ctx.getChat('dm_u1_u2').messages.some((m) => m.from === 'Friend'));

  // Send a real message (no simulated reply).
  els['msg-input'].value = 'Hello real friend';
  ctx.sendMessage();
  await sleep(10);
  check('sendMessage used Firestore, not local push', calls.some((c) => c[0] === 'sendChatMessage' && c[2] === 'Hello real friend'));

  // New chat: find a real user by phone, start DM.
  ctx.openRealNewChat();
  ctx.document.getElementById('real-search-input').value = '+918888888888';
  ctx.searchRealUser();
  await sleep(10);
  check('search found Friend', (els['real-search-results'].innerHTML || '').indexOf('Friend') !== -1);
  ctx.startRealChatWith('u2', 'Friend');
  await sleep(10);
  check('ensureDM called for u2', calls.some((c) => c[0] === 'ensureDM' && c[1] === 'u2'));

  // Logout signs out of Firebase.
  ctx.logout();
  check('logout called Firebase signOut', calls.some((c) => c[0] === 'signOut'));
  check('realMode false after logout', ctx.realMode === false);

  // Email: RETURNING user signs in with password -> straight into the
  // app, no "create account" / profile screen again.
  ctx.document.getElementById('id-input').value = 'returning@ksri.app';
  ctx.document.getElementById('email-password').value = 'secret123';
  ctx.signInEmailPasswordFlow();
  await sleep(10);
  check('email sign-in called signInEmailPassword', calls.some((c) => c[0] === 'signInEmailPassword' && c[1] === 'returning@ksri.app'));
  check('returning email user enters app directly', !els['app-screen']._cls.has('hidden'));
  check('returning email user skips profile step', els['step-profile']._cls.has('hidden'));

  // Email: NEW user (no profile yet) -> profile setup, as before.
  ctx.logout();
  ctx.document.getElementById('id-input').value = 'new@ksri.app';
  ctx.document.getElementById('email-password').value = 'secret123';
  ctx.signInEmailPasswordFlow();
  await sleep(10);
  check('new email user sees profile setup', !els['step-profile']._cls.has('hidden'));
  ctx.document.getElementById('profile-name').value = 'New User';
  ctx.finishRegistration();
  await sleep(10);
  check('new user upserted profile', calls.some((c) => c[0] === 'upsertUserProfile' && c[1] === 'New User'));
  check('new user enters app after setup', !els['app-screen']._cls.has('hidden'));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
