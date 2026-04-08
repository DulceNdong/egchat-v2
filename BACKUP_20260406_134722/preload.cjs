const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
});
