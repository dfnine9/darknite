const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load JARVIS_DATA via Node.js fs (sandbox:false enables this)
// Try multiple paths to find the data file
let JARVIS_DATA_CACHE = null;
const searchPaths = [
  path.join(__dirname, 'src', 'dashboard-data.js'),
  path.join(process.resourcesPath || '', 'dashboard-data.js'),
  path.join(__dirname, '..', 'dashboard-data.js'),
];

for (const dp of searchPaths) {
  if (JARVIS_DATA_CACHE) break;
  try {
    if (!fs.existsSync(dp)) continue;
    console.log('[Preload] Trying:', dp);
    const src = fs.readFileSync(dp, 'utf8');
    if (src.length < 1000) { console.log('[Preload] File too small, skipping:', src.length); continue; }
    console.log('[Preload] File read OK, size:', src.length);
    // Use Function constructor - handles the "window._JARVIS_RAW = {...};" format
    const fn = new Function('window', src + '; return window._JARVIS_RAW || (typeof JARVIS_DATA !== "undefined" ? JARVIS_DATA : null);');
    const fakeWindow = {};
    JARVIS_DATA_CACHE = fn(fakeWindow);
    if (JARVIS_DATA_CACHE && JARVIS_DATA_CACHE.skills) {
      console.log('[Preload] SUCCESS:', JARVIS_DATA_CACHE.skills.length, 'skills,', JARVIS_DATA_CACHE.agents.length, 'agents,', JARVIS_DATA_CACHE.commands.length, 'commands');
    } else {
      console.warn('[Preload] Parsed but no skills found');
      JARVIS_DATA_CACHE = null;
    }
  } catch (e) {
    console.warn('[Preload] Failed on', dp, ':', e.message);
  }
}

if (!JARVIS_DATA_CACHE) {
  console.error('[Preload] ALL paths failed - main process injection will be the fallback');
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
  openFolder: async (folderPath) => {
    return await ipcRenderer.invoke('open-folder', folderPath);
  },
  verifyInstall: async () => {
    return await ipcRenderer.invoke('verify-install');
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  }
});
