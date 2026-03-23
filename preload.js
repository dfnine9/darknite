const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Load data DIRECTLY in preload using Node.js — no IPC, no fetch, no size limits
// This runs before the page loads and has full Node.js access
let _preloadedData = null;

function loadFromB64(filePath, fsModule) {
  if (!fsModule.existsSync(filePath)) return null;
  const raw = fsModule.readFileSync(filePath, 'utf8').trim();
  if (raw.startsWith('version ')) {
    console.log('[preload] Skipped LFS pointer:', filePath);
    return null;
  }
  console.log('[preload] Reading from:', filePath, '(' + raw.length + ' chars)');
  const json = Buffer.from(raw, 'base64').toString('utf8');
  const data = JSON.parse(json);
  console.log('[preload] Loaded:', data.skills?.length, 'skills,', data.agents?.length, 'agents,', data.commands?.length, 'commands');
  return data;
}

// Fallback: load from jarvis/ folder (extracted markdown files)
function loadFromJarvisFolder() {
  const jarvisPaths = [
    path.join(__dirname, 'jarvis'),
    path.join(__dirname, '..', 'jarvis'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'jarvis'),
  ];

  for (const jarvisDir of jarvisPaths) {
    try {
      const skillsDir = path.join(jarvisDir, 'skills');
      const agentsDir = path.join(jarvisDir, 'agents');
      const commandsDir = path.join(jarvisDir, 'commands');
      if (!fs.existsSync(skillsDir)) continue;

      console.log('[preload] Loading from jarvis/ folder:', jarvisDir);
      const data = { skills: [], agents: [], commands: [] };

      // Load skills
      const skillDirs = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.'));
      for (const sid of skillDirs) {
        const skillFile = path.join(skillsDir, sid, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf8');
          const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
          data.skills.push({ id: sid, d: descMatch ? descMatch[1] : sid, c: content });
        }
      }

      // Load agents
      if (fs.existsSync(agentsDir)) {
        const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
        for (const af of agentFiles) {
          const content = fs.readFileSync(path.join(agentsDir, af), 'utf8');
          const id = af.replace('.md', '');
          const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
          data.agents.push({ id, d: descMatch ? descMatch[1] : id, c: content });
        }
      }

      // Load commands
      if (fs.existsSync(commandsDir)) {
        const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
        for (const cf of cmdFiles) {
          const content = fs.readFileSync(path.join(commandsDir, cf), 'utf8');
          const id = 'commands/' + cf.replace('.md', '');
          const descMatch = content.match(/description:\s*"?([^"\n]+)"?/);
          data.commands.push({ id, d: descMatch ? descMatch[1] : id, c: content });
        }
      }

      console.log('[preload] Loaded from jarvis/:', data.skills.length, 'skills,', data.agents.length, 'agents,', data.commands.length, 'commands');
      return data;
    } catch (e) {
      console.log('[preload] jarvis/ folder failed:', jarvisDir, e.message);
    }
  }
  return null;
}

function loadDataInPreload() {
  // Try original-fs first (bypasses ASAR)
  let origFs;
  try { origFs = require('original-fs'); } catch(e) { origFs = fs; }

  const searchPaths = [
    // Unpacked path (outside ASAR) — preferred for packaged apps
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'data.b64'),
    // Dev mode paths
    path.join(__dirname, 'src', 'data.b64'),
    path.join(__dirname, '..', 'src', 'data.b64'),
    // Inside ASAR (macOS packaged)
    path.join(process.resourcesPath || '', 'app', 'src', 'data.b64'),
    // Fallback
    path.join(process.resourcesPath || '', 'src', 'data.b64'),
  ];

  console.log('[preload] Searching for data.b64...');

  // Strategy 1: Load from data.b64
  for (const p of searchPaths) {
    for (const mod of [origFs, fs]) {
      try {
        const data = loadFromB64(p, mod);
        if (data) return data;
      } catch (e) {
        console.log('[preload] Failed:', p, e.message);
      }
    }
  }

  // Strategy 2: Load from jarvis/ folder (extracted markdown files)
  console.log('[preload] data.b64 not found, trying jarvis/ folder...');
  const jarvisData = loadFromJarvisFolder();
  if (jarvisData) return jarvisData;

  console.error('[preload] FATAL: No data source found (data.b64 or jarvis/ folder)');
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
