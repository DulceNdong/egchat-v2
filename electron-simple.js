import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración para Windows
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
}

let mainWindow;

function createWindow() {
  console.log('Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    mainWindow.focus();
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Try to load from dev server or show error
  const devUrl = 'http://localhost:3006';
  console.log('Loading URL:', devUrl);
  
  mainWindow.loadURL(devUrl).catch(err => {
    console.error('Failed to load dev server, trying ports 3001-3005...');
    const ports = [3001, 3002, 3003, 3004, 3005];
    
    let portIndex = 0;
    const tryPort = () => {
      if (portIndex >= ports.length) {
        console.error('Failed to connect to any development server');
        mainWindow.loadFile('public/error.html').catch(() => {
          mainWindow.loadURL(`data:text/html,<h1>Error</h1><p>Could not load application. Make sure dev server is running on port 3001-3006</p>`);
        });
        return;
      }
      
      const port = ports[portIndex];
      const url = `http://localhost:${port}`;
      console.log(`Trying port ${port}...`);
      
      mainWindow.loadURL(url).then(() => {
        console.log(`Successfully loaded from port ${port}`);
      }).catch(() => {
        portIndex++;
        tryPort();
      });
    };
    
    tryPort();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('App ready event fired');
  createWindow();
  
  // Simple menu
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'exit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];
  
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

console.log('Electron main script loaded');
