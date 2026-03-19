const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('darknite', {
  install: async (type, id, content, target) => {
    return await ipcRenderer.invoke('install-capability', { type, id, content, target: target || 'claude' });
  },
  scanRepo: async (repoUrl) => {
    return await ipcRenderer.invoke('github-scan-repo', repoUrl);
  },
  fetchFile: async (owner, repo, filePath) => {
    return await ipcRenderer.invoke('github-fetch-file', { owner, repo, filePath });
  },
  checkForAppUpdate: async () => {
    return await ipcRenderer.invoke('check-for-app-update');
  },
  getAppVersion: async () => {
    return await ipcRenderer.invoke('get-app-version');
  },
  detectEditors: async () => {
    return await ipcRenderer.invoke('detect-editors');
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  }
});
