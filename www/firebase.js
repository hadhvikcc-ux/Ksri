/* Ksri — Firebase (REAL mode): real accounts + real chats.
 *
 * Loaded as a plain <script> (no bundler). It dynamically imports the
 * Firebase modular SDK from the Google CDN, so it needs internet — if
 * the CDN cannot be reached, or firebase-config.js still has placeholder
 * values, KsriFirebase.ready stays false and the app runs in DEMO MODE
 * (offline, simulated chats) exactly as before. Nothing here can break
 * demo mode: every failure ends in a graceful fallback to demo.
 *
 * Firebase JS SDK version is pinned (see FIREBASE_SDK_VERSION) so a
 * future SDK change cannot silently break the app.
 *
 * HONEST CAVEATS (also in docs/FIREBASE.md):
 * - Phone SMS uses Firebase Phone Auth with an invisible reCAPTCHA.
 *   In a Capacitor WebView (file:// origin) reCAPTCHA / app verification
 *   can fail on some devices — if it does, the real Firebase error text
 *   is shown to the user. On Android the robust fix is the
 *   @capacitor-firebase/authentication plugin (native, no reCAPTCHA);
 *   that is a future step, not done here.
 * - Firebase does NOT send 6-digit codes by email. Email sign-in is by
 *   sign-in LINK (tap the link in your inbox) or by email + password.
 *   There is deliberately no fake "email OTP" anywhere in this file.
 * - Email-link sign-in only works on the WEB (https). The installed
 *   Android app loads from a file:// URL, and a Firebase email link
 *   cannot complete back into a file:// page — the link opens in a
 *   browser and sign-in never finishes. sendEmailLink() therefore
 *   refuses file:// outright; on Android use email + password instead.
 *   On the web the link must also be opened on the same browser/device
 *   that requested it (the email is saved in localStorage); if it was
 *   not saved, completeEmailLink() fails with code 'ksri-need-email'
 *   so the app can ask the user to type the email and retry.
 *
 * Firestore model:
 *   users/{uid}                  { uid, displayName, bio, avatarColor,
 *                                  phone, email, createdAt, lastSeen }
 *   chats/{chatId}               { participants: [uid, uid], type: 'dm' | 'group',
 *                                  name, createdAt, updatedAt, lastMessage,
 *                                  typing: { uid: true } }
 *     DM chatId is deterministic: 'dm_' + sorted uids joined with '_',
 *     so two users always find the same chat.
 *   chats/{chatId}/messages/{id} { senderId, text, type, createdAt
 *                                  (serverTimestamp), status: 'sent' |
 *                                  'delivered' | 'read', replyTo, reactions,
 *                                  edited, deleted, deletedFor: [uid] }
 */
'use strict';

var FIREBASE_SDK_VERSION = '13.4.0';
var FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/' + FIREBASE_SDK_VERSION + '/';

window.KsriFirebase = (function () {
  var F = {
    ready: false,
    configured: !!(window.KSRI_FIREBASE_CONFIGURED),
    user: null,          /* Firebase Auth user (or null) */
    error: null,
    _app: null, _auth: null, _db: null, _fns: null,
    _confirmation: null, /* pending phone-code confirmation */
    _recaptcha: null,
    _unsubs: [],         /* active onSnapshot unsubscribers */
    _listeners: []
  };

  function dispatchReady() {
    window.__ksriFirebaseSettled = true;
    try {
      window.dispatchEvent(new CustomEvent('ksri-firebase-ready', {
        detail: { ready: F.ready, configured: F.configured, error: F.error ? String(F.error) : null }
      }));
    } catch (e) { /* very old WebView without CustomEvent detail — ignore */ }
  }
  function dispatchAuth() {
    try {
      window.dispatchEvent(new CustomEvent('ksri-firebase-auth', {
        detail: { uid: F.user ? F.user.uid : null }
      }));
    } catch (e) { /* ignore */ }
  }

  /* ---------- init ---------- */
  F.init = function () {
    if (!F.configured) { F.ready = false; dispatchReady(); return Promise.resolve(false); }
    return Promise.all([
      import(FIREBASE_CDN + 'firebase-app.js'),
      import(FIREBASE_CDN + 'firebase-auth.js'),
      import(FIREBASE_CDN + 'firebase-firestore.js')
    ]).then(function (mods) {
      var appMod = mods[0], authMod = mods[1], fsMod = mods[2];
      F._fns = { app: appMod, auth: authMod, fs: fsMod };
      F._app = appMod.initializeApp(window.KSRI_FIREBASE_CONFIG);
      F._auth = authMod.getAuth(F._app);
      /* Offline persistence: chats keep working offline and sync later. */
      try {
        F._db = fsMod.initializeFirestore(F._app, {
          localCache: fsMod.persistentLocalCache({
            tabManager: fsMod.persistentSingleTabManager({})
          })
        });
      } catch (e) {
        F._db = fsMod.getFirestore(F._app); /* persistence unavailable — still works online */
      }
      authMod.onAuthStateChanged(F._auth, function (u) {
        F.user = u || null;
        if (u) F.updateLastSeen();
        dispatchAuth();
      });
      F.ready = true;
      dispatchReady();
      return true;
    }).catch(function (err) {
      /* CDN unreachable / SDK failed to load: stay in demo mode. */
      F.ready = false;
      F.error = err && err.message ? err.message : String(err);
      dispatchReady();
      return false;
    });
  };

  /* ---------- auth ---------- */
  function friendlyAuthError(err) {
    var code = (err && err.code) || '';
    var map = {
      'auth/invalid-phone-number': 'That phone number looks invalid. Use full international format, e.g. +91 98765 43210.',
      'auth/missing-phone-number': 'Enter a phone number first.',
      'auth/quota-exceeded': 'SMS quota exceeded for this project (free tier limit). Try again tomorrow.',
      'auth/captcha-check-failed': 'reCAPTCHA check failed. In the installed Android app this can happen — try the browser version, or use email sign-in instead.',
      'auth/invalid-verification-code': 'Wrong code — check the SMS and try again.',
      'auth/code-expired': 'That code expired. Ask for a new one.',
      'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
      'auth/user-not-found': 'No account with that email. Create one with a password first.',
      'auth/wrong-password': 'Wrong password for that email.',
      'auth/invalid-email': 'That email address looks invalid.',
      'auth/email-already-in-use': 'An account with that email already exists — sign in with your password instead.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-verification-id': 'Verification expired — ask for a new SMS code.',
      'auth/network-request-failed': 'No internet connection. Real sign-in needs internet; demo mode works offline.',
      'ksri-need-email': 'We need the email address you used for the link — it was not saved on this device. Enter it and try again.'
    };
    return map[code] || ((err && err.message) || 'Sign-in failed. Please try again.');
  }
  F.friendlyAuthError = friendlyAuthError;

  /* Every adapter method below must REJECT (never throw synchronously)
     when Firebase has not initialised yet. F._fns is null until init()
     finishes, and a sync TypeError escapes the callers' .catch handlers
     (which only see rejected promises) — so the button that called it
     looks dead with no error shown. */
  function notInitialised() {
    return Promise.reject(new Error('Firebase is not ready yet — check your connection and try again, or use demo mode.'));
  }
  /* Race a promise against a timeout so a stalled Auth call cannot
     freeze sign-in forever (same pattern as getUserProfile's 10s
     timeout below). F._authTimeoutMs is test-only; default is 15s. */
  function withTimeout(promise, message) {
    var ms = F._authTimeoutMs || 15000;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return; done = true;
        reject(new Error(message));
      }, ms);
      promise.then(function (v) {
        if (done) return; done = true; clearTimeout(timer); resolve(v);
      }, function (e) {
        if (done) return; done = true; clearTimeout(timer); reject(e);
      });
    });
  }

  /* Real SMS code. Needs a #recaptcha-container element in the page. */
  F.sendPhoneCode = function (phone) {
    if (!F._fns) return notInitialised();
    var auth = F._fns.auth;
    var container = document.getElementById('recaptcha-container');
    if (!container) return Promise.reject(new Error('reCAPTCHA container missing from the page.'));
    if (!F._recaptcha) {
      try {
        F._recaptcha = new auth.RecaptchaVerifier(F._auth, 'recaptcha-container', { size: 'invisible' });
      } catch (e) {
        return Promise.reject(e);
      }
    }
    return withTimeout(auth.signInWithPhoneNumber(F._auth, phone, F._recaptcha).then(function (confirmation) {
      F._confirmation = confirmation;
      return true;
    }).catch(function (err) {
      /* A stale verifier can poison the next attempt — drop it so the
         user can retry cleanly. */
      try { if (F._recaptcha) { F._recaptcha.clear(); } } catch (e) { /* ignore */ }
      F._recaptcha = null;
      throw err;
    }), 'SMS code request timed out — check your connection and try again.');
  };
  F.hasPendingPhoneCode = function () { return !!F._confirmation; };
  F.confirmPhoneCode = function (code) {
    if (!F._fns) return notInitialised();
    if (!F._confirmation) return Promise.reject(new Error('No SMS code was requested — tap "Send OTP" first.'));
    return F._confirmation.confirm(code).then(function (cred) {
      F.user = cred.user;
      F._confirmation = null;
      return cred.user;
    });
  };

  /* Email sign-in LINK (Firebase has no email OTP codes — this is the
     real email path). Only works on the WEB (https): the installed app
     loads from file:// and a Firebase email link can never complete
     back into a file:// page — the link opens in a browser and sign-in
     never finishes. Refuse file:// outright instead of sending a link
     that can never work. On Android use email + password instead. */
  F.sendEmailLink = function (email) {
    if (!F._fns) return notInitialised();
    var auth = F._fns.auth;
    if ((window.location.protocol || '') === 'file:' ||
        (window.location.href || '').indexOf('file://') === 0) {
      return Promise.reject(new Error('Email links need a web address — use a password on the installed app instead.'));
    }
    try { localStorage.setItem('ksri_email_for_signin', email); } catch (e) { /* ignore */ }
    return auth.sendSignInLinkToEmail(F._auth, email, {
      url: window.location.href.split('#')[0],
      handleCodeInApp: true
    });
  };
  F.isEmailLink = function () {
    if (!F._fns) return false;
    try { return F._fns.auth.isSignInWithEmailLink(F._auth, window.location.href); } catch (e) { return false; }
  };
  /* Complete a sign-in link with an EXPLICIT email (used when the email
     was not saved on this device — e.g. the link was clicked on a
     different browser than the one that requested it). */
  F.completeEmailLinkWith = function (email) {
    if (!F._fns) return notInitialised();
    var auth = F._fns.auth;
    return withTimeout(auth.signInWithEmailLink(F._auth, email, window.location.href).then(function (cred) {
      F.user = cred.user;
      try { localStorage.setItem('ksri_email_for_signin', email); } catch (e) { /* ignore */ }
      return cred.user;
    }), 'Sign-in link timed out — check your connection and try again.');
  };
  F.completeEmailLink = function () {
    var email = null;
    try { email = localStorage.getItem('ksri_email_for_signin'); } catch (e) { /* ignore */ }
    if (!email) {
      /* Do NOT fail outright: the caller (boot) asks the user to type
         the email they used and retries via completeEmailLinkWith. */
      var err = new Error('We need the email address you used — it was not saved on this device. Enter it again and request a new link.');
      err.code = 'ksri-need-email';
      return Promise.reject(err);
    }
    return F.completeEmailLinkWith(email);
  };

  /* Email + password (the Android-friendly email path). */
  F.createEmailAccount = function (email, password) {
    if (!F._fns) return notInitialised();
    return withTimeout(F._fns.auth.createUserWithEmailAndPassword(F._auth, email, password).then(function (cred) {
      F.user = cred.user;
      return cred.user;
    }), 'Account creation timed out — check your connection and try again.');
  };
  F.signInEmailPassword = function (email, password) {
    if (!F._fns) return notInitialised();
    return withTimeout(F._fns.auth.signInWithEmailAndPassword(F._auth, email, password).then(function (cred) {
      F.user = cred.user;
      return cred.user;
    }), 'Sign-in timed out — check your connection and try again.');
  };

  F.signOut = function () {
    F.stopAllListeners();
    F._confirmation = null;
    if (!F._fns) { F.user = null; return Promise.resolve(); }
    return F._fns.auth.signOut(F._auth).then(function () { F.user = null; });
  };

  /* ---------- users ---------- */
  F.upsertUserProfile = function (profile) {
    if (!F.user) return Promise.resolve();
    var fs = F._fns.fs;
    var data = {
      uid: F.user.uid,
      displayName: profile.displayName || profile.name || '',
      bio: profile.bio || '',
      avatarColor: profile.avatarColor || profile.color || '#25D366',
      phone: profile.phone || F.user.phoneNumber || '',
      email: profile.email || F.user.email || '',
      lastSeen: fs.serverTimestamp()
    };
    if (!data.displayName) data.displayName = data.phone || data.email || 'Ksri user';
    return fs.setDoc(fs.doc(F._db, 'users', F.user.uid), data, { merge: true });
  };
  F.getUserProfile = function (uid) {
    if (!F._fns) return notInitialised();
    var fs = F._fns.fs;
    /* A Firestore read that never settles must not freeze sign-in
       forever: Auth can succeed (the console proves it) while this
       read stalls in a sandboxed webview, leaving the user stuck on
       the sign-in screen with no error. Time out and reject instead —
       enterAfterSignIn() already catches a failed lookup and either
       enters the app from the saved local user or shows profile
       setup, so a stalled lookup degrades instead of hanging. */
    var timeoutMs = F._profileLookupTimeoutMs || 10000;
    var done = false;
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        if (done) return; done = true;
        reject(new Error('Profile lookup timed out'));
      }, timeoutMs);
      fs.getDoc(fs.doc(F._db, 'users', uid)).then(function (snap) {
        if (done) return; done = true; clearTimeout(timer);
        resolve(snap.exists() ? snap.data() : null);
      }).catch(function (e) {
        if (done) return; done = true; clearTimeout(timer);
        reject(e);
      });
    });
  };
  F.updateLastSeen = function () {
    if (!F.user || !F._fns) return;
    var fs = F._fns.fs;
    fs.setDoc(fs.doc(F._db, 'users', F.user.uid), { lastSeen: fs.serverTimestamp() }, { merge: true }).catch(function () { /* best effort */ });
  };
  /* Find a real user by exact phone (+digits) or email. */
  F.findUserByContact = function (value) {
    var fs = F._fns.fs;
    var v = String(value || '').trim();
    var field = v.indexOf('@') !== -1 ? 'email' : 'phone';
    if (field === 'email') v = v.toLowerCase();
    return fs.getDocs(fs.query(fs.collection(F._db, 'users'), fs.where(field, '==', v), fs.limit(5))).then(function (snap) {
      var out = [];
      snap.forEach(function (d) { out.push(d.data()); });
      return out;
    });
  };
  /* Small directory for the group picker (rules allow any signed-in
     user to read user profiles — needed to find people). */
  F.listUsers = function (limitN) {
    var fs = F._fns.fs;
    return fs.getDocs(fs.query(fs.collection(F._db, 'users'), fs.orderBy('lastSeen', 'desc'), fs.limit(limitN || 20))).then(function (snap) {
      var out = [];
      snap.forEach(function (d) { out.push(d.data()); });
      return out;
    }).catch(function () { return []; });
  };

  /* ---------- chats ---------- */
  function dmChatId(a, b) { return 'dm_' + [a, b].sort().join('_'); }
  F.dmChatId = dmChatId;

  F.ensureDM = function (otherUid) {
    if (!F._fns) return notInitialised();
    var fs = F._fns.fs;
    var id = dmChatId(F.user.uid, otherUid);
    var ref = fs.doc(F._db, 'chats', id);
    function create() {
      return fs.setDoc(ref, {
        participants: [F.user.uid, otherUid],
        type: 'dm',
        name: '',
        createdAt: fs.serverTimestamp(),
        updatedAt: fs.serverTimestamp(),
        lastMessage: '',
        typing: {}
      }).then(function () { return id; });
    }
    /* The rules only let participants READ a chat, and a chat that does
       not exist yet has no participants — so getDoc() on a brand-new DM
       is denied with "Missing or insufficient permissions". That denial
       does NOT mean the chat cannot be created (the create rule only
       needs the creator in `participants`), so fall through to create.
       An existing chat reads fine and is returned untouched, so opening
       it never wipes lastMessage/typing. */
    return fs.getDoc(ref).then(function (snap) {
      if (snap.exists()) return id;
      return create();
    }).catch(function () { return create(); });
  };
  F.createGroup = function (name, memberUids) {
    var fs = F._fns.fs;
    var participants = [F.user.uid];
    memberUids.forEach(function (u) { if (participants.indexOf(u) === -1) participants.push(u); });
    return fs.addDoc(fs.collection(F._db, 'chats'), {
      participants: participants,
      type: 'group',
      name: name,
      createdAt: fs.serverTimestamp(),
      updatedAt: fs.serverTimestamp(),
      lastMessage: 'Group created 🎉',
      typing: {}
    }).then(function (ref) { return ref.id; });
  };

  F.listenToMyChats = function (cb) {
    var fs = F._fns.fs;
    var q = fs.query(fs.collection(F._db, 'chats'),
      fs.where('participants', 'array-contains', F.user.uid),
      fs.orderBy('updatedAt', 'desc'));
    var unsub = fs.onSnapshot(q, function (snap) {
      var docs = [];
      snap.forEach(function (d) { var data = d.data(); data._id = d.id; docs.push(data); });
      cb(docs);
    }, function (err) { cb([], err); });
    F._unsubs.push(unsub);
    return unsub;
  };
  F.listenToMessages = function (chatId, cb) {
    var fs = F._fns.fs;
    var q = fs.query(fs.collection(F._db, 'chats', chatId, 'messages'),
      fs.orderBy('createdAt', 'asc'), fs.limit(500));
    var unsub = fs.onSnapshot(q, function (snap) {
      var docs = [];
      snap.forEach(function (d) { var data = d.data(); data._id = d.id; docs.push(data); });
      cb(docs);
    }, function (err) { cb([], err); });
    F._unsubs.push(unsub);
    return unsub;
  };
  F.stopAllListeners = function () {
    F._unsubs.forEach(function (u) { try { u(); } catch (e) { /* ignore */ } });
    F._unsubs = [];
  };

  F.sendChatMessage = function (chatId, text, extra) {
    var fs = F._fns.fs;
    var data = {
      senderId: F.user.uid,
      text: text,
      type: (extra && extra.type) || 'text',
      createdAt: fs.serverTimestamp(),
      status: 'sent',
      replyTo: (extra && extra.replyTo) || null,
      reactions: {},
      edited: false,
      deleted: false,
      deletedFor: []
    };
    if (extra && extra.dataUrl) data.dataUrl = extra.dataUrl;
    if (extra && extra.poll) data.poll = extra.poll;
    return fs.addDoc(fs.collection(F._db, 'chats', chatId, 'messages'), data).then(function () {
      return fs.updateDoc(fs.doc(F._db, 'chats', chatId), {
        lastMessage: data.type === 'poll' ? '📊 Poll' : (data.type === 'image' ? '📷 Photo' : (data.type === 'voice' ? '🎙️ Voice message' : text)),
        updatedAt: fs.serverTimestamp()
      });
    });
  };
  F.markChatRead = function (chatId) {
    var fs = F._fns.fs;
    var q = fs.query(fs.collection(F._db, 'chats', chatId, 'messages'),
      fs.orderBy('createdAt', 'desc'), fs.limit(50));
    return fs.getDocs(q).then(function (snap) {
      var batch = fs.writeBatch(F._db);
      var n = 0;
      snap.forEach(function (d) {
        var m = d.data();
        if (m.senderId !== F.user.uid && m.status !== 'read') {
          batch.update(d.ref, { status: 'read' });
          n++;
        }
      });
      return n ? batch.commit() : Promise.resolve();
    }).catch(function () { /* best effort */ });
  };
  F.setTyping = function (chatId, typing) {
    if (!F.user || !F._fns) return;
    var fs = F._fns.fs;
    var patch = {};
    patch['typing.' + F.user.uid] = !!typing;
    fs.updateDoc(fs.doc(F._db, 'chats', chatId), patch).catch(function () { /* best effort */ });
  };
  F.reactToMessage = function (chatId, msgId, emoji, on) {
    var fs = F._fns.fs;
    var patch = {};
    patch['reactions.' + emoji] = !!on;
    return fs.updateDoc(fs.doc(F._db, 'chats', chatId, 'messages', msgId), patch);
  };
  F.editMessage = function (chatId, msgId, text) {
    var fs = F._fns.fs;
    return fs.updateDoc(fs.doc(F._db, 'chats', chatId, 'messages', msgId), { text: text, edited: true });
  };
  F.deleteMessageForEveryone = function (chatId, msgId) {
    var fs = F._fns.fs;
    return fs.updateDoc(fs.doc(F._db, 'chats', chatId, 'messages', msgId), { deleted: true, text: '' });
  };
  F.deleteMessageForMe = function (chatId, msgId) {
    var fs = F._fns.fs;
    return fs.updateDoc(fs.doc(F._db, 'chats', chatId, 'messages', msgId), {
      deletedFor: fs.arrayUnion(F.user.uid)
    });
  };
  /* Generic field update (used for real-mode poll votes). */
  F.updateMessageFields = function (chatId, msgId, patch) {
    var fs = F._fns.fs;
    return fs.updateDoc(fs.doc(F._db, 'chats', chatId, 'messages', msgId), patch);
  };

  /* Start init as soon as this file loads (it is included before app.js,
     so the ready event / settled flag is available when app.js boots). */
  try { F.init(); } catch (e) { F.ready = false; F.error = e; dispatchReady(); }
  return F;
})();
