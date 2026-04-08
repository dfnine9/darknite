const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load JARVIS_DATA directly in preload using Node.js fs
// This runs BEFORE the page loads — data is ready immediately
let _preloadedData = null;

function loadData() {
  const searchPaths = [
    // Unpacked (outside asar) — works on Mac + Windows packaged
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'dashboard-data.js'),
    // Inside asar — Windows reads this transparently
    path.join(__dirname, 'src', 'dashboard-data.js'),
    // Dev mode
    path.join(__dirname, '..', 'src', 'dashboard-data.js'),
  ];

  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        const src = fs.readFileSync(p, 'utf8');
        // Skip Git LFS pointers
        if (src.startsWith('version ')) continue;
        // Extract JSON from various formats:
        // "window._JARVIS_RAW = {...};" or "const JARVIS_DATA = {...};" or just "{...}"
        let json = src;
        json = json.replace(/^(?:window\._JARVIS_RAW|const\s+JARVIS_DATA|var\s+JARVIS_DATA)\s*=\s*/, '');
        json = json.replace(/;\s*$/, '');
        const data = JSON.parse(json);
        console.log('[preload] Loaded from:', p);
        console.log('[preload] Skills:', data.skills?.length, 'Agents:', data.agents?.length, 'Commands:', data.commands?.length);
        return data;
      }
    } catch (e) {
      console.log('[preload] Failed:', p, e.message);
    }
  }

  // Fallback: try data.b64
  const b64Paths = [
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'data.b64'),
    path.join(__dirname, 'src', 'data.b64'),
  ];
  for (const p of b64Paths) {
    try {
      let origFs;
      try { origFs = require('original-fs'); } catch(e) { origFs = fs; }
      if (origFs.existsSync(p)) {
        const b64 = origFs.readFileSync(p, 'utf8').trim();
        if (b64.startsWith('version ')) continue;
        const json = Buffer.from(b64, 'base64').toString('utf8');
        const data = JSON.parse(json);
        console.log('[preload] Loaded from b64:', p);
        return data;
      }
    } catch (e) {
      console.log('[preload] b64 failed:', p, e.message);
    }
  }

  console.error('[preload] ALL data loading methods failed');
  return null;
}

try {
  _preloadedData = loadData();
} catch (e) {
  console.error('[preload] Fatal:', e.message);
}

contextBridge.exposeInMainWorld('darknite', {
  getData: () => _preloadedData,
  loadContent: (type, id) => ipcRenderer.invoke('load-content', { type, id }),
  install: (type, id, content, target) => ipcRenderer.invoke('install-capability', { type, id, content, target: target || 'claude' }),
  scanRepo: (repoUrl) => ipcRenderer.invoke('github-scan-repo', repoUrl),
  fetchFile: (owner, repo, filePath) => ipcRenderer.invoke('github-fetch-file', { owner, repo, filePath }),
  checkForAppUpdate: () => ipcRenderer.invoke('check-for-app-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  detectEditors: () => ipcRenderer.invoke('detect-editors'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  verifyInstall: () => ipcRenderer.invoke('verify-install'),
  loadData: () => ipcRenderer.invoke('load-data'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  onUpdateStatus: (cb) => ipcRenderer.on('update-status', (e, data) => cb(data))
});
