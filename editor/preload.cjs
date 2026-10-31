const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('makuluDesktop', {
  getElectraAuth: () => ipcRenderer.invoke('get-system-electra-auth'),
  readBundledAsset: url => ipcRenderer.invoke('read-bundled-asset', url),
  getExportRuntimes: () => ipcRenderer.invoke('get-export-runtimes')
});
