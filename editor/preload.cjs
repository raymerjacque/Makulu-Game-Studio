const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('makuluDesktop', {
  getElectraAuth: () => ipcRenderer.invoke('get-system-electra-auth')
});
