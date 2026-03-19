const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load JARVIS_DATA directly via Node.js fs (sandbox: false enables this)
let JARVIS_DATA_CACHE = null;
try {
  const dataPath = path.join(__dirname, 'src', 'dashboard-data.js');
  console.log('[Preload] Loading data from:', dataPath);
  const src = fs.readFileSync(dataPath, 'utf8');
  console.log('[Preload] File read OK, size:', src.length, 'chars');
  const fn = new Function(src + '; return JARVIS_DATA;');
  JARVIS_DATA_CACHE = fn();
  console.log('[Preload] JARVIS_DATA parsed:', JARVIS_DATA_CACHE.skills?.length, 'skills,', JARVIS_DATA_CACHE.agents?.length, 'agents,', JARVIS_DATA_CACHE.commands?.length, 'commands');
} catch (e) {
  console.error('[Preload] FAILED to load data:', e.message);
  JARVIS_DATA_CACHE = { skills: [], agents: [], commands: [] };
}

contextBridge.exposeInMainWorld('darknite', {
  getData: () => JARVIS_DATA_CACHE,
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
