const { app, BrowserWindow } = require('electron');

console.log('=== DEBUG: Starting Electron ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);

function createWindow() {
  console.log('=== DEBUG: Creating window ===');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log('=== DEBUG: Window created ===');
  
  win.loadURL('data:text/html,<h1>DEBUG WINDOW</h1><p>If you see this, Electron is working!</p>');
  
  console.log('=== DEBUG: Content loaded ===');
  
  win.webContents.openDevTools();
  
  console.log('=== DEBUG: DevTools opened ===');
  
  win.on('closed', () => {
    console.log('=== DEBUG: Window closed ===');
  });
}

app.whenReady().then(() => {
  console.log('=== DEBUG: App ready ===');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('=== DEBUG: All windows closed ===');
  app.quit();
});

console.log('=== DEBUG: Script loaded ===');
