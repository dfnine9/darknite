const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Pre-load data via Node.js fs as backup for script tag
let JARVIS_DATA_CACHE = null;
try {
  const dataPath = path.join(__dirname, 'src', 'dashboard-data.js');
  console.log('[Preload] Loading data from:', dataPath);
  const src = fs.readFileSync(dataPath, 'utf8');
  console.log('[Preload] File read OK, size:', src.length);
  // Extract JSON after "window._JARVIS_RAW = " and before trailing semicolon
  let jsonStr = src.substring(src.indexOf('{'));
  if (jsonStr.endsWith(';\n') || jsonStr.endsWith(';')) jsonStr = jsonStr.replace(/;\s*$/, '');
  JARVIS_DATA_CACHE = JSON.parse(jsonStr);
  console.log('[Preload] Parsed:', JARVIS_DATA_CACHE.skills?.length, 'skills,', JARVIS_DATA_CACHE.agents?.length, 'agents,', JARVIS_DATA_CACHE.commands?.length, 'commands');
} catch (e) {
  console.warn('[Preload] fs load failed (script tag will handle it):', e.message);
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
