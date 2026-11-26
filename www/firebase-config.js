/* Ksri — Firebase configuration (REAL mode).
 *
 * By default this file contains PLACEHOLDER values, so the app runs in
 * DEMO MODE (offline, simulated chats, demo OTP 123456) — exactly as
 * before. To switch Ksri to REAL MODE:
 *
 *   1. Follow docs/FIREBASE.md to create a free Firebase project.
 *   2. In the Firebase console: Project settings → Your apps → Web app,
 *      copy the config object it shows you.
 *   3. Replace the values below with your real ones (keep the same keys).
 *   4. Rebuild / reinstall the app.
 *
 * NOTE: a Firebase *web* apiKey is a public client identifier, not a
 * secret — it is safe to ship in the app. What actually protects your
 * data is firestore.rules (only chat participants can read/write) plus
 * Firebase Auth. Never paste a private/service-account key here.
 *
 * CONFIGURED 2026-11-27: real values from the Ksri Firebase project
 * (ksri-8974b, Spark plan, asia-south1). Phone + Email/Password + Email
 * link sign-in enabled; Firestore in production mode.
 */
'use strict';

window.KSRI_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBAAlDGdcdbNxp8U_CiWF6Abt4_M0F5Juw',
  authDomain: 'ksri-8974b.firebaseapp.com',
  projectId: 'ksri-8974b',
  storageBucket: 'ksri-8974b.firebasestorage.app',
  messagingSenderId: '667783926200',
  appId: '1:667783926200:web:cdbccfcbb15b5c0cf63f4d',
  measurementId: 'G-H0E6WHCW4D'
};

/* True only when every value above has been replaced with a real one.
   app.js reads this to decide Demo mode vs Real mode. */
window.KSRI_FIREBASE_CONFIGURED = (function () {
  var c = window.KSRI_FIREBASE_CONFIG || {};
  var keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  for (var i = 0; i < keys.length; i++) {
    var v = c[keys[i]];
    if (!v || typeof v !== 'string' || v.indexOf('PASTE_YOUR_') === 0) return false;
  }
  return true;
})();
