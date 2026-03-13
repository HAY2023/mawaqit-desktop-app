const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(800, height),
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0a1628',
    show: false,
    title: 'MAWAQIT - Prayer Times'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check if we have a saved mosque, auto-load it
    const savedMosque = store.get('selectedMosque');
    if (savedMosque) {
      mainWindow.webContents.send('load-saved-mosque', savedMosque);
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle F11 for fullscreen toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    if (input.key === 'Escape' && mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  
  try {
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
  } catch (e) {
    // If icon fails, create a simple tray without icon
    const trayIcon = nativeImage.createEmpty();
    tray = new Tray(trayIcon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show MAWAQIT',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Fullscreen Mode',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.setFullScreen(true);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Reset Mosque',
      click: () => {
        store.delete('selectedMosque');
        if (mainWindow) {
          mainWindow.webContents.send('reset-mosque');
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('MAWAQIT - Prayer Times');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.handle('save-mosque', (event, mosqueData) => {
  store.set('selectedMosque', mosqueData);
  return true;
});

ipcMain.handle('get-saved-mosque', () => {
  return store.get('selectedMosque') || null;
});

ipcMain.handle('clear-mosque', () => {
  store.delete('selectedMosque');
  return true;
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
