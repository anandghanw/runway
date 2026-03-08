const { contextBridge, ipcRenderer } = require('electron')

// Mark document as running inside Electron so CSS can adjust layout
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron')
})

contextBridge.exposeInMainWorld('electronAPI', {
  writeBackup: (content) => ipcRenderer.invoke('backup-write', content),
  readBackup: () => ipcRenderer.invoke('backup-read'),
})
