import pkg from 'electron';
const { app, BrowserWindow } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false // Don't show until ready
  });

  console.log('Window created, loading content...');
  
  // Load a simple HTML page
  mainWindow.loadURL('data:text/html,<h1>Electron is working!</h1><p>App loaded successfully.</p>');
  
  mainWindow.show();
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('App ready!');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('Error in app.whenReady():', err);
});

app.on('window-all-closed', () => {
  console.log('All windows closed, quitting...');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
