// Ksri — Windows desktop wrapper (Electron).
// Loads the same offline www/ app as the Android / iOS shells, from a
// file:// URL. No server, no network — all data lives in localStorage
// (key ksri_v1), exactly as on mobile. Run: npm run windows:dev
// Build the installer: npm run windows:build  (electron-builder, NSIS).
'use strict';
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 420,
    height: 880,
    minWidth: 360,
    minHeight: 640,
    title: 'Ksri',
    autoHideMenuBar: true,
    webPreferences: {
      // No Node in the web app: www/app.js is plain browser JS.
      nodeIntegration: false,
      contextIsolation: true,
      // Media (voice notes) needs the microphone; the OS will prompt.
      sandbox: false,
    },
  });
  // www/ sits next to electron/ in the repo and in the packaged app:
  // resources/app/electron/main.js -> resources/app/www/index.html
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
  return win;
}

app.whenReady().then(() => {
  createWindow();
  // macOS: re-create a window when the dock icon is clicked.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS (standard behaviour).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = { createWindow };
