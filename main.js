const { app, BrowserWindow, Menu, ipcMain, dialog, protocol, net } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { pathToFileURL } = require('url');

let mainWindow;

// === MEMORY (handle 49MB data file) ===
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// === GPU ACCELERATION ===
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
if (process.platform === 'win32') {
  // Windows-specific flags (NVIDIA 3060 etc.)
  app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top,underlay');
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,CanvasOopRasterization');
  app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
} else if (process.platform === 'darwin') {
  // macOS Metal acceleration
  app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization,Metal');
}

// === AUTO-UPDATER ===
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdate] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdate] Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
  }
});

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdate] App is up to date');
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'downloading', percent: Math.round(progress.percent) });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdate] Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'ready', version: info.version });
    // Only show dialog after boot animation (delay 5s to let boot finish)
    setTimeout(() => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'DarkNite Update',
        message: `Version ${info.version} is ready to install.`,
        detail: 'The update will be installed when you close the app.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }, 5000);
  }
});

autoUpdater.on('error', (err) => {
  console.log('[AutoUpdate] Error:', err.message);
});

// IPC: Load capability data from data.b64 file
// Use original-fs to bypass Electron's ASAR interception (critical for large files on macOS)
const origFs = require('original-fs');

// Decode data.b64 at startup and write JSON to temp file for reliable renderer access
let dataJsonPath = null;

function prepareDataFile() {
  const possiblePaths = [
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'src', 'data.b64'),
    path.join(__dirname, 'src', 'data.b64'),
    path.join(__dirname, '..', 'src', 'data.b64'),
    path.join(process.resourcesPath || '', 'src', 'data.b64')
  ];

  console.log('[load-data] Searching paths:', possiblePaths);

  for (const p of possiblePaths) {
    try {
      const isUnpacked = p.includes('app.asar.unpacked');
      const fsModule = isUnpacked ? origFs : fs;
      if (fsModule.existsSync(p)) {
        const b64 = fsModule.readFileSync(p, 'utf8').trim();
        if (b64.startsWith('version ')) {
          console.log('[load-data] Skipped LFS pointer at:', p);
          continue;
        }
        console.log('[load-data] Read from:', p, '(' + b64.length + ' chars)');
        const json = Buffer.from(b64, 'base64').toString('utf8');
        // Write decoded JSON to temp file so renderer can fetch it without IPC size limits
        dataJsonPath = path.join(os.tmpdir(), 'darknite-data.json');
        fs.writeFileSync(dataJsonPath, json, 'utf8');
        console.log('[load-data] Wrote temp JSON:', dataJsonPath, '(' + json.length + ' bytes)');
        return true;
      }
    } catch (e) {
      console.log('[load-data] Skipped:', p, e.message);
    }
  }
  console.error('[load-data] data.b64 not found in any expected location');
  return false;
}

// IPC: Get path to decoded data JSON (renderer fetches it directly)
ipcMain.handle('get-data-path', async () => {
  if (!dataJsonPath) prepareDataFile();
  return dataJsonPath ? { success: true, path: dataJsonPath } : { success: false, error: 'data.b64 not found' };
});

// IPC: Load data directly via IPC (fallback for small datasets or if fetch fails)
ipcMain.handle('load-data', async () => {
  try {
    if (!dataJsonPath) prepareDataFile();
    if (!dataJsonPath) return { success: false, error: 'data.b64 not found' };
    const json = fs.readFileSync(dataJsonPath, 'utf8');
    const data = JSON.parse(json);
    console.log('[load-data] Parsed:', data.skills?.length, 'skills,', data.agents?.length, 'agents,', data.commands?.length, 'commands');
    return { success: true, data };
  } catch (err) {
    console.error('[load-data] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// IPC: Manual check for app updates
ipcMain.handle('check-for-app-update', async () => {
  try {
    autoUpdater.checkForUpdates();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC: Get current app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// === CUSTOM PROTOCOL: serve data files from app directory ===
// This bypasses ALL asar/atob/IPC size limits
protocol.registerSchemesAsPrivileged([{
  scheme: 'darknite',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
}]);

function createWindow() {
  // Register protocol handler BEFORE creating window
  protocol.handle('darknite', (request) => {
    const url = new URL(request.url);
    // Serve files from src/ directory inside the app
    const filePath = path.join(__dirname, 'src', url.pathname);
    try {
      const fileUrl = pathToFileURL(filePath).href;
      return net.fetch(fileUrl);
    } catch (e) {
      console.error('[Protocol] Failed to serve:', filePath, e.message);
      return new Response('Not found', { status: 404 });
    }
  });

  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'DarkNite - Powered by JARVIS',
    icon: path.join(__dirname, 'src', 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });

  Menu.setApplicationMenu(null);

  // Load the app via our custom protocol — this ensures ALL resources
  // (including dashboard-data.js) are served through the protocol handler
  // which reads from the asar transparently on all platforms
  mainWindow.loadURL('darknite:///index.html');
}

// HTTPS GET with redirect following
function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'DarkNite/1.0', 'Accept': 'application/json' }, ...opts };
    https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        return httpGet(res.headers.location, opts).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

// Helper: install to a specific base directory
function installToDir(baseDir, type, id, content) {
  let destPath;
  if (type === 'skill') {
    const skillDir = path.join(baseDir, 'skills', id);
    fs.mkdirSync(skillDir, { recursive: true });
    destPath = path.join(skillDir, 'SKILL.md');
  } else if (type === 'agent') {
    fs.mkdirSync(path.join(baseDir, 'agents'), { recursive: true });
    destPath = path.join(baseDir, 'agents', id + '.md');
  } else if (type === 'command') {
    const cleanId = id.replace(/^commands\//, '');
    fs.mkdirSync(path.join(baseDir, 'commands'), { recursive: true });
    destPath = path.join(baseDir, 'commands', cleanId + '.md');
  } else {
    throw new Error('Unknown type: ' + type);
  }
  fs.writeFileSync(destPath, content, 'utf8');
  // Verify the file was actually written
  if (!fs.existsSync(destPath)) {
    throw new Error('File was not written: ' + destPath);
  }
  const stat = fs.statSync(destPath);
  console.log('[Install] Written:', destPath, '(' + stat.size + ' bytes)');
  return destPath;
}

// IPC: Install capability (supports target: 'claude', 'cursor', 'both')
ipcMain.handle('install-capability', async (event, { type, id, content, target }) => {
  try {
    const results = [];
    const targets = target === 'both' ? ['claude', 'cursor'] : [target || 'claude'];

    for (const t of targets) {
      const baseDir = t === 'cursor'
        ? path.join(os.homedir(), '.cursor')
        : path.join(os.homedir(), '.claude');
      try {
        const destPath = installToDir(baseDir, type, id, content);
        results.push({ target: t, success: true, path: destPath });
      } catch (err) {
        results.push({ target: t, success: false, error: err.message });
      }
    }
    return { success: results.every(r => r.success), results };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Detect which editors are installed
ipcMain.handle('detect-editors', async () => {
  const home = os.homedir();
  const editors = [];
  if (fs.existsSync(path.join(home, '.claude')) || true) {
    editors.push({ id: 'claude', name: 'Claude Code', dir: path.join(home, '.claude'), installed: true });
  }
  const cursorDir = path.join(home, '.cursor');
  const cursorExists = fs.existsSync(cursorDir);
  editors.push({ id: 'cursor', name: 'Cursor', dir: cursorDir, installed: cursorExists });
  return editors;
});

// IPC: Scan a GitHub repo
ipcMain.handle('github-scan-repo', async (event, repoUrl) => {
  try {
    const match = repoUrl.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s]+)/);
    if (!match) return { success: false, error: 'Invalid format. Use owner/repo or GitHub URL.' };
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    const items = [];

    async function scanDir(dirPath, type, isSkill) {
      try {
        const res = await httpGet(`${apiBase}/contents/${dirPath}`);
        if (res.status !== 200) return;
        const tree = JSON.parse(res.data);
        if (!Array.isArray(tree)) return;
        for (const entry of tree) {
          if (isSkill && entry.type === 'dir') {
            items.push({ id: entry.name, type, path: entry.path + '/SKILL.md', repo: `${owner}/${repo}` });
          } else if (!isSkill && entry.name.endsWith('.md')) {
            items.push({ id: entry.name.replace('.md',''), type, path: entry.path, repo: `${owner}/${repo}` });
          }
        }
      } catch(e) {}
    }

    await scanDir('.claude/skills', 'skill', true);
    await scanDir('.claude/agents', 'agent', false);
    await scanDir('.claude/commands', 'command', false);

    return { success: true, items, repo: `${owner}/${repo}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Fetch a single file from GitHub
ipcMain.handle('github-fetch-file', async (event, { owner, repo, filePath }) => {
  try {
    for (const branch of ['main', 'master']) {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const res = await httpGet(url, { headers: { 'User-Agent': 'DarkNite/1.0', 'Accept': 'text/plain' } });
      if (res.status === 200 && !res.data.includes('<!DOCTYPE')) {
        return { success: true, content: res.data };
      }
    }
    return { success: false, error: 'File not found on main or master branch' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Open a folder in the system file manager
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    const { shell } = require('electron');
    if (fs.existsSync(folderPath)) {
      shell.openPath(folderPath);
      return { success: true };
    }
    return { success: false, error: 'Folder does not exist: ' + folderPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC: Verify install - count files in ~/.claude/ and ~/.cursor/
ipcMain.handle('verify-install', async () => {
  const results = {};
  for (const editor of ['claude', 'cursor']) {
    const base = path.join(os.homedir(), '.' + editor);
    const counts = { skills: 0, agents: 0, commands: 0, path: base, exists: fs.existsSync(base) };
    try {
      const skillsDir = path.join(base, 'skills');
      if (fs.existsSync(skillsDir)) counts.skills = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.')).length;
      const agentsDir = path.join(base, 'agents');
      if (fs.existsSync(agentsDir)) counts.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
      const cmdsDir = path.join(base, 'commands');
      if (fs.existsSync(cmdsDir)) counts.commands = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.md')).length;
    } catch(e) {}
    results[editor] = counts;
  }
  return results;
});

app.whenReady().then(() => {
  // Decode data.b64 before window loads so it's ready when renderer asks for it
  prepareDataFile();
  createWindow();
  // Check for updates immediately during boot animation (not after)
  autoUpdater.checkForUpdates().catch(() => {});
});
app.on('window-all-closed', () => app.quit());
