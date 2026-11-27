/* Ksri — WhatsApp-style messenger.
   DEMO MODE (default): offline-first, all state in localStorage under key
   ksri_v1. No server, no network; demo OTP 123456, simulated contacts.
   REAL MODE (when www/firebase-config.js has real Firebase values):
   real sign-in (SMS code / email link / email+password) and real chats
   over Cloud Firestore via www/firebase.js (window.KsriFirebase).
   Demo mode is never broken by real mode — if Firebase is not
   configured or cannot be reached, the app behaves exactly as before. */
'use strict';

var KEY = 'ksri_v1';
/* Demo OTP — FIXED, never random, so the shown code can never be wrong.
   Root cause of the old failures: a random code was generated on Send OTP
   and validation silently returned (staying on the same screen) for any
   empty/invalid input, so the user never reached the screen that showed it. */
var DEMO_OTP = '123456';
var DEMO_PHONE = '+91 98765 43210';
var DEMO_EMAIL = 'demo@ksri.app';
var AVATAR_COLORS = ['#25D366', '#128C7E', '#7C4DFF', '#FF7043', '#29B6F6', '#EC407A', '#FFA000', '#00ACC1'];
var EMOJIS = ['😀','😂','❤️','👍','🙏','😮','😢','😡','🎉','🔥','👏','😊','😍','🤔','👀','🥳','💯','🙌','😴','🤝','🌹','☕','🎂','✈️','⚽','🎵','📷','💡','👋','😎'];
var REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];
var CANNED = [
  'Haha, nice one! 😄', 'Sounds good to me 👍', 'Let me check and get back to you.',
  'Absolutely! Let\'s do it.', 'Hmm, interesting… tell me more.', 'Okay, noted! ✅',
  'That works for me.', 'I was just thinking the same thing!', 'Give me 5 minutes ⏰',
  'Great idea! Let\'s go with that.'
];
var SMART_REPLIES = ['Sure! 👍', 'Sounds good', 'Let me check', 'Haha 😂', 'On my way!', 'Thanks! 🙏', 'Okay ✅', 'Call you later?'];
var AI_ANSWERS = [
  { k: ['hello', 'hi', 'hey', 'namaste'], a: 'Hello! 👋 I\'m Ksri AI, your in-app assistant. I can help you draft messages, translate text, plan your day, or summarise a chat. What do you need?' },
  { k: ['plan', 'schedule', 'today'], a: 'Here\'s a quick plan: 1) Reply to unread chats first, 2) Check your scheduled messages, 3) Post a status update. Want me to draft a message for someone?' },
  { k: ['translate', 'hindi', 'telugu', 'spanish'], a: 'I can translate messages! Long-press any message → Translate, and pick Hindi, Telugu or Spanish. Try it on "Good morning" — it becomes "शुभ प्रभात" in Hindi.' },
  { k: ['joke'], a: 'Why did the phone go to therapy? It had too many unresolved notifications. 😄' },
  { k: ['weather'], a: 'I\'m offline so I can\'t fetch live weather — but it\'s a great day to message someone you miss! ☀️' },
  { k: ['help', 'what can you'], a: 'I can: draft replies, translate messages, summarise chats, suggest polls, and remind you about scheduled messages. Just ask!' }
];
var TRANSLATE_DICT = {
  hi: { 'hello': 'नमस्ते', 'good morning': 'शुभ प्रभात', 'good night': 'शुभ रात्रि', 'thank you': 'धन्यवाद', 'thanks': 'धन्यवाद', 'how are you': 'आप कैसे हैं', 'i love you': 'मैं तुमसे प्यार करता हूँ', 'yes': 'हाँ', 'no': 'नहीं', 'goodbye': 'अलविदा', 'please': 'कृपया', 'sorry': 'माफ़ कीजिए', 'okay': 'ठीक है', 'great': 'बहुत बढ़िया', 'happy birthday': 'जन्मदिन मुबारक' },
  te: { 'hello': 'నమస్కారం', 'good morning': 'శుభోదయం', 'good night': 'శుభ రాత్రి', 'thank you': 'ధన్యవాదాలు', 'thanks': 'ధన్యవాదాలు', 'how are you': 'మీరు ఎలా ఉన్నారు', 'i love you': 'నేను నిన్ను ప్రేమిస్తున్నాను', 'yes': 'అవును', 'no': 'కాదు', 'goodbye': 'వీడ్కోలు', 'please': 'దయచేసి', 'sorry': 'క్షమించండి', 'okay': 'సరే', 'great': 'చాలా బాగుంది', 'happy birthday': 'పుట్టినరోజు శుభాకాంక్షలు' },
  es: { 'hello': 'Hola', 'good morning': 'Buenos días', 'good night': 'Buenas noches', 'thank you': 'Gracias', 'thanks': 'Gracias', 'how are you': '¿Cómo estás?', 'i love you': 'Te quiero', 'yes': 'Sí', 'no': 'No', 'goodbye': 'Adiós', 'please': 'Por favor', 'sorry': 'Lo siento', 'okay': 'Vale', 'great': '¡Genial!', 'happy birthday': '¡Feliz cumpleaños!' }
};
var LANG_NAMES = { hi: 'Hindi', te: 'Telugu', es: 'Spanish' };
var WALLPAPERS = [
  { id: 'default', label: 'Default', css: '#efeae2' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(135deg,#d9fdd3,#a8e6a1)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg,#d0ecff,#a8d8ff)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg,#ffe0b2,#ffccbc)' },
  { id: 'lavender', label: 'Lavender', css: 'linear-gradient(135deg,#e1bee7,#d1c4e9)' },
  { id: 'dark', label: 'Midnight', css: '#0b141a' }
];

/* ---------- helpers ---------- */
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function nowTime(d) { var t = d ? new Date(d) : new Date(); var h = t.getHours(), m = ('0' + t.getMinutes()).slice(-2); var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + m + ' ' + ap; }
function todayLabel(ts) { var d = new Date(ts), n = new Date(); if (d.toDateString() === n.toDateString()) return 'Today'; var y = new Date(n); y.setDate(y.getDate() - 1); if (d.toDateString() === y.toDateString()) return 'Yesterday'; return d.toLocaleDateString(); }
function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); }
function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(function () { t.classList.add('hidden'); }, 2200); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Storage full — some media was not saved'); } }
function load() { try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }

/* ---------- seed data ---------- */
function msg(from, text, minsAgo, extra) {
  var m = Object.assign({ id: uid(), from: from, text: text, time: Date.now() - minsAgo * 60000, type: 'text', ticks: 2, starred: false, reactions: {}, edited: false, deleted: false }, extra || {});
  return m;
}
function seed() {
  var t = Date.now();
  return {
    user: null,
    folder: 'all',
    showArchived: false,
    settings: { theme: 'light', fontSize: 'medium', readReceipts: true, lastSeen: 'Everyone', profilePhoto: 'Everyone', notifications: true, disappearingDefault: 'off', screenShare: true },
    lockPin: null,
    unlocked: false,
    notes: (function () {
      var dstr = function (off) { var d = new Date(t + off * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
      return [
        { id: uid(), text: 'Buy milk, eggs and bread on the way home', time: t - 3600000, done: false, targetDate: dstr(1), targetTime: '09:00' },
        { id: uid(), text: 'Call bank about the new debit card', time: t - 7200000, done: false, targetDate: '', targetTime: '09:00' },
        { id: uid(), text: 'Project demo is on Friday — prepare slides', time: t - 86400000, done: true, targetDate: '', targetTime: '09:00' }
      ];
    })(),
    scheduled: [],
    reminders: [],
    events: (function () {
      var dstr = function (off) { var d = new Date(t + off * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
      return [
        { id: uid(), chatId: 'c-team', title: 'Sprint review', date: dstr(1), time: '15:00', notes: 'Bring demo notes for the client', createdAt: t },
        { id: uid(), chatId: 'c-family', title: 'Sunday lunch at Amma\'s', date: dstr(3), time: '13:00', notes: 'Don\'t be late — 1pm sharp', createdAt: t }
      ];
    })(),
    todos: (function () {
      var dstr = function (off) { var d = new Date(t + off * 86400000); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
      return [
        { id: uid(), chatId: 'c-rahul', title: 'Bring snacks for Sunday match', priority: 'Medium', due: dstr(1), notes: 'Chips + drinks', done: false, createdAt: t },
        { id: uid(), chatId: 'c-team', title: 'Review Arjun\'s PR', priority: 'High', due: dstr(2), notes: 'Login flow fix', done: false, createdAt: t },
        { id: uid(), chatId: 'c-amma', title: 'Call Amma in the evening', priority: 'Low', due: dstr(0), notes: '', done: true, createdAt: t }
      ];
    })(),
    chats: [
      { id: 'c-amma', name: 'Amma ❤️', color: '#EC407A', folder: 'personal', pinned: true, muted: false, archived: false, locked: false, online: true, typing: false, unread: 2, disappearing: 'off', wallpaper: 'default', members: null, admin: null,
        messages: [msg('c-amma', 'Good morning beta! Did you eat breakfast?', 180), msg('me', 'Good morning Amma! Yes, had idli 😊', 175), msg('c-amma', 'Good. Don\'t skip meals. Call me in the evening.', 170), msg('c-amma', 'Your father is asking about Sunday lunch 🍛', 5)] },
      { id: 'c-rahul', name: 'Rahul Sharma', color: '#29B6F6', folder: 'personal', pinned: false, muted: false, archived: false, locked: false, online: true, typing: false, unread: 1, disappearing: 'off', wallpaper: 'default', members: null, admin: null,
        messages: [msg('me', 'Bro, did you watch the match last night?', 300), msg('c-rahul', 'What a finish! That last over was insane 🔥', 295), msg('me', 'I know right! Let\'s catch the next one together', 290), msg('c-rahul', 'Done. My place, Sunday 7pm. Bring snacks 😄', 12)] },
      { id: 'c-priya', name: 'Priya Nair', color: '#7C4DFF', folder: 'personal', pinned: false, muted: false, archived: false, locked: false, online: false, typing: false, unread: 0, disappearing: '7d', wallpaper: 'lavender', members: null, admin: null,
        messages: [msg('c-priya', 'Hey! The photos from the trip came out so well 📷', 600), msg('me', 'Send me your favourites, I\'ll make an album', 590), msg('c-priya', 'Done! Check your inbox 💕', 580, { ticks: 2 }), msg('me', 'They\'re beautiful! Especially the sunset one 🌅', 570, { ticks: 2 })] },
      { id: 'c-team', name: '🚀 Project Team', color: '#FF7043', folder: 'work', pinned: true, muted: true, archived: false, locked: false, online: true, typing: false, unread: 5, disappearing: 'off', wallpaper: 'default', isGroup: true, admin: 'me', members: ['Rahul Sharma', 'Priya Nair', 'Arjun', 'Sneha', 'You'],
        messages: [msg('Rahul Sharma', 'Sprint review moved to 3pm today', 240), msg('Sneha', 'I\'ve pushed the latest build ✅', 200), msg('Arjun', 'Found a bug in the login flow, fixing now', 150), msg('me', 'Great work team! Let\'s ship it 🚀', 140, { ticks: 2 }), msg('Priya Nair', 'Client loved the demo! 🎉', 20)] },
      { id: 'c-family', name: 'Family Group 👨‍👩‍👧‍👦', color: '#FFA000', folder: 'personal', pinned: false, muted: false, archived: false, locked: false, online: false, typing: false, unread: 0, disappearing: 'off', wallpaper: 'forest', isGroup: true, admin: 'Amma ❤️', members: ['Amma ❤️', 'Nanna', 'Chinnu', 'You'],
        messages: [msg('Nanna', 'Sunday lunch at our place, everyone come!', 900), msg('Chinnu', 'I\'ll bring the dessert 🍰', 880), msg('me', 'Count me in! What time?', 870, { ticks: 2 }), msg('Amma ❤️', '1pm sharp. Don\'t be late 😄', 860)] },
      { id: 'c-arjun', name: 'Arjun Mehta', color: '#00ACC1', folder: 'work', pinned: false, muted: false, archived: false, locked: false, online: true, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', members: null, admin: null,
        messages: [msg('me', 'Can you review my PR when you get a chance?', 1500), msg('c-arjun', 'On it. Left a few comments — mostly looks good 👍', 1440), msg('me', 'Thanks! Addressed them all', 1400, { ticks: 2 })] },
      { id: 'c-sneha', name: 'Sneha Reddy', color: '#EC407A', folder: 'work', pinned: false, muted: false, archived: false, locked: false, online: false, typing: false, unread: 0, disappearing: 'off', wallpaper: 'ocean', members: null, admin: null,
        messages: [msg('c-sneha', 'The design mockups are ready for review 🎨', 3000), msg('me', 'Love the new colour scheme!', 2900, { ticks: 2 })] },
      { id: 'c-ai', name: 'Ksri AI ✨', color: '#25D366', folder: 'personal', pinned: true, muted: false, archived: false, locked: false, online: true, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', isAI: true, members: null, admin: null,
        messages: [msg('c-ai', 'Hi! I\'m Ksri AI 🤖 Ask me anything — I can draft messages, translate text, or help plan your day. Try "tell me a joke"!', 60)] },
      { id: 'c-notes', name: 'Notes to Self 📝', color: '#667781', folder: 'personal', pinned: false, muted: false, archived: false, locked: false, online: false, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', isNotes: true, members: null, admin: null,
        messages: [msg('me', 'Idea: plan a weekend trip to Coorg 🏔️', 4000), msg('me', 'Reminder: renew gym membership this week', 2000)] },
      { id: 'c-old', name: 'Old College Friends', color: '#8D6E63', folder: 'personal', pinned: false, muted: false, archived: true, locked: false, online: false, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', isGroup: true, admin: 'Vikram', members: ['Vikram', 'Divya', 'You'],
        messages: [msg('Vikram', 'Reunion in December, who\'s in?', 10000), msg('me', 'I\'m in! 🎉', 9900, { ticks: 2 })] }
    ],
    statuses: [
      { id: uid(), user: 'Rahul Sharma', color: '#29B6F6', text: 'Match day! 🏏 Who\'s watching tonight?', time: t - 3600000, viewed: false, mine: false },
      { id: uid(), user: 'Priya Nair', color: '#7C4DFF', text: 'Sunset views from the trip 🌅✨', time: t - 7200000, viewed: false, mine: false },
      { id: uid(), user: 'Sneha Reddy', color: '#EC407A', text: 'New design is live! 🎨', time: t - 10800000, viewed: true, mine: false }
    ],
    calls: [
      { id: uid(), name: 'Amma ❤️', color: '#EC407A', type: 'video', dir: 'incoming', time: t - 7200000, duration: '12:34' },
      { id: uid(), name: 'Rahul Sharma', color: '#29B6F6', type: 'voice', dir: 'outgoing', time: t - 20000000, duration: '04:12' },
      { id: uid(), name: '🚀 Project Team', color: '#FF7043', type: 'voice', dir: 'missed', time: t - 86400000, duration: 'Missed' },
      { id: uid(), name: 'Priya Nair', color: '#7C4DFF', type: 'video', dir: 'outgoing', time: t - 172800000, duration: '28:05' }
    ],
    channels: [
      { id: 'ch-tech', name: 'Tech Daily', color: '#29B6F6', followers: '2.4M', followed: true, posts: [{ text: 'AI phones are here — 5 things to know 📱', time: t - 3600000 }, { text: 'The best budget earbuds of 2026 🎧', time: t - 86400000 }] },
      { id: 'ch-cricket', name: 'Cricket Central', color: '#25D366', followers: '8.1M', followed: true, posts: [{ text: 'India wins by 6 wickets! 🏏🎉', time: t - 7200000 }] },
      { id: 'ch-food', name: 'Foodie Finds', color: '#FF7043', followers: '1.2M', followed: false, posts: [{ text: '10-minute biryani recipe 🍛', time: t - 5000000 }] },
      { id: 'ch-news', name: 'Morning Brief', color: '#7C4DFF', followers: '5.6M', followed: false, posts: [{ text: 'Top headlines this morning 📰', time: t - 2000000 }] }
    ],
    broadcasts: [
      { id: uid(), name: 'Weekend Plans', recipients: ['Rahul Sharma', 'Priya Nair', 'Arjun Mehta'], time: t - 86400000 }
    ]
  };
}

var state = load() || seed();
if (!state.chats) state = seed();
if (!Array.isArray(state.events)) state.events = [];
if (!Array.isArray(state.todos)) state.todos = [];
if (!Array.isArray(state.reminders)) state.reminders = [];
if (!Array.isArray(state.notes)) state.notes = [];
/* Migration: notes saved before target dates existed get the new fields. */
state.notes.forEach(function (n) { if (n.targetDate === undefined) n.targetDate = ''; if (n.targetTime === undefined) n.targetTime = '09:00'; });
if (!state.settings) state.settings = {};
if (state.settings.screenShare === undefined) state.settings.screenShare = true;
var screenShare = { active: false, demo: false, stream: null, seconds: 0, timerInt: null, sharer: null, isGroup: false, chatName: null };
var calView = (function () { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth(), selected: null }; })();
var todoFilter = 'all';
var todoChatFilter = 'all';
var activeReminderId = null;
var currentChatId = null;
var replyToId = null;
var pendingOtp = DEMO_OTP;
var pendingMethod = 'phone';
var pendingValue = '';
var avatarColorIdx = 0;
var mediaRecorder = null, voiceChunks = [], voiceTimer = null, voiceStart = 0;
var callTimerInt = null, callSeconds = 0;
var longPressTimer = null;

/* ---------- REAL MODE (Firebase) globals ---------- */
/* firebaseReady: true once www/firebase.js has initialised with a REAL
   config (false in demo mode, and false if the CDN is unreachable).
   realMode: true only when signed in with Firebase — demo chats are
   hidden and real Firestore chats take over. Demo mode is the fallback
   whenever either flag is false. */
var firebaseReady = false;
var realMode = false;
var realOtpPending = false;
var realUserCache = {};   /* uid -> Firestore user profile */
var realChatsUnsub = null;
var realMsgsUnsub = null;
var realMsgsChatId = null;
var realTypingSent = false;

/* ---------- persistence helpers ---------- */
function getChat(id) { return state.chats.find(function (c) { return c.id === id; }); }
function lastMsg(chat) { var ms = chat.messages.filter(function (m) { return !m.deleted; }); return ms[ms.length - 1]; }
function applyTheme() { document.body.classList.toggle('dark', state.settings.theme === 'dark'); }
function applyFontSize() { var s = state.settings.fontSize; document.documentElement.style.fontSize = s === 'small' ? '14px' : s === 'large' ? '18px' : '16px'; }

/* ---------- AUTH: phone OR email + OTP ---------- */
function setMethod(m) {
  pendingMethod = m;
  document.querySelectorAll('.method-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.method === m); });
  $('id-label').textContent = m === 'phone' ? 'Phone number' : 'Email address';
  var inp = $('id-input');
  inp.type = m === 'phone' ? 'tel' : 'email';
  inp.placeholder = m === 'phone' ? '+91 98765 43210' : 'you@example.com';
  inp.value = '';
  refreshAuthModeUI();
}
function showStep(id) {
  ['step-method', 'step-otp', 'step-profile'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); });
  /* The demo code is fixed, so (re)stamp it on every step — it can never
     be blank or stale, whatever path the user took to get here. */
  var a = $('demo-otp'); if (a) a.textContent = DEMO_OTP;
  var b = $('demo-otp-signup'); if (b) b.textContent = DEMO_OTP;
}
function normalizePhone(v) {
  /* Turn anything the user types into a valid E.164 number for Firebase.
     Firebase rejects a bare 10-digit number ('+9876543210' has no country
     code) so no SMS is ever sent — that was the "OTP has not sent" bug.
     Indian numbers: bare 10 digits -> +91 added; 0-prefixed 11 digits ->
     drop the 0, then +91; 12 digits starting with 91 -> +91... */
  var digits = String(v || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return '+91' + digits;
  if (digits.length === 11 && digits.charAt(0) === '0') return '+91' + digits.slice(1);
  if (digits.length === 12 && digits.indexOf('91') === 0) return '+' + digits;
  return '+' + digits;
}
function sendOtp() {
  /* BULLETPROOF: this function must ALWAYS advance to the OTP screen.
     No early `return` before showStep('step-otp') is allowed — that was
     the bug. Empty/invalid input is normalised to a demo value instead
     of blocking, and the reason is shown visibly on the OTP screen. */
  try {
    var v = ($('id-input').value || '').trim();
    var err = $('id-error');
    var note = '';
    if (!v) {
      /* Empty field: auto-fill a demo value and continue. */
      if (pendingMethod === 'phone') { pendingValue = DEMO_PHONE; $('id-input').value = DEMO_PHONE; }
      else { pendingValue = DEMO_EMAIL; $('id-input').value = DEMO_EMAIL; }
      note = 'No number/email entered — using demo ' + pendingMethod + ' ' + pendingValue + ' so you can continue.';
    } else if (v.indexOf('@') !== -1) {
      /* Auto-detect: an email typed while Phone was selected (and vice versa). */
      pendingMethod = 'email';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { pendingValue = v.toLowerCase(); }
      else { pendingValue = DEMO_EMAIL; note = 'That email looks incomplete — using demo email ' + DEMO_EMAIL + ' so you can continue.'; }
    } else if (pendingMethod === 'email') {
      var digitsOnly = v.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && v.indexOf('.') === -1) {
        pendingMethod = 'phone'; pendingValue = normalizePhone(v);
        note = 'That looks like a phone number, so we switched to Phone.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        pendingValue = DEMO_EMAIL;
        note = 'That email looks incomplete — using demo email ' + DEMO_EMAIL + ' so you can continue.';
      } else { pendingValue = v.toLowerCase(); }
    } else {
      var digits = v.replace(/\D/g, '');
      if (digits.length < 10) {
        pendingValue = DEMO_PHONE;
        note = 'That number is too short (' + digits.length + ' digits, need 10) — using demo number ' + DEMO_PHONE + ' so you can continue.';
      } else {
        pendingValue = normalizePhone(v);
        if (digits.length === 10) note = 'Added the India code +91 — sending to ' + pendingValue + '.';
      }
    }
    if (err) { err.textContent = ''; err.classList.add('hidden'); }
  } catch (e) {
    /* Even if anything above throws, never stay stuck on this screen. */
    if (!pendingValue) pendingValue = DEMO_PHONE;
    note = 'Something went wrong reading that — using demo ' + pendingValue + ' so you can continue.';
  }
  pendingOtp = DEMO_OTP;
  $('otp-target').textContent = pendingValue;
  var d = $('demo-otp'); if (d) d.textContent = DEMO_OTP;
  $('otp-input').value = '';
  /* REAL MODE: send a REAL SMS code instead of using the demo code.
     The request is async — the screen advances immediately and the note
     below is updated when Firebase answers. A failure never blocks the
     screen; the real error text is shown in the note. */
  if (firebaseReady && pendingMethod === 'phone' && window.KsriFirebase) {
    realOtpPending = true;
    note = 'Sending a real SMS code to ' + pendingValue + '…';
    window.KsriFirebase.sendPhoneCode(pendingValue).then(function () {
      var n2 = $('otp-note');
      if (n2) { n2.textContent = 'Real SMS code sent to ' + pendingValue + '. Enter the 6-digit code from the SMS.'; n2.classList.remove('hidden'); }
      toast('SMS code sent — check your phone');
    }).catch(function (err) {
      realOtpPending = false;
      var n2 = $('otp-note');
      if (n2) { n2.textContent = 'Could not send the SMS: ' + window.KsriFirebase.friendlyAuthError(err) + ' The demo code 123456 does NOT work in real mode.'; n2.classList.remove('hidden'); }
      toast('SMS failed — see the note above');
    });
  }
  var onote = $('otp-note');
  if (onote) {
    if (firebaseReady && pendingMethod === 'phone') {
      onote.textContent = note || ('Real SMS code sent to ' + pendingValue + '. Enter the 6-digit code from the SMS.');
    } else {
      onote.textContent = (note ? note + ' ' : '') + 'Demo OTP is 123456 — tap "Use demo code 123456" below. No SMS is sent.';
    }
    onote.classList.remove('hidden');
  }
  showStep('step-otp');
  toast((firebaseReady && pendingMethod === 'phone') ? 'Sending SMS code…' : 'Demo OTP is 123456');
}
function resendOtp() {
  /* REAL MODE: actually re-send a real SMS to the same number. (It used
     to just say the demo code again, so a failed first send could never
     be retried.) Demo mode keeps the old behaviour — fixed code. */
  if (firebaseReady && pendingMethod === 'phone' && window.KsriFirebase && pendingValue) {
    realOtpPending = true;
    var n0 = $('otp-note');
    if (n0) { n0.textContent = 'Sending a real SMS code to ' + pendingValue + '…'; n0.classList.remove('hidden'); }
    window.KsriFirebase.sendPhoneCode(pendingValue).then(function () {
      var n2 = $('otp-note');
      if (n2) { n2.textContent = 'Real SMS code sent to ' + pendingValue + '. Enter the 6-digit code from the SMS.'; n2.classList.remove('hidden'); }
      toast('SMS code sent — check your phone');
    }).catch(function (err) {
      realOtpPending = false;
      var n2 = $('otp-note');
      if (n2) { n2.textContent = 'Could not send the SMS: ' + window.KsriFirebase.friendlyAuthError(err); n2.classList.remove('hidden'); }
      toast('SMS failed — see the note above');
    });
    return;
  }
  pendingOtp = DEMO_OTP;
  var d = $('demo-otp'); if (d) d.textContent = DEMO_OTP;
  toast('Demo OTP is still 123456');
}
function backToMethod() { showStep('step-method'); }
function fillDemoOtp() {
  $('otp-input').value = DEMO_OTP;
  verifyOtp();
}
function otpTyped() {
  /* Auto-verify as soon as 6 digits are typed/pasted. */
  var v = ($('otp-input').value || '').replace(/\D/g, '');
  if (v.length >= 6) { $('otp-input').value = v.slice(0, 6); verifyOtp(); }
}
function continueDemoAccount() {
  /* One-tap bypass: never get stuck on OTP. Uses whatever was typed,
     or a demo value, then goes straight to profile setup. */
  var v = ($('id-input') && $('id-input').value || '').trim();
  if (!pendingValue) {
    if (v) pendingValue = v.indexOf('@') !== -1 ? v.toLowerCase() : normalizePhone(v);
    else pendingValue = pendingMethod === 'phone' ? DEMO_PHONE : DEMO_EMAIL;
  }
  pendingOtp = DEMO_OTP;
  var name = $('profile-name');
  if (name && !name.value.trim()) name.value = 'Hadhvik';
  showStep('step-profile');
  toast('Demo account — no OTP needed');
}
function skipOtp() { continueDemoAccount(); }
function enterAfterSignIn() {
  /* After a successful sign-in: RETURNING users (a Firestore profile
     already exists for this uid) go straight into the app — they must
     NOT see profile setup again. Only FIRST-TIME users (no profile yet)
     see the profile screen. This was the "email login always asks for
     creating account after logout" bug: both sign-in paths used to go
     to step-profile unconditionally. */
  var fbUser = window.KsriFirebase && window.KsriFirebase.user;
  if (!fbUser) { showStep('step-method'); return; }
  window.KsriFirebase.getUserProfile(fbUser.uid).then(function (p) {
    if (p) {
      state.user = {
        name: p.displayName || 'Ksri user', bio: p.bio || '',
        color: p.avatarColor || '#25D366',
        method: p.phone ? 'phone' : 'email', value: p.phone || p.email || '',
        uid: fbUser.uid, joinedAt: (state.user && state.user.joinedAt) || Date.now()
      };
      save();
      enterApp();
      toast('Welcome back, ' + state.user.name + '!');
    } else {
      showStep('step-profile');
      var n = $('profile-name'); if (n) n.focus();
    }
  }).catch(function () {
    /* Profile lookup failed (e.g. offline) — go in if we already have
       this user locally, otherwise fall back to profile setup. */
    if (state.user && state.user.uid === fbUser.uid) enterApp();
    else showStep('step-profile');
  });
}
function verifyOtp() {
  var v = ($('otp-input').value || '').trim().replace(/\D/g, '');
  var err = $('otp-error');
  /* REAL MODE: verify the REAL SMS code with Firebase. The demo code
     NEVER works here — if no SMS was requested, refuse outright instead
     of falling through to the demo check below. */
  if (firebaseReady && pendingMethod === 'phone' && window.KsriFirebase) {
    if (!window.KsriFirebase.hasPendingPhoneCode()) {
      if (err) { err.textContent = 'No SMS code was requested — tap "Send OTP" first. If sending failed, see the note above.'; err.classList.remove('hidden'); }
      return;
    }
    if (v.length !== 6) {
      if (err) { err.textContent = 'Enter the 6-digit code from the SMS.'; err.classList.remove('hidden'); }
      return;
    }
    window.KsriFirebase.confirmPhoneCode(v).then(function () {
      realOtpPending = false;
      if (err) err.classList.add('hidden');
      enterAfterSignIn();
    }).catch(function (e) {
      if (err) { err.textContent = window.KsriFirebase.friendlyAuthError(e); err.classList.remove('hidden'); }
    });
    return;
  }
  /* Accept the fixed demo code and whatever code is currently shown —
     they are the same by construction, so the shown code can never fail. */
  if (v === DEMO_OTP || v === String(pendingOtp).replace(/\D/g, '')) {
    if (err) err.classList.add('hidden');
    showStep('step-profile');
    $('profile-name').focus();
    return;
  }
  if (err) {
    err.textContent = 'Incorrect code. The demo code is 123456 — tap "Use demo code 123456" above to fill it.';
    err.classList.remove('hidden');
  }
  toast('Demo OTP is 123456');
}
function cycleAvatarColor() {
  avatarColorIdx = (avatarColorIdx + 1) % AVATAR_COLORS.length;
  var av = $('profile-avatar');
  av.style.background = AVATAR_COLORS[avatarColorIdx];
  var name = $('profile-name').value.trim();
  av.textContent = name ? initials(name) : 'K';
}
function finishRegistration() {
  var name = $('profile-name').value.trim();
  var bio = $('profile-bio').value.trim() || "Hey there! I'm using Ksri.";
  var err = $('profile-error');
  if (!name) { err.textContent = 'Please enter a display name.'; err.classList.remove('hidden'); return; }
  err.classList.add('hidden');
  state.user = { name: name, bio: bio, color: AVATAR_COLORS[avatarColorIdx], method: pendingMethod, value: pendingValue, joinedAt: Date.now() };
  /* REAL MODE: save the profile to Firestore so other real users can
     find this person by phone/email, and chats can show their name. */
  if (firebaseReady && window.KsriFirebase && window.KsriFirebase.user) {
    state.user.uid = window.KsriFirebase.user.uid;
    window.KsriFirebase.upsertUserProfile({
      displayName: name, bio: bio, avatarColor: AVATAR_COLORS[avatarColorIdx],
      phone: pendingMethod === 'phone' ? pendingValue : '',
      email: pendingMethod === 'email' ? pendingValue : ''
    });
  }
  save();
  enterApp();
  toast('Welcome to Ksri, ' + name + '! 🎉');
}
function logout() {
  if (!confirm('Log out? Your chats stay on this device, but you will need to sign in again.')) return;
  /* REAL MODE: sign out of Firebase and stop live listeners. */
  if (firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.signOut();
    stopRealChats();
    stopRealMessages();
    realMode = false;
  }
  state.user = null;
  save();
  $('app-screen').classList.add('hidden');
  $('chat-screen').classList.add('hidden');
  $('auth-screen').classList.remove('hidden');
  showStep('step-method');
  updateModeBadge();
}
function enterApp() {
  $('auth-screen').classList.add('hidden');
  $('chat-screen').classList.add('hidden');
  $('app-screen').classList.remove('hidden');
  /* REAL MODE: subscribe to the user's real Firestore chats. */
  if (firebaseReady && window.KsriFirebase && window.KsriFirebase.user) {
    realMode = true;
    startRealChats();
  }
  applyTheme(); applyFontSize();
  renderAll();
}

/* ---------- TABS & CHAT LIST ---------- */
function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
  ['chats', 'status', 'calls', 'channels', 'calendar', 'tasks', 'settings'].forEach(function (t) { $('tab-' + t).classList.toggle('hidden', t !== tab); });
  if (tab === 'status') renderStatus();
  if (tab === 'calls') renderCalls();
  if (tab === 'channels') renderChannels();
  if (tab === 'calendar') renderCalendar();
  if (tab === 'tasks') renderTodos();
  if (tab === 'settings') renderSettings();
  if (tab === 'chats') renderChats();
}
function setFolder(f) {
  state.folder = f; save();
  document.querySelectorAll('#folder-chips .chip').forEach(function (c) { c.classList.toggle('active', c.dataset.folder === f); });
  renderChats();
}
function toggleGlobalSearch() {
  var el = $('global-search');
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) $('global-search-input').focus();
  else { $('global-search-input').value = ''; renderChats(); }
}
function toggleArchived() { state.showArchived = !state.showArchived; save(); renderChats(); }

function chatMatches(chat, q) {
  if (!q) return true;
  q = q.toLowerCase();
  if (chat.name.toLowerCase().indexOf(q) !== -1) return true;
  return chat.messages.some(function (m) { return (m.text || '').toLowerCase().indexOf(q) !== -1; });
}
function renderChats() {
  var q = ($('global-search-input') ? $('global-search-input').value.trim() : '');
  var list = state.chats.filter(function (c) { return !c.archived; });
  /* REAL MODE: seeded demo contacts are not real people — hide them and
     show only real Firestore chats (plus the local Ksri AI / Notes chats). */
  if (realMode) list = list.filter(function (c) { return c.real || c.isAI || c.isNotes; });
  if (state.folder === 'unread') list = list.filter(function (c) { return c.unread > 0; });
  if (state.folder === 'personal') list = list.filter(function (c) { return c.folder === 'personal'; });
  if (state.folder === 'work') list = list.filter(function (c) { return c.folder === 'work'; });
  if (state.folder === 'groups') list = list.filter(function (c) { return c.isGroup; });
  if (q) list = list.filter(function (c) { return chatMatches(c, q); });
  list = list.slice().sort(function (a, b) {
    if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    var la = lastMsg(a), lb = lastMsg(b);
    return (lb ? lb.time : 0) - (la ? la.time : 0);
  });
  var locked = list.filter(function (c) { return c.locked; });
  var visible = list.filter(function (c) { return !c.locked || state.unlocked; });

  var ls = $('locked-section');
  if (locked.length && !state.unlocked) {
    ls.innerHTML = '<div class="row" onclick="unlockLockedChats()"><div class="avatar" style="background:#667781">🔒</div>' +
      '<div class="body"><div class="top"><span class="name">Locked chats</span></div>' +
      '<div class="sub">' + locked.length + ' locked chat' + (locked.length > 1 ? 's' : '') + ' · tap to unlock with PIN</div></div></div>';
  } else if (locked.length && state.unlocked) {
    ls.innerHTML = '<div class="row" onclick="lockAllChats()"><div class="avatar" style="background:#667781">🔓</div>' +
      '<div class="body"><div class="top"><span class="name">Locked chats (unlocked)</span></div>' +
      '<div class="sub">Tap to lock again</div></div></div>';
  } else ls.innerHTML = '';

  $('chat-list').innerHTML = visible.map(chatRow).join('') ||
    '<p class="muted center" style="padding:30px 16px">No chats here yet.<br>Tap ＋ to start a new chat.</p>';

  var arch = state.chats.filter(function (c) { return c.archived; });
  if (realMode) arch = arch.filter(function (c) { return c.real || c.isAI || c.isNotes; });
  $('archived-row').textContent = arch.length ? ('📦 Archived (' + arch.length + ')' + (state.showArchived ? ' ▾' : ' ▸')) : '';
  $('archived-list').classList.toggle('hidden', !state.showArchived);
  $('archived-list').innerHTML = arch.map(chatRow).join('');

  var totalUnread = state.chats.reduce(function (s, c) { return s + (c.archived ? 0 : c.unread); }, 0);
  var badge = $('nav-unread');
  badge.textContent = totalUnread;
  badge.classList.toggle('hidden', totalUnread === 0);
}
function chatRow(c) {
  var lm = lastMsg(c);
  var preview = '';
  if (lm) {
    if (lm.deleted) preview = '🚫 This message was deleted';
    else if (lm.type === 'image') preview = '📷 Photo';
    else if (lm.type === 'voice') preview = '🎙️ Voice message';
    else if (lm.type === 'poll') preview = '📊 ' + esc(lm.poll.question);
    else preview = (c.isGroup && lm.from !== 'me' ? esc(lm.from) + ': ' : '') + esc(lm.text);
  }
  var ticks = '';
  if (lm && lm.from === 'me' && !lm.deleted) {
    ticks = lm.ticks >= 2 ? '<span class="ticks">✓✓</span>' : '<span class="ticks" style="color:var(--muted)">✓</span>';
  }
  return '<div class="row" onclick="openChat(\'' + c.id + '\')" oncontextmenu="event.preventDefault();openChatMenuFor(\'' + c.id + '\')">' +
    '<div class="avatar" style="background:' + c.color + '">' + esc(initials(c.name)) +
    (c.online ? '<span class="dot"></span>' : '') + '</div>' +
    '<div class="body"><div class="top"><span class="name">' + esc(c.name) + (c.pinned ? ' 📌' : '') + (c.locked ? ' 🔒' : '') + '</span>' +
    '<span class="time">' + (lm ? nowTime(lm.time) : '') + '</span></div>' +
    '<div class="sub">' + ticks + preview + '</div></div>' +
    '<div class="meta">' + (c.unread > 0 ? '<span class="unread-badge">' + c.unread + '</span>' : '') +
    (c.muted ? '<span class="mute-ico">🔇</span>' : '') + '</div></div>';
}
function renderAll() { renderChats(); renderStatus(); renderCalls(); renderChannels(); renderCalendar(); renderTodos(); renderSettings(); updateMyAvatar(); updatePlannerBadges(); }
function updateMyAvatar() {
  if (!state.user) return;
  var ini = initials(state.user.name);
  ['my-status-avatar', 'settings-avatar'].forEach(function (id) { var el = $(id); if (el) { el.textContent = ini; el.style.background = state.user.color; } });
  $('settings-name').textContent = state.user.name;
  $('settings-bio').textContent = state.user.bio;
  $('settings-id').textContent = (state.user.method === 'phone' ? '📱 ' : '✉️ ') + state.user.value;
}

/* ---------- OPEN / CLOSE CHAT ---------- */
function openChat(id) {
  var chat = getChat(id);
  if (!chat) return;
  if (chat.locked && !state.unlocked) { unlockLockedChats(); return; }
  currentChatId = id;
  chat.unread = 0;
  save();
  /* REAL MODE: mark the other person's messages read, and subscribe to
     this chat's messages live. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.markChatRead(id);
    startRealMessages(id);
  }
  $('app-screen').classList.add('hidden');
  $('chat-screen').classList.remove('hidden');
  $('chat-avatar').textContent = initials(chat.name);
  $('chat-avatar').style.background = chat.color;
  $('chat-name').textContent = chat.name;
  updateChatStatus(chat);
  var wp = WALLPAPERS.find(function (w) { return w.id === chat.wallpaper; }) || WALLPAPERS[0];
  $('chat-screen').style.background = wp.css;
  var note = $('chat-wallpaper-note');
  if (chat.wallpaper !== 'default') { note.textContent = 'Wallpaper: ' + wp.label + ' · Disappearing messages: ' + (chat.disappearing === 'off' ? 'off' : chat.disappearing); note.classList.remove('hidden'); }
  else note.classList.add('hidden');
  renderMessages();
  renderSmartReplies();
  renderChats();
}
function updateChatStatus(chat) {
  if (chat.typing) { $('chat-status').textContent = 'typing…'; return; }
  if (chat.isAI) { $('chat-status').textContent = 'AI assistant · always online'; return; }
  if (chat.isNotes) { $('chat-status').textContent = 'Your personal space'; return; }
  $('chat-status').textContent = chat.online ? 'online' : 'last seen ' + nowTime(Date.now() - 3600000);
}
function closeChat() {
  stopRealMessages();
  currentChatId = null;
  $('chat-screen').classList.add('hidden');
  $('app-screen').classList.remove('hidden');
  renderChats();
}

/* ---------- MESSAGES ---------- */
function renderMessages() {
  var chat = getChat(currentChatId);
  if (!chat) return;
  var q = ($('in-chat-search-input') ? $('in-chat-search-input').value.trim().toLowerCase() : '');
  var box = $('messages');
  var html = '<div class="day-chip">🔒 Messages are end-to-end encrypted' + ((firebaseReady && realMode) ? '' : ' (demo)') + ' · ' + todayLabel(Date.now()) + '</div>';
  var shown = 0;
  chat.messages.forEach(function (m) {
    if (m._hiddenForMe) return; /* deleted for me in a real chat */
    if (q && (m.text || '').toLowerCase().indexOf(q) === -1) return;
    shown++;
    html += messageHtml(chat, m);
  });
  if (chat.typing) html += '<div class="typing"><i></i><i></i><i></i></div>';
  if (q && shown === 0) html += '<p class="muted center" style="padding:20px">No messages match "' + esc(q) + '"</p>';
  box.innerHTML = html;
  box.scrollTop = box.scrollHeight;
  updateChatStatus(chat);
}
function messageHtml(chat, m) {
  var out = m.from === 'me';
  var cls = 'msg ' + (out ? 'out' : 'in') + (m.deleted ? ' deleted' : '');
  var sender = '';
  if (!out && chat.isGroup && m.from !== 'Ksri AI') sender = '<div class="sender" style="color:' + (chat.color || '#128C7E') + '">' + esc(m.from) + '</div>';
  var reply = '';
  if (m.replyTo) {
    var orig = chat.messages.find(function (x) { return x.id === m.replyTo; });
    if (orig) reply = '<div class="reply-box">↩ ' + esc(orig.from === 'me' ? 'You' : orig.from) + ': ' + esc(orig.text || '[media]').slice(0, 60) + '</div>';
  }
  var body = '';
  if (m.deleted) body = '🚫 This message was deleted';
  else if (m.type === 'image') body = '<img class="attached" src="' + m.dataUrl + '" alt="photo">' + esc(m.text || '');
  else if (m.type === 'voice') body = '<div class="voice-note">🎙️ <audio controls src="' + m.dataUrl + '"></audio></div>' +
    '<button class="btn-link" style="text-align:left;margin:4px 0 0" onclick="transcribeVoice(\'' + m.id + '\')">📝 Transcribe</button>' +
    (m.transcript ? '<div class="translated">“' + esc(m.transcript) + '”</div>' : '');
  else if (m.type === 'poll') body = pollHtml(chat, m);
  else body = esc(m.text);
  if (m.translated) body += '<div class="translated">🌐 ' + esc(LANG_NAMES[m.translated.lang]) + ': ' + esc(m.translated.text) + '</div>';
  if (m.edited && !m.deleted) body += ' <span class="muted tiny">(edited)</span>';
  var reacts = '';
  var keys = Object.keys(m.reactions || {});
  if (keys.length) reacts = '<span class="reactions">' + keys.join(' ') + '</span>';
  var ticks = '';
  if (out && !m.deleted) ticks = '<span class="ticks">' + (m.ticks >= 2 ? '✓✓' : '✓') + '</span>';
  var star = m.starred ? '<span class="star">★</span> ' : '';
  return '<div class="' + cls + '" data-mid="' + m.id + '" onclick="onMsgTap(\'' + m.id + '\',event)" oncontextmenu="event.preventDefault();openMessageMenu(\'' + m.id + '\')">' +
    sender + reply + body + reacts +
    '<span class="meta">' + star + nowTime(m.time) + ' ' + ticks + '</span></div>';
}
function pollHtml(chat, m) {
  var total = m.poll.options.reduce(function (s, o) { return s + o.votes; }, 0) || 1;
  var html = '<b>📊 ' + esc(m.poll.question) + '</b>';
  m.poll.options.forEach(function (o, i) {
    var pct = Math.round(o.votes / total * 100);
    html += '<div class="poll-opt' + (m.poll.voted === i ? ' voted' : '') + '" onclick="event.stopPropagation();votePoll(\'' + m.id + '\',' + i + ')">' +
      esc(o.text) + ' · ' + o.votes + ' vote' + (o.votes === 1 ? '' : 's') + ' (' + pct + '%)' +
      '<div class="poll-bar"><i style="width:' + pct + '%"></i></div></div>';
  });
  html += '<div class="tiny muted">Tap an option to vote · ' + total + ' total votes</div>';
  return html;
}
function votePoll(mid, idx) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m || !m.poll) return;
  if (m.poll.voted === idx) { m.poll.options[idx].votes = Math.max(0, m.poll.options[idx].votes - 1); m.poll.voted = null; }
  else {
    if (m.poll.voted !== null) m.poll.options[m.poll.voted].votes = Math.max(0, m.poll.options[m.poll.voted].votes - 1);
    m.poll.options[idx].votes++; m.poll.voted = idx;
  }
  /* REAL MODE: poll votes are shared — write the counts to Firestore.
     (Your own vote highlight is local; counts are what sync.) */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.updateMessageFields(chat.id, mid, { poll: m.poll }).catch(function () { /* best effort */ });
  }
  save(); renderMessages();
}
function onMsgTap(mid, ev) {
  // Single tap: toggle reaction bar on long-press only; plain tap does nothing.
  if (ev && ev.detail === 2) openMessageMenu(mid);
}
function renderSmartReplies() {
  var chat = getChat(currentChatId);
  var bar = $('smart-replies');
  if (!chat || chat.isNotes) { bar.innerHTML = ''; return; }
  bar.innerHTML = '<span class="tiny muted" style="align-self:center">✨ AI:</span>' +
    SMART_REPLIES.slice(0, 4).map(function (r) { return '<button onclick="sendSmartReply(\'' + esc(r).replace(/'/g, "\\'") + '\')">' + esc(r) + '</button>'; }).join('');
}
function sendSmartReply(text) { $('msg-input').value = text; sendMessage(); }
function onTypingInput() {
  var v = $('msg-input').value.trim();
  $('send-btn').style.display = v ? 'block' : 'none';
  $('mic-btn').style.display = v ? 'none' : 'block';
  /* REAL MODE: broadcast a typing indicator (only when it changes, so we
     do not write to Firestore on every keystroke). */
  if (firebaseReady && realMode && currentChatId) {
    var c = getChat(currentChatId);
    if (c && c.real && realTypingSent !== !!v) {
      realTypingSent = !!v;
      window.KsriFirebase.setTyping(currentChatId, !!v);
    }
  }
}

/* ---------- SEND + SIMULATED REPLIES ---------- */
function pushMessage(chat, m) {
  chat.messages.push(m);
  if (chat.disappearing !== 'off') {
    var hours = chat.disappearing === '24h' ? 24 : 168;
    setTimeout(function () {
      var i = chat.messages.indexOf(m);
      if (i !== -1) { chat.messages.splice(i, 1); save(); if (currentChatId === chat.id) renderMessages(); }
    }, hours * 3600000);
  }
}
function sendMessage() {
  var chat = getChat(currentChatId); if (!chat) return;
  var input = $('msg-input');
  var text = input.value.trim();
  if (!text) return;
  /* REAL MODE: send to Firestore — the live listener echoes it back, and
     the other phone receives it. No simulated reply in real chats. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    var extra = {};
    if (replyToId) extra.replyTo = replyToId;
    input.value = ''; replyToId = null; $('reply-preview').classList.add('hidden');
    onTypingInput();
    realTypingSent = false;
    window.KsriFirebase.sendChatMessage(chat.id, text, extra).catch(function (e) {
      toast('Could not send: ' + (e && e.message ? e.message : e));
    });
    return;
  }
  var m = msg('me', text, 0, { ticks: 1, replyTo: replyToId || undefined });
  pushMessage(chat, m);
  input.value = ''; replyToId = null; $('reply-preview').classList.add('hidden');
  onTypingInput();
  save(); renderMessages();
  setTimeout(function () { m.ticks = 2; save(); if (currentChatId === chat.id) renderMessages(); }, 900);
  if (chat.isNotes) return;
  if (chat.isAI) { setTimeout(function () { aiReply(chat, text); }, 1200); return; }
  setTimeout(function () {
    chat.typing = true; save(); if (currentChatId === chat.id) renderMessages();
    setTimeout(function () {
      chat.typing = false;
      var reply = CANNED[Math.floor(Math.random() * CANNED.length)];
      pushMessage(chat, msg(chat.isGroup ? (chat.members ? chat.members[0] : chat.name) : chat.id, reply, 0, { ticks: 2 }));
      save(); if (currentChatId === chat.id) { renderMessages(); renderSmartReplies(); }
      renderChats();
    }, 1400 + Math.random() * 800);
  }, 1200 + Math.random() * 800);
}
function aiReply(chat, text) {
  var low = text.toLowerCase();
  var found = null;
  AI_ANSWERS.forEach(function (a) { if (!found && a.k.some(function (k) { return low.indexOf(k) !== -1; })) found = a; });
  var ans = found ? found.a : 'Here\'s a thought on "' + text + '": a short, friendly reply could be "Thanks for sharing! I\'ll get back to you on this soon 👍". Want me to draft a longer version, translate it, or turn it into a poll?';
  chat.typing = true; save(); renderMessages();
  setTimeout(function () {
    chat.typing = false;
    pushMessage(chat, msg(chat.id, ans, 0, { ticks: 2 }));
    save(); renderMessages(); renderChats();
  }, 1100);
}

/* ---------- EMOJI / ATTACH / VOICE ---------- */
function toggleEmojiPicker() {
  var p = $('emoji-picker');
  if (p.classList.contains('hidden')) {
    p.innerHTML = EMOJIS.map(function (e) { return '<button onclick="insertEmoji(\'' + e + '\')">' + e + '</button>'; }).join('');
    p.classList.remove('hidden');
  } else p.classList.add('hidden');
}
function insertEmoji(e) { var i = $('msg-input'); i.value += e; i.focus(); onTypingInput(); }
function attachPhoto(ev) {
  var chat = getChat(currentChatId); if (!chat) return;
  var file = ev.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function () {
    /* REAL MODE: photos go into the Firestore message (size limit ~1 MB
       per document — larger photos are refused with a clear message). */
    if (chat.real && firebaseReady && window.KsriFirebase) {
      if (String(reader.result).length > 700000) { toast('Photo too large for a real chat message (Firestore limit ~1 MB). Try a smaller photo.'); return; }
      window.KsriFirebase.sendChatMessage(chat.id, '📷 Photo', { type: 'image', dataUrl: reader.result }).catch(function (e) {
        toast('Could not send photo: ' + (e && e.message ? e.message : e));
      });
      save(); renderChats();
      toast('Photo sent');
      return;
    }
    pushMessage(chat, msg('me', '📷 Photo', 0, { type: 'image', dataUrl: reader.result, ticks: 1 }));
    save(); renderMessages(); renderChats();
    toast('Photo sent');
  };
  reader.readAsDataURL(file);
  ev.target.value = '';
}
function startVoiceNote(ev) {
  ev.preventDefault();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('Microphone not available in this browser — try the installed app'); return; }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    voiceChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function (e) { voiceChunks.push(e.data); };
    mediaRecorder.start();
    voiceStart = Date.now();
    $('mic-btn').classList.add('recording');
    toast('Recording… release to send');
  }).catch(function () { toast('Microphone permission denied'); });
}
function stopVoiceNote(ev) {
  if (ev) ev.preventDefault();
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
  var chat = getChat(currentChatId);
  mediaRecorder.onstop = function () {
    var blob = new Blob(voiceChunks, { type: 'audio/webm' });
    var reader = new FileReader();
    reader.onload = function () {
      if (chat) {
        /* REAL MODE: voice note as a Firestore message (same ~1 MB guard). */
        if (chat.real && firebaseReady && window.KsriFirebase) {
          if (String(reader.result).length > 700000) { toast('Voice note too long for a real chat message. Keep it short.'); return; }
          window.KsriFirebase.sendChatMessage(chat.id, '🎙️ Voice message (' + Math.round((Date.now() - voiceStart) / 1000) + 's)', { type: 'voice', dataUrl: reader.result }).catch(function (e) {
            toast('Could not send voice note: ' + (e && e.message ? e.message : e));
          });
          save(); renderChats();
          return;
        }
        pushMessage(chat, msg('me', '🎙️ Voice message (' + Math.round((Date.now() - voiceStart) / 1000) + 's)', 0, { type: 'voice', dataUrl: reader.result, ticks: 1 })); save(); renderMessages(); renderChats();
      }
    };
    reader.readAsDataURL(blob);
    mediaRecorder.stream.getTracks().forEach(function (t) { t.stop(); });
  };
  mediaRecorder.stop();
  $('mic-btn').classList.remove('recording');
}
function transcribeVoice(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var samples = ['Hey, just checking in — call me when you\'re free!', 'Don\'t forget the meeting at 3pm today.', 'Sounds good, see you on Sunday!'];
  m.transcript = samples[Math.floor(Math.random() * samples.length)] + ' (auto-transcript, demo)';
  save(); renderMessages();
  toast('Transcript ready');
}

/* ---------- MESSAGE MENU: reply / react / edit / delete / forward / star / copy / translate / remind ---------- */
function openMessageMenu(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var own = m.from === 'me';
  var html = '<h3>Message options</h3><div style="font-size:26px;display:flex;gap:12px;justify-content:center;padding:8px 0">' +
    REACTIONS.map(function (r) { return '<button onclick="reactToMessage(\'' + mid + '\',\'' + r + '\')">' + r + '</button>'; }).join('') + '</div>' +
    '<button class="menu-item" onclick="setReply(\'' + mid + '\')">↩ Reply</button>' +
    '<button class="menu-item" onclick="copyMessage(\'' + mid + '\')">📋 Copy text</button>' +
    '<button class="menu-item" onclick="starMessage(\'' + mid + '\')">' + (m.starred ? '☆ Unstar message' : '⭐ Star message') + '</button>' +
    '<button class="menu-item" onclick="translateMessage(\'' + mid + '\')">🌐 Translate…</button>' +
    '<button class="menu-item" onclick="remindMessage(\'' + mid + '\')">⏰ Remind me about this</button>' +
    '<button class="menu-item" onclick="forwardMessage(\'' + mid + '\')">➡️ Forward…</button>' +
    (own && !m.deleted ? '<button class="menu-item" onclick="editMessage(\'' + mid + '\')">✏️ Edit message</button>' : '') +
    (own && !m.deleted ? '<button class="menu-item danger" onclick="deleteMessage(\'' + mid + '\',true)">🗑️ Delete for everyone</button>' : '') +
    '<button class="menu-item danger" onclick="deleteMessage(\'' + mid + '\',false)">🗑️ Delete for me</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function reactToMessage(mid, emoji) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  m.reactions = m.reactions || {};
  if (m.reactions[emoji]) delete m.reactions[emoji]; else m.reactions[emoji] = true;
  /* REAL MODE: reactions sync to the other phone. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.reactToMessage(chat.id, mid, emoji, !!m.reactions[emoji]).catch(function () { /* best effort */ });
  }
  save(); closeModal(); renderMessages();
}
function setReply(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  replyToId = mid; closeModal();
  var rp = $('reply-preview');
  rp.innerHTML = '<span>↩ Replying to <b>' + esc(m.from === 'me' ? 'yourself' : m.from) + '</b>: ' + esc((m.text || '[media]').slice(0, 50)) + '</span><button onclick="cancelReply()">✕</button>';
  rp.classList.remove('hidden');
  $('msg-input').focus();
}
function cancelReply() { replyToId = null; $('reply-preview').classList.add('hidden'); }
function copyMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var text = m.text || '';
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Copied'); });
  else toast('Copied: ' + text.slice(0, 40));
  closeModal();
}
function starMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  m.starred = !m.starred; save(); closeModal(); renderMessages();
  toast(m.starred ? 'Starred ⭐ — find it in Settings → Starred messages' : 'Unstarred');
}
function translateMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var html = '<h3>Translate message</h3><p class="muted small">"' + esc((m.text || '').slice(0, 80)) + '"</p>' +
    Object.keys(LANG_NAMES).map(function (lang) {
      return '<button class="menu-item" onclick="doTranslate(\'' + mid + '\',\'' + lang + '\')">🌐 ' + LANG_NAMES[lang] + '</button>';
    }).join('') +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function doTranslate(mid, lang) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var dict = TRANSLATE_DICT[lang];
  var low = (m.text || '').toLowerCase().trim();
  var out = dict[low];
  if (!out) {
    var words = low.split(/\s+/).map(function (w) { return dict[w] || w; });
    out = words.join(' ');
    if (out === low) out = '[' + LANG_NAMES[lang] + ' translation unavailable offline for this text — demo dictionary covers common phrases like "hello", "good morning", "thank you"]';
  }
  m.translated = { lang: lang, text: out };
  save(); closeModal(); renderMessages();
  toast('Translated to ' + LANG_NAMES[lang]);
}
function remindMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var html = '<h3>Remind me about this</h3><p class="muted small">"' + esc((m.text || '').slice(0, 80)) + '"</p>' +
    [[5, 'In 5 minutes'], [30, 'In 30 minutes'], [60, 'In 1 hour'], [1440, 'Tomorrow']].map(function (r) {
      return '<button class="menu-item" onclick="setReminder(\'' + mid + '\',' + r[0] + ')">⏰ ' + r[1] + '</button>';
    }).join('') + '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function setReminder(mid, mins) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  state.reminders.push({ id: uid(), chatId: chat.id, msgId: mid, at: Date.now() + mins * 60000, text: m.text || '[media]', fired: false });
  save(); closeModal(); toast('Reminder set ⏰');
}
function forwardMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var html = '<h3>Forward to…</h3>' + state.chats.filter(function (c) { return c.id !== chat.id; }).map(function (c) {
    return '<button class="menu-item" onclick="doForward(\'' + mid + '\',\'' + c.id + '\')">' + esc(c.name) + '</button>';
  }).join('') + '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function doForward(mid, targetId) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var target = getChat(targetId); if (!target) return;
  /* REAL MODE: forward into a real chat via Firestore. */
  if (target.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.sendChatMessage(target.id, '↪ Forwarded: ' + (m.text || ''), {}).catch(function (e) {
      toast('Could not forward: ' + (e && e.message ? e.message : e));
    });
    save(); closeModal(); toast('Forwarded to ' + target.name);
    renderChats();
    return;
  }
  var copy = JSON.parse(JSON.stringify(m));
  copy.id = uid(); copy.from = 'me'; copy.time = Date.now(); copy.ticks = 1; copy.text = '↪ Forwarded: ' + (copy.text || '');
  target.messages.push(copy);
  save(); closeModal(); toast('Forwarded to ' + target.name);
  renderChats();
}
function editMessage(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m || m.from !== 'me') return;
  closeModal();
  var html = '<h3>Edit message</h3><input id="edit-input" type="text" value="' + esc(m.text) + '">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveEdit(\'' + mid + '\')">Save</button></div>';
  openModal(html);
  setTimeout(function () { $('edit-input').focus(); }, 50);
}
function saveEdit(mid) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  var v = $('edit-input').value.trim();
  if (!v) return;
  m.text = v; m.edited = true;
  /* REAL MODE: the edit syncs to the other phone. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.editMessage(chat.id, mid, v).catch(function () { /* best effort */ });
  }
  save(); closeModal(); renderMessages();
}
function deleteMessage(mid, forEveryone) {
  var chat = getChat(currentChatId); if (!chat) return;
  var m = chat.messages.find(function (x) { return x.id === mid; }); if (!m) return;
  /* REAL MODE: delete-for-everyone / delete-for-me sync via Firestore. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    if (forEveryone && m.from === 'me') {
      window.KsriFirebase.deleteMessageForEveryone(chat.id, mid).catch(function () { /* best effort */ });
      m.deleted = true; m.text = '';
    } else {
      window.KsriFirebase.deleteMessageForMe(chat.id, mid).catch(function () { /* best effort */ });
      chat.messages = chat.messages.filter(function (x) { return x.id !== mid; });
    }
    save(); closeModal(); renderMessages(); renderChats();
    return;
  }
  if (forEveryone && m.from === 'me') { m.deleted = true; m.text = ''; }
  else { chat.messages = chat.messages.filter(function (x) { return x.id !== mid; }); }
  save(); closeModal(); renderMessages(); renderChats();
}

/* ---------- SCHEDULED MESSAGES & POLLS ---------- */
function openSchedulePicker() {
  var chat = getChat(currentChatId); if (!chat) return;
  var html = '<h3>🕒 Schedule a message</h3><p class="muted small">To ' + esc(chat.name) + ' — it will send automatically at the chosen time, even if you close the app (checked on next open).</p>' +
    '<label>Message</label><input id="sched-text" type="text" placeholder="Type your message…">' +
    '<label>Send at</label><input id="sched-time" type="datetime-local">' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    [[5, '+5 min'], [60, '+1 hour'], [1440, 'Tomorrow 9am']].map(function (p) {
      return '<button class="chip" onclick="quickSchedule(' + p[0] + ')">' + p[1] + '</button>';
    }).join('') + '</div>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveScheduled()">Schedule</button></div>' +
    '<h3 style="margin-top:18px">Scheduled messages</h3><div id="sched-list">' + scheduledListHtml() + '</div>';
  openModal(html);
}
function scheduledListHtml() {
  if (!state.scheduled.length) return '<p class="muted small">None scheduled yet.</p>';
  return state.scheduled.map(function (s) {
    var c = getChat(s.chatId);
    return '<div class="settings-row"><div><div class="lbl">🕒 ' + esc(s.text) + '</div><div class="val">To ' + esc(c ? c.name : '?') + ' · ' + new Date(s.at).toLocaleString() + '</div></div>' +
      '<button class="btn-link" style="width:auto;margin:0" onclick="cancelScheduled(\'' + s.id + '\')">Cancel</button></div>';
  }).join('');
}
function quickSchedule(mins) {
  var d = new Date(Date.now() + mins * 60000);
  var pad = function (n) { return ('0' + n).slice(-2); };
  $('sched-time').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function saveScheduled() {
  var chat = getChat(currentChatId); if (!chat) return;
  var text = $('sched-text').value.trim();
  var at = new Date($('sched-time').value).getTime();
  if (!text) { toast('Type a message first'); return; }
  if (!at || at <= Date.now()) { toast('Pick a future time'); return; }
  state.scheduled.push({ id: uid(), chatId: chat.id, text: text, at: at });
  save(); closeModal(); toast('Message scheduled 🕒');
  checkScheduled();
}
function cancelScheduled(id) {
  state.scheduled = state.scheduled.filter(function (s) { return s.id !== id; });
  save(); closeModal(); toast('Scheduled message cancelled');
}
function checkScheduled() {
  var now = Date.now(), due = state.scheduled.filter(function (s) { return s.at <= now; });
  if (!due.length) return;
  due.forEach(function (s) {
    var chat = getChat(s.chatId);
    if (chat) {
      /* REAL MODE: scheduled message goes to Firestore. */
      if (chat.real && firebaseReady && window.KsriFirebase) { window.KsriFirebase.sendChatMessage(chat.id, s.text, {}).catch(function () { /* best effort */ }); }
      else { pushMessage(chat, msg('me', s.text, 0, { ticks: 2 })); }
    }
  });
  state.scheduled = state.scheduled.filter(function (s) { return s.at > now; });
  save();
  if (currentChatId) renderMessages();
  renderChats();
  toast('📬 ' + due.length + ' scheduled message' + (due.length > 1 ? 's' : '') + ' sent');
}
function openPollCreator() {
  var chat = getChat(currentChatId); if (!chat) return;
  var html = '<h3>📊 Create a poll</h3><label>Question</label><input id="poll-q" type="text" placeholder="e.g. Where should we meet?">' +
    '<label>Option 1</label><input class="poll-opt-input" type="text" placeholder="Option 1">' +
    '<label>Option 2</label><input class="poll-opt-input" type="text" placeholder="Option 2">' +
    '<label>Option 3 (optional)</label><input class="poll-opt-input" type="text" placeholder="Option 3">' +
    '<label>Option 4 (optional)</label><input class="poll-opt-input" type="text" placeholder="Option 4">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="savePoll()">Post poll</button></div>';
  openModal(html);
}
function savePoll() {
  var chat = getChat(currentChatId); if (!chat) return;
  var q = $('poll-q').value.trim();
  var opts = Array.prototype.slice.call(document.querySelectorAll('.poll-opt-input')).map(function (i) { return i.value.trim(); }).filter(Boolean);
  if (!q || opts.length < 2) { toast('Add a question and at least 2 options'); return; }
  /* REAL MODE: poll goes to Firestore so everyone in the chat can vote. */
  if (chat.real && firebaseReady && window.KsriFirebase) {
    window.KsriFirebase.sendChatMessage(chat.id, '', { type: 'poll', poll: { question: q, options: opts.map(function (o) { return { text: o, votes: 0 }; }), voted: null } }).catch(function (e) {
      toast('Could not post poll: ' + (e && e.message ? e.message : e));
    });
    save(); closeModal(); renderChats();
    return;
  }
  pushMessage(chat, msg('me', '', 0, { type: 'poll', poll: { question: q, options: opts.map(function (o) { return { text: o, votes: 0 }; }), voted: null }, ticks: 1 }));
  save(); closeModal(); renderMessages(); renderChats();
}

/* ---------- MODAL ---------- */
function openModal(html) { $('modal-card').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); $('modal-card').innerHTML = ''; }
$('modal').addEventListener('click', function (e) { if (e.target === $('modal')) closeModal(); });

/* ---------- CHAT MENU / INFO / LOCK / WALLPAPER ---------- */
function openChatMenu() { if (currentChatId) openChatMenuFor(currentChatId); }
function openChatMenuFor(id) {
  var chat = getChat(id); if (!chat) return;
  var html = '<h3>' + esc(chat.name) + '</h3>' +
    '<button class="menu-item" onclick="closeModal();startChatScreenShare()">🖥️ Share screen in call</button>' +
    '<button class="menu-item" onclick="closeModal();openEventCreator(\'' + id + '\')">📅 Add calendar event</button>' +
    '<button class="menu-item" onclick="closeModal();openTodoCreator(\'' + id + '\')">✅ Add a task for this chat</button>' +
    '<button class="menu-item" onclick="closeModal();switchTab(\'calendar\')">📅 Open calendar</button>' +
    '<button class="menu-item" onclick="closeModal();switchTab(\'tasks\')">✅ Open to-do list</button>' +
    '<button class="menu-item" onclick="togglePin(\'' + id + '\')">' + (chat.pinned ? '📌 Unpin chat' : '📌 Pin chat') + '</button>' +
    '<button class="menu-item" onclick="toggleMute(\'' + id + '\')">' + (chat.muted ? '🔔 Unmute notifications' : '🔇 Mute notifications') + '</button>' +
    '<button class="menu-item" onclick="toggleArchive(\'' + id + '\')">' + (chat.archived ? '📤 Unarchive chat' : '📦 Archive chat') + '</button>' +
    '<button class="menu-item" onclick="toggleLock(\'' + id + '\')">' + (chat.locked ? '🔓 Unlock chat' : '🔒 Lock chat (PIN)') + '</button>' +
    '<button class="menu-item" onclick="markRead(\'' + id + '\')">✓✓ Mark as read</button>' +
    '<button class="menu-item" onclick="openWallpaperPicker(\'' + id + '\')">🎨 Chat wallpaper &amp; theme</button>' +
    '<button class="menu-item" onclick="openDisappearing(\'' + id + '\')">⏳ Disappearing messages: ' + (chat.disappearing === 'off' ? 'Off' : chat.disappearing) + '</button>' +
    '<button class="menu-item" onclick="openChatInfoFor(\'' + id + '\')">ℹ️ ' + (chat.isGroup ? 'Group info' : 'Contact info') + '</button>' +
    '<button class="menu-item" onclick="viewStarred()">⭐ View starred messages</button>' +
    '<button class="menu-item danger" onclick="deleteChat(\'' + id + '\')">🗑️ Delete chat</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function togglePin(id) { var c = getChat(id); c.pinned = !c.pinned; save(); closeModal(); renderChats(); toast(c.pinned ? 'Chat pinned 📌' : 'Chat unpinned'); }
function toggleMute(id) { var c = getChat(id); c.muted = !c.muted; save(); closeModal(); renderChats(); toast(c.muted ? 'Notifications muted 🔇' : 'Notifications on 🔔'); }
function toggleArchive(id) {
  var c = getChat(id); c.archived = !c.archived; save(); closeModal();
  if (currentChatId === id && c.archived) closeChat();
  renderChats(); toast(c.archived ? 'Chat archived 📦' : 'Chat unarchived');
}
function markRead(id) { var c = getChat(id); c.unread = 0; save(); closeModal(); renderChats(); toast('Marked as read'); }
function deleteChat(id) {
  if (!confirm('Delete this chat? This cannot be undone.')) return;
  state.chats = state.chats.filter(function (c) { return c.id !== id; });
  save(); closeModal();
  if (currentChatId === id) closeChat();
  renderChats(); toast('Chat deleted');
}
function toggleLock(id) {
  var c = getChat(id); if (!c) return;
  if (c.locked) { c.locked = false; save(); closeModal(); renderChats(); toast('Chat unlocked 🔓'); return; }
  if (!state.lockPin) {
    openModal('<h3>Set a Chat Lock PIN</h3><p class="muted small">Choose a 4-digit PIN. Locked chats hide behind this PIN.</p>' +
      '<input id="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="4-digit PIN">' +
      '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
      '<button class="btn-primary" onclick="setLockPin(\'' + id + '\')">Set PIN &amp; lock</button></div>');
    return;
  }
  c.locked = true; save(); closeModal(); renderChats(); toast('Chat locked 🔒');
}
function setLockPin(id) {
  var pin = $('pin-input').value.trim();
  if (!/^\d{4}$/.test(pin)) { toast('Enter exactly 4 digits'); return; }
  state.lockPin = pin;
  var c = getChat(id); if (c) c.locked = true;
  save(); closeModal(); renderChats(); toast('PIN set — chat locked 🔒');
}
function unlockLockedChats() {
  openModal('<h3>🔒 Locked chats</h3><p class="muted small">Enter your 4-digit Chat Lock PIN.</p>' +
    '<input id="unlock-pin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="checkUnlockPin()">Unlock</button></div>');
  setTimeout(function () { var el = $('unlock-pin'); if (el) el.focus(); }, 50);
}
function checkUnlockPin() {
  if ($('unlock-pin').value.trim() === state.lockPin) { state.unlocked = true; save(); closeModal(); renderChats(); toast('Locked chats unlocked 🔓'); }
  else toast('Wrong PIN');
}
function lockAllChats() { state.unlocked = false; save(); renderChats(); toast('Locked chats hidden 🔒'); }
function openWallpaperPicker(id) {
  var chat = getChat(id); if (!chat) return;
  var html = '<h3>🎨 Chat wallpaper</h3><p class="muted small">Applies to ' + esc(chat.name) + ' only.</p><div>' +
    WALLPAPERS.map(function (w) {
      return '<div class="wallpaper-opt' + (chat.wallpaper === w.id ? ' sel' : '') + '" style="background:' + w.css + '" title="' + w.label + '" onclick="setWallpaper(\'' + id + '\',\'' + w.id + '\')"></div>';
    }).join('') + '</div><p class="muted small" style="margin-top:8px">Tip: also change the whole app theme in Settings → Appearance.</p>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Done</button>';
  openModal(html);
}
function setWallpaper(id, wpId) {
  var chat = getChat(id); if (!chat) return;
  chat.wallpaper = wpId; save();
  if (currentChatId === id) { var w = WALLPAPERS.find(function (x) { return x.id === wpId; }); $('chat-screen').style.background = w.css; }
  closeModal(); toast('Wallpaper updated 🎨');
}
function openDisappearing(id) {
  var chat = getChat(id); if (!chat) return;
  var html = '<h3>⏳ Disappearing messages</h3><p class="muted small">New messages in this chat disappear after the chosen time.</p>' +
    [['off', 'Off'], ['24h', '24 hours'], ['7d', '7 days']].map(function (o) {
      return '<button class="menu-item" onclick="setDisappearing(\'' + id + '\',\'' + o[0] + '\')">' + (chat.disappearing === o[0] ? '✓ ' : '') + o[1] + '</button>';
    }).join('') + '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function setDisappearing(id, val) {
  var chat = getChat(id); if (!chat) return;
  chat.disappearing = val; save(); closeModal(); renderMessages();
  toast(val === 'off' ? 'Disappearing messages off' : 'Messages will disappear after ' + val);
}
function openChatInfo() { if (currentChatId) openChatInfoFor(currentChatId); }
function openChatInfoFor(id) {
  var chat = getChat(id); if (!chat) return;
  var media = chat.messages.filter(function (m) { return m.type === 'image'; }).length;
  var html = '<h3>' + esc(chat.name) + '</h3>' +
    '<div style="display:flex;gap:12px;align-items:center;margin:10px 0"><div class="avatar lg" style="background:' + chat.color + '">' + esc(initials(chat.name)) + '</div>' +
    '<div><div class="muted small">' + (chat.isGroup ? 'Group · ' + (chat.members || []).length + ' members' : (chat.online ? 'online' : 'last seen recently')) + '</div>' +
    '<div class="muted small">📷 ' + media + ' photos shared · ⭐ ' + chat.messages.filter(function (m) { return m.starred; }).length + ' starred</div></div></div>' +
    (chat.isGroup ? '<h3 style="margin-top:10px">Members</h3>' + (chat.members || []).map(function (m) {
      return '<div class="settings-row"><div><div class="lbl">' + esc(m) + '</div><div class="val">' + (chat.admin === m ? '👑 Group admin' : 'Member') + '</div></div>' +
        (chat.admin === 'me' && m !== 'You' ? '<button class="btn-link" style="width:auto;margin:0" onclick="removeMember(\'' + id + '\',\'' + esc(m).replace(/'/g, "\\'") + '\')">Remove</button>' : '') + '</div>';
    }).join('') + '<button class="btn-outline" onclick="addMember(\'' + id + '\')">＋ Add member</button>' : '') +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>';
  openModal(html);
}
function addMember(id) {
  var chat = getChat(id); if (!chat) return;
  var names = ['Vikram', 'Divya', 'Kiran', 'Ananya', 'Rohan'];
  var avail = names.filter(function (n) { return (chat.members || []).indexOf(n) === -1; });
  if (!avail.length) { toast('No more contacts to add'); return; }
  chat.members.push(avail[0]);
  pushMessage(chat, msg('me', 'Added ' + avail[0] + ' to the group', 0, { ticks: 2 }));
  save(); closeModal(); renderMessages(); toast(avail[0] + ' added to the group');
}
function removeMember(id, name) {
  var chat = getChat(id); if (!chat) return;
  chat.members = (chat.members || []).filter(function (m) { return m !== name; });
  pushMessage(chat, msg('me', 'Removed ' + name + ' from the group', 0, { ticks: 2 }));
  save(); closeModal(); renderMessages(); toast(name + ' removed');
}
function openInChatSearch() { $('in-chat-search').classList.remove('hidden'); $('in-chat-search-input').focus(); }
function closeInChatSearch() { $('in-chat-search').classList.add('hidden'); $('in-chat-search-input').value = ''; renderMessages(); }

/* ---------- NEW CHAT / GROUP / BROADCAST ---------- */
function openNewChat() {
  /* REAL MODE: find a real person by phone/email instead of the demo list. */
  if (firebaseReady && realMode) { openRealNewChat(); return; }
  var existing = ['Amma ❤️', 'Rahul Sharma', 'Priya Nair', 'Arjun Mehta', 'Sneha Reddy', 'Vikram', 'Divya', 'Kiran'];
  var html = '<h3>New chat</h3>' +
    existing.map(function (n) {
      return '<button class="menu-item" onclick="startChatWith(\'' + esc(n).replace(/'/g, "\\'") + '\')">' + esc(n) + '</button>';
    }).join('') +
    '<button class="menu-item" onclick="createGroupFlow()">👥 New group</button>' +
    '<button class="menu-item" onclick="createBroadcastFlow()">📣 New broadcast list</button>' +
    '<button class="menu-item" onclick="openNotesChat()">📝 Notes to Self</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function startChatWith(name) {
  var found = state.chats.find(function (c) { return c.name === name && !c.isGroup; });
  if (!found) {
    found = { id: 'c-' + uid(), name: name, color: AVATAR_COLORS[state.chats.length % AVATAR_COLORS.length], folder: 'personal', pinned: false, muted: false, archived: false, locked: false, online: Math.random() > 0.5, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', members: null, admin: null, messages: [msg('c-new', 'Hi ' + (state.user ? state.user.name : '') + '! 👋', 1)] };
    state.chats.unshift(found);
  }
  save(); closeModal(); renderChats(); openChat(found.id);
}
function openNotesChat() { closeModal(); var n = state.chats.find(function (c) { return c.isNotes; }); if (n) openChat(n.id); }
function createGroupFlow() {
  /* REAL MODE: pick members from real Ksri users, not the demo list. */
  if (firebaseReady && realMode) {
    openModal('<h3>👥 Create group</h3><p class="muted small">Loading Ksri users…</p>');
    window.KsriFirebase.listUsers(30).then(function (users) {
      var others = users.filter(function (u) { return u.uid !== myUid(); });
      var html = '<h3>👥 Create group</h3><label>Group name</label><input id="group-name" type="text" placeholder="e.g. Weekend Trip">' +
        '<label>Pick members</label>' + (others.length ? others.map(function (u) {
          return '<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" class="group-member" value="' + esc(u.uid) + '" style="width:auto"> ' + esc(u.displayName || u.phone || u.email || '') + '</label>';
        }).join('') : '<p class="muted small">No other Ksri users found yet — invite someone to sign up first.</p>') +
        '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
        '<button class="btn-primary" onclick="saveGroup()">Create group</button></div>';
      openModal(html);
    }).catch(function (e) {
      openModal('<h3>👥 Create group</h3><p class="error">Could not load users: ' + esc(e && e.message ? e.message : e) + '</p><button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>');
    });
    return;
  }
  var people = ['Rahul Sharma', 'Priya Nair', 'Arjun Mehta', 'Sneha Reddy', 'Vikram', 'Divya'];
  var html = '<h3>👥 Create group</h3><label>Group name</label><input id="group-name" type="text" placeholder="e.g. Weekend Trip">' +
    '<label>Pick members</label>' + people.map(function (p) {
      return '<label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" class="group-member" value="' + esc(p) + '" style="width:auto"> ' + esc(p) + '</label>';
    }).join('') +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveGroup()">Create group</button></div>';
  openModal(html);
}
function saveGroup() {
  /* REAL MODE: create the group in Firestore with real user IDs. */
  if (firebaseReady && realMode) {
    var rname = $('group-name').value.trim();
    var rmembers = Array.prototype.slice.call(document.querySelectorAll('.group-member:checked')).map(function (c) { return c.value; });
    if (!rname) { toast('Give the group a name'); return; }
    if (!rmembers.length) { toast('Pick at least one member'); return; }
    window.KsriFirebase.createGroup(rname, rmembers).then(function (chatId) {
      var doc = { _id: chatId, participants: [myUid()].concat(rmembers), type: 'group', name: rname, lastMessage: 'Group created 🎉', typing: {} };
      upsertRealChat(doc);
      save(); closeModal(); renderChats(); openChat(chatId);
      toast('Group "' + rname + '" created 👥');
    }).catch(function (e) { toast('Could not create group: ' + (e && e.message ? e.message : e)); });
    return;
  }
  var name = $('group-name').value.trim();
  var members = Array.prototype.slice.call(document.querySelectorAll('.group-member:checked')).map(function (c) { return c.value; });
  if (!name) { toast('Give the group a name'); return; }
  if (!members.length) { toast('Pick at least one member'); return; }
  members.push('You');
  var g = { id: 'c-' + uid(), name: name, color: AVATAR_COLORS[state.chats.length % AVATAR_COLORS.length], folder: 'groups', pinned: false, muted: false, archived: false, locked: false, online: true, typing: false, unread: 0, disappearing: 'off', wallpaper: 'default', isGroup: true, admin: 'me', members: members, messages: [msg('me', 'Welcome to ' + name + '! 🎉', 0, { ticks: 2 })] };
  state.chats.unshift(g);
  save(); closeModal(); renderChats(); openChat(g.id);
  toast('Group "' + name + '" created 👥');
}
function createBroadcastFlow() {
  var people = ['Rahul Sharma', 'Priya Nair', 'Arjun Mehta'];
  state.broadcasts.push({ id: uid(), name: 'Broadcast ' + (state.broadcasts.length + 1), recipients: people, time: Date.now() });
  save(); closeModal();
  toast('📣 Broadcast list created — send one message to ' + people.join(', ') + '. Use any chat\'s Forward to send to them.');
}
function openAppMenu() {
  var html = '<h3>Ksri</h3>' +
    '<button class="menu-item" onclick="closeModal();createGroupFlow()">👥 New group</button>' +
    '<button class="menu-item" onclick="closeModal();createBroadcastFlow()">📣 New broadcast</button>' +
    '<button class="menu-item" onclick="closeModal();viewStarred()">⭐ Starred messages</button>' +
    '<button class="menu-item" onclick="closeModal();openNotesPanel()">📝 Notes &amp; reminders</button>' +
    '<button class="menu-item" onclick="closeModal();switchTab(\'settings\')">⚙️ Settings</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function viewStarred() {
  closeModal();
  var items = [];
  state.chats.forEach(function (c) { c.messages.forEach(function (m) { if (m.starred) items.push({ chat: c.name, m: m }); }); });
  var html = '<h3>⭐ Starred messages</h3>' + (items.length ? items.map(function (it) {
    return '<div class="settings-row"><div><div class="lbl">' + esc(it.chat) + '</div><div class="val">' + esc(it.m.text || '[media]') + ' · ' + nowTime(it.m.time) + '</div></div></div>';
  }).join('') : '<p class="muted">No starred messages yet. Long-press any message → Star.</p>') +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>';
  openModal(html);
}
/* ----- Notes with a target date picked from the calendar ----- */
function sortedNotes() {
  /* Open notes with a target date first (earliest first), then open notes
     without a target date (newest first), then done notes. */
  return state.notes.slice().sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    var at = a.targetDate ? noteDateTime(a).getTime() : Infinity;
    var bt = b.targetDate ? noteDateTime(b).getTime() : Infinity;
    if (at !== bt) return at - bt;
    return b.time - a.time;
  });
}
function openNotesPanel() {
  var html = '<h3>📝 Notes &amp; reminders</h3>' +
    '<p class="muted small">Give a note a target date and Ksri reminds you <b>1 day before</b> it.</p>' +
    sortedNotes().map(function (n) {
      var overdue = isNoteOverdue(n);
      var targetLine = n.targetDate
        ? '<div class="val note-target">🎯 ' + esc(fmtTargetDate(n)) + (overdue ? ' · <b style="color:var(--danger)">Overdue</b>' : '') + '</div>' +
          (n.done ? '' : '<div class="val">🔔 Reminds 1 day before · ' + new Date(noteDateTime(n).getTime() - 24 * 3600000).toLocaleString() + '</div>')
        : '<div class="val">No target date — tap Edit to add one from the calendar</div>';
      return '<div class="settings-row"><div><div class="lbl" style="' + (n.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(n.text) + '</div>' +
        '<div class="val">' + todayLabel(n.time) + '</div>' + targetLine + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">' +
        '<button class="btn-link" style="width:auto;margin:0" onclick="toggleNote(\'' + n.id + '\')">' + (n.done ? '↩ Undo' : '✓ Done') + '</button>' +
        '<button class="btn-link" style="width:auto;margin:0" onclick="openNoteCreator(\'' + n.id + '\')">✏️ Edit</button>' +
        '<button class="btn-link" style="width:auto;margin:0;color:var(--danger)" onclick="deleteNote(\'' + n.id + '\')">Delete</button></div></div>';
    }).join('') +
    '<label>Add a note</label><input id="note-input" type="text" placeholder="Type a note…">' +
    '<label>Target date (optional) — pick it from the calendar</label>' +
    '<div class="note-date-row"><input id="note-target-date" type="date" value="">' +
    '<input id="note-target-time" type="time" value="09:00"></div>' +
    '<button class="btn-outline" style="width:100%" onclick="toggleNoteCalendar(\'note-target-date\',\'note-cal-wrap\',\'note-cal-grid\',\'note-cal-label\')">📅 Pick from calendar</button>' +
    '<div id="note-cal-wrap" class="mini-cal-wrap hidden"><div class="cal-nav"><button class="cal-nav-btn" onclick="changeNoteCalMonth(-1)">‹</button><b id="note-cal-label"></b><button class="cal-nav-btn" onclick="changeNoteCalMonth(1)">›</button></div><div id="note-cal-grid" class="cal-grid"></div></div>' +
    '<p class="muted small">🔔 With a target date, Ksri reminds you 1 day before — in-app banner + notification. Without one, no reminder.</p>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Close</button>' +
    '<button class="btn-primary" onclick="addNote()">Add note</button></div>' +
    '<h3 style="margin-top:16px">⏰ Reminders</h3>' +
    (state.reminders.length ? state.reminders.map(function (r) {
      return '<div class="settings-row"><div><div class="lbl">⏰ ' + esc(r.text) + '</div><div class="val">' + new Date(r.at).toLocaleString() + (r.fired ? ' · ✅ fired' : '') + '</div></div></div>';
    }).join('') : '<p class="muted small">No reminders. Long-press a message → Remind me.</p>');
  openModal(html);
}
function upsertNote(text, targetDate, targetTime, editId) {
  var n = editId ? state.notes.find(function (x) { return x.id === editId; }) : null;
  if (n) {
    n.text = text; n.targetDate = targetDate || ''; n.targetTime = targetTime || '09:00';
  } else {
    n = { id: uid(), text: text, time: Date.now(), done: false, targetDate: targetDate || '', targetTime: targetTime || '09:00' };
    state.notes.unshift(n);
  }
  syncReminderForNote(n);
  save();
  return n;
}
function addNote() {
  var v = $('note-input') ? $('note-input').value.trim() : '';
  if (!v) { toast('Write the note first'); return; }
  var targetDate = $('note-target-date') ? $('note-target-date').value : '';
  var targetTime = $('note-target-time') ? $('note-target-time').value : '09:00';
  upsertNote(v, targetDate, targetTime, null);
  if (targetDate) requestNotificationPermission();
  save(); closeModal(); openNotesPanel();
  toast(targetDate ? 'Note added 📝 — reminder set for 1 day before' : 'Note added 📝');
}
function openNoteCreator(editId) {
  var n = editId ? state.notes.find(function (x) { return x.id === editId; }) : null;
  var html = '<h3>📝 ' + (n ? 'Edit note' : 'Add a note') + '</h3>' +
    '<p class="muted small">Pick a target date from the calendar and Ksri reminds you <b>1 day before</b> it.</p>' +
    (n ? '<input id="note-edit-id" type="hidden" value="' + n.id + '">' : '') +
    '<label>Note</label><input id="note-edit-text" type="text" placeholder="Type a note…" value="' + (n ? esc(n.text) : '') + '">' +
    '<label>Target date (optional)</label>' +
    '<div class="note-date-row"><input id="note-target-date" type="date" value="' + (n ? esc(n.targetDate || '') : '') + '">' +
    '<input id="note-target-time" type="time" value="' + (n ? esc(n.targetTime || '09:00') : '09:00') + '"></div>' +
    '<button class="btn-outline" style="width:100%" onclick="toggleNoteCalendar(\'note-target-date\',\'note-cal-wrap\',\'note-cal-grid\',\'note-cal-label\')">📅 Pick from calendar</button>' +
    '<div id="note-cal-wrap" class="mini-cal-wrap hidden"><div class="cal-nav"><button class="cal-nav-btn" onclick="changeNoteCalMonth(-1)">‹</button><b id="note-cal-label"></b><button class="cal-nav-btn" onclick="changeNoteCalMonth(1)">›</button></div><div id="note-cal-grid" class="cal-grid"></div></div>' +
    '<button class="btn-link" onclick="clearNoteTargetDate()">Clear target date (no reminder)</button>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal();openNotesPanel()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveNote()">Save note</button></div>';
  openModal(html);
}
function saveNote() {
  var v = $('note-edit-text') ? $('note-edit-text').value.trim() : '';
  if (!v) { toast('Write the note first'); return; }
  var targetDate = $('note-target-date') ? $('note-target-date').value : '';
  var targetTime = $('note-target-time') ? $('note-target-time').value : '09:00';
  var idEl = $('note-edit-id');
  upsertNote(v, targetDate, targetTime, idEl ? idEl.value : null);
  if (targetDate) requestNotificationPermission();
  save(); closeModal(); openNotesPanel();
  toast(targetDate ? 'Note saved 📝 — reminder set for 1 day before' : 'Note saved 📝');
}
function clearNoteTargetDate() {
  var d = $('note-target-date'); if (d) d.value = '';
  var t = $('note-target-time'); if (t) t.value = '09:00';
  toast('Target date cleared — this note will not remind you');
}
function editNote(id) { openNoteCreator(id); }
function deleteNote(id) {
  if (!confirm('Delete this note and its 1-day-before reminder?')) return;
  state.notes = state.notes.filter(function (x) { return x.id !== id; });
  removeRemindersFor('note', id);
  save(); closeModal(); openNotesPanel(); toast('Note deleted');
}
function toggleNote(id) {
  var n = state.notes.find(function (x) { return x.id === id; }); if (!n) return;
  n.done = !n.done;
  if (n.done) removeRemindersFor('note', id); else syncReminderForNote(n);
  save(); closeModal(); openNotesPanel();
  toast(n.done ? 'Note done ✅' : 'Note reopened');
}
/* Mini calendar picker for a note's target date. Reuses the planner's
   month-grid styling; picking a day fills the date input next to it. */
var noteCalView = (function () { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })();
var noteCalCtx = null;
function toggleNoteCalendar(inputId, wrapId, gridId, labelId) {
  var wrap = $(wrapId); if (!wrap) return;
  if (!wrap.classList.contains('hidden')) { wrap.classList.add('hidden'); return; }
  noteCalCtx = { inputId: inputId, wrapId: wrapId, gridId: gridId, labelId: labelId };
  var cur = $(inputId) && $(inputId).value ? new Date($(inputId).value + 'T12:00:00') : new Date();
  noteCalView = { y: cur.getFullYear(), m: cur.getMonth() };
  wrap.classList.remove('hidden');
  renderNoteCalendar();
}
function renderNoteCalendar() {
  if (!noteCalCtx) return;
  var grid = $(noteCalCtx.gridId); if (!grid) return;
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var label = $(noteCalCtx.labelId); if (label) label.textContent = months[noteCalView.m] + ' ' + noteCalView.y;
  var first = new Date(noteCalView.y, noteCalView.m, 1).getDay();
  var days = new Date(noteCalView.y, noteCalView.m + 1, 0).getDate();
  var today = fmtDateStr(new Date());
  var picked = $(noteCalCtx.inputId) ? $(noteCalCtx.inputId).value : '';
  var withItems = {};
  state.events.forEach(function (e) { withItems[e.date] = true; });
  state.notes.forEach(function (n) { if (n.targetDate) withItems[n.targetDate] = true; });
  var html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) { return '<div class="cal-weekday">' + d + '</div>'; }).join('');
  for (var i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
  for (var d = 1; d <= days; d++) {
    var ds = noteCalView.y + '-' + ('0' + (noteCalView.m + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
    html += '<div class="cal-day' + (ds === today ? ' today' : '') + (ds === picked ? ' selected' : '') + '" onclick="selectNoteCalDay(\'' + ds + '\')">' +
      '<span>' + d + '</span>' + (withItems[ds] ? '<i class="cal-dot"></i>' : '') + '</div>';
  }
  grid.innerHTML = html;
}
function changeNoteCalMonth(delta) {
  noteCalView.m += delta;
  if (noteCalView.m < 0) { noteCalView.m = 11; noteCalView.y--; }
  if (noteCalView.m > 11) { noteCalView.m = 0; noteCalView.y++; }
  renderNoteCalendar();
}
function selectNoteCalDay(ds) {
  if (!noteCalCtx) return;
  var inp = $(noteCalCtx.inputId); if (inp) inp.value = ds;
  var wrap = $(noteCalCtx.wrapId); if (wrap) wrap.classList.add('hidden');
  toast('📅 Target date: ' + ds + ' — reminder 1 day before');
}

/* ---------- STATUS ---------- */
function renderStatus() {
  var mine = state.statuses.filter(function (s) { return s.mine; });
  $('my-status-sub').textContent = mine.length ? mine.length + ' update' + (mine.length > 1 ? 's' : '') + ' · expires in 24h' : 'Tap to add a status update';
  var recent = state.statuses.filter(function (s) { return !s.mine && !s.viewed; });
  var viewed = state.statuses.filter(function (s) { return !s.mine && s.viewed; });
  var row = function (s) {
    return '<div class="row" onclick="viewStatus(\'' + s.id + '\')"><div class="avatar status-ring' + (s.viewed ? ' viewed' : '') + '" style="background:' + s.color + '">' + esc(initials(s.user)) + '</div>' +
      '<div class="body"><div class="top"><span class="name">' + esc(s.user) + '</span><span class="time">' + nowTime(s.time) + '</span></div>' +
      '<div class="sub">' + esc(s.text || '📷 Photo') + '</div></div></div>';
  };
  $('status-list').innerHTML = recent.map(row).join('') || '<p class="muted center" style="padding:16px">No new updates</p>';
  $('status-viewed-list').innerHTML = viewed.map(row).join('') || '<p class="muted center" style="padding:16px">Nothing viewed yet</p>';
}
function openMyStatus() {
  var html = '<h3>Post a status</h3><p class="muted small">Visible to your contacts for 24 hours, then it disappears.</p>' +
    '<label>Status text</label><input id="status-text" type="text" placeholder="What\'s on your mind?">' +
    '<label>Or add a photo</label><input id="status-photo" type="file" accept="image/*">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveMyStatus()">Post status</button></div>';
  openModal(html);
}
function saveMyStatus() {
  var text = $('status-text').value.trim();
  var file = $('status-photo').files[0];
  var done = function (dataUrl) {
    state.statuses.unshift({ id: uid(), user: state.user ? state.user.name : 'You', color: state.user ? state.user.color : '#25D366', text: text || (dataUrl ? '📷 Photo status' : ''), image: dataUrl || null, time: Date.now(), viewed: false, mine: true });
    save(); closeModal(); renderStatus(); toast('Status posted ⭕ (expires in 24h)');
  };
  if (!text && !file) { toast('Write something or pick a photo'); return; }
  if (file) { var r = new FileReader(); r.onload = function () { done(r.result); }; r.readAsDataURL(file); }
  else done(null);
}
function viewStatus(id) {
  var s = state.statuses.find(function (x) { return x.id === id; }); if (!s) return;
  s.viewed = true; save(); renderStatus();
  var v = $('status-viewer');
  v.innerHTML = '<div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="background:' + s.color + '">' + esc(initials(s.user)) + '</div>' +
    '<div><b>' + esc(s.user) + '</b><div class="small" style="opacity:.8">' + nowTime(s.time) + ' · expires in 24h</div></div>' +
    '<button class="icon-btn" style="margin-left:auto" onclick="closeStatusViewer()">✕</button></div>' +
    '<div class="progress"><i></i></div>' +
    '<div class="status-content">' + (s.image ? '<img src="' + s.image + '" alt="status">' : '') + '<div class="big">' + esc(s.text || '') + '</div></div>' +
    '<div style="display:flex;gap:8px"><input id="status-reply-input" type="text" placeholder="Reply to ' + esc(s.user.split(' ')[0]) + '…" style="flex:1">' +
    '<button class="send-btn" onclick="replyToStatus(\'' + s.id + '\')">➤</button></div>';
  v.classList.remove('hidden');
}
function closeStatusViewer() { $('status-viewer').classList.add('hidden'); $('status-viewer').innerHTML = ''; }
function replyToStatus(id) {
  var s = state.statuses.find(function (x) { return x.id === id; }); if (!s) return;
  var text = $('status-reply-input').value.trim(); if (!text) return;
  var chat = state.chats.find(function (c) { return c.name === s.user; });
  if (!chat) { startChatWith(s.user); chat = state.chats.find(function (c) { return c.name === s.user; }); }
  pushMessage(chat, msg('me', '↪ Replied to status: ' + text, 0, { ticks: 1 }));
  save(); closeStatusViewer(); renderChats(); toast('Reply sent to ' + s.user);
}

/* ---------- CALLS ---------- */
function renderCalls() {
  $('call-list').innerHTML = state.calls.map(function (c) {
    var icon = c.dir === 'missed' ? '📵' : c.dir === 'incoming' ? '↙' : '↗';
    var col = c.dir === 'missed' ? 'style="color:var(--danger)"' : '';
    return '<div class="row" onclick="startCall(\'' + esc(c.name).replace(/'/g, "\\'") + '\',\'' + c.type + '\')">' +
      '<div class="avatar" style="background:' + c.color + '">' + esc(initials(c.name)) + '</div>' +
      '<div class="body"><div class="top"><span class="name" ' + col + '>' + icon + ' ' + esc(c.name) + '</span></div>' +
      '<div class="sub">' + todayLabel(c.time) + ' ' + nowTime(c.time) + ' · ' + esc(c.duration) + ' · ' + c.type + '</div></div>' +
      '<button class="icon-btn" style="color:var(--green)">' + (c.type === 'video' ? '🎥' : '📞') + '</button></div>';
  }).join('') || '<p class="muted center" style="padding:20px">No calls yet</p>';
}
function startCallPrompt(isVideo) {
  var names = state.chats.filter(function (c) { return !c.isGroup && !c.isNotes && !c.isAI; }).map(function (c) { return c.name; });
  var html = '<h3>' + (isVideo ? '🎥 Video call' : '📞 Voice call') + '</h3><p class="muted small">Pick a contact:</p>' +
    names.map(function (n) { return '<button class="menu-item" onclick="closeModal();startCall(\'' + esc(n).replace(/'/g, "\\'") + '\',\'' + (isVideo ? 'video' : 'voice') + '\')">' + esc(n) + '</button>'; }).join('') +
    '<button class="menu-item" onclick="closeModal();startGroupCall()">👥 Group call (Project Team)</button>' +
    '<button class="menu-item" onclick="closeModal();startScreenShareCallPrompt()">🖥️ Video call + share screen</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function startScreenShareCallPrompt() {
  if (!state.settings.screenShare) { toast('Screen sharing is off — turn it on in Settings › Screen sharing'); return; }
  var names = state.chats.filter(function (c) { return !c.isGroup && !c.isNotes && !c.isAI; }).map(function (c) { return c.name; });
  var html = '<h3>🖥️ Share screen in a call</h3><p class="muted small">Pick who to call — the call starts as video with screen sharing on.</p>' +
    names.map(function (n) { return '<button class="menu-item" onclick="closeModal();startCall(\'' + esc(n).replace(/'/g, "\\'") + '\',\'video\',{share:true})">' + esc(n) + '</button>'; }).join('') +
    '<button class="menu-item" onclick="closeModal();startGroupCall(true)">👥 Group call + share screen</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Cancel</button>';
  openModal(html);
}
function startChatCall(isVideo) {
  var chat = getChat(currentChatId); if (!chat) return;
  startCall(chat.name, isVideo ? 'video' : 'voice');
}
function startChatScreenShare() {
  if (!state.settings.screenShare) { toast('Screen sharing is off — turn it on in Settings › Screen sharing'); return; }
  var chat = getChat(currentChatId); if (!chat) return;
  startCall(chat.name, 'video', { share: true });
}
function startCall(name, type, opts) {
  opts = opts || {};
  var chat = state.chats.find(function (c) { return c.name === name; });
  var color = chat ? chat.color : '#25D366';
  var isGroup = !!(chat && chat.isGroup) || name.indexOf('Project Team') !== -1 || opts.group;
  callSeconds = 0;
  stopScreenShare(true);
  screenShare.chatName = name; screenShare.isGroup = isGroup;
  screenShare.sharer = state.user ? state.user.name : 'You';
  var cs = $('call-screen');
  cs.innerHTML = '<div class="avatar" style="background:' + color + '">' + esc(initials(name)) + '</div>' +
    '<h2 style="margin-top:14px">' + esc(name) + '</h2>' +
    '<div class="muted" style="color:#cfe8d8">' + (type === 'video' ? '🎥 Video call' : '📞 Voice call') + (isGroup ? ' · 👥 Group' : '') + '</div>' +
    '<div class="call-timer" id="call-timer">Calling…</div>' +
    '<div id="share-banner" class="share-banner hidden"><span>🖥️ <b>You are sharing your screen</b> · <span id="share-banner-timer">00:00</span></span><button class="share-stop" onclick="stopScreenShare()">Stop sharing</button></div>' +
    '<div id="share-tile" class="share-tile hidden"></div>' +
    (isGroup ? '<div id="group-tiles" class="group-tiles">' + groupTilesHtml(name) + '</div>' : '') +
    (type === 'video' ? '<div style="margin-top:20px;background:rgba(0,0,0,.35);border-radius:12px;padding:40px 60px">📷 Your video preview (demo)</div>' : '') +
    '<div class="call-controls">' +
    '<button class="call-ctrl" onclick="toggleCallMute(this)">🔇<small>Mute</small></button>' +
    '<button class="call-ctrl" onclick="toast(\'Speaker on 🔊\')">🔊<small>Speaker</small></button>' +
    '<button class="call-ctrl" onclick="toggleCallVideo(this)">🎥<small>Video</small></button>' +
    (state.settings.screenShare ? '<button class="call-ctrl" id="share-ctrl" onclick="toggleScreenShare()">🖥️<small>Share</small></button>' : '') +
    '<button class="call-ctrl end" onclick="endCall(\'' + esc(name).replace(/'/g, "\\'") + '\',\'' + type + '\')">📞<small>End</small></button></div>';
  cs.classList.remove('hidden');
  if (opts.share) { if (opts.demo) startDemoScreenShare(); else startScreenShare(); }
  setTimeout(function () { var t = $('call-timer'); if (t && !cs.classList.contains('hidden')) t.textContent = '00:00'; }, 1500);
  callTimerInt = setInterval(function () {
    callSeconds++;
    var t = $('call-timer');
    if (t) { var m = ('0' + Math.floor(callSeconds / 60)).slice(-2), s = ('0' + (callSeconds % 60)).slice(-2); t.textContent = m + ':' + s; }
  }, 1000);
}
function groupTilesHtml(name) {
  var members = ['You', 'Rahul Sharma', 'Priya Nair', 'Arjun Mehta', 'Sneha Reddy'];
  return members.map(function (m, i) {
    return '<div class="participant-tile' + (screenShare.active && m === screenShare.sharer ? ' sharing' : '') + '" id="tile-' + i + '">' +
      '<div class="avatar" style="background:' + AVATAR_COLORS[i % AVATAR_COLORS.length] + '">' + esc(initials(m)) + '</div>' +
      '<div class="small">' + esc(m) + (screenShare.active && m === screenShare.sharer ? ' · 🖥️ sharing screen' : '') + '</div></div>';
  }).join('');
}
function updateGroupTiles() {
  var gt = $('group-tiles'); if (!gt) return;
  gt.innerHTML = groupTilesHtml(screenShare.chatName || '');
}
function fmtShareTime(s) { return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); }
function getShareSupport() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return { supported: false, reason: 'getDisplayMedia is not available in this browser / WebView. Real screen sharing needs a browser or Android WebView that supports it, plus the screen-capture permission.' };
  return { supported: true, reason: '' };
}
function toggleScreenShare() {
  if (screenShare.active) { stopScreenShare(); return; }
  startScreenShare();
}
function startScreenShare() {
  if (!state.settings.screenShare) { toast('Screen sharing is off — turn it on in Settings › Screen sharing'); return; }
  if (screenShare.active) return;
  if ($('call-screen') && $('call-screen').classList.contains('hidden')) {
    // No call in progress — start a video call with sharing on, using the open chat if any.
    var chat = getChat(currentChatId);
    if (chat) { startCall(chat.name, 'video', { share: true }); return; }
    startScreenShareCallPrompt(); return;
  }
  var support = getShareSupport();
  if (!support.supported) { offerDemoScreenShare(support.reason); return; }
  var p = navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  if (p && p.then) {
    p.then(function (stream) { beginRealScreenShare(stream); }).catch(function (err) {
      var reason = 'Screen sharing was ' + ((err && err.name === 'NotAllowedError') ? 'cancelled / permission denied' : 'unavailable') + (err && err.message ? ' — ' + err.message : '') + '. You can still try the demo simulated share below.';
      offerDemoScreenShare(reason);
    });
  } else { offerDemoScreenShare('getDisplayMedia did not return a stream on this device.'); }
}
function offerDemoScreenShare(reason) {
  openModal('<h3>🖥️ Screen sharing unavailable</h3><p class="muted small">' + esc(reason) + '</p>' +
    '<p class="small">Real screen sharing on Android needs WebView / Capacitor permission and getDisplayMedia support. Try the demo simulated share instead — it shows a fake shared-screen tile in the call so you can preview the flow.</p>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="closeModal();startDemoScreenShare()">▶ Try demo share</button></div>');
}
function beginRealScreenShare(stream) {
  screenShare.active = true; screenShare.demo = false; screenShare.stream = stream; screenShare.seconds = 0;
  screenShare.sharer = state.user ? state.user.name : 'You';
  var tile = $('share-tile');
  if (tile) {
    tile.innerHTML = '<video id="share-video" autoplay muted playsinline></video><div class="share-label">🖥️ ' + esc(screenShare.sharer) + ' — sharing screen · <span id="share-timer">00:00</span></div>';
    tile.classList.remove('hidden');
    var v = $('share-video'); if (v) v.srcObject = stream;
  }
  showShareBanner();
  if (stream && stream.getVideoTracks) stream.getVideoTracks().forEach(function (tr) { tr.onended = function () { stopScreenShare(); }; });
  startShareTimer();
  updateGroupTiles();
  toast('Screen sharing started 🖥️');
}
function startDemoScreenShare() {
  if ($('call-screen') && $('call-screen').classList.contains('hidden')) {
    var chat = getChat(currentChatId);
    if (chat) { startCall(chat.name, 'video', { share: true, demo: true }); return; }
    startScreenShareCallPrompt(); return;
  }
  screenShare.active = true; screenShare.demo = true; screenShare.stream = null; screenShare.seconds = 0;
  screenShare.sharer = state.user ? state.user.name : 'You';
  var chat2 = state.chats.find(function (c) { return c.name === screenShare.chatName; });
  var lastMsgs = chat2 ? chat2.messages.filter(function (m) { return !m.deleted; }).slice(-3) : [];
  var tile = $('share-tile');
  if (tile) {
    tile.innerHTML = '<div class="share-demo-slide"><div class="share-demo-tag">DEMO SHARE — simulated screen</div>' +
      '<h3>📊 ' + esc(screenShare.chatName || 'Ksri') + '</h3><p class="muted small">What the other side would see — a shared screen preview.</p>' +
      (lastMsgs.length ? lastMsgs.map(function (m) { return '<div class="share-demo-line">• ' + esc(m.text || '[media]') + '</div>'; }).join('') : '<div class="share-demo-line">• Welcome to Ksri — chat, call &amp; share</div><div class="share-demo-line">• Photos, notes and plans, all in one place</div>') +
      '<div class="share-label" style="position:static;margin-top:10px">🖥️ ' + esc(screenShare.sharer) + ' — sharing screen (demo) · <span id="share-timer">00:00</span></div></div>';
    tile.classList.remove('hidden');
  }
  showShareBanner();
  startShareTimer();
  updateGroupTiles();
  toast('Demo screen share started 🖥️ (simulated)');
}
function showShareBanner() {
  var b = $('share-banner'); if (b) b.classList.remove('hidden');
  var btn = $('share-ctrl'); if (btn) { btn.style.background = '#25D366'; btn.innerHTML = '🖥️<small>Sharing</small>'; }
}
function startShareTimer() {
  clearInterval(screenShare.timerInt);
  screenShare.timerInt = setInterval(function () {
    screenShare.seconds++;
    var t = $('share-timer'); if (t) t.textContent = fmtShareTime(screenShare.seconds);
    var b = $('share-banner-timer'); if (b) b.textContent = fmtShareTime(screenShare.seconds);
  }, 1000);
}
function stopScreenShare(silent) {
  if (!screenShare.active && !screenShare.stream) { screenShare.active = false; return; }
  if (screenShare.stream) { try { screenShare.stream.getTracks().forEach(function (tr) { tr.stop(); }); } catch (e) {} screenShare.stream = null; }
  clearInterval(screenShare.timerInt); screenShare.timerInt = null;
  screenShare.active = false; screenShare.demo = false; screenShare.seconds = 0;
  var tile = $('share-tile'); if (tile) { tile.classList.add('hidden'); tile.innerHTML = ''; }
  var b = $('share-banner'); if (b) b.classList.add('hidden');
  var btn = $('share-ctrl'); if (btn) { btn.style.background = ''; btn.innerHTML = '🖥️<small>Share</small>'; }
  updateGroupTiles();
  if (!silent) toast('Screen sharing stopped');
}
function toggleCallMute(btn) { btn.style.background = btn.style.background === 'rgb(37, 211, 102)' ? '' : '#25D366'; toast('Microphone ' + (btn.style.background ? 'muted 🔇' : 'unmuted')); }
function toggleCallVideo(btn) { toast('Camera toggled 🎥'); }
function endCall(name, type) {
  stopScreenShare(true);
  clearInterval(callTimerInt);
  $('call-screen').classList.add('hidden'); $('call-screen').innerHTML = '';
  var dur = ('0' + Math.floor(callSeconds / 60)).slice(-2) + ':' + ('0' + (callSeconds % 60)).slice(-2);
  var chat = state.chats.find(function (c) { return c.name === name; });
  state.calls.unshift({ id: uid(), name: name, color: chat ? chat.color : '#25D366', type: type, dir: 'outgoing', time: Date.now(), duration: callSeconds > 2 ? dur : 'Missed' });
  save(); renderCalls();
  toast('Call ended · ' + dur);
}
function simulateIncomingCall() {
  var name = 'Rahul Sharma';
  var cs = $('call-screen');
  cs.innerHTML = '<div class="avatar" style="background:#29B6F6">RS</div>' +
    '<h2 style="margin-top:14px">' + name + '</h2><div style="color:#cfe8d8">📞 Incoming voice call…</div>' +
    '<div class="call-controls"><button class="call-ctrl end" onclick="declineCall()">✕<small>Decline</small></button>' +
    '<button class="call-ctrl" style="background:#25D366" onclick="acceptCall(\'' + name + '\')">📞<small>Accept</small></button></div>';
  cs.classList.remove('hidden');
}
function declineCall() {
  stopScreenShare(true);
  $('call-screen').classList.add('hidden'); $('call-screen').innerHTML = '';
  state.calls.unshift({ id: uid(), name: 'Rahul Sharma', color: '#29B6F6', type: 'voice', dir: 'missed', time: Date.now(), duration: 'Missed' });
  save(); renderCalls(); toast('Call declined');
}
function acceptCall(name) { $('call-screen').classList.add('hidden'); $('call-screen').innerHTML = ''; startCall(name, 'voice'); }
function startGroupCall(share) { startCall('🚀 Project Team', share ? 'video' : 'voice', { group: true, share: !!share }); toast('Group call started with 5 members 👥' + (share ? ' — screen sharing on' : '')); }

/* ---------- CHANNELS ---------- */
function renderChannels() {
  var mine = state.channels.filter(function (c) { return c.followed; });
  var discover = state.channels.filter(function (c) { return !c.followed; });
  var row = function (ch) {
    return '<div class="row"><div class="avatar" style="background:' + ch.color + '">' + esc(initials(ch.name)) + '</div>' +
      '<div class="body"><div class="top"><span class="name">' + esc(ch.name) + '</span><span class="time">' + esc(ch.followers) + ' followers</span></div>' +
      '<div class="sub">' + esc(ch.posts[0] ? ch.posts[0].text : '') + '</div></div>' +
      '<button class="btn-outline" style="margin:0;padding:7px 14px" onclick="toggleFollowChannel(\'' + ch.id + '\')">' + (ch.followed ? 'Following ✓' : 'Follow') + '</button></div>';
  };
  $('channel-list').innerHTML = mine.map(row).join('') || '<p class="muted center" style="padding:16px">You follow no channels yet</p>';
  $('channel-discover').innerHTML = discover.map(row).join('') || '<p class="muted center" style="padding:16px">No more channels to discover</p>';
}
function toggleFollowChannel(id) {
  var ch = state.channels.find(function (c) { return c.id === id; }); if (!ch) return;
  ch.followed = !ch.followed; save(); renderChannels();
  toast(ch.followed ? 'Following ' + ch.name + ' 📢' : 'Unfollowed ' + ch.name);
}
function createChannel() {
  var html = '<h3>📢 Create a channel</h3><p class="muted small">Channels broadcast updates to followers. Only admins can post.</p>' +
    '<label>Channel name</label><input id="channel-name" type="text" placeholder="e.g. My Updates">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveChannel()">Create</button></div>';
  openModal(html);
}
function saveChannel() {
  var name = $('channel-name').value.trim(); if (!name) { toast('Enter a channel name'); return; }
  state.channels.unshift({ id: 'ch-' + uid(), name: name, color: AVATAR_COLORS[state.channels.length % AVATAR_COLORS.length], followers: '1', followed: true, posts: [{ text: 'Welcome to ' + name + '! 👋', time: Date.now() }] });
  save(); closeModal(); renderChannels(); toast('Channel "' + name + '" created 📢');
}

/* ---------- SETTINGS ---------- */
function renderSettings() {
  var s = state.settings;
  var row = function (label, val, onclick) {
    return '<div class="settings-row" onclick="' + onclick + '"><div><div class="lbl">' + label + '</div><div class="val">' + val + '</div></div><span>›</span></div>';
  };
  var tog = function (label, val, on, onclick) {
    return '<div class="settings-row"><div><div class="lbl">' + label + '</div><div class="val">' + val + '</div></div><div class="toggle' + (on ? ' on' : '') + '" onclick="' + onclick + '"></div></div>';
  };
  $('settings-list').innerHTML =
    row('🔌 Connection', firebaseReady ? 'Real mode — Firebase connected' + (state.user && state.user.value ? ' · ' + esc(state.user.value) : '') : 'Demo mode — no backend, chats are simulated', 'openModeInfo()') +
    row('👤 Profile', 'Name, bio, avatar colour', 'editMyProfile()') +
    row('🔒 Privacy', 'Last seen: ' + s.lastSeen + ' · Read receipts: ' + (s.readReceipts ? 'On' : 'Off'), 'openPrivacy()') +
    tog('🌙 Dark mode', s.theme === 'dark' ? 'Dark theme is on' : 'Light theme is on', s.theme === 'dark', 'toggleTheme()') +
    row('🔠 Font size', s.fontSize.charAt(0).toUpperCase() + s.fontSize.slice(1), 'cycleFontSize()') +
    tog('🔔 Notifications', s.notifications ? 'Message notifications on' : 'Notifications off', s.notifications, 'toggleNotifications()') +
    tog('🖥️ Screen sharing', s.screenShare ? 'Screen sharing allowed in calls' : 'Screen sharing off — Share button hidden', s.screenShare, 'toggleScreenShareSetting()') +
    row('🖥️ Screen sharing help', 'How sharing works on this device', 'openScreenShareSettings()') +
    row('⭐ Starred messages', 'Your saved messages', 'viewStarred()') +
    row('📝 Notes & reminders', state.notes.filter(function (n) { return !n.done; }).length + ' open notes · ' + state.reminders.length + ' reminders', 'openNotesPanel()') +
    row('🕒 Scheduled messages', state.scheduled.length + ' scheduled', 'openScheduledList()') +
    row('📅 Calendar & ✅ Tasks', (state.events || []).length + ' events · ' + (state.todos || []).filter(function (t) { return !t.done; }).length + ' open tasks', 'openPlannerFromSettings()') +
    row('💾 Storage & backup', 'Export / import your chats as JSON', 'openBackup()') +
    row('ℹ️ About Ksri', 'Version 1.0.0 · Offline-first demo', 'openAbout()');
}
function editMyProfile() {
  if (!state.user) return;
  var html = '<h3>Edit profile</h3><label>Display name</label><input id="edit-name" type="text" value="' + esc(state.user.name) + '">' +
    '<label>Bio</label><input id="edit-bio" type="text" value="' + esc(state.user.bio) + '">' +
    '<label>Avatar colour</label><div>' + AVATAR_COLORS.map(function (c, i) {
      return '<div class="wallpaper-opt' + (state.user.color === c ? ' sel' : '') + '" style="background:' + c + '" onclick="setMyColor(' + i + ')"></div>';
    }).join('') + '</div>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveMyProfile()">Save</button></div>';
  openModal(html);
}
function setMyColor(i) { state.user.color = AVATAR_COLORS[i]; save(); updateMyAvatar(); closeModal(); editMyProfile(); }
function saveMyProfile() {
  var n = $('edit-name').value.trim(); if (!n) { toast('Name cannot be empty'); return; }
  state.user.name = n; state.user.bio = $('edit-bio').value.trim() || state.user.bio;
  save(); closeModal(); updateMyAvatar(); renderSettings(); toast('Profile updated');
}
function openPrivacy() {
  var s = state.settings;
  var html = '<h3>🔒 Privacy</h3>' +
    '<label>Last seen</label><select id="privacy-lastseen"><option' + (s.lastSeen === 'Everyone' ? ' selected' : '') + '>Everyone</option><option' + (s.lastSeen === 'My contacts' ? ' selected' : '') + '>My contacts</option><option' + (s.lastSeen === 'Nobody' ? ' selected' : '') + '>Nobody</option></select>' +
    '<label>Profile photo</label><select id="privacy-photo"><option' + (s.profilePhoto === 'Everyone' ? ' selected' : '') + '>Everyone</option><option' + (s.profilePhoto === 'My contacts' ? ' selected' : '') + '>My contacts</option><option' + (s.profilePhoto === 'Nobody' ? ' selected' : '') + '>Nobody</option></select>' +
    '<div class="settings-row" style="padding-left:0;padding-right:0"><div><div class="lbl">Read receipts</div><div class="val">Show blue ticks when you read messages</div></div><div class="toggle' + (s.readReceipts ? ' on' : '') + '" onclick="toggleReadReceipts()"></div></div>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="savePrivacy()">Save</button></div>';
  openModal(html);
}
function toggleReadReceipts() { state.settings.readReceipts = !state.settings.readReceipts; save(); closeModal(); openPrivacy(); renderSettings(); }
function savePrivacy() {
  state.settings.lastSeen = $('privacy-lastseen').value;
  state.settings.profilePhoto = $('privacy-photo').value;
  save(); closeModal(); renderSettings(); toast('Privacy settings saved 🔒');
}
function toggleTheme() {
  state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
  save(); applyTheme(); renderSettings();
  toast(state.settings.theme === 'dark' ? 'Dark mode on 🌙' : 'Light mode on ☀️');
}
function cycleFontSize() {
  var order = ['small', 'medium', 'large'];
  state.settings.fontSize = order[(order.indexOf(state.settings.fontSize) + 1) % order.length];
  save(); applyFontSize(); renderSettings(); toast('Font size: ' + state.settings.fontSize);
}
function toggleNotifications() { state.settings.notifications = !state.settings.notifications; save(); renderSettings(); toast(state.settings.notifications ? 'Notifications on 🔔' : 'Notifications off 🔕'); }
function toggleScreenShareSetting() { state.settings.screenShare = !state.settings.screenShare; save(); renderSettings(); toast(state.settings.screenShare ? 'Screen sharing on 🖥️' : 'Screen sharing off — Share button hidden'); }
function openScreenShareSettings() {
  var supported = navigator.mediaDevices && !!navigator.mediaDevices.getDisplayMedia;
  var html = '<h3>🖥️ Screen sharing</h3>' +
    '<p class="muted small">Share your screen in a voice or video call. Tap 🖥️ Share in a call, or 🖥️ in a chat header to start a video call with sharing on.</p>' +
    '<p class="small">On this device: <b>' + (supported ? 'Real screen sharing is available — your browser / WebView will ask which screen or window to share.' : 'Real screen sharing is NOT available here — Ksri will offer a demo simulated share so you can still try the flow.') + '</b></p>' +
    '<p class="muted small">Real sharing on Android needs WebView / Capacitor permission and getDisplayMedia support. Nothing you share is recorded or saved by Ksri — sharing stops automatically when the call ends.</p>' +
    '<div class="settings-row" style="padding-left:0;padding-right:0"><div><div class="lbl">Allow screen sharing</div><div class="val">Show the Share button in calls</div></div><div class="toggle' + (state.settings.screenShare ? ' on' : '') + '" onclick="toggleScreenShareSetting();closeModal();openScreenShareSettings()"></div></div>' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Close</button>' +
    '<button class="btn-primary" onclick="closeModal();startDemoScreenShare()">Try demo share</button></div>';
  openModal(html);
}
function openScheduledList() {
  var html = '<h3>🕒 Scheduled messages</h3><div>' + scheduledListHtml() + '</div>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>';
  openModal(html);
}
function openPlannerFromSettings() { closeModal(); switchTab('calendar'); }
function openBackup() {
  var total = state.chats.reduce(function (s, c) { return s + c.messages.length; }, 0);
  var html = '<h3>💾 Storage &amp; backup</h3><p class="muted small">' + state.chats.length + ' chats · ' + total + ' messages · stored on this device only.</p>' +
    '<button class="btn-primary" onclick="exportBackup()">⬇️ Export backup (JSON)</button>' +
    '<label style="margin-top:14px">Import backup</label><input id="import-file" type="file" accept=".json,application/json" onchange="importBackup(event)">' +
    '<button class="btn-danger-outline" onclick="clearAllData()">Erase all Ksri data</button>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>';
  openModal(html);
}
function exportBackup() {
  var blob = new Blob([JSON.stringify({ format: 'ksri-backup-v1', exportedAt: new Date().toISOString(), state: state }, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ksri-backup.json';
  a.click();
  toast('Backup downloaded 💾');
}
function importBackup(ev) {
  var file = ev.target.files[0]; if (!file) return;
  var r = new FileReader();
  r.onload = function () {
    try {
      var data = JSON.parse(r.result);
      if (data.format !== 'ksri-backup-v1' || !data.state || !data.state.chats) throw new Error('bad format');
      state = data.state; save(); closeModal(); enterApp();
      toast('Backup restored ✅');
    } catch (e) { toast('Invalid Ksri backup file'); }
  };
  r.readAsText(file);
}
function clearAllData() {
  if (!confirm('Erase ALL Ksri data on this device (chats, statuses, settings)?')) return;
  localStorage.removeItem(KEY);
  location.reload();
}
function openAbout() {
  openModal('<h3>About Ksri</h3><p>Ksri v1.0.0 — a WhatsApp-style messenger that works fully offline.</p>' +
    '<p class="muted small">Register with a phone number <b>or</b> an email address. Beyond WhatsApp: scheduled messages, AI smart replies &amp; assistant, message translation, chat folders, chat lock, polls, notes &amp; reminders, custom themes &amp; wallpapers, voice transcription, broadcast lists and channels.</p>' +
    '<p class="muted small">Built with Capacitor 8 · App ID com.hadhvik.ksri</p>' +
    '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>');
}

/* ---------- CALENDAR + TODO LINKED TO CHATS ---------- */
function fmtDateStr(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function dateStrOff(off) { var d = new Date(); d.setDate(d.getDate() + off); return fmtDateStr(d); }
function eventDateTime(ev) { return new Date(ev.date + 'T' + (ev.time || '09:00') + ':00'); }
function todoDueDateTime(td) { return new Date((td.due || fmtDateStr(new Date())) + 'T09:00:00'); }
function chatOptionsHtml(selectedId) {
  return state.chats.map(function (c) {
    return '<option value="' + c.id + '"' + (c.id === selectedId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
  }).join('');
}
function chatNameOf(id) { var c = getChat(id); return c ? c.name : 'No chat'; }
function updatePlannerBadges() {
  var today = fmtDateStr(new Date());
  var upcoming = state.events.filter(function (e) { return e.date >= today; }).length;
  var open = state.todos.filter(function (t) { return !t.done; }).length;
  var eb = $('nav-events'), tb = $('nav-tasks');
  if (eb) { eb.textContent = upcoming; eb.classList.toggle('hidden', upcoming === 0); }
  if (tb) { tb.textContent = open; tb.classList.toggle('hidden', open === 0); }
}

/* Reminders are always 1 day before the event / due date. One reminder
   entry per event/todo, kept in state.reminders alongside message reminders. */
function createReminderFor(kind, refId, chatId, at, text) {
  removeRemindersFor(kind, refId);
  state.reminders.push({ id: uid(), kind: kind, refId: refId, chatId: chatId, at: at, text: text, fired: false, dismissed: false });
}
function removeRemindersFor(kind, refId) {
  state.reminders = state.reminders.filter(function (r) { return !(r.kind === kind && r.refId === refId); });
}
function syncReminderForEvent(ev) {
  var at = eventDateTime(ev).getTime() - 24 * 3600000;
  createReminderFor('event', ev.id, ev.chatId, at, 'Tomorrow: ' + ev.title + ' with ' + chatNameOf(ev.chatId) + ' at ' + (ev.time || '09:00'));
}
function syncReminderForTodo(td) {
  if (!td.due) { removeRemindersFor('todo', td.id); return; }
  var at = todoDueDateTime(td).getTime() - 24 * 3600000;
  createReminderFor('todo', td.id, td.chatId, at, 'Due tomorrow: ' + td.title + ' (' + chatNameOf(td.chatId) + ')');
}
/* ----- Notes: target date → 1-day-before reminder (same system) ----- */
function noteDateTime(n) { return new Date((n.targetDate || fmtDateStr(new Date())) + 'T' + (n.targetTime || '09:00') + ':00'); }
function fmtTargetDate(n) {
  if (!n.targetDate) return '';
  var d = new Date(n.targetDate + 'T12:00:00');
  return 'Target: ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + (n.targetTime ? ' · ' + n.targetTime : '');
}
function isNoteOverdue(n) { return !n.done && !!n.targetDate && noteDateTime(n).getTime() < Date.now(); }
function syncReminderForNote(n) {
  if (!n.targetDate || n.done) { removeRemindersFor('note', n.id); return; }
  var at = noteDateTime(n).getTime() - 24 * 3600000;
  createReminderFor('note', n.id, 'c-notes', at, 'Tomorrow: ' + n.text);
}
function ensurePlannerReminders() {
  state.events.forEach(function (ev) {
    if (!state.reminders.some(function (r) { return r.kind === 'event' && r.refId === ev.id; })) syncReminderForEvent(ev);
  });
  state.todos.forEach(function (td) {
    if (!td.done && td.due && !state.reminders.some(function (r) { return r.kind === 'todo' && r.refId === td.id; })) syncReminderForTodo(td);
  });
  state.notes.forEach(function (n) {
    if (!n.done && n.targetDate && !state.reminders.some(function (r) { return r.kind === 'note' && r.refId === n.id; })) syncReminderForNote(n);
  });
}

/* ----- Calendar ----- */
function renderCalendar() {
  ensurePlannerReminders();
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $('cal-month-label').textContent = months[calView.m] + ' ' + calView.y;
  var first = new Date(calView.y, calView.m, 1).getDay();
  var days = new Date(calView.y, calView.m + 1, 0).getDate();
  var today = fmtDateStr(new Date());
  var byDate = {};
  state.events.forEach(function (e) { (byDate[e.date] = byDate[e.date] || []).push(e); });
  state.notes.forEach(function (n) { if (n.targetDate && !n.done) (byDate[n.targetDate] = byDate[n.targetDate] || []).push({ title: '📝 ' + n.text }); });
  var html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) { return '<div class="cal-weekday">' + d + '</div>'; }).join('');
  for (var i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
  for (var d = 1; d <= days; d++) {
    var ds = calView.y + '-' + ('0' + (calView.m + 1)).slice(-2) + '-' + ('0' + d).slice(-2);
    var evs = byDate[ds] || [];
    html += '<div class="cal-day' + (ds === today ? ' today' : '') + (calView.selected === ds ? ' selected' : '') + '" onclick="selectCalDay(\'' + ds + '\')">' +
      '<span>' + d + '</span>' + (evs.length ? '<i class="cal-dot" title="' + evs.length + ' event(s)"></i>' : '') + '</div>';
  }
  $('cal-grid').innerHTML = html;
  var sorted = state.events.slice().sort(function (a, b) { return eventDateTime(a) - eventDateTime(b); });
  var list = calView.selected ? sorted.filter(function (e) { return e.date === calView.selected; }) : sorted.filter(function (e) { return e.date >= today; });
  $('event-list').innerHTML = (calView.selected ? '<p class="muted small" style="padding:4px 14px">Showing events for <b>' + esc(calView.selected) + '</b> · <a href="#" onclick="clearCalDay();return false">Show all upcoming</a></p>' : '') +
    (list.length ? list.map(function (ev) {
      var c = getChat(ev.chatId);
      return '<div class="row"><div class="avatar" style="background:' + (c ? c.color : '#25D366') + '">📅</div>' +
        '<div class="body"><div class="top"><span class="name">' + esc(ev.title) + '</span><span class="time">' + esc(ev.date) + ' · ' + esc(ev.time || '') + '</span></div>' +
        '<div class="sub">💬 ' + esc(chatNameOf(ev.chatId)) + (ev.notes ? ' · ' + esc(ev.notes) : '') + '</div>' +
        '<div class="sub">🔔 Reminds 1 day before · ' + new Date(eventDateTime(ev).getTime() - 24 * 3600000).toLocaleString() + '</div></div>' +
        '<div class="meta"><button class="btn-link" style="width:auto;margin:0" onclick="openChat(\'' + ev.chatId + '\')">Open chat</button>' +
        '<button class="btn-link" style="width:auto;margin:0" onclick="openEventCreator(\'' + ev.chatId + '\',null,\'' + ev.id + '\')">Edit</button>' +
        '<button class="btn-link" style="width:auto;margin:0;color:var(--danger)" onclick="deleteEvent(\'' + ev.id + '\')">Delete</button></div></div>';
    }).join('') : '<p class="muted center" style="padding:16px">' + (calView.selected ? 'No events on this day. Tap ＋ Add event to add one.' : 'No upcoming events yet. Tap ＋ Add event.') + '</p>');
  renderReminderList();
  updatePlannerBadges();
}
function changeCalMonth(delta) {
  calView.m += delta;
  if (calView.m < 0) { calView.m = 11; calView.y--; }
  if (calView.m > 11) { calView.m = 0; calView.y++; }
  renderCalendar();
}
function goToToday() { var n = new Date(); calView.y = n.getFullYear(); calView.m = n.getMonth(); calView.selected = fmtDateStr(n); renderCalendar(); }
function selectCalDay(ds) { calView.selected = ds; renderCalendar(); }
function clearCalDay() { calView.selected = null; renderCalendar(); }
function openEventCreator(chatId, presetDate, editId) {
  var ev = editId ? state.events.find(function (e) { return e.id === editId; }) : null;
  var selChat = ev ? ev.chatId : (chatId || (state.chats[0] ? state.chats[0].id : ''));
  var dateVal = ev ? ev.date : (presetDate || calView.selected || dateStrOff(1));
  var html = '<h3>📅 ' + (ev ? 'Edit event' : 'Add calendar event') + '</h3>' +
    '<p class="muted small">Linked to a chat — the event shows on the calendar and in that chat\'s menu. <b>🔔 Reminds 1 day before.</b></p>' +
    (ev ? '<input id="ev-id" type="hidden" value="' + ev.id + '">' : '') +
    '<label>Linked chat</label><select id="ev-chat">' + chatOptionsHtml(selChat) + '</select>' +
    '<label>Event title</label><input id="ev-title" type="text" placeholder="e.g. Sprint review" value="' + (ev ? esc(ev.title) : '') + '">' +
    '<label>Date</label><input id="ev-date" type="date" value="' + dateVal + '">' +
    '<label>Time</label><input id="ev-time" type="time" value="' + (ev ? ev.time : '15:00') + '">' +
    '<label>Notes (optional)</label><input id="ev-notes" type="text" placeholder="e.g. Bring demo notes" value="' + (ev ? esc(ev.notes || '') : '') + '">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveEvent()">Save event</button></div>';
  openModal(html);
}
function saveEvent() {
  var title = $('ev-title').value.trim();
  var date = $('ev-date').value;
  var time = $('ev-time').value || '09:00';
  if (!title) { toast('Give the event a title'); return; }
  if (!date) { toast('Pick a date'); return; }
  var idEl = $('ev-id');
  var ev;
  if (idEl) {
    ev = state.events.find(function (e) { return e.id === idEl.value; });
    if (ev) { ev.title = title; ev.date = date; ev.time = time; ev.chatId = $('ev-chat').value; ev.notes = $('ev-notes').value.trim(); }
  } else {
    ev = { id: uid(), chatId: $('ev-chat').value, title: title, date: date, time: time, notes: $('ev-notes').value.trim(), createdAt: Date.now() };
    state.events.push(ev);
  }
  if (ev) syncReminderForEvent(ev);
  save(); closeModal(); renderCalendar();
  requestNotificationPermission();
  toast('📅 Event saved — reminder set for 1 day before');
}
function editEvent(id) { openEventCreator(null, null, id); }
function deleteEvent(id) {
  if (!confirm('Delete this event and its 1-day-before reminder?')) return;
  state.events = state.events.filter(function (e) { return e.id !== id; });
  removeRemindersFor('event', id);
  save(); renderCalendar(); toast('Event deleted');
}

/* ----- To-do list ----- */
function renderTodos() {
  ensurePlannerReminders();
  var sel = $('todo-chat-filter');
  var cur = sel.value || todoChatFilter;
  sel.innerHTML = '<option value="all">All chats</option>' + state.chats.map(function (c) {
    return '<option value="' + c.id + '"' + (cur === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
  }).join('');
  var today = fmtDateStr(new Date());
  var list = state.todos.slice().sort(function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : 1; });
  if (todoFilter === 'open') list = list.filter(function (t) { return !t.done; });
  if (todoFilter === 'done') list = list.filter(function (t) { return t.done; });
  if (todoFilter === 'today') list = list.filter(function (t) { return t.due === today && !t.done; });
  if (todoChatFilter !== 'all') list = list.filter(function (t) { return t.chatId === todoChatFilter; });
  $('todo-list').innerHTML = list.length ? list.map(function (td) {
    var overdue = !td.done && td.due && td.due < today;
    var priCls = td.priority === 'High' ? 'pri-high' : td.priority === 'Low' ? 'pri-low' : 'pri-med';
    return '<div class="row"><input type="checkbox" style="width:22px;height:22px;flex-shrink:0" ' + (td.done ? 'checked' : '') + ' onchange="toggleTodo(\'' + td.id + '\')">' +
      '<div class="body"><div class="top"><span class="name" style="' + (td.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(td.title) + '</span>' +
      '<span class="pri ' + priCls + '">' + esc(td.priority) + '</span></div>' +
      '<div class="sub">💬 ' + esc(chatNameOf(td.chatId)) + (td.notes ? ' · ' + esc(td.notes) : '') + '</div>' +
      '<div class="sub">' + (td.due ? '📅 Due ' + esc(td.due) + (overdue ? ' · <b style="color:var(--danger)">Overdue</b>' : '') + ' · 🔔 Reminds 1 day before' : 'No due date') + '</div></div>' +
      '<div class="meta"><button class="btn-link" style="width:auto;margin:0" onclick="openChat(\'' + td.chatId + '\')">Open chat</button>' +
      '<button class="btn-link" style="width:auto;margin:0" onclick="openTodoCreator(\'' + td.chatId + '\',\'' + td.id + '\')">Edit</button>' +
      '<button class="btn-link" style="width:auto;margin:0;color:var(--danger)" onclick="deleteTodo(\'' + td.id + '\')">Delete</button></div></div>';
  }).join('') : '<p class="muted center" style="padding:20px">No tasks here yet.<br>Tap ＋ Add a task, or use ✅ in any chat.</p>';
  updatePlannerBadges();
}
function setTodoFilter(f) {
  todoFilter = f;
  document.querySelectorAll('#todo-chips .chip').forEach(function (c) { c.classList.toggle('active', c.dataset.todoFilter === f); });
  renderTodos();
}
function setTodoChatFilter(chatId) { todoChatFilter = chatId; renderTodos(); }
function openTodoCreator(chatId, editId) {
  var td = editId ? state.todos.find(function (t) { return t.id === editId; }) : null;
  var selChat = td ? td.chatId : (chatId || (state.chats[0] ? state.chats[0].id : ''));
  var html = '<h3>✅ ' + (td ? 'Edit task' : 'Add a task') + '</h3>' +
    '<p class="muted small">Linked to a chat — tick it off when done. <b>🔔 Reminds 1 day before the due date.</b></p>' +
    (td ? '<input id="td-id" type="hidden" value="' + td.id + '">' : '') +
    '<label>Linked chat</label><select id="td-chat">' + chatOptionsHtml(selChat) + '</select>' +
    '<label>Task</label><input id="td-title" type="text" placeholder="e.g. Send the slides" value="' + (td ? esc(td.title) : '') + '">' +
    '<label>Priority</label><select id="td-priority">' + ['High', 'Medium', 'Low'].map(function (p) {
      return '<option' + ((td ? td.priority : 'Medium') === p ? ' selected' : '') + '>' + p + '</option>';
    }).join('') + '</select>' +
    '<label>Due date</label><input id="td-due" type="date" value="' + (td ? td.due : dateStrOff(1)) + '">' +
    '<label>Notes (optional)</label><input id="td-notes" type="text" placeholder="e.g. PDF only" value="' + (td ? esc(td.notes || '') : '') + '">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="saveTodo()">Save task</button></div>';
  openModal(html);
}
function saveTodo() {
  var title = $('td-title').value.trim();
  if (!title) { toast('Write the task first'); return; }
  var idEl = $('td-id');
  var td;
  if (idEl) {
    td = state.todos.find(function (t) { return t.id === idEl.value; });
    if (td) { td.title = title; td.chatId = $('td-chat').value; td.priority = $('td-priority').value; td.due = $('td-due').value; td.notes = $('td-notes').value.trim(); }
  } else {
    td = { id: uid(), chatId: $('td-chat').value, title: title, priority: $('td-priority').value, due: $('td-due').value, notes: $('td-notes').value.trim(), done: false, createdAt: Date.now() };
    state.todos.push(td);
  }
  if (td) syncReminderForTodo(td);
  save(); closeModal(); renderTodos();
  requestNotificationPermission();
  toast('✅ Task saved — reminder set for 1 day before due');
}
function editTodo(id) { openTodoCreator(null, id); }
function toggleTodo(id) {
  var td = state.todos.find(function (t) { return t.id === id; }); if (!td) return;
  td.done = !td.done;
  if (td.done) removeRemindersFor('todo', id); else syncReminderForTodo(td);
  save(); renderTodos();
  toast(td.done ? 'Task done ✅' : 'Task reopened');
}
function deleteTodo(id) {
  if (!confirm('Delete this task and its reminder?')) return;
  state.todos = state.todos.filter(function (t) { return t.id !== id; });
  removeRemindersFor('todo', id);
  save(); renderTodos(); toast('Task deleted');
}

/* ----- Reminders: 1 day before, in-app banner + Notification API ----- */
function renderReminderList() {
  var el = $('reminder-list'); if (!el) return;
  var now = Date.now();
  var list = state.reminders.filter(function (r) { return (r.kind === 'event' || r.kind === 'todo' || r.kind === 'note') && !r.dismissed; })
    .slice().sort(function (a, b) { return a.at - b.at; });
  el.innerHTML = list.length ? list.map(function (r) {
    var due = r.at <= now;
    var when = due ? (r.fired ? '🔔 Due — reminder shown' : '🔔 Due now') : 'in ' + Math.max(1, Math.round((r.at - now) / 3600000)) + 'h';
    return '<div class="settings-row"><div><div class="lbl">⏰ ' + esc(r.text) + '</div>' +
      '<div class="val">Reminds 1 day before · fires ' + new Date(r.at).toLocaleString() + ' · ' + when + '</div></div>' +
      '<div style="display:flex;gap:4px"><button class="btn-link" style="width:auto;margin:0" onclick="snoozeReminder(\'' + r.id + '\',60)">Snooze 1h</button>' +
      '<button class="btn-link" style="width:auto;margin:0" onclick="dismissReminder(\'' + r.id + '\')">Dismiss</button></div></div>';
  }).join('') : '<p class="muted small" style="padding:4px 14px">No reminders yet — add an event, a task, or a note with a target date and its reminder appears here, 1 day before.</p>';
}
function requestNotificationPermission() {
  if (!('Notification' in window)) { toast('This browser has no system notifications — Ksri will remind you in-app instead 🔔'); return; }
  if (Notification.permission === 'granted') { toast('Notifications on 🔔 — you\'ll be reminded 1 day before'); return; }
  if (Notification.permission === 'denied') { toast('Notifications are blocked in browser settings — Ksri will remind you in-app instead 🔔'); return; }
  Notification.requestPermission().then(function (p) {
    toast(p === 'granted' ? 'Notifications on 🔔 — you\'ll be reminded 1 day before' : 'No problem — Ksri will remind you in-app instead 🔔');
  });
}
function notifyReminder(r) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Ksri reminder — 1 day before', { body: r.text, tag: r.id });
      return true;
    }
  } catch (e) { /* fall through to in-app banner */ }
  return false;
}
function showReminderBanner(r) {
  activeReminderId = r.id;
  $('reminder-banner-text').textContent = r.text + ' — 1 day before';
  $('reminder-banner').classList.remove('hidden');
}
function hideReminderBanner() { activeReminderId = null; $('reminder-banner').classList.add('hidden'); }
function snoozeReminder(id, mins) {
  var r = state.reminders.find(function (x) { return x.id === id; }); if (!r) { hideReminderBanner(); return; }
  r.at = Date.now() + mins * 60000; r.fired = false; r.dismissed = false;
  save(); hideReminderBanner(); renderReminderList();
  toast('⏰ Snoozed for ' + mins + ' min');
}
function dismissReminder(id) {
  var r = state.reminders.find(function (x) { return x.id === id; }); if (!r) { hideReminderBanner(); return; }
  r.dismissed = true; r.fired = true;
  save(); hideReminderBanner(); renderReminderList();
  toast('Reminder dismissed');
}

/* ---------- REMINDERS + SCHEDULED CHECK ---------- */
function checkReminders() {
  ensurePlannerReminders();
  var now = Date.now(), shown = false;
  state.reminders.forEach(function (r) {
    if (!r.fired && !r.dismissed && r.at <= now) {
      r.fired = true;
      notifyReminder(r);
      toast('⏰ Reminder: ' + r.text.slice(0, 60));
      if (!shown) { showReminderBanner(r); shown = true; }
    }
  });
  save();
  renderReminderList();
}
setInterval(function () { checkScheduled(); checkReminders(); }, 20000);

/* ================= REAL MODE (Firebase) =================
   Everything in this section only runs when firebaseReady is true.
   Demo mode never calls these functions. */
function myUid() { return (window.KsriFirebase && window.KsriFirebase.user) ? window.KsriFirebase.user.uid : null; }
function realAvatarColor(uid) { var h = 0; for (var i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) % 997; return AVATAR_COLORS[h % AVATAR_COLORS.length]; }

/* Firebase init finished (async, from www/firebase.js) — record it and
   refresh the mode badge. Registered at load time; firebase.js may
   already have settled before this file ran (placeholder config settles
   synchronously), so boot also checks window.__ksriFirebaseSettled. */
window.addEventListener('ksri-firebase-ready', function (e) {
  firebaseReady = !!(e.detail && e.detail.ready);
  updateModeBadge();
});

function updateModeBadge() {
  var text = firebaseReady
    ? 'Real mode — Firebase connected · real accounts & chats'
    : 'Demo mode — no backend, chats are simulated';
  ['mode-badge', 'settings-mode-badge'].forEach(function (id) {
    var el = $(id);
    if (el) { el.textContent = text; el.classList.toggle('real', firebaseReady); el.classList.toggle('demo', !firebaseReady); }
  });
  /* Demo-only controls (demo OTP boxes, demo bypass buttons) are hidden
     in real mode; the real-mode hint is shown instead. */
  var demoEls = document.querySelectorAll('.demo-only');
  for (var i = 0; i < demoEls.length; i++) demoEls[i].classList.toggle('hidden', firebaseReady);
  var realEls = document.querySelectorAll('.real-only');
  for (var j = 0; j < realEls.length; j++) realEls[j].classList.toggle('hidden', !firebaseReady);
  refreshAuthModeUI();
}
function refreshAuthModeUI() {
  /* Email in real mode uses a sign-in link / password, not an OTP code —
     so the Send OTP button is replaced by the email-auth row. */
  var emailRow = $('email-auth-row');
  var sendBtn = $('send-otp-btn');
  if (emailRow) emailRow.classList.toggle('hidden', !(firebaseReady && pendingMethod === 'email'));
  if (sendBtn) sendBtn.classList.toggle('hidden', firebaseReady && pendingMethod === 'email');
}
function openModeInfo() {
  var html = firebaseReady
    ? '<h3>🔌 Real mode — Firebase connected</h3>' +
      '<p>Your account and chats are real: messages are stored in Cloud Firestore and reach other signed-in phones live.</p>' +
      '<p class="muted small">Signed in as <b>' + esc(state.user ? state.user.value : '') + '</b> · ' +
      'Chats sync live · Works offline and syncs later · Only chat participants can read a chat (see firestore.rules).</p>' +
      '<p class="muted small">Still demo-only in real mode: AI replies, translations, voice transcripts, status, channels and calls use the built-in demo data.</p>'
    : '<h3>🔌 Demo mode</h3>' +
      '<p>No Firebase config is set up yet, so Ksri runs fully offline: the OTP is always <b>123456</b> and chats are simulated on this device only.</p>' +
      '<p class="muted small">To go real: follow <b>docs/FIREBASE.md</b> — create a free Firebase project, paste the config into www/firebase-config.js, rebuild. No code changes needed beyond the config.</p>';
  html += '<button class="btn-outline" style="width:100%" onclick="closeModal()">Close</button>';
  openModal(html);
}

/* ---------- REAL AUTH: email link / email + password ---------- */
function sendEmailLinkFlow() {
  var v = ($('id-input').value || '').trim().toLowerCase();
  var err = $('id-error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    if (err) { err.textContent = 'Enter a valid email address first.'; err.classList.remove('hidden'); }
    return;
  }
  if (err) err.classList.add('hidden');
  pendingMethod = 'email'; pendingValue = v;
  window.KsriFirebase.sendEmailLink(v).then(function () {
    openModal('<h3>Check your inbox ✉️</h3><p>We sent a sign-in link to <b>' + esc(v) + '</b>. Tap the link to finish signing in, then set up your profile.</p><p class="muted small">On Android the link opens in a browser — if it does not bring you back into the app, use the password option instead. Firebase does not send 6-digit codes by email.</p><button class="btn-outline" style="width:100%" onclick="closeModal()">OK</button>');
    toast('Sign-in link sent');
  }).catch(function (e) {
    if (err) { err.textContent = window.KsriFirebase.friendlyAuthError(e); err.classList.remove('hidden'); }
  });
}
function signInEmailPasswordFlow() {
  var v = ($('id-input').value || '').trim().toLowerCase();
  var pw = ($('email-password').value || '');
  var err = $('id-error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    if (err) { err.textContent = 'Enter a valid email address first.'; err.classList.remove('hidden'); }
    return;
  }
  if (pw.length < 6) {
    if (err) { err.textContent = 'Password must be at least 6 characters.'; err.classList.remove('hidden'); }
    return;
  }
  if (err) err.classList.add('hidden');
  pendingMethod = 'email'; pendingValue = v;
  /* One button for both: try sign-in; if there is no account yet,
     create one. A wrong password for an existing account fails here
     with a clear message (see friendlyAuthError). */
  window.KsriFirebase.signInEmailPassword(v, pw).then(function () {
    enterAfterSignIn();
  }).catch(function () {
    window.KsriFirebase.createEmailAccount(v, pw).then(function () {
      enterAfterSignIn();
    }).catch(function (e) {
      if (err) { err.textContent = window.KsriFirebase.friendlyAuthError(e); err.classList.remove('hidden'); }
    });
  });
}

/* ---------- REAL CHATS: Firestore -> local chat model ---------- */
function mapRealMessage(d) {
  var me = myUid();
  var t = (d.createdAt && d.createdAt.toMillis) ? d.createdAt.toMillis() : (d.createdAt || Date.now());
  var senderName = d.senderId === me ? 'me' : (realUserCache[d.senderId] ? (realUserCache[d.senderId].displayName || 'Chat') : '…');
  var m = {
    id: d._id, from: senderName, senderId: d.senderId,
    text: d.deleted ? '' : (d.text || ''), time: t, type: d.type || 'text',
    ticks: d.status === 'read' ? 2 : 1, starred: false, reactions: {},
    edited: !!d.edited, deleted: !!d.deleted, replyTo: d.replyTo || null,
    dataUrl: d.dataUrl || null, poll: d.poll || null
  };
  if (d.reactions) Object.keys(d.reactions).forEach(function (k) { if (d.reactions[k]) m.reactions[k] = true; });
  if (d.deletedFor && d.deletedFor.indexOf(me) !== -1) m._hiddenForMe = true;
  return m;
}
function upsertRealChat(doc) {
  var me = myUid(); if (!me) return null;
  var others = (doc.participants || []).filter(function (u) { return u !== me; });
  var otherUid = others[0] || null;
  var chat = getChat(doc._id);
  if (!chat) {
    chat = {
      id: doc._id, name: doc.name || 'Chat', color: realAvatarColor(doc._id),
      folder: doc.type === 'group' ? 'groups' : 'personal',
      pinned: false, muted: false, archived: false, locked: false,
      online: false, typing: false, unread: 0, disappearing: 'off',
      wallpaper: 'default', members: null, admin: null, messages: [],
      real: true, participants: doc.participants || [], isGroup: doc.type === 'group'
    };
    state.chats.unshift(chat);
  }
  chat.real = true;
  chat.participants = doc.participants || [];
  chat.isGroup = doc.type === 'group';
  chat.folder = chat.isGroup ? 'groups' : 'personal';
  if (chat.isGroup) chat.name = doc.name || 'Group';
  var typingMap = doc.typing || {};
  chat.typing = others.some(function (u) { return typingMap[u]; });
  /* Lightweight preview so the list shows the last message before the
     message listener for that chat has loaded. */
  if (doc.lastMessage && !chat.messages.length) {
    var t = (doc.updatedAt && doc.updatedAt.toMillis) ? doc.updatedAt.toMillis() : Date.now();
    chat.messages = [{ id: 'preview', from: 'other', text: doc.lastMessage, time: t, type: 'text', ticks: 2, starred: false, reactions: {} }];
  }
  /* Resolve the other person's name/avatar (async). */
  if (!chat.isGroup && otherUid) {
    chat.otherUid = otherUid;
    var cached = realUserCache[otherUid];
    if (cached) {
      chat.name = cached.displayName || cached.phone || cached.email || 'Chat';
      chat.color = cached.avatarColor || chat.color;
    } else {
      window.KsriFirebase.getUserProfile(otherUid).then(function (p) {
        if (!p) return;
        realUserCache[otherUid] = p;
        chat.name = p.displayName || p.phone || p.email || 'Chat';
        chat.color = p.avatarColor || chat.color;
        if (currentChatId === chat.id) {
          $('chat-name').textContent = chat.name;
          $('chat-avatar').textContent = initials(chat.name);
          $('chat-avatar').style.background = chat.color;
        }
        renderChats();
      }).catch(function () { /* name stays generic — best effort */ });
    }
  }
  return chat;
}
function startRealChats() {
  if (!firebaseReady || !window.KsriFirebase || !window.KsriFirebase.user) return;
  stopRealChats();
  realChatsUnsub = window.KsriFirebase.listenToMyChats(function (docs, err) {
    if (err) { toast('Could not load real chats: ' + (err && err.message ? err.message : err)); return; }
    var ids = {};
    docs.forEach(function (d) { ids[d._id] = true; upsertRealChat(d); });
    /* Drop real chats that no longer exist remotely. Demo chats stay in
       state (they are hidden by renderChats in real mode, and come back
       if the app ever returns to demo mode). */
    state.chats = state.chats.filter(function (c) { return !c.real || ids[c.id]; });
    save();
    renderChats();
    if (currentChatId) { var cc = getChat(currentChatId); if (cc) renderMessages(); }
  });
}
function stopRealChats() {
  if (realChatsUnsub) { try { realChatsUnsub(); } catch (e) { /* ignore */ } realChatsUnsub = null; }
}
function startRealMessages(chatId) {
  stopRealMessages();
  realMsgsChatId = chatId;
  realMsgsUnsub = window.KsriFirebase.listenToMessages(chatId, function (docs, err) {
    if (err) { toast('Could not load messages'); return; }
    var chat = getChat(chatId); if (!chat) return;
    chat.messages = docs.map(mapRealMessage).filter(function (m) { return !m._hiddenForMe; });
    /* Resolve sender names for incoming messages. */
    var need = {};
    chat.messages.forEach(function (m) { if (m.senderId && m.senderId !== myUid() && !realUserCache[m.senderId]) need[m.senderId] = true; });
    Object.keys(need).forEach(function (uid) {
      window.KsriFirebase.getUserProfile(uid).then(function (p) {
        if (!p) return;
        realUserCache[uid] = p;
        var c2 = getChat(chatId);
        if (c2 && currentChatId === chatId) {
          c2.messages.forEach(function (m) { if (m.senderId === uid) m.from = p.displayName || m.from; });
          renderMessages();
        }
      }).catch(function () { /* names stay generic — best effort */ });
    });
    if (currentChatId === chatId) renderMessages();
    renderChats();
  });
}
function stopRealMessages() {
  if (realMsgsUnsub) { try { realMsgsUnsub(); } catch (e) { /* ignore */ } realMsgsUnsub = null; }
  realMsgsChatId = null;
}

/* ---------- REAL NEW CHAT / GROUP ---------- */
function openRealNewChat() {
  var html = '<h3>New chat</h3><p class="muted small">Find a real Ksri user by their phone number or email. They must have signed up on Ksri already.</p>' +
    '<label>Phone or email</label><input id="real-search-input" type="text" placeholder="+91 98765 43210 or name@example.com">' +
    '<div class="modal-actions"><button class="btn-outline" onclick="closeModal()">Cancel</button>' +
    '<button class="btn-primary" onclick="searchRealUser()">Search</button></div>' +
    '<div id="real-search-results"></div>' +
    '<button class="menu-item" onclick="closeModal();createGroupFlow()">👥 New group</button>' +
    '<button class="menu-item" onclick="closeModal();openNotesChat()">📝 Notes to Self</button>';
  openModal(html);
}
function searchRealUser() {
  var v = ($('real-search-input').value || '').trim();
  /* Stored phones are normalised (+91…), so normalise the search too —
     a bare 10-digit number must find the same user. */
  if (v && v.indexOf('@') === -1) v = normalizePhone(v);
  var box = $('real-search-results');
  if (!v) { box.innerHTML = '<p class="error">Enter a phone number or email.</p>'; return; }
  box.innerHTML = '<p class="muted small">Searching…</p>';
  window.KsriFirebase.findUserByContact(v).then(function (users) {
    if (!users.length) {
      box.innerHTML = '<p class="muted">No Ksri user found for <b>' + esc(v) + '</b>. They need to sign up on Ksri first.</p>';
      return;
    }
    box.innerHTML = users.map(function (u) {
      if (u.uid === myUid()) return '<p class="muted small">That is you 🙂</p>';
      return '<button class="menu-item" onclick="startRealChatWith(\'' + esc(u.uid) + '\',\'' + esc(u.displayName || u.phone || u.email || '').replace(/\'/g, "\\'") + '\')">👤 ' + esc(u.displayName || u.phone || u.email || '') + ' <span class="muted small">' + esc(u.phone || u.email || '') + '</span></button>';
    }).join('');
  }).catch(function (e) {
    box.innerHTML = '<p class="error">Search failed: ' + esc(e && e.message ? e.message : e) + '</p>';
  });
}
function startRealChatWith(uid, name) {
  window.KsriFirebase.ensureDM(uid).then(function (chatId) {
    var doc = { _id: chatId, participants: [myUid(), uid], type: 'dm', name: '', lastMessage: '', typing: {} };
    var chat = upsertRealChat(doc);
    if (name) chat.name = name;
    save(); closeModal(); renderChats(); openChat(chatId);
  }).catch(function (e) { toast('Could not start chat: ' + (e && e.message ? e.message : e)); });
}

/* ---------- REAL BOOT ---------- */
function afterFirebaseAuth() {
  if (window.KsriFirebase && window.KsriFirebase.user) {
    realMode = true;
    var fbUser = window.KsriFirebase.user;
    window.KsriFirebase.getUserProfile(fbUser.uid).then(function (p) {
      if (p) {
        state.user = {
          name: p.displayName || 'Ksri user', bio: p.bio || '',
          color: p.avatarColor || '#25D366',
          method: p.phone ? 'phone' : 'email', value: p.phone || p.email || '',
          uid: fbUser.uid, joinedAt: (state.user && state.user.joinedAt) || Date.now()
        };
      } else if (!state.user) {
        state.user = {
          name: fbUser.phoneNumber || fbUser.email || 'Ksri user',
          bio: "Hey there! I'm using Ksri.", color: '#25D366',
          method: fbUser.phoneNumber ? 'phone' : 'email',
          value: fbUser.phoneNumber || fbUser.email || '',
          uid: fbUser.uid, joinedAt: Date.now()
        };
      } else {
        state.user.uid = fbUser.uid;
      }
      save();
      enterApp();
    }).catch(function () { enterApp(); });
  } else {
    /* Real mode configured but not signed in — show the real sign-in screen. */
    realMode = false;
    $('auth-screen').classList.remove('hidden');
    $('app-screen').classList.add('hidden');
    showStep('step-method');
    updateModeBadge();
  }
  checkScheduled(); checkReminders();
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', function () {
  applyTheme(); applyFontSize();
  onTypingInput();
  updateModeBadge();
  var booted = false;
  var boot = function () {
    if (booted) return; booted = true;
    /* firebase.js may have settled already (placeholder config settles
       synchronously); otherwise this runs when its ready event fires,
       or after the 4s fallback below (CDN unreachable -> demo mode). */
    if (window.KsriFirebase) firebaseReady = !!window.KsriFirebase.ready;
    updateModeBadge();
    if (firebaseReady) {
      /* Returning from an email sign-in link? Complete it first. */
      if (window.KsriFirebase.isEmailLink && window.KsriFirebase.isEmailLink()) {
        window.KsriFirebase.completeEmailLink().then(function () {
          afterFirebaseAuth();
        }).catch(function (e) {
          toast(window.KsriFirebase.friendlyAuthError(e));
          realMode = false;
          $('auth-screen').classList.remove('hidden');
          showStep('step-method');
          updateModeBadge();
        });
        return;
      }
      afterFirebaseAuth();
      return;
    }
    /* Demo mode (unchanged behaviour). */
    if (state.user) enterApp();
    else { $('auth-screen').classList.remove('hidden'); showStep('step-method'); }
    checkScheduled(); checkReminders();
  };
  if (window.__ksriFirebaseSettled) {
    boot();
  } else {
    window.addEventListener('ksri-firebase-ready', boot);
    setTimeout(boot, 4000);
  }
});
