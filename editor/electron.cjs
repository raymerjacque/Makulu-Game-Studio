const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// IPC handler to read ~/.config/ai_terminal/electra_auth.json on MakuluLinux OS
ipcMain.handle('get-system-electra-auth', () => {
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
    console.warn('Could not read ~/.config/ai_terminal/electra_auth.json:', err.message);
  }
  return null;
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
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
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
