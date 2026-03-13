const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mawaqitAPI', {
  saveMosque: (mosqueData) => ipcRenderer.invoke('save-mosque', mosqueData),
  getSavedMosque: () => ipcRenderer.invoke('get-saved-mosque'),
  clearMosque: () => ipcRenderer.invoke('clear-mosque'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Listen for events from main process
  onLoadSavedMosque: (callback) => {
    ipcRenderer.on('load-saved-mosque', (event, data) => callback(data));
  },
  onResetMosque: (callback) => {
    ipcRenderer.on('reset-mosque', () => callback());
  }
});
