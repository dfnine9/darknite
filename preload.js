const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load data DIRECTLY in preload using Node.js — no IPC, no fetch, no size limits
// This runs before the page loads and has full Node.js access
let _preloadedData = null;

function loadDataInPreload() {
  // Try original-fs first (bypasses ASAR), then regular fs
  let origFs;
  try { origFs = require('original-fs'); } catch(e) { origFs = fs; }

  const searchPaths = [
    // Unpacked path (outside ASAR) — preferred for packaged apps
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'data.b64'),
    // Dev mode paths
    path.join(__dirname, 'src', 'data.b64'),
    path.join(__dirname, '..', 'src', 'data.b64'),
    // Fallback
    path.join(process.resourcesPath || '', 'src', 'data.b64'),
  ];

  console.log('[preload] Searching for data.b64...');

  for (const p of searchPaths) {
    // Try with original-fs (bypasses ASAR)
    for (const mod of [origFs, fs]) {
      try {
        if (mod.existsSync(p)) {
          const raw = mod.readFileSync(p, 'utf8').trim();
          // Skip Git LFS pointers
          if (raw.startsWith('version ')) {
            console.log('[preload] Skipped LFS pointer:', p);
            continue;
          }
          console.log('[preload] Reading from:', p, '(' + raw.length + ' chars)');
          const json = Buffer.from(raw, 'base64').toString('utf8');
          const data = JSON.parse(json);
          console.log('[preload] Loaded:', data.skills?.length, 'skills,', data.agents?.length, 'agents,', data.commands?.length, 'commands');
          return data;
        }
      } catch (e) {
        console.log('[preload] Failed:', p, e.message);
      }
    }
  }

  console.error('[preload] data.b64 NOT FOUND in any location');
  return null;
}

try {
  _preloadedData = loadDataInPreload();
} catch (e) {
  console.error('[preload] Fatal error loading data:', e.message);
}

contextBridge.exposeInMainWorld('darknite', {
  // Direct data access — no IPC needed
  getData: () => _preloadedData,

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
  loadData: async () => {
    return await ipcRenderer.invoke('load-data');
  },
  getDataPath: async () => {
    return await ipcRenderer.invoke('get-data-path');
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  }
});
