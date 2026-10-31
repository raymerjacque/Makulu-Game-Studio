const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { readBundledAsset } = require('./bundled-assets.cjs');
const { confirmUnsavedClose, isTrustedDocument, isTrustedAuthSender, isSafeExternalUrl, packagedEntryUrl } = require('./desktop-security.cjs');

let studioWindow = null;
let trustedEntryUrl = null;

// IPC handler to read ~/.config/ai_terminal/electra_auth.json on MakuluLinux OS
ipcMain.handle('get-system-electra-auth', (event) => {
  if (!isTrustedAuthSender(event, studioWindow, trustedEntryUrl)) return null;
  try {
    const authPath = path.join(os.homedir(), '.config', 'ai_terminal', 'electra_auth.json');
    if (fs.existsSync(authPath)) {
      const data = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      if (data && data.api_key) {
        return {
          apiKey: data.api_key,
          username: data.username || 'MakuluUser',
          tier: data.tier || 'Free',
          dailyLimit: data.daily_limit || 0,
          usedToday: data.used_today || 0
        };
      }
    }
  } catch (err) {
    console.warn('System Electra authentication is unavailable.');
  }
  return null;
});

ipcMain.handle('read-bundled-asset', async (event, url) => {
  if (!isTrustedAuthSender(event, studioWindow, trustedEntryUrl)) return null;
  try {
    // The production renderer loads dist/index.html; its bundled media also lives in dist.
    return await readBundledAsset(path.join(__dirname, 'dist'), url);
  } catch { return null; }
});

// Ensure WebGL & GPU hardware acceleration work reliably across all Linux distros
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-webgl');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'MakuluLinux Game Studio',
    backgroundColor: '#0a0d11',
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      enableRemoteModule: false
    }
  });

  studioWindow = mainWindow;
  const packagedUrl = packagedEntryUrl(path.join(__dirname, 'dist', 'index.html'));
  const developmentUrl = 'http://127.0.0.1:3000/';
  trustedEntryUrl = (app.isPackaged || process.env.NODE_ENV === 'production') ? packagedUrl : developmentUrl;

  // Keep untrusted documents away from the credential-bearing preload bridge.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedDocument(url, trustedEntryUrl)) event.preventDefault();
  });
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (!isTrustedDocument(url, trustedEntryUrl)) event.preventDefault();
  });
  mainWindow.on('closed', () => {
    if (studioWindow === mainWindow) {
      studioWindow = null;
      trustedEntryUrl = null;
    }
  });

  mainWindow.webContents.on('will-prevent-unload', event => confirmUnsavedClose(event, mainWindow, dialog));

  // Remove default menu bar for modern editor feel
  mainWindow.setMenuBarVisibility(false);

  // Diagnostic logging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('MakuluStudio Load Failure:', validatedURL, errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.warn(`[Renderer Warning] ${message} (${sourceId}:${line})`);
    }
  });

  // In packaged/production mode load built files; in dev mode load dev server with fallback
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    mainWindow.loadURL(developmentUrl).catch(() => {
      trustedEntryUrl = packagedUrl;
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url).catch(() => console.warn('External link could not be opened.'));
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
