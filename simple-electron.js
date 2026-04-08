const { app, BrowserWindow } = require('electron');

function createWindow() {
  console.log('Creating window...');
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: true
  });

  win.loadURL('data:text/html,<h1>Simple Electron App</h1><p>Window should be visible now!</p>');
  
  win.webContents.openDevTools();
  
  console.log('Window created and shown');
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('Script loaded');
