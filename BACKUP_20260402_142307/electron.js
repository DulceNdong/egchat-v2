import { app, BrowserWindow, Menu, shell, session, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 375, height: 812,
    minWidth: 320, minHeight: 568,
    maxWidth: 428, maxHeight: 926,
    icon: path.join(__dirname, 'public/logo-120.svg.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.cjs'),
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    },
    show: false,
    backgroundColor: '#EEF2F7',
    title: 'EGCHAT - Guinea Ecuatorial',
    resizable: true, maximizable: false, minimizable: true,
    titleBarStyle: 'default', frame: true
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media','camera','microphone','audioCapture','videoCapture','screen','display-capture'];
    callback(allowed.includes(permission));
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    return ['media','camera','microphone','audioCapture','videoCapture'].includes(permission);
  });

  // Bloquear apertura de ventanas externas
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked external window:', url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.setWindowOpenHandler(({ url }) => {
      webContents.loadURL(url);
      return { action: 'deny' };
    });
  });

  const devUrl = `http://localhost:3002?t=${Date.now()}`;
  const prodUrl = `file://${path.join(__dirname, 'dist/index.html')}`;
  const startUrl = isDev ? devUrl : prodUrl;

  const loadWithRetry = async (url, retries = 8) => {
    for (let i = 0; i < retries; i++) {
      try {
        await mainWindow.loadURL(url);
        console.log('Loaded:', url);
        return;
      } catch (e) {
        console.log(`Attempt ${i+1} failed:`, e.message);
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  mainWindow.webContents.session.clearCache().then(() => {
    loadWithRetry(startUrl);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.center();
    if (isDev) setTimeout(() => mainWindow.webContents.openDevTools(), 1000);
  });

  // Fallback: mostrar ventana aunque no dispare ready-to-show
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.center();
    }
  }, 3000);

  mainWindow.on('closed', () => { mainWindow = null; });
}

function createMenu() {
  const template = [
    { label: 'EGCHAT', submenu: [
      { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
      { label: 'DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
      { type: 'separator' },
      { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
    ]},
    { label: 'Dispositivos', submenu: [
      { label: 'iPhone SE (375x667)', click: () => { mainWindow.setSize(375,667); mainWindow.center(); } },
      { label: 'iPhone 14 (390x844)', click: () => { mainWindow.setSize(390,844); mainWindow.center(); } },
      { label: 'iPhone Pro Max (428x926)', click: () => { mainWindow.setSize(428,926); mainWindow.center(); } },
      { type: 'separator' },
      { label: 'Centrar', accelerator: 'CmdOrCtrl+Shift+C', click: () => mainWindow.center() }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivo',
    filters: [
      { name: 'Imágenes y Vídeos', extensions: ['jpg','jpeg','png','gif','webp','mp4','webm','mov'] },
    ],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const ext = filePath.split('.').pop().toLowerCase();
  const isVideo = ['mp4','webm','mov','avi','mkv'].includes(ext);
  return { path: filePath, url: `file://${filePath}`, isVideo };
});

app.whenReady().then(() => {
  createWindow();
  createMenu();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

process.on('uncaughtException', (e) => console.error('Uncaught:', e));
process.on('unhandledRejection', (r) => console.error('Unhandled:', r));
